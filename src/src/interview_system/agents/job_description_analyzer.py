# src/interview_system/agents/job_description_analyzer.py

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
        clean_content = response.content.strip().replace("```json", "").replace("```", "").strip()
        response_data = json.loads(clean_content)
    except json.JSONDecodeError:
        raise ValueError(f"Failed to decode LLM response as JSON. Raw content: {response.content}")

    return JobDescriptionAnalysisOutput(**response_data)