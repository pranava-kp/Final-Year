import logging
import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from langgraph.checkpoint.memory import MemorySaver

from ..database import get_db
from ...schemas.session import (
    StartInterviewRequest,
    StartInterviewResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
    ReportResponse,
    QuestionInSessionResponse, # <-- NEW IMPORT
)
# --- NEW IMPORTS for structured data models ---
from ...schemas.agent_outputs import FeedbackGenOutput, ImprovementPoint, Resource 
from ...services.pdf_parser import extract_text_from_pdf_url
# We import the uncompiled workflow to add our checkpointer
from ...orchestration.graph import get_interview_workflow
from ...orchestration.state import SessionState, QuestionTurn # Import QuestionTurn
from ...auth.dependencies import get_current_user
from ...repositories.user_repository import UserRepository

logger = logging.getLogger(__name__)

# --- Router Setup ---
router = APIRouter(
    prefix="/interview",
    tags=["Interview"]
)

# --- Stateful Graph Setup (from old_interview.py) ---
# This is crucial for multi-turn chat. We create one stateful graph.
checkpointer = MemorySaver()
workflow = get_interview_workflow()  # Get the uncompiled workflow definition
graph = workflow.compile(checkpointer=checkpointer) # Compile it with our checkpointer

# --- Endpoint 1: Start Interview (Unchanged) ---
@router.post(
    "/sessions",
    response_model=StartInterviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new interview session",
)
async def create_new_interview_session(
    request: StartInterviewRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Starts a new interview session.
    ...
    """
    logger.info(f"--- Endpoint: Starting New Session for user {current_user['user_id']} ---")
    
    try: # <--- TRY BLOCK STARTS HERE
        # 1. Get User and Personalization Profile (This is the new feature)
        user_id = current_user["user_id"]
        repo = UserRepository(db)
        user_profile = repo.get_personalization_profile(user_id)
        logger.info(f"Loaded personalization profile for user {user_id}: {bool(user_profile)}")
        
        # 2. Parse Resume
        resume_text = ""
        # FIX: Use 'file_url' to match schema
        if request.file_url:
            try:
                # FIX: Convert Pydantic HttpUrl to string
                resume_text = await extract_text_from_pdf_url(str(request.file_url))
            except Exception as e:
                logger.error(f"Failed to parse PDF from URL {request.file_url}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to parse resume PDF from URL.",
                )
        elif request.resume_text:
             resume_text = request.resume_text
        else:
            logger.warning("No resume URL or text provided. Proceeding without resume.")
            resume_text = "No resume provided."

        # 3. Create Initial State
        session_id = str(uuid.uuid4())
        config = {"configurable": {"thread_id": session_id}, "recursion_limit": 150}
        
        initial_state = SessionState(
            session_id=session_id,
            user_id=user_id,
            namespace="updated-namespace", # Or get from config
            initial_resume_text=resume_text,
            initial_job_description_text=request.job_description, # FIX: use 'job_description'
            personalization_profile=user_profile, # This is the loaded profile
            question_history=[],
            interview_plan=[],
        )

        # 4. Invoke Graph (uses the global, stateful graph)
        logger.info(f"--- Invoking graph for new session {session_id} ---")
        final_state = await graph.ainvoke(initial_state, config=config)
        
        # 5. Get First Question
        current_question = final_state.get("current_question")
        
        if not current_question:
            raise HTTPException(
                status_code=500, detail="Graph failed to produce a first question."
            )

        # FIX: Return conversational_text (str) to match schema
        return StartInterviewResponse(
            session_id=session_id,
            first_question=current_question.conversational_text 
        )

    except Exception as e: # <--- ENTIRE TRY BLOCK ENDS HERE
        logger.error(f"Error during initial graph invocation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while starting the interview.",
        )

# --- Endpoint 2: Submit Answer (Updated and Fixed) ---
@router.post(
    "/sessions/{session_id}/answer",
    response_model=SubmitAnswerResponse,
    summary="Submit an answer and get the next question/structured feedback",
)
async def submit_answer(
    session_id: str,
    request: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Submits an answer, runs the evaluation loop, and returns
    the next question object and structured immediate feedback.
    """
    logger.info(f"--- Endpoint: Submitting Answer for Session {session_id} ---")
    config = {"configurable": {"thread_id": session_id}, "recursion_limit": 150}

    try:
        # 1. Get current state from checkpointer
        current_state = await graph.aget_state(config)
        if not current_state:
            raise HTTPException(status_code=404, detail="Session not found.")
        
        current_question = current_state.values.get("current_question")
        
        # NOTE: This is where the error was raised. If current_question is None, the interview 
        # is finished or the client is misbehaving. The error is correct but subsequent 
        # code needs to be robust if it were to pass.
        if not current_question:
             raise HTTPException(status_code=400, detail="No active question in state.")

        # 2. Update the state with the new answer
        # FIX: current_question is already the Pydantic object (QuestionTurn)
        current_question.answer_text = request.answer_text
        
        # TODO: Implement rubric fetching logic
        default_rubric = {
            "criteria": [
                {"name": "Clarity", "description": "Was the answer clear?"},
                {"name": "Correctness", "description": "Was it correct?"}
            ]
        }
        
        await graph.aupdate_state(
            config,
            {
                # Dump back to dict for state merging
                "current_question": current_question.model_dump(),
                "current_rubric": default_rubric,
            },
        )

        # 3. Resume the graph from the evaluation node
        logger.info(f"--- Resuming graph at 'run_evaluation' for {session_id} ---")
        final_state = await graph.ainvoke(None, config=config, at="run_evaluation")

        # 4. --- EXTRACT RESPONSE FOR NEW STRUCTURED SCHEMA ---
        next_question_obj = final_state.get("current_question") # This is a QuestionTurn instance
        history = final_state.get("question_history", [])
        
        # 4a. Extract Structured Feedback 
        last_turn_in_history = history[-1] if history else None
        
        if not last_turn_in_history or not last_turn_in_history.feedback:
            logger.warning("No structured feedback found in history. Using fallback.")
            structured_feedback = FeedbackGenOutput(
                improvement_points=[ImprovementPoint(
                    bullet="Evaluation in progress or session state incomplete.", 
                    actionable_step="Please continue with the interview."
                )],
                resources=[],
                practice_exercises=[]
            )
        else:
            structured_feedback = FeedbackGenOutput(**last_turn_in_history.feedback)
        
        # 4b. Determine if finished and process next question
        is_finished = next_question_obj is None
        final_next_question = None
        
        if not is_finished:
            # FIX: Convert Pydantic model to dictionary for safe .get() access
            next_question_dict = next_question_obj.model_dump()
            raw_data = next_question_dict.get('raw_question', {})

            # FIX: Provide default empty strings for required fields to pass validation
            final_next_question = QuestionInSessionResponse(
                question_id=raw_data.get('question_id'),
                conversational_text=next_question_dict.get('conversational_text'),
                raw_question_text=raw_data.get('text', ""), 
                ideal_answer_snippet=raw_data.get('ideal_answer_snippet', ""), 
                answer_text=next_question_dict.get('answer_text'),
                answer_audio_ref=next_question_dict.get('answer_audio_ref'),
                evals=next_question_dict.get('evals') or {},
                feedback=next_question_dict.get('feedback') or {},
                timestamp=str(next_question_dict.get('timestamp'))
            )
            
        # 5. Return the final structured response
        return SubmitAnswerResponse(
            feedback=structured_feedback,
            next_question=final_next_question,
            is_finished=is_finished
        )
        
    except Exception as e:
        logger.error(f"Error processing answer for {session_id}: {e}", exc_info=True)
        # Re-raise explicit HTTP exceptions if they are 4xx errors
        if isinstance(e, HTTPException) and e.status_code < 500:
            raise
        raise HTTPException(
            status_code=500, detail="An error occurred while processing your answer."
        )

# --- Endpoint 3: Get Report (Synchronous generation re-instated as requested) ---
@router.get(
    "/sessions/{session_id}/report",
    response_model=ReportResponse,
    summary="Get the final report for a session"
)
async def get_report(
    session_id: str,
    db: Session = Depends(get_db), # Added dependency
    current_user: dict = Depends(get_current_user), # Added dependency
):
    """
    Retrieves the final report for a completed interview session.
    If not found, it attempts to generate it synchronously.
    """
    logger.info(f"--- Endpoint: Fetching report for session {session_id} ---")
    config = {"configurable": {"thread_id": session_id}}

    try:
        # 1. Get the final state from the checkpointer
        final_state = await graph.aget_state(config)
        
        if not final_state:
            raise HTTPException(status_code=404, detail="Session not found.")
            
        report = final_state.values.get("final_report")
        profile = final_state.values.get("personalization_profile")

        # 2. Check if the report exists
        if not report:
            # Re-introduce manual invocation to generate the report (as requested by user)
            logger.warning(f"Report not found for {session_id}. Attempting to generate.")
            try:
                # Synchronous long-running call
                final_state = await graph.ainvoke(None, config=config, at="final_reporting_entry")
                report = final_state.values.get("final_report")
                profile = final_state.values.get("personalization_profile")
            except Exception as e:
                 # Catch graph invocation errors and treat the report as unavailable
                 logger.error(f"Failed to manually generate report: {e}")
                 raise HTTPException(status_code=404, detail="Report not yet available.")

        if not report:
             # Final check after attempted generation
             raise HTTPException(status_code=404, detail="Report not yet available.")

        return ReportResponse(
            session_id=session_id,
            final_report=report,
            personalization_profile=profile
        )
    except Exception as e:
        logger.error(f"Error fetching report for {session_id}: {e}", exc_info=True)
        # Only raise 500 if the exception wasn't already caught as a 404
        if isinstance(e, HTTPException) and e.status_code == 404:
            raise
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching the report."
        )