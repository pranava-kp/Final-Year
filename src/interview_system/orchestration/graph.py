# src/interview_system/orchestration/graph.py

from langgraph.graph import END, START, StateGraph
from langgraph.pregel import Pregel as CompiledGraph
from typing import List, Union

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
    save_personalization_node,  # Your new node is kept
)
from .state import SessionState


def route_to_questioner(state: SessionState) -> str:
    """
    This router reads the *next* topic from the interview_plan
    and directs the graph to the correct question-generation node.
    """
    topic = state.get("current_topic")
    if not topic or not state.get("interview_plan"):
        return "generate_report_and_plan"
    if topic == "introduction":
        return "introduction"
    if "deep_dive" in topic:
        return "deep_dive"
    if topic == "wrap_up":
        return "wrap_up"
    return "retrieve"


# --- FIX 1: Restore the OLD router logic ---
# This router checks for an answer *after* the question node runs
# (which it can only do if the user script updates the state).
def route_after_question_is_answered(state: SessionState) -> Union[str, List[str]]:
    """
    This router checks if an answer has been provided.
    It returns a list of nodes to run in parallel, or END.
    """
    # --- THIS IS THE FIX ---
    # We must access the state as an object, because the
    # previous node (e.g., introduction_questioner) put a
    # 'QuestionTurn' object into the state, not a dict.
    current_question_obj = state.get("current_question")
    
    if current_question_obj and current_question_obj.answer_text:
        # Answer is present, proceed to parallel evaluation
        # This will be used after the user provides an answer
        return ["fast_evaluator", "rubric_evaluator"]
    else:
        # No answer text, which is true after introduction_questioner
        # This is a critical logic error in the old monolithic graph.
        # It should just END to wait for user input.
        return END
    # --- END OF FIX ---

def route_after_evaluation(state: SessionState) -> str:
    """
    This router checks the canonical evaluation to decide if a
    follow-up question is needed or if we can proceed to feedback.
    """
    # This logic is correct and remains unchanged.
    current_question = state.get("current_question")
    if not current_question:
        return "generate_feedback" # Should not happen, but safe default
        
    canonical_eval = current_question.evals.get("canonical", {})
    
    if (
        canonical_eval.get("user_input_needed", False)
        and canonical_eval.get("final_score", 100) < 60
    ):
        return "handle_follow_up"
    else:
        return "generate_feedback"

def build_interview_workflow() -> StateGraph:
    """
    Builds the StateGraph workflow definition.
    """
    workflow = StateGraph(SessionState)

    # --- 1. Add All Nodes ---
    # This list is correct and includes your new node
    workflow.add_node("analyze_resume", analyze_resume_node)
    workflow.add_node("analyze_job_description", analyze_job_description_node)
    workflow.add_node("plan_creator", create_interview_plan_node)
    workflow.add_node("topic_setter", set_current_topic_node)

    workflow.add_node("introduction_questioner", introduction_node)
    workflow.add_node("question_retriever", retrieve_question_node)
    workflow.add_node("deep_dive_questioner", deep_dive_question_node)
    workflow.add_node("wrap_up_questioner", wrap_up_node)

    workflow.add_node("run_evaluation", lambda state: {}) # Dummy entry point
    workflow.add_node("fast_evaluator", fast_eval_node)
    workflow.add_node("rubric_evaluator", rubric_eval_node)
    workflow.add_node("evaluation_synthesizer", evaluation_synthesizer_node)

    workflow.add_node("feedback_generator", feedback_generator_node)
    workflow.add_node("handle_follow_up", handle_follow_up_node)
    workflow.add_node("state_updater", update_history_and_plan_node)

    workflow.add_node("final_reporting_entry", final_reporting_entry_node)
    workflow.add_node("report_generator", report_generator_node)
    workflow.add_node("personalization_planner", personalization_node)
    workflow.add_node("save_personalization", save_personalization_node)

    # --- 2. Define Edges ---

    # --- A. Initial Planning Flow (Unchanged) ---
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
            "generate_report_and_plan": "final_reporting_entry",
        },
    )

    # --- B. Evaluation Flow (Reverted to Monolithic Logic) ---
    
    # --- FIX 2: Restore the OLD looping logic ---
    # REMOVE the edges from questioner nodes to END.
    # ADD conditional edges from questioner nodes to the answer router.
    for node in [
        "introduction_questioner",
        "question_retriever",
        "deep_dive_questioner",
        "wrap_up_questioner",
    ]:
        workflow.add_conditional_edges(node, route_after_question_is_answered)

    # This is the old, correct logic for a monolithic graph
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

    # --- C. Main Interview Loop (Reverted) ---
    # Path A: Normal feedback -> update history -> get next topic
    workflow.add_edge("feedback_generator", "state_updater")
    workflow.add_edge("state_updater", "topic_setter")  # This loops back

    # Path B: Follow-up question -> route back to answer check
    workflow.add_conditional_edges("handle_follow_up", route_after_question_is_answered)


    # --- D. Final Reporting Flow (Unchanged) ---
    # This flow is parallel
    workflow.add_edge("final_reporting_entry", "report_generator")
    workflow.add_edge("final_reporting_entry", "personalization_planner")
    
    # Your new node is correctly wired up
    workflow.add_edge("report_generator", END)
    workflow.add_edge("personalization_planner", "save_personalization")
    workflow.add_edge("save_personalization", END)
    
    return workflow

# --- Compile the Graph (Unchanged) ---
_workflow = build_interview_workflow()
app: CompiledGraph = _workflow.compile()

def get_interview_graph() -> CompiledGraph:
    return app

def get_interview_workflow() -> StateGraph:
    return _workflow