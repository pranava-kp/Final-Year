# scripts/test_fast_eval_agent.py

import os
import logging
from dotenv import load_dotenv
from interview_system.agents.fast_eval_agent import fast_eval_answer

# Configure basic logging for better feedback
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def main():
    """
    Runs a test of the fast evaluation agent in isolation.
    """
    # Load environment variables from the .env file in the project root
    load_dotenv()

    if not os.getenv("GOOGLE_API_KEY"):
        logging.error("Error: GOOGLE_API_KEY not found in .env file.")
        return

    logging.info("--- Testing Fast Evaluation Agent ---")

    # Sample data for testing
    question = "Explain the concept of REST APIs."
    ideal_snippet = "Stateless, client-server architecture, uses HTTP methods like GET, POST, DELETE."
    candidate_answer = "REST api consists of put patch delete get post etc. the payload is embedded in the api call along with headers. its stateless "

    try:
        logging.info("Attempting to call the fast evaluation agent...")
        analysis_result = fast_eval_answer(
            question_text=question,
            ideal_answer_snippet=ideal_snippet,
            answer_text=candidate_answer
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