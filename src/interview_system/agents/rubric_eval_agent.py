# src/interview_system/agents/rubric_eval_agent.py

import json
import logging
from typing import Dict, Any
from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import RubricEvalOutput
from interview_system.services.llm_clients import get_llm

# Configure logging
logger = logging.getLogger(__name__)


def rubric_eval_answer(
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
        response = llm.invoke(prompt)
        logger.info("RubricEvalAgent invocation complete.")
        # print("the agent says\n"+response.content)

        # 6. Clean and parse the JSON response
        clean_content = (
            response.content.strip().replace("```json", "").replace("```", "").strip()
        )
        response_data = json.loads(clean_content)

        # 7. Validate the data against the Pydantic schema and return
        return RubricEvalOutput(**response_data)

    except json.JSONDecodeError as e:
        logger.error(
            "Failed to decode LLM response as JSON. Raw content: %s", response.content
        )
        raise ValueError(
            f"Failed to decode LLM response as JSON. Raw content: {response.content}"
        ) from e
    except Exception as e:
        logger.error("An unexpected error occurred in RubricEvalAgent: %s", e)
        raise