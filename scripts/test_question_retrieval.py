# scripts/test_question_retrieval.py

import os
import pathlib
import sys

from dotenv import load_dotenv

from interview_system.agents.question_retrieval import retrieve_question
from interview_system.schemas.agent_outputs import (
    JobDescriptionAnalysisOutput,
    Project,
    ResumeAnalysisOutput,
    Skill,
)

# --- Boilerplate to set up path for imports ---
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
# --- End Boilerplate ---



# REMOVED: get_vector_store is not needed here anymore unless you want to check stats

# REMOVED: The entire seed_example_questions function has been moved to seed_database.py


def make_resume_and_job() -> tuple[ResumeAnalysisOutput, JobDescriptionAnalysisOutput]:
    resume = ResumeAnalysisOutput(
        skills=[
            Skill(name="Python", confidence=0.95),
            Skill(name="Spark", confidence=0.9),
        ],
        topics=["distributed-systems", "system-design", "data-engineering"],
        experience_summary="5+ years building data platforms and distributed services",
        projects=[
            Project(title="Orion", summary="Real-time personalization engine"),
        ],
    )
    job = JobDescriptionAnalysisOutput(
        required_skills=["Python", "System Design"],
        seniority="Senior",
        keywords=["Scalability", "Reliability"],
    )
    return resume, job


def main() -> None:
    load_dotenv()

    if not all(os.getenv(k) for k in ["GOOGLE_API_KEY", "PINECONE_API_KEY"]):
        print("Error: GOOGLE_API_KEY and PINECONE_API_KEY must be set in .env file.")
        return

    # REMOVED: The call to seed_example_questions() is gone.
    print("--- Running Retrieval Tests Against Existing Database ---")

    resume, job = make_resume_and_job()

    print("\n--- Retrieval Test: technical domain (should hit Pinecone) ---")
    try:
        # NOTE: Lowered min_relevance to increase chance of getting a match
        out = retrieve_question(
            domain="technical",
            difficulty_hint=6,
            resume_analysis=resume,
            job_analysis=job,
            last_topics=["system-design"],
            top_k=5,
            min_relevance=0.4,
        )
        print(out.model_dump_json(indent=2))
    except Exception as e:
        print("Retrieval test failed:", e)

    print("\n--- Fallback Test: ml-ops domain (should trigger LLM fallback) ---")
    try:
        out_fb = retrieve_question(
            domain="ml-ops",
            difficulty_hint=5,
            resume_analysis=resume,
            job_analysis=job,
            last_topics=["feature-store"],
            top_k=3,
            min_relevance=0.9,  # High threshold to force fallback
        )
        print(out_fb.model_dump_json(indent=2))
    except Exception as e:
        print("Fallback test failed:", e)


if __name__ == "__main__":
    main()
