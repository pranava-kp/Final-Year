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


# --- Analysis & Planning Nodes ---
async def analyze_resume_node(state: SessionState) -> dict:
    logger.info("--- Node: Analyzing Resume ---")
    analysis_result = await analyze_resume(state.get("initial_resume_text"))
    return {"resume_summary": analysis_result.model_dump()}


async def analyze_job_description_node(state: SessionState) -> dict:
    logger.info("--- Node: Analyzing Job Description ---")
    analysis_result = await analyze_job_description(
        state.get("initial_job_description_text")
    )
    return {"job_summary": analysis_result.model_dump()}


async def create_interview_plan_node(state: SessionState) -> dict:
    logger.info("--- Node: Creating Interview Plan (via Agent) ---")
    plan = await generate_interview_plan(
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


# --- Question Generation Nodes ---
def introduction_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Introduction ---")
    turn = QuestionTurn(
        conversational_text="Welcome, Candidate! Thanks for your time today. To get started, could you please tell me a bit about yourself and walk me through your resume?",
        raw_question_text="Tell me about yourself.",
        ideal_answer_snippet="A concise 'elevator pitch' summarizing background, key skills, and career goals.",
    )
    return {"current_question": turn}


async def retrieve_question_node(state: SessionState) -> dict:
    logger.info("--- Node: Retrieving Generic Question ---")
    topic = state["current_topic"]
    history = state.get("question_history", [])
    last_topics = [turn.raw_question_text for turn in history]
    question_output = await retrieve_question(
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


async def deep_dive_question_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Deep Dive Question ---")
    topic_string = state["current_topic"]
    parts = topic_string.replace("_", ":").split(":", 2)
    if len(parts) != 3:
        raise ValueError(f"Invalid deep_dive format: '{topic_string}'")
    _, item_type, item_name = parts
    question_output = await generate_deep_dive_question(
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


# --- Evaluation & Synthesis Nodes ---
async def fast_eval_node(state: SessionState) -> dict:
    logger.info("--- Node: Fast Evaluation ---")
    current_question = state["current_question"]
    eval_result = await fast_eval_answer(
        question_text=current_question.raw_question_text,
        ideal_answer_snippet=current_question.ideal_answer_snippet,
        answer_text=current_question.answer_text,
    )
    return {"current_question": {"evals": {"fast_eval": eval_result.model_dump()}}}


async def rubric_eval_node(state: SessionState) -> dict:
    logger.info("--- Node: Rubric Evaluation ---")
    current_question = state["current_question"]
    rubric = state["current_rubric"]
    eval_result = await rubric_eval_answer(
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


# --- Feedback & Follow-up Nodes ---
async def feedback_generator_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Feedback ---")
    current_question = state["current_question"]
    feedback_result = await generate_feedback(
        question_text=current_question.raw_question_text,
        answer_text=current_question.answer_text,
        canonical_evaluation=current_question.evals["canonical"],
    )
    return {"current_question": {"feedback": feedback_result.model_dump()}}


async def handle_follow_up_node(state: SessionState) -> dict:
    logger.info("--- Node: Handling Follow-up Detour ---")
    last_question = state["current_question"]
    follow_up_agent_output = await generate_follow_up(
        question_text=last_question.raw_question_text,
        answer_text=last_question.answer_text,
    )
    follow_up_turn = QuestionTurn(
        conversational_text=follow_up_agent_output.question_text,
        raw_question_text=follow_up_agent_output.question_text,
        ideal_answer_snippet="The candidate should provide the specific information missing from their previous answer.",
    )
    return {
        "question_history": state.get("question_history", []) + [last_question],
        "current_question": follow_up_turn,
    }


# --- Final Reporting & State Management ---
async def report_generator_node(state: SessionState) -> dict:
    logger.info("--- Node: Generating Final Report ---")
    serializable_state = dict(state)
    if state.get("question_history"):
        serializable_state["question_history"] = [
            turn.model_dump(mode="json") for turn in state["question_history"]
        ]
    
    # --- THIS IS THE FIX ---
    try:
        report_result = await generate_report(serializable_state)
        
        # Check if the agent returned a valid report
        if report_result:
            return {"final_report": report_result.model_dump()}
        else:
            # Handle cases where the agent fails silently (returns None)
            logger.error("Report generation returned None.")
            return {"final_report": None}
            
    except Exception as e:
        # Handle cases where the agent throws an error
        logger.error(f"Report generation node failed: {e}", exc_info=True)
        return {"final_report": None}
    # --- END FIX ---


async def personalization_node(state: SessionState) -> dict:
    logger.info("--- Node: Creating Personalization Plan ---")
    serializable_state = dict(state)
    if state.get("question_history"):
        serializable_state["question_history"] = [
            turn.model_dump(mode="json") for turn in state["question_history"]
        ]
    plan_result = await create_personalization_plan(serializable_state)
    return {"personalization_profile": plan_result.model_dump()}


def final_reporting_entry_node(state: SessionState) -> dict:
    logger.info("--- Node: Kicking off Final Reporting ---")
    return {}


def update_history_and_plan_node(state: SessionState) -> dict:
    logger.info("--- Node: Updating History and Advancing Plan ---")
    last_question = state["current_question"]
    new_history = state.get("question_history", []) + [last_question]
    updated_plan = state.get("interview_plan", [])[1:]
    return {
        "question_history": new_history,
        "interview_plan": updated_plan,
        "current_question": None,
    }