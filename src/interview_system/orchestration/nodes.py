import logging
from typing import Any

from ..agents.deep_dive_agent import generate_deep_dive_question
from ..agents.fast_eval_agent import fast_eval_answer
from ..agents.feedback_generator import generate_feedback
from ..agents.follow_up_agent import generate_follow_up
from ..agents.interview_plan_agent import generate_interview_plan
from ..agents.job_description_analyzer import analyze_job_description
from ..agents.personalization_agent import create_personalization_plan
from ..agents.question_retrieval import retrieve_question
from ..agents.report_generator import generate_report
from ..agents.resume_analyzer import analyze_resume
from ..agents.rubric_eval_agent import rubric_eval_answer
from .state import QuestionTurn, SessionState

logger = logging.getLogger(__name__)


# --- Analysis & Planning Nodes (Unchanged) ---
def analyze_resume_node(state: SessionState) -> dict:
    logger.info("--- Node: Analyzing Resume ---")
    analysis_result = analyze_resume(state.get("initial_resume_text"))
    return {"resume_summary": analysis_result.model_dump()}


def analyze_job_description_node(state: SessionState) -> dict:
    logger.info("--- Node: Analyzing Job Description ---")
    analysis_result = analyze_job_description(state.get("initial_job_description_text"))
    return {"job_summary": analysis_result.model_dump()}


def create_interview_plan_node(state: SessionState) -> dict:
    logger.info("--- Node: Creating Interview Plan (via Agent) ---")
    plan = generate_interview_plan(
        resume_summary=state.get("resume_summary"),
        job_summary=state.get("job_summary"),
        personalization_profile=state.get("personalization_profile"),
    )
    logger.info(f"Generated Plan: {plan}")
    return {"interview_plan": plan}


def set_current_topic_node(state: SessionState) -> dict:
    plan = state.get("interview_plan", [])
    if plan:
        return {"current_topic": plan[0]}
    return {"current_topic": None}


# --- Question Generation Nodes (Unchanged) ---
def introduction_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Introduction ---")
    turn = QuestionTurn(
        conversational_text="Welcome, Candidate! Thanks for your time today. To get started, could you please tell me a bit about yourself and walk me through your resume?",
        raw_question_text="Tell me about yourself.",
        ideal_answer_snippet="A concise 'elevator pitch' summarizing background, key skills, and career goals.",
    )
    return {"current_question": turn}


def retrieve_question_node(state: SessionState) -> dict:
    logger.info("--- Node: Retrieving Generic Question ---")
    topic = state["current_topic"]
    history = state.get("question_history", [])
    last_topics = [turn.raw_question_text for turn in history]
    question_output = retrieve_question(
        domain=topic,
        resume_analysis=state.get("resume_summary"),
        job_analysis=state.get("job_summary"),
        last_topics=last_topics,
    )
    turn = QuestionTurn(
        question_id=question_output.raw_question.question_id,
        conversational_text=question_output.conversational_text,
        raw_question_text=question_output.raw_question.text,
        ideal_answer_snippet=question_output.raw_question.ideal_answer_snippet,
    )
    return {"current_question": turn}


def deep_dive_question_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Deep Dive Question ---")
    topic_string = state["current_topic"]
    parts = topic_string.replace("_", ":").split(":", 2)
    if len(parts) != 3:
        raise ValueError(f"Invalid deep_dive format: '{topic_string}'")
    _, item_type, item_name = parts
    question_output = generate_deep_dive_question(
        item_type=item_type,
        item_name=item_name,
        resume_summary=state.get("resume_summary"),
    )
    turn = QuestionTurn(
        question_id=None,
        conversational_text=question_output.conversational_text,
        raw_question_text=question_output.raw_question.text,
        ideal_answer_snippet=question_output.raw_question.ideal_answer_snippet,
    )
    return {"current_question": turn}


def wrap_up_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Wrap-up Question ---")
    turn = QuestionTurn(
        conversational_text="That was the last question I had. Do you have any questions for me?",
        raw_question_text="Do you have any questions for me?",
        ideal_answer_snippet="The candidate should ask thoughtful questions about the role, team, or company.",
    )
    return {"current_question": turn}


# --- Evaluation & Synthesis Nodes (Unchanged) ---
def fast_eval_node(state: SessionState) -> dict:
    logger.info("--- Node: Fast Evaluation ---")
    current_question = state["current_question"]
    eval_result = fast_eval_answer(
        question_text=current_question.raw_question_text,
        ideal_answer_snippet=current_question.ideal_answer_snippet,
        answer_text=current_question.answer_text,
    )
    return {"current_question": {"evals": {"fast_eval": eval_result.model_dump()}}}


