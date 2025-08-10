# src/interview_system/agents/resume_analyzer.py

import json

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import ResumeAnalysisOutput
from interview_system.services.llm_clients import get_llm


def analyze_resume(resume_text: str) -> ResumeAnalysisOutput:
    """
    Analyzes resume text using an LLM to extract structured data.

    Args:
        resume_text: The raw text content of the user's resume.

    Returns:
        A Pydantic object containing the structured analysis of the resume.
    """
    # 1. Set up the Jinja2 environment to load the prompt template
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("resume_analyzer.j2")

    # 2. Render the prompt with the user's resume text
    prompt = template.render(resume_text=resume_text)

    # 3. Get the Gemini Pro model
    llm = get_llm(model_type="pro")

    # 4. Invoke the model and get the response
    response = llm.invoke(prompt)

    # 5. Parse the JSON response from the model
    try:
        # The response.content should be a JSON string.
        # It might be wrapped in markdown, so we clean it first.
        clean_content = response.content.strip().replace("```json", "").replace("```", "").strip()
        response_data = json.loads(clean_content)
    except json.JSONDecodeError:
        # Add the raw content to the error for better debugging
        raise ValueError(f"Failed to decode LLM response as JSON. Raw content: {response.content}")

    # 6. Validate the data against our Pydantic schema and return
    return ResumeAnalysisOutput(**response_data)
