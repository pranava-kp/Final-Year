import json

from jinja2 import Environment, FileSystemLoader

# Corrected the import statement to use ResumeAnalysisOutput
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
        # --- ROBUST JSON PARSING ---
        # Find the start and end of the JSON object in the response
        json_start = response.content.find("{")
        json_end = response.content.rfind("}") + 1
        if json_start == -1 or json_end == 0:
            raise ValueError("No JSON object found in the LLM response.")

        json_string = response.content[json_start:json_end]
        response_data = json.loads(json_string)
        
    except json.JSONDecodeError as e:
        # Add the raw content to the error for better debugging
        raise ValueError(
            f"Failed to decode LLM response as JSON. Raw content: {response.content}"
        ) from e

    # 6. Validate the data against our Pydantic schema and return
    return ResumeAnalysisOutput(**response_data)