def rubric_eval_node(state: SessionState) -> dict:
    logger.info("--- Node: Rubric Evaluation ---")
    current_question = state["current_question"]
    rubric = state["current_rubric"]
    eval_result = rubric_eval_answer(
        question_text=current_question.raw_question_text,
        answer_text=current_question.answer_text,
        rubric=rubric,
    )
    return {"current_question": {"evals": {"rubric_eval": eval_result.model_dump()}}}


def evaluation_synthesizer_node(state: SessionState) -> dict[str, Any]:
    logger.info("--- Node: Synthesizing Evaluations ---")
    current_question = state["current_question"]
    fast_eval = current_question.evals.get("fast_eval", {})
    rubric_eval = current_question.evals.get("rubric_eval", {})
    fast_score = fast_eval.get("score", 0)
    rubric_score = rubric_eval.get("aggregate_score", 0)
    canonical_score_100 = (rubric_score * 0.7) + (fast_score * 0.3)
    canonical_eval = {
        "final_score": round(canonical_score_100, 1),
        "user_input_needed": rubric_eval.get("user_input_needed", False),
        "full_rubric": rubric_eval,
    }
    return {"current_question": {"evals": {"canonical": canonical_eval}}}


# --- Feedback & Follow-up Nodes (THE CORE FIX) ---
def feedback_generator_node(state: SessionState) -> dict:
    """This node now ONLY generates feedback. It does not advance the plan."""
    logger.info("--- Node: Generating Feedback ---")
    current_question = state["current_question"]
    feedback_result = generate_feedback(
        question_text=current_question.raw_question_text,
        answer_text=current_question.answer_text,
        canonical_evaluation=current_question.evals["canonical"],
    )
    return {"current_question": {"feedback": feedback_result.model_dump()}}


def handle_follow_up_node(state: SessionState) -> dict:
    """
    This is a new, dedicated node. Its ONLY job is to generate a follow-up
    and prepare it to be asked next.
    """
    logger.info("--- Node: Handling Follow-up ---")
    current_question = state["current_question"]
    follow_up_agent_output = generate_follow_up(
        question_text=current_question.raw_question_text,
        answer_text=current_question.answer_text,
    )

    # --- THIS IS THE CRITICAL FIX ---
    # Create a brand new, clean QuestionTurn object for the follow-up.
    # It will have no 'answer_text' by default.
    follow_up_turn = QuestionTurn(
        conversational_text=follow_up_agent_output.question_text,
        raw_question_text=follow_up_agent_output.question_text,
        ideal_answer_snippet="The candidate should provide the specific information that was missing from their previous answer.",
    )
    # --------------------------------

    # We do NOT change the plan here. We just prepare the next question.
    return {"next_question_override": follow_up_turn}


# --- Final Reporting & State Management (THE CORE FIX) ---
def report_generator_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Final Report ---")
    serializable_state = dict(state)
    if state.get("question_history"):
        serializable_state["question_history"] = [
            turn.model_dump(mode="json") for turn in state["question_history"]
        ]
    report_result = generate_report(serializable_state)
    return {"final_report": report_result.model_dump()}


def personalization_node(state: SessionState) -> dict:
    logger.info("--- Node: Creating Personalization Plan ---")
    serializable_state = dict(state)
    if state.get("question_history"):
        serializable_state["question_history"] = [
            turn.model_dump(mode="json") for turn in state["question_history"]
        ]
    plan_result = create_personalization_plan(serializable_state)
    return {"personalization_profile": plan_result.model_dump()}


def final_reporting_entry_node(state: SessionState) -> dict:
    logger.info("--- Node: Kicking off Final Reporting ---")
    return {}


# In nodes.py


# In nodes.py


# In nodes.py


def update_history_and_plan_node(state: SessionState) -> dict:
    """
    This node is now smarter. It knows that a follow-up is a "detour"
    and does not advance the main interview plan during that detour.
    """
    logger.info("--- Node: Updating History and Plan ---")

    # 1. ALWAYS archive the question that was just answered.
    last_question = state["current_question"]
    new_history = state.get("question_history", []) + [last_question]

    # 2. Check if a follow-up question was prepared in the last step.
    next_question = state.get("next_question_override")

    # --- THIS IS THE CRITICAL FIX ---
    # 3. ONLY advance the plan if we are NOT handling a follow-up.
    if next_question:
        # We are on a detour. Do NOT change the main itinerary.
        updated_plan = state.get("interview_plan", [])
    else:
        # We are on the main road. Proceed to the next city on the itinerary.
        updated_plan = state.get("interview_plan", [])[1:]
    # --------------------------------

    return {
        "question_history": new_history,
        "interview_plan": updated_plan,
        "current_question": next_question,  # This is either the follow-up or None
        "next_question_override": None,  # Clean up the temporary state
    }
