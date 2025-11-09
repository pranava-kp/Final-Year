import json

from jinja2 import Environment, FileSystemLoader

from interview_system.orchestration.state import SessionState
from interview_system.schemas.agent_outputs import ReportGenOutput
from interview_system.services.llm_clients import get_llm
# 1. Import PromptTemplate
from langchain_core.prompts import PromptTemplate


async def generate_report(session_state: SessionState) -> ReportGenOutput:
    """
    Generates a final HTML report for the interview session.

    Args:
        session_state: The complete final state of the interview.

    Returns:
        A Pydantic object containing the HTML report and summary data.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("report_generator.j2")

    # 2. Render the prompt string
    prompt_string = template.render(session_history=session_state["question_history"])

    # 3. Get the Gemini Pro model
    llm = get_llm(
        model_type="pro"
    )  # Use Pro for a comprehensive and well-formatted report
    
    # 4. THIS IS THE FIX: Force the LLM to return JSON
    #    matching the ReportGenOutput schema.
    structured_llm = llm.with_structured_output(ReportGenOutput)

    try:
        # 5. Invoke the structured LLM. This will return a Pydantic object, not text.
        response_data = await structured_llm.ainvoke(prompt_string)
        return response_data
        
    except Exception as exc:
        # Catch any errors during the structured output generation
        raise ValueError(
            f"ReportGenAgent failed to generate structured output: {exc}"
        ) from exc