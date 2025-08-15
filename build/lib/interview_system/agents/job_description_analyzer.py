import json

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import JobDescAnalysisOutput
from interview_system.services.llm_clients import get_llm


def analyze_job_description(job_desc_text: str) -> JobDescAnalysisOutput:
    """
    Analyzes a job description using an LLM to extract structured data.

    Args:
        job_desc_text: The raw text content of the job description.

    Returns:
        A Pydantic object containing the structured analysis.
    """
    # 1. Set up the Jinja2 environment to load the prompt template
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("job_description_analyzer.j2")

    # 2. Render the prompt with the job description text
    prompt = template.render(job_desc_text=job_desc_text)

    # 3. Get the Gemini Pro model for deep analysis
    llm = get_llm(model_type="pro")

    # 4. Invoke the model and get the response
    response = llm.invoke(prompt)

    # 5. Parse the JSON response from the model
    try:
        # Clean the response to handle markdown wrappers
        clean_content = response.content.strip().replace("```json", "").replace("```", "").strip()
        response_data = json.loads(clean_content)
    except json.JSONDecodeError:
        raise ValueError(f"Failed to decode LLM response as JSON. Raw content: {response.content}")

    # 6. Validate the data against our Pydantic schema and return
    return JobDescAnalysisOutput(**response_data)