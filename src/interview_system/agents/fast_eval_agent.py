import json
import logging

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import FastEvalOutput
from interview_system.services.llm_clients import get_llm

# Configure logging
logger = logging.getLogger(__name__)


async def fast_eval_answer(
    question_text: str, ideal_answer_snippet: str, answer_text: str
) -> FastEvalOutput:
    """
    Performs a high-level, quick evaluation of a user's answer using a fast LLM.

    Args:
        question_text: The interview question that was asked.
        ideal_answer_snippet: A snippet of the ideal answer for context.
        answer_text: The user's answer to the question.

    Returns:
        A Pydantic object containing the structured evaluation of the answer.
    """
    try:
        # 1. Set up Jinja2 to load the prompt template
        env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
        template = env.get_template("fast_eval_agent.j2")

        # 2. Render the prompt with the provided context
        prompt = template.render(
            question_text=question_text,
            ideal_answer_snippet=ideal_answer_snippet,
            answer_text=answer_text,
        )

        # 3. Get the Gemini Flash model for a fast response
        llm = get_llm(model_type="flash")

        # 4. Invoke the model
        logger.info("Invoking FastEvalAgent (flash model)...")
        response = await llm.ainvoke(prompt)
        logger.info("FastEvalAgent invocation complete.")

        # 5. Clean and parse the JSON response
        try:
            # --- ROBUST JSON PARSING ---
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

        # 6. Validate the data against the Pydantic schema and return
        return FastEvalOutput(**response_data)

    except Exception as e:
        logger.error("An unexpected error occurred in FastEvalAgent: %s", e)
        raise
