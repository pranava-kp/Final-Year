import json

from jinja2 import Environment, FileSystemLoader

from interview_system.orchestration.state import SessionState
from interview_system.schemas.agent_outputs import PersonalizationOutput
from interview_system.services.llm_clients import get_llm


async def create_personalization_plan(session_state: SessionState) -> PersonalizationOutput:
    """
    Analyzes the full session to create a personalized plan for the next one.

    Args:
        session_state: The complete final state of the interview.

    Returns:
        A Pydantic object containing the personalization plan.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("personalization_agent.j2")

    prompt = template.render(session_history=session_state["question_history"])

    llm = get_llm(model_type="pro")  # Use Pro for insightful analysis
    response = await llm.ainvoke(prompt)

    try:
        start_index = response.content.find("{")
        end_index = response.content.rfind("}") + 1
        json_str = response.content[start_index:end_index]
        response_data = json.loads(json_str)
        return PersonalizationOutput(**response_data)
    except (json.JSONDecodeError, KeyError) as exc:
        raise ValueError(
            f"PersonalizationAgent returned malformed JSON: {response.content}"
        ) from exc
