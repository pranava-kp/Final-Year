import json

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import (
    ConversationalQuestionOutput,
    RawQuestionData,
)
from interview_system.services.llm_clients import get_llm


async def generate_deep_dive_question(
    item_type: str, item_name: str, resume_summary: dict
) -> ConversationalQuestionOutput:
    """
    Generates a personalized question about a specific item on a resume.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))

    if item_type == "project":
        template = env.get_template("deep_dive_project.j2")
        # Find the specific project details from the summary
        project_details = next(
            (
                p
                for p in resume_summary.get("projects", [])
                if p.get("title") == item_name
            ),
            None,
        )
        if not project_details:
            raise ValueError(f"Project '{item_name}' not found in resume summary.")

        prompt = template.render(
            item_name=item_name, project_summary=project_details.get("summary")
        )
    else:  # Assumes 'skill' for any other type
        template = env.get_template("deep_dive_skill.j2")
        prompt = template.render(skill_name=item_name)

    llm = get_llm(model_type="pro")
    response = await llm.ainvoke(prompt)

    try:
        # Robustly find and parse the JSON object from the response
        start_index = response.content.find("{")
        end_index = response.content.rfind("}") + 1
        json_str = response.content[start_index:end_index]
        data = json.loads(json_str)

        # Use the correct, generic schema for generated questions
        raw_question = RawQuestionData(**data["raw_question"])

        return ConversationalQuestionOutput(
            conversational_text=data["conversational_text"], raw_question=raw_question
        )
    except (json.JSONDecodeError, KeyError) as exc:
        raise ValueError(
            f"Deep dive generation returned malformed JSON: {response.content}"
        ) from exc

