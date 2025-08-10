# src/interview_system/orchestration/graph.py

from langgraph.graph import END, StateGraph

from .nodes import analyze_resume_node
from .state import SessionState

# This is our main orchestrator graph
workflow = StateGraph(SessionState)

# Add the nodes to the graph
workflow.add_node("resume_analyzer", analyze_resume_node)

# Set the entry point for the graph
workflow.set_entry_point("resume_analyzer")

# For now, the graph will end right after the resume analysis.
# We will add more nodes and edges later.
workflow.add_edge("resume_analyzer", END)

# Compile the graph into a runnable app
app = workflow.compile()
