import json
from jinja2 import Environment, FileSystemLoader

# Corrected the import statement to use ResumeAnalysisOutput
from interview_system.schemas.agent_outputs import ResumeAnalysisOutput
from interview_system.services.llm_clients import get_llm
from langchain_core.prompts import PromptTemplate


async def analyze_resume(resume_text: str) -> ResumeAnalysisOutput:
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
    prompt_string = template.render(resume_text=resume_text)

    # Create a PromptTemplate for the chain
    prompt = PromptTemplate.from_template(prompt_string)

    # 3. Get the Gemini Pro model
    llm = get_llm(model_type="pro")

    # 4. THIS IS THE FIX: Force the LLM to return
    #    JSON matching the ResumeAnalysisOutput schema.
    structured_llm = llm.with_structured_output(ResumeAnalysisOutput)

    # 5. Invoke the model and get the response
    # The 'response_data' will be a perfectly-formed ResumeAnalysisOutput object
    try:
        response_data = await structured_llm.ainvoke(prompt_string)
    except Exception as e:
        # This will catch errors if the LLM *still* fails to output valid JSON
        raise ValueError(f"Failed to get structured output from LLM: {e}")

    # 6. Validate the data against our Pydantic schema and return
    return response_data