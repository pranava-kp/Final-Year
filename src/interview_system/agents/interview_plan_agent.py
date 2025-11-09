import json

from jinja2 import Environment, FileSystemLoader

from interview_system.services.llm_clients import get_llm


async def generate_interview_plan(
    resume_summary: dict, job_summary: dict, personalization_profile: dict | None
) -> list[str]:
    """
    Uses a powerful LLM to generate a dynamic, personalized interview plan.

    Args:
        resume_summary: The structured summary of the candidate's resume.
        job_summary: The structured summary of the job description.
        personalization_profile: The (optional) personalization profile from previous sessions.
                                 This will be None for the first run.

    Returns:
        A list of strings representing the interview plan.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("interview_plan_generator.j2")

    # Pass all three variables to the template.
    prompt = template.render(
        resume_summary=resume_summary,
        job_summary=job_summary,
        personalization_profile=personalization_profile,
    )

    llm = get_llm(model_type="pro")  # Use Pro for strategic reasoning
    response = await llm.ainvoke(prompt)

    try:
        # Use robust JSON parsing
        start_index = response.content.find("{")
        end_index = response.content.rfind("}") + 1
        if start_index == -1 or end_index == 0:
            raise ValueError("No JSON object found in the LLM response.")

        json_str = response.content[start_index:end_index]
        response_data = json.loads(json_str)

        plan = response_data.get("plan")
        if not isinstance(plan, list):
            raise ValueError("The 'plan' key in the JSON response is not a list.")

        return plan

    except (json.JSONDecodeError, KeyError, ValueError) as exc:
        raise ValueError(
            f"InterviewPlanAgent returned malformed data: {response.content}"
        ) from exc
