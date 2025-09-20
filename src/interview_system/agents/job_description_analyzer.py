import json

from jinja2 import Environment, FileSystemLoader

# The class name here MUST be "JobDescriptionAnalysisOutput"
from interview_system.schemas.agent_outputs import JobDescriptionAnalysisOutput
from interview_system.services.llm_clients import get_llm


def analyze_job_description(job_desc_text: str) -> JobDescriptionAnalysisOutput:
    """
    Analyzes a job description using an LLM to extract structured data.

    Args:
        job_desc_text: The raw text content of the job description.

    Returns:
        A Pydantic object containing the structured analysis.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("job_description_analyzer.j2")
    prompt = template.render(job_desc_text=job_desc_text)

    llm = get_llm(model_type="pro")
    response = llm.invoke(prompt)

    try:
        # --- ROBUST JSON PARSING ---
        # Find the start and end of the JSON object in the response
        json_start = response.content.find("{")
        json_end = response.content.rfind("}") + 1
        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON object found in the LLM response.")

        json_string = response.content[json_start:json_end]
        response_data = json.loads(json_string)

    except json.JSONDecodeError as e:
        raise ValueError(
            f"Failed to decode LLM response as JSON. Raw content: {response.content}"
        ) from e

    return JobDescriptionAnalysisOutput(**response_data)
