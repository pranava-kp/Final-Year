# src/interview_system/agents/fast_eval_agent.py

import json
import logging
from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import FastEvalOutput
from interview_system.services.llm_clients import get_llm

# Configure logging
logger = logging.getLogger(__name__)


def fast_eval_answer(
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
        response = llm.invoke(prompt)
        logger.info("FastEvalAgent invocation complete.")

        # 5. Clean and parse the JSON response
        # The response.content should be a JSON string.
        # It might be wrapped in markdown, so we clean it first.
        clean_content = (
            response.content.strip().replace("```json", "").replace("```", "").strip()
        )
        response_data = json.loads(clean_content)

        # 6. Validate the data against the Pydantic schema and return
        return FastEvalOutput(**response_data)

    except json.JSONDecodeError as e:
        logger.error(
            "Failed to decode LLM response as JSON. Raw content: %s", response.content
        )
        # In a real app, you might return a default error object or retry
        raise ValueError(
            f"Failed to decode LLM response as JSON. Raw content: {response.content}"
        ) from e
    except Exception as e:
        logger.error("An unexpected error occurred in FastEvalAgent: %s", e)
        raise