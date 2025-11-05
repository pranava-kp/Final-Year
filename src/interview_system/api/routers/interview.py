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
    ReportResponse,  # Make sure this is imported
)
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

# --- Endpoint 1: Start Interview (Corrected) ---
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
    Parses the resume, loads personalization profile, creates an initial
    state, and runs the graph to generate the first question.
    """
    logger.info(f"--- Endpoint: Starting New Session for user {current_user['id']} ---")
    
    try:
        # 1. Get User and Personalization Profile (This is the new feature)
        user_id = current_user["id"]
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
        current_question = final_state.values.get("current_question")
        
        if not current_question:
            raise HTTPException(
                status_code=500, detail="Graph failed to produce a first question."
            )

        # FIX: Return conversational_text (str) to match schema
        return StartInterviewResponse(
            session_id=session_id,
            first_question=current_question.conversational_text 
        )

    except Exception as e:
        logger.error(f"Error during initial graph invocation: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while starting the interview.",
        )

# --- Endpoint 2: Submit Answer (from old_interview.py logic) ---
# --- Endpoint 2: Submit Answer (Corrected) ---
@router.post(
    "/sessions/{session_id}/answer",
    response_model=SubmitAnswerResponse,
    summary="Submit an answer and get the next question/feedback",
)
async def submit_answer(
    session_id: str,
    request: SubmitAnswerRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Submits an answer, runs the evaluation loop, and returns
    the next question (or follow-up) and immediate feedback.
    """
    logger.info(f"--- Endpoint: Submitting Answer for Session {session_id} ---")
    config = {"configurable": {"thread_id": session_id}, "recursion_limit": 150}

    try:
        # 1. Get current state from checkpointer
        current_state = await graph.aget_state(config)
        if not current_state:
            raise HTTPException(status_code=404, detail="Session not found.")
        
        current_question_dict = current_state.values.get("current_question")
        if not current_question_dict:
             raise HTTPException(status_code=400, detail="No active question in state.")

        # 2. Update the state with the new answer
        current_question = QuestionTurn(**current_question_dict)
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

        # 4. --- EXTRACT RESPONSE (Corrected Logic) ---
        next_question_obj_dict = final_state.values.get("current_question")
        history = final_state.values.get("question_history", [])
        
        feedback_text = "Feedback is being processed."
        is_follow_up = False

        if history:
            last_turn_in_history = history[-1]
            if last_turn_in_history.get("feedback"):
                # Path A: Normal loop. Feedback was generated.
                is_follow_up = False
                feedback_text = last_turn_in_history["feedback"].get(
                    "fast_summary", "Great, let's move on."
                )
            else:
                # Path B: Follow-up loop. Feedback was NOT generated.
                is_follow_up = True
                feedback_text = "Thanks for that. Could you clarify one thing?"

        if not next_question_obj_dict:
            # Interview has finished
            logger.info(f"--- Interview finished for session {session_id} ---")
            return SubmitAnswerResponse(
                feedback=feedback_text or "Interview complete!",
                status="finished"
            )

        # Re-hydrate the Pydantic model
        next_question_obj = QuestionTurn(**next_question_obj_dict)

        if is_follow_up:
            # It's a follow-up question
            return SubmitAnswerResponse(
                feedback=feedback_text,
                follow_up_question=next_question_obj.conversational_text,
                status="in_progress"
            )
        else:
            # It's a normal next question
            return SubmitAnswerResponse(
                feedback=feedback_text,
                next_question=next_question_obj.conversational_text,
                status="in_progress"
            )
        
    except Exception as e:
        logger.error(f"Error processing answer for {session_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="An error occurred while processing your answer."
        )

# --- Endpoint 3: Get Report (from old_interview.py) ---
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
            # This might mean the interview isn't finished.
            # We can manually invoke the reporting node.
            logger.warning(f"Report not found for {session_id}. Attempting to generate.")
            try:
                final_state = await graph.ainvoke(None, config=config, at="final_reporting_entry")
                report = final_state.values.get("final_report")
                profile = final_state.values.get("personalization_profile")
            except Exception as e:
                 logger.error(f"Failed to manually generate report: {e}")
                 raise HTTPException(status_code=404, detail="Report not yet available.")

        if not report:
             raise HTTPException(status_code=404, detail="Report not yet available.")

        return ReportResponse(
            session_id=session_id,
            final_report=report,
            personalization_profile=profile
        )
    except Exception as e:
        logger.error(f"Error fetching report for {session_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail="An error occurred while fetching the report."
        )