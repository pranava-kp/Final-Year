# scripts/test_resume_agent.py

import os

from dotenv import load_dotenv

from interview_system.agents.resume_analyzer import analyze_resume


def main():
    """
    Runs a test of the resume analysis agent with enhanced debugging.
    """
    # Load environment variables from the .env file in the project root
    load_dotenv()

    if not os.getenv("GOOGLE_API_KEY"):
        print("Error: GOOGLE_API_KEY not found in .env file.")
        return

    print("--- Testing Resume Analysis Agent ---")

    # A sample resume text for testing
    sample_resume = """
    Jane Smith
    Lead Data Scientist

    Experience:
    - 8 years at Netflix optimizing recommendation algorithms using Python, PyTorch, and Spark.
    - Published 3 papers on reinforcement learning applications.

    Skills: Python, PyTorch, TensorFlow, Spark, SQL, Reinforcement Learning, NLP.

    Projects:
    - Project 'Orion': A real-time content personalization engine.
    """

    try:
        # We will now call the agent and print more detailed info
        print("\nAttempting to call the resume analysis agent...")
        analysis_result = analyze_resume(sample_resume)

        print("\n--- Analysis Successful ---")
        print("Validated Pydantic Object:")
        print(analysis_result.model_dump_json(indent=2))

    except ValueError as ve:
        # This will catch our specific JSON decoding error
        print("\n--- A ValueError occurred (likely a JSON parsing issue) ---")
        print(ve)
    except Exception as e:
        # This will catch any other errors, like authentication failures
        print("\n--- An unexpected error occurred ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")

if __name__ == "__main__":
    main()
