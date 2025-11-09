# scripts/test_question_retrieval.py

import os
import pathlib
import sys
import asyncio
import json
from dotenv import load_dotenv

# --- THIS IS THE FIX ---
# Load environment variables FIRST, before any project imports
load_dotenv()
# --- END FIX ---

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
        # Add must_have_keywords for the new fallback agent
        must_have_keywords=["Scalability", "Reliability", "Data Pipelines"]
    )
    return resume, job


async def main() -> None:
    # load_dotenv() <-- REMOVED FROM HERE

    if not all(os.getenv(k) for k in ["GOOGLE_API_KEY", "PINECONE_API_KEY"]):
        print("Error: GOOGLE_API_KEY and PINECONE_API_KEY must be set in .env file.")
        return

    print("--- Running Retrieval Tests Against Existing Database ---")

    resume, job = make_resume_and_job()

    print("\n--- Retrieval Test: 'system-design' domain (should hit Pinecone) ---")
    try:
        out = await retrieve_question(
            domain="system-design", # More specific domain
            difficulty_hint=6,
            resume_analysis=resume,
            job_analysis=job,
            last_topics=["data-engineering"],
            min_relevance=0.3, # Low relevance to force a match
        )
        print("✅ RAG Success Output:")
        print(json.dumps(out.model_dump(), indent=2))
        
    except Exception as e:
        print(f"❌ Retrieval test failed: {e}")

    print("\n--- Fallback Test: 'ml-ops' domain (should trigger LLM fallback) ---")
    try:
        out_fb = await retrieve_question(
            domain="ml-ops",
            difficulty_hint=5,
            resume_analysis=resume,
            job_analysis=job,
            last_topics=["feature-store"],
            min_relevance=0.99,  # High threshold to force fallback
        )
        print("✅ Fallback Generation Output:")
        print(json.dumps(out_fb.model_dump(), indent=2))
        
        if out_fb.raw_question.question_id is None:
            print("\n👍 Test PASSED: Fallback was correctly triggered (question_id is None).")
        else:
            print("\n❌ Test FAILED: Fallback was NOT triggered.")
            
    except Exception as e:
        print(f"❌ Fallback test failed: {e}")


if __name__ == "__main__":
    asyncio.run(main())