from langgraph.graph import END, START, StateGraph

from .nodes import (
    analyze_job_description_node,
    analyze_resume_node,
    create_interview_plan_node,
    deep_dive_question_node,
    evaluation_synthesizer_node,
    fast_eval_node,
    feedback_generator_node,
    final_reporting_entry_node,
    handle_follow_up_node,
    introduction_node,
    personalization_node,
    report_generator_node,
    retrieve_question_node,
    rubric_eval_node,
    set_current_topic_node,
    update_history_and_plan_node,
    wrap_up_node,
)
from .state import SessionState


def route_to_questioner(state: SessionState) -> str:
    if state.get("current_question"):
        return "pause_for_answer"

    topic = state.get("current_topic")
    if not topic or not state.get("interview_plan"):
        return "generate_report_and_plan"
    if topic == "introduction":
        return "introduction"
    if "deep_dive" in topic:
        return "deep_dive"
    if topic.startswith("follow_up:"):
        return "pause_for_answer"
    if topic == "wrap_up":
        return "wrap_up"
    return "retrieve"


def route_after_question_is_answered(state: SessionState) -> str:
    if state.get("current_question") and state["current_question"].answer_text:
        return "run_evaluation"
    else:
        return END


def route_after_evaluation(state: SessionState) -> str:
    """
    Checks the canonical evaluation to decide if a follow-up is needed.
    This is now much more robust.
    """
    canonical_eval = state.get("current_question", {}).evals.get("canonical", {})

    # --- THIS IS THE FIX ---
    # Only trigger a follow-up if the answer was marked as needing input
    # AND the score was genuinely low (e.g., below 60/100).
    # This prevents unnecessary follow-ups on good answers.
    if (
        canonical_eval.get("user_input_needed", False)
        and canonical_eval.get("final_score", 100) < 60
    ):
        return "handle_follow_up"
    else:
        # For all other cases, proceed to generate normal feedback.
        return "generate_feedback"


workflow = StateGraph(SessionState)

# --- Add Nodes (Explicitly Named for Clarity and Correctness) ---
workflow.add_node("analyze_resume", analyze_resume_node)
workflow.add_node("analyze_job_description", analyze_job_description_node)
workflow.add_node("plan_creator", create_interview_plan_node)
workflow.add_node("topic_setter", set_current_topic_node)
workflow.add_node("introduction_questioner", introduction_node)
workflow.add_node("question_retriever", retrieve_question_node)
workflow.add_node("deep_dive_questioner", deep_dive_question_node)
workflow.add_node("wrap_up_questioner", wrap_up_node)
workflow.add_node("run_evaluation", lambda state: {})
workflow.add_node("fast_evaluator", fast_eval_node)
workflow.add_node("rubric_evaluator", rubric_eval_node)
workflow.add_node("evaluation_synthesizer", evaluation_synthesizer_node)
workflow.add_node("feedback_generator", feedback_generator_node)
workflow.add_node("handle_follow_up", handle_follow_up_node)
workflow.add_node("state_updater", update_history_and_plan_node)
workflow.add_node("report_generator", report_generator_node)
workflow.add_node("personalization_planner", personalization_node)
workflow.add_node("final_reporting_entry", final_reporting_entry_node)
workflow.add_node("pause_for_answer", lambda state: {})


# --- Define Edges ---
workflow.add_edge(START, "analyze_resume")
workflow.add_edge(START, "analyze_job_description")
workflow.add_edge("analyze_resume", "plan_creator")
workflow.add_edge("analyze_job_description", "plan_creator")
workflow.add_edge("plan_creator", "topic_setter")

workflow.add_conditional_edges(
    "topic_setter",
    route_to_questioner,
    {
        "introduction": "introduction_questioner",
        "deep_dive": "deep_dive_questioner",
        "retrieve": "question_retriever",
        "wrap_up": "wrap_up_questioner",
        "pause_for_answer": "pause_for_answer",
        "generate_report_and_plan": "final_reporting_entry",
    },
)

# This is the critical missing piece. It connects the questioners to the evaluation chain.
for node in [
    "introduction_questioner",
    "question_retriever",
    "deep_dive_questioner",
    "wrap_up_questioner",
    "pause_for_answer",
]:
    workflow.add_conditional_edges(
        node,
        route_after_question_is_answered,
        {"run_evaluation": "run_evaluation", END: END},
    )

workflow.add_edge("run_evaluation", "fast_evaluator")
workflow.add_edge("run_evaluation", "rubric_evaluator")
workflow.add_edge("fast_evaluator", "evaluation_synthesizer")
workflow.add_edge("rubric_evaluator", "evaluation_synthesizer")

workflow.add_conditional_edges(
    "evaluation_synthesizer",
    route_after_evaluation,
    {
        "generate_feedback": "feedback_generator",
        "handle_follow_up": "handle_follow_up",
    },
)

workflow.add_edge("feedback_generator", "state_updater")
workflow.add_edge("handle_follow_up", "state_updater")
workflow.add_edge("state_updater", "topic_setter")

workflow.add_edge("final_reporting_entry", "report_generator")
workflow.add_edge("final_reporting_entry", "personalization_planner")
workflow.add_edge("report_generator", END)
workflow.add_edge("personalization_planner", END)

app = workflow.compile()
