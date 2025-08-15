import os
from dotenv import load_dotenv

from interview_system.agents.job_description_analyzer import analyze_job_description

def main():
    """
    Runs a test of the job description analysis agent with enhanced debugging.
    """
    load_dotenv()

    if not os.getenv("GOOGLE_API_KEY"):
        print("Error: GOOGLE_API_KEY not found in .env file.")
        return

    print("--- Testing Job Description Analysis Agent ---")

    sample_job_desc = """
    We are looking for a Senior Software Engineer with 5+ years of experience in Python and cloud technologies. The ideal candidate will have a strong background in building scalable distributed systems and RESTful APIs using frameworks like Django or Flask. Must have experience with microservices architecture, Docker, and Kubernetes. Knowledge of database design (SQL/NoSQL) and message queues (RabbitMQ, Kafka) is essential. A background in machine learning or data engineering is a plus.
    """
    try:
        print("\nAttempting to call the job description analysis agent...")
        analysis = analyze_job_description(sample_job_desc)
        
        print("\n--- Analysis Successful ---")
        print(analysis.model_dump_json(indent=2))

    except Exception as e:
        print(f"\n--- An error occurred ---")
        print(e)

if __name__ == "__main__":
    main()