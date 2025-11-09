import json
from typing import Any

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import FeedbackGenOutput
from interview_system.services.llm_clients import get_llm


async def generate_feedback(
    question_text: str, answer_text: str, canonical_evaluation: dict[str, Any]
) -> FeedbackGenOutput:
    """
    Generates actionable feedback for the user based on their performance.

    Args:
        question_text: The raw text of the question that was asked.
        answer_text: The user's answer.
        canonical_evaluation: The synthesized evaluation from the previous step.

    Returns:
        A Pydantic object containing structured feedback.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("feedback_generator.j2")

    prompt = template.render(
        question_text=question_text,
        answer_text=answer_text,
        canonical_evaluation=canonical_evaluation,
    )

    llm = get_llm(model_type="pro")  # Use Pro for high-quality, nuanced feedback
    response = await llm.ainvoke(prompt)

    try:
        start_index = response.content.find("{")
        end_index = response.content.rfind("}") + 1
        json_str = response.content[start_index:end_index]
        response_data = json.loads(json_str)
        return FeedbackGenOutput(**response_data)
    except (json.JSONDecodeError, KeyError) as exc:
        raise ValueError(
            f"FeedbackGenAgent returned malformed JSON: {response.content}"
        ) from exc
