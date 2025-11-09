import json

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import FollowUpOutput
from interview_system.services.llm_clients import get_llm


async def generate_follow_up(question_text: str, answer_text: str) -> FollowUpOutput:
    """
    Generates a follow-up question if the user's answer was incomplete.

    Args:
        question_text: The original question asked.
        answer_text: The user's incomplete answer.

    Returns:
        A Pydantic object containing the follow-up question.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("follow_up_agent.j2")

    prompt = template.render(question_text=question_text, answer_text=answer_text)

    llm = get_llm(model_type="flash")  # Use Flash for a fast, conversational follow-up
    response = await llm.ainvoke(prompt)

    try:
        start_index = response.content.find("{")
        end_index = response.content.rfind("}") + 1
        json_str = response.content[start_index:end_index]
        response_data = json.loads(json_str)
        return FollowUpOutput(**response_data)
    except (json.JSONDecodeError, KeyError) as exc:
        raise ValueError(
            f"FollowUpAgent returned malformed JSON: {response.content}"
        ) from exc
