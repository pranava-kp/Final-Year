# src\interview_system\api\routers\interview.py
import uuid
import logging
from typing import Any  # <-- 1. Import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from langgraph.checkpoint.memory import MemorySaver

# Import your graph, state, and auth dependencies
from ...orchestration.graph import workflow
from ...orchestration.state import SessionState, QuestionTurn
from ...auth.dependencies import get_current_user
from ...models.user import User # Assuming this is your User model path

logger = logging.getLogger(__name__)

# This is the router you already have
router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
    # dependencies=[Depends(get_current_user)] # Uncomment this line to protect all routes
)

# --- Checkpointer and Graph Setup ---
checkpointer = MemorySaver()
graph = workflow.compile(checkpointer=checkpointer)

# --- Pydantic Models for API Data ---

class StartRequest(BaseModel):
    """Data needed to start an interview."""
    resume_text: str
    job_description_text: str

class StartResponse(BaseModel):
    """What we send back when an interview starts."""
    session_id: str
    first_question: dict # Send the question as a JSON-friendly dict

class AnswerRequest(BaseModel):
    """Data needed to submit an answer."""
    session_id: str
    answer_text: str

class AnswerResponse(BaseModel):
    """What we send back after an answer is submitted."""
    feedback: dict | None
    next_question: dict | None
    is_finished: bool

# --- 2. ADD NEW RESPONSE MODEL FOR THE REPORT ---
class ReportResponse(BaseModel):
    """What we send back for the final report."""
    session_id: str
    final_report: dict | None
    personalization_profile: dict | None

# --- API Endpoints ---

@router.post("/start", response_model=StartResponse)
async def start_interview(
    request: StartRequest,
    # current_user: User = Depends(get_current_user) # Uncomment to get the logged-in user
):
    """
    Starts a new interview session.
    Analyzes docs, creates a plan, and returns the first question.
    """
    logger.info("--- API: Starting new interview session ---")
    session_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": session_id}}
    
    # This is the initial state, based on your interactive_interview.py
    initial_state = {
        "session_id": session_id,
        "user_id": str(uuid.uuid4()), # TODO: Replace with current_user.id if using auth
        "namespace": "updated-namespace", # Or get from user/request
        "initial_resume_text": request.resume_text,
        "initial_job_description_text": request.job_description_text,
        "question_history": [],
        "resume_summary": None,
        "job_summary": None,
        "current_question": None,
        "personalization_profile": None,
        "current_rubric": None,
        "interview_plan": [],
        "final_report": None,
        "current_topic": None,
    }

    try:
        # Run the graph until the first question is generated
        async for _ in graph.astream(initial_state, config=config):
            pass 

        current_state = await graph.aget_state(config)
        first_question: QuestionTurn | None = current_state.values.get("current_question")

        if not first_question:
            logger.error(f"Session {session_id}: Failed to generate first question.")
            raise HTTPException(status_code=500, detail="Failed to generate first question.")

        return StartResponse(
            session_id=session_id,
            first_question=first_question.model_dump()
        )
    except Exception as e:
        logger.error(f"Error starting interview: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while starting the interview.")


@router.post("/answer", response_model=AnswerResponse)
async def submit_answer(
    request: AnswerRequest,
    # current_user: User = Depends(get_current_user) # Uncomment to get the logged-in user
):
    """
    Submits an answer and gets feedback + the next question.
    """
    logger.info(f"--- API: Receiving answer for session {request.session_id} ---")
    config = {"configurable": {"thread_id": request.session_id}}

    try:
        # 1. Get the current state
        current_state = await graph.aget_state(config)
        
        current_question: QuestionTurn | None = current_state.values.get("current_question")
        
        if not current_question:
            logger.warning(f"Session {request.session_id}: No current question found. Maybe session ended?")
            raise HTTPException(status_code=404, detail="Session not found or question not ready.")
        
        # 2. Update the state with the user's answer
        current_question.answer_text = request.answer_text
        await graph.aupdate_state(
            config,
            {
                "current_question": current_question.model_dump(),
                "current_rubric": {}, # Reset rubric for next eval
            },
        )

        # 3. Resume the graph
        async for _ in graph.astream(None, config=config):
            pass # Run to the next pause

        # 4. Get the *new* state and prepare the response
        new_state = await graph.aget_state(config)
        
        last_turn_history: list[QuestionTurn] = new_state.values.get("question_history", [])
        last_turn = last_turn_history[-1] if last_turn_history else None
        
        next_question: QuestionTurn | None = new_state.values.get("current_question")
        
        is_finished = not new_state.values.get("interview_plan")
        
        return AnswerResponse(
            feedback=last_turn.feedback if last_turn and last_turn.feedback else None,
            next_question=next_question.model_dump() if next_question else None,
            is_finished=is_finished
        )
    except Exception as e:
        logger.error(f"Error processing answer for session {request.session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while processing your answer.")


# --- 3. ADD NEW ENDPOINT TO FETCH THE REPORT ---
@router.get("/report/{session_id}", response_model=ReportResponse)
async def get_report(
    session_id: str,
    # current_user: User = Depends(get_current_user) # Uncomment to get the logged-in user
):
    """
    Retrieves the final report for a completed interview session.
    """
    logger.info(f"--- API: Fetching report for session {session_id} ---")
    config = {"configurable": {"thread_id": session_id}}

    try:
        # Get the final state from the checkpointer
        final_state = await graph.aget_state(config)
        
        if not final_state:
            raise HTTPException(status_code=404, detail="Session not found.")
            
        report = final_state.values.get("final_report")
        profile = final_state.values.get("personalization_profile")

        if not report:
            logger.warning(f"Session {session_id}: Report not found or not yet generated.")
            raise HTTPException(status_code=404, detail="Report not yet available.")

        return ReportResponse(
            session_id=session_id,
            final_report=report,
            personalization_profile=profile
        )
    except Exception as e:
        logger.error(f"Error fetching report for session {session_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred while fetching the report.")