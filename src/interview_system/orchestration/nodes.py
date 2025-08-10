# src/interview_system/orchestration/nodes.py

from interview_system.agents.resume_analyzer import analyze_resume

from .state import SessionState


def analyze_resume_node(state: SessionState) -> dict:
    """
    A node that analyzes the user's resume.

    Args:
        state: The current session state.

    Returns:
        A dictionary with the updated resume_summary.
    """
    print("--- Running Resume Analysis Node ---")

    # For now, we'll use a placeholder for the resume text.
    # Later, this will come from the initial API request.
    resume_text = state.get("initial_resume_text", "")

    if not resume_text:
        # In a real scenario, you might handle this error more gracefully
        print("Warning: No resume text found in state.")
        return {}

    analysis_result = analyze_resume(resume_text)

    # We convert the Pydantic model to a dict to store it in the state
    return {"resume_summary": analysis_result.model_dump()}

