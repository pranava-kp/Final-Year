# test_question_retrieval.py

import os
import sys
import pathlib
import time
import json # ADDED: Import the json library

from dotenv import load_dotenv

# Ensure the project's src/ is on sys.path for local runs
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from interview_system.agents.question_retrieval import retrieve_question
from interview_system.schemas.agent_outputs import (
    JobDescriptionAnalysisOutput,
    ResumeAnalysisOutput,
    Skill,
    Project,
)
from interview_system.services.vector_store import get_vector_store


def seed_example_questions() -> None:
    store = get_vector_store()
    stats = store.index.describe_index_stats()
    # Check if the index is already seeded to avoid doing it every time
    if stats["total_vector_count"] > 10: # MODIFIED: Check against a higher number
        print("Index already contains a significant number of vectors. Skipping seeding.")
        return

    # --- MODIFIED SECTION START ---
    # Load questions from the external questions.txt file
    try:
        # NOTE: Adjust the path if your script's working directory is different
        with open("questions.txt", "r") as f:
            items = json.load(f)
        print(f"Loading {len(items)} questions from questions.txt...")
    except FileNotFoundError:
        print("Error: questions.txt not found. Cannot seed the database.")
        return
    except json.JSONDecodeError:
        print("Error: questions.txt is not a valid JSON file.")
        return
    # --- MODIFIED SECTION END ---

    print("Seeding example questions into Pinecone...")
    store.upsert_questions(items)
    print("Waiting for 10 seconds for the index to update...")
    time.sleep(10)


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

    if not all(
        os.getenv(k)
        for k in ["GOOGLE_API_KEY", "PINECONE_API_KEY"]
    ):
        print(
            "Error: GOOGLE_API_KEY and PINECONE_API_KEY must be set in .env file."
        )
        return

    print("--- Initializing vector store and seeding questions ---")
    seed_example_questions()

    resume, job = make_resume_and_job()

    print("\n--- Retrieval Test: technical domain (should hit Pinecone) ---")
    try:
        out = retrieve_question(
            domain="technical",
            difficulty_hint=6,
            resume_analysis=resume,
            job_analysis=job,
            last_topics=["system-design"],
            top_k=5,
            min_relevance=0.5,
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
            min_relevance=0.9,  # high threshold to force fallback if any near-miss occurs
        )
        print(out_fb.model_dump_json(indent=2))
    except Exception as e:
        print("Fallback test failed:", e)


if __name__ == "__main__":
    main()