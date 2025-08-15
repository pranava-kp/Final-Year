"""
Quick manual test for the Question Retrieval Agent.

What it does:
- Loads env (expects GOOGLE_API_KEY in .env)
- Seeds a few example questions into the local ChromaDB collection
- Calls retrieve_question() once for a retrievable domain and once for a domain
  that should trigger LLM fallback
"""

import os
import sys
import pathlib

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
    items = [
        {
            "id": "q-tech-sysdesign-1",
            "text": "Design a URL shortener service. Discuss storage, hashing, and scalability trade-offs.",
            "domain": "technical",
            "difficulty": 6,
            "ideal_answer_snippet": "Cover API design, unique ID generation, DB schema, caching, rate limiting, and horizontal scaling.",
            "rubric_id": "rubric-sysdesign-01",
        },
        {
            "id": "q-tech-ds-1",
            "text": "Explain how you would optimize a Spark job that is running slowly on large datasets.",
            "domain": "technical",
            "difficulty": 5,
            "ideal_answer_snippet": "Discuss partitioning, caching, avoiding wide shuffles, predicate pushdown, and monitoring lineage/stages.",
            "rubric_id": "rubric-ds-01",
        },
        {
            "id": "q-behavioral-1",
            "text": "Tell me about a time you handled a significant production incident.",
            "domain": "behavioural",
            "difficulty": 4,
            "ideal_answer_snippet": "Describe incident detection, triage, root cause analysis, communication, and postmortem actions.",
            "rubric_id": "rubric-behavioral-01",
        },
    ]
    store.upsert_questions(items)


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
        must_have_keywords=["Scalability", "Reliability"],
    )
    return resume, job


def main() -> None:
    load_dotenv()

    if not os.getenv("GOOGLE_API_KEY"):
        print("Error: GOOGLE_API_KEY not found in .env file.")
        return

    print("--- Seeding example questions into ChromaDB ---")
    seed_example_questions()

    resume, job = make_resume_and_job()

    print("\n--- Retrieval Test: technical domain (should hit DB) ---")
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


