import logging
from typing import Any, Dict

from ..agents.fast_eval_agent import fast_eval_answer
from ..agents.job_description_analyzer import analyze_job_description
from ..agents.question_retrieval import retrieve_question
from ..agents.resume_analyzer import analyze_resume
from ..agents.rubric_eval_agent import rubric_eval_answer
from .state import SessionState, QuestionTurn

logger = logging.getLogger(__name__)


def analyze_resume_node(state: SessionState) -> dict:
    """A node that analyzes the user's resume."""
    logger.info("--- Running Resume Analysis Node ---")
    resume_text = state.get("initial_resume_text")
    if not resume_text:
        logger.warning("No resume text found in state for analysis.")
        return {}

    analysis_result = analyze_resume(resume_text)
    return {"resume_summary": analysis_result.model_dump()}


def analyze_job_description_node(state: SessionState) -> dict:
    """A node that analyzes the provided job description."""
    logger.info("--- Running Job Description Analysis Node ---")
    job_desc_text = state.get("initial_job_description_text")
    if not job_desc_text:
        logger.warning("No job description text found in state for analysis.")
        return {}

    analysis_result = analyze_job_description(job_desc_text)
    return {"job_summary": analysis_result.model_dump()}


def retrieve_question_node(state: SessionState) -> dict:
    """A node that retrieves a conversational question for the user."""
    logger.info("--- Running Question Retrieval Node ---")

    # In a real app, the domain and difficulty would be dynamically determined
    # by the orchestrator's "Interview Plan".
    domain = "technical"
    difficulty_hint = 5

    # Get the last topic from history for better conversational flow
    last_topics = []
    if state.get("question_history"):
        last_topics.append(state["question_history"][-1].raw_question.domain)

    question_output = retrieve_question(
        domain=domain,
        difficulty_hint=difficulty_hint,
        resume_analysis=state.get("resume_summary"),
        job_analysis=state.get("job_summary"),
        last_topics=last_topics,
    )

    # Create the QuestionTurn object to hold all data for this turn
    turn = QuestionTurn(
        question_id=question_output.raw_question.question_id,
        question_text=question_output.conversational_text,
        ideal_answer_snippet=question_output.raw_question.ideal_answer_snippet,
        # Answer is added later by the user
    )

    return {"current_question": turn}


def fast_eval_node(state: SessionState) -> dict:
    """A node that performs a fast evaluation of the user's last answer."""
    logger.info("--- Running Fast Evaluation Node ---")
    current_question = state.get("current_question")
    if not current_question or not current_question.answer_text:
        logger.error(
            "Cannot run fast_eval_node: current_question or answer_text is missing."
        )
        return {}

    eval_result = fast_eval_answer(
        question_text=current_question.question_text,
        ideal_answer_snippet=current_question.ideal_answer_snippet,
        answer_text=current_question.answer_text,
    )

    updated_evals = current_question.evals or {}
    updated_evals["fast_eval"] = eval_result.model_dump()
    current_question.evals = updated_evals

    return {"current_question": current_question}


def rubric_eval_node(state: SessionState) -> dict:
    """A node that performs a detailed, rubric-based evaluation."""
    logger.info("--- Running Rubric Evaluation Node ---")
    current_question = state.get("current_question")
    # This node will need the actual rubric, which we'll add to the state later
    rubric = state.get("current_rubric", {"placeholder": "a placeholder rubric"})

    if not current_question or not current_question.answer_text:
        logger.error(
            "Cannot run rubric_eval_node: current_question or answer_text is missing."
        )
        return {}
    if not rubric:
        logger.error("Cannot run rubric_eval_node: rubric is missing from state.")
        return {}

    eval_result = rubric_eval_answer(
        question_text=current_question.question_text,
        answer_text=current_question.answer_text,
        rubric=rubric,
    )

    updated_evals = current_question.evals or {}
    updated_evals["rubric_eval"] = eval_result.model_dump()
    current_question.evals = updated_evals

    return {"current_question": current_question}


def evaluation_synthesizer_node(state: SessionState) -> Dict[str, Any]:
    """
    A non-LLM node that merges the fast and rubric evaluations into a canonical score.
    """
    logger.info("--- Running Evaluation Synthesizer Node ---")
    current_question = state.get("current_question")
    if not current_question or not current_question.evals:
        logger.error("Synthesizer error: No evaluations found in the current question.")
        return {}

    fast_eval = current_question.evals.get("fast_eval", {})
    rubric_eval = current_question.evals.get("rubric_eval", {})

    if not fast_eval or not rubric_eval:
        logger.error("Synthesizer error: Missing fast_eval or rubric_eval.")
        return {}

    # Simple weighted average as planned
    fast_score = fast_eval.get("score", 0)
    rubric_score = rubric_eval.get("aggregate_score", 0)

    # Weights: Rubric 0.7, Fast 0.3
    canonical_score = (rubric_score * 0.7) + (fast_score * 0.3)

    # Store the final, merged evaluation
    updated_evals = current_question.evals
    updated_evals["canonical_evaluation"] = {
        "final_score": round(canonical_score, 2),
        "user_input_needed": rubric_eval.get("user_input_needed", False),
        "full_rubric": rubric_eval,  # Keep the full details
    }
    current_question.evals = updated_evals

    return {"current_question": current_question}
