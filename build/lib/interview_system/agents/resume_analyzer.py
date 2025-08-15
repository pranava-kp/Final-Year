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
        # The response.content should be a JSON string.
        # It might be wrapped in markdown, so we clean it first.
        clean_content = response.content.strip().replace("```json", "").replace("```", "").strip()
        response_data = json.loads(clean_content)
    except json.JSONDecodeError:
        # Add the raw content to the error for better debugging
        raise ValueError(f"Failed to decode LLM response as JSON. Raw content: {response.content}")

    # 6. Validate the data against our Pydantic schema and return
    return ResumeAnalysisOutput(**response_data)
if __name__ == "__main__":
    sample_resume = """
    John Doe
    Backend Engineer
    Experience: 5 years of experience in Python and Java. Proficient in Django, Flask, and Spring Boot.
    Projects:
    1. E-commerce Platform: Designed and implemented a microservices-based e-commerce platform using Python and Django.
    2. Data Processing Pipeline: Built a distributed data processing pipeline with Apache Kafka.
    """
    try:
        analysis = analyze_resume(sample_resume)
        print("Analysis successful!")
        print(analysis.model_dump_json(indent=2))
    except Exception as e:
        print(f"An error occurred: {e}")