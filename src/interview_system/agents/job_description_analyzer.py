import json
from jinja2 import Environment, FileSystemLoader

# The class name here MUST be "JobDescriptionAnalysisOutput"
from interview_system.schemas.agent_outputs import JobDescriptionAnalysisOutput
from interview_system.services.llm_clients import get_llm
from langchain_core.prompts import PromptTemplate

async def analyze_job_description(job_desc_text: str) -> JobDescriptionAnalysisOutput:
    """
    Analyzes a job description using an LLM to extract structured data.

    Args:
        job_desc_text: The raw text content of the job description.

    Returns:
        A Pydantic object containing the structured analysis.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("job_description_analyzer.j2")
    prompt_string = template.render(job_desc_text=job_desc_text)
    
    # Create a PromptTemplate for the chain
    prompt = PromptTemplate.from_template(prompt_string)

    # 1. Get the base LLM
    llm = get_llm(model_type="pro")

    # 2. THIS IS THE FIX: Create a new LLM that is
    #    forced to return JSON matching your Pydantic schema.
    structured_llm = llm.with_structured_output(JobDescriptionAnalysisOutput)

    # 3. Create the chain WITHOUT the manual JsonOutputParser
    #    We pass an empty dict {} because the prompt is already fully rendered
    chain = structured_llm

    # 4. Invoke the new chain
    # The 'response' will now be a perfectly-formed JobDescriptionAnalysisOutput object
    try:
        response_data = await chain.ainvoke(prompt_string)
    except Exception as e:
        # This will catch errors if the LLM *still* fails to output valid JSON
        raise ValueError(f"Failed to get structured output from LLM: {e}")

    return response_data