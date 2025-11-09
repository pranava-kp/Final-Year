import json
import logging
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import RubricEvalOutput
from interview_system.services.llm_clients import get_llm

# Configure logging
logger = logging.getLogger(__name__)


async def rubric_eval_answer(
    question_text: str, answer_text: str, rubric: Dict[str, Any]
) -> RubricEvalOutput:
    """
    Performs a detailed, rubric-based evaluation of a user's answer using a pro LLM.

    Args:
        question_text: The interview question that was asked.
        answer_text: The user's answer to the question.
        rubric: A dictionary representing the evaluation rubric.

    Returns:
        A Pydantic object containing the structured rubric-based evaluation.
    """
    try:
        # 1. Set up Jinja2 to load the prompt template
        env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
        template = env.get_template("rubric_eval_agent.j2")

        # 2. Convert the rubric dict to a pretty-printed JSON string for the prompt
        rubric_json = json.dumps(rubric, indent=2)

        # 3. Render the prompt with the provided context
        prompt = template.render(
            question_text=question_text,
            answer_text=answer_text,
            rubric_json=rubric_json,
        )

        # 4. Get the Gemini Pro model for a high-quality response
        llm = get_llm(model_type="pro")

        # 5. Invoke the model
        logger.info("Invoking RubricEvalAgent (pro model)...")
        response = await llm.ainvoke(prompt)
        logger.info("RubricEvalAgent invocation complete.")

        # 6. Clean and parse the JSON response
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

        # 7. Validate the data against the Pydantic schema and return
        return RubricEvalOutput(**response_data)

    except Exception as e:
        logger.error("An unexpected error occurred in RubricEvalAgent: %s", e)
        raise
