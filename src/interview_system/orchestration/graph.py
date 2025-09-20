from langgraph.graph import END, START, StateGraph
from typing import List, Literal

from .nodes import (
    analyze_job_description_node,
    analyze_resume_node,
    evaluation_synthesizer_node,
    fast_eval_node,
    retrieve_question_node,
    rubric_eval_node,
)
from .state import SessionState


def route_after_question(state: SessionState) -> List[str] | Literal["__end__"]:
    """
    Router that decides what to do after a question is retrieved and answered.
    It returns a list of nodes to run in parallel if evaluation is needed.
    """
    current_question = state.get("current_question")
    if current_question and current_question.answer_text:
        print("--- Answer received, proceeding to parallel evaluation ---")
        # Return a list of nodes to run in parallel
        return ["fast_evaluator", "rubric_evaluator"]
    else:
        # This path is taken after the first question is retrieved, before an answer.
        # The graph will pause here, waiting for user input.
        print("--- Question presented, graph pausing ---")
        return END


# This is our main orchestrator graph
workflow = StateGraph(SessionState)

# Add all the nodes to the graph
workflow.add_node("resume_analyzer", analyze_resume_node)
workflow.add_node("job_description_analyzer", analyze_job_description_node)
workflow.add_node("question_retriever", retrieve_question_node)
workflow.add_node("fast_evaluator", fast_eval_node)
workflow.add_node("rubric_evaluator", rubric_eval_node)
workflow.add_node("evaluation_synthesizer", evaluation_synthesizer_node)

# --- Define the graph's structure (the edges) ---

# 1. Set the entry point to run the two analysis nodes in parallel
workflow.add_edge(START, "resume_analyzer")
workflow.add_edge(START, "job_description_analyzer")

# 2. After both analysis nodes are done, they lead to the question retriever
workflow.add_edge("resume_analyzer", "question_retriever")
workflow.add_edge("job_description_analyzer", "question_retriever")

# 3. After a question is retrieved, our conditional router decides the next step.
# CORRECTED: The router function now returns the list of nodes directly.
# We no longer need the mapping dictionary.
workflow.add_conditional_edges(
    "question_retriever",
    route_after_question,
)

# 4. After both evaluation nodes run in parallel, they proceed to the synthesizer
workflow.add_edge("fast_evaluator", "evaluation_synthesizer")
workflow.add_edge("rubric_evaluator", "evaluation_synthesizer")

# 5. For now, the graph ends after synthesizing the evaluation.
workflow.add_edge("evaluation_synthesizer", END)


# Compile the graph into a runnable app
app = workflow.compile()

