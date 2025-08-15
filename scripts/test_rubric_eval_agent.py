# scripts/test_rubric_eval_agent.py

import os
import logging
from dotenv import load_dotenv
from interview_system.agents.rubric_eval_agent import rubric_eval_answer

# Configure basic logging for better feedback
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    """
    Runs a test of the rubric evaluation agent in isolation.
    """
    # Load environment variables from the .env file in the project root
    load_dotenv()

    if not os.getenv("GOOGLE_API_KEY"):
        logging.error("Error: GOOGLE_API_KEY not found in .env file.")
        return

    logging.info("--- Testing Rubric Evaluation Agent ---")

    # Sample data for testing
    question = "Explain the concept of REST APIs."
    candidate_answer = "REST APIs are POST, GET, FETCH, DELETE etc."
    evaluation_rubric = {
      "technical_accuracy": "Evaluates if core technical principles were mentioned and correct.",
      "clarity_of_explanation": "Assesses how clearly the concept was communicated.",
      "depth_of_knowledge": "Judges if the answer demonstrates a deep or superficial understanding."
    }

    try:
        logging.info("Attempting to call the rubric evaluation agent...")
        analysis_result = rubric_eval_answer(
            question_text=question,
            answer_text=candidate_answer,
            rubric=evaluation_rubric
        )

        logging.info("--- Analysis Successful ---")
        print("Validated Pydantic Object:")
        print(analysis_result.model_dump_json(indent=2))

    except ValueError as ve:
        logging.error("A ValueError occurred (likely a JSON parsing issue).")
        print(ve)
    except Exception as e:
        logging.error("An unexpected error occurred.")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")

if __name__ == "__main__":
    main()