# src/interview_system/agents/question_retrieval.py
import json
import logging
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import (
    ConversationalQuestionOutput,
    JobDescriptionAnalysisOutput,  # <-- Restored this import
    RawQuestionData,
    ResumeAnalysisOutput,  # <-- Restored this import
)
from interview_system.services.llm_clients import get_llm
from interview_system.services.vector_store import get_vector_store

from ..api.database import get_db_session
from ..repositories.review_queue_repository import ReviewQueueRepository

logger = logging.getLogger(__name__)  # <-- From your teammate

FALLBACK_MIN_RELEVANCE = 0.35


async def _transform_query(
    resume_summary: dict | None, job_summary: dict | None, domain: str
) -> str:
    """
    Uses a fast LLM to transform resume and job summaries into a natural language query.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("query_transformer.j2")
    prompt = template.render(
        domain=domain, resume_summary=resume_summary, job_summary=job_summary
    )
    llm = get_llm(model_type="flash")
    response = await llm.ainvoke(prompt)
    return response.content.strip().strip('"')


async def _make_question_conversational(
    raw_question: RawQuestionData,
) -> ConversationalQuestionOutput:
    """Uses a fast LLM to rephrase a raw question text to be conversational."""
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("make_question_conversational.j2")
    prompt = template.render(question_text=raw_question.text)
    llm = get_llm(model_type="flash")
    response = await llm.ainvoke(prompt)
    return ConversationalQuestionOutput(
        conversational_text=response.content.strip(), raw_question=raw_question
    )


# --- This is your teammate's good, fixed fallback function ---
async def _generate_and_present_fallback(
    domain: str,
    difficulty: int,
    last_topics: List[str],
    resume_summary: dict | None,
    job_summary: dict | None,
) -> ConversationalQuestionOutput:
    """
    If no relevant question is found, generates a new one and presents it.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("generate_and_present_fallback.j2")

    resume_topics = resume_summary.get("topics", []) if resume_summary else []
    job_keywords_list = job_summary.get("must_have_keywords", []) if job_summary else []

    prompt = template.render(
        domain=domain,
        difficulty=difficulty,
        last_topics=last_topics,
        resume_topics=resume_topics,
        job_keywords=job_keywords_list,
    )

    llm = get_llm(model_type="flash")
    response = await llm.ainvoke(prompt)

    try:
        # --- THIS IS THE FIX ---
        # Find the first { and the last } to extract the JSON
        # This strips the "```json\n" prefix and "\n```" suffix
        start_index = response.content.find("{")
        end_index = response.content.rfind("}") + 1

        if start_index == -1 or end_index == -1:
            raise json.JSONDecodeError("No JSON object found", response.content, 0)

        json_str = response.content[start_index:end_index]
        data = json.loads(json_str)
        try:
            with get_db_session() as db:
                repo = ReviewQueueRepository(db)
                repo.create_pending_question(question_json=data)
            logger.info(
                f"Successfully saved fallback question for '{domain}' to review queue."
            )
        except Exception as db_exc:
            # Log the error, but don't fail the interview for the user
            logger.error(
                f"Failed to save fallback question to review queue: {db_exc}",
                exc_info=True,
            )

        # Check if "raw_question" key exists as per your original file's logic
        if "raw_question" in data and isinstance(data["raw_question"], dict):
            raw_question = RawQuestionData(**data["raw_question"])
        else:
            # Fallback to the teammate's safer parsing
            raw_question = RawQuestionData(
                question_id=None,
                text=data.get("raw_question_text"),
                domain=domain,
                difficulty=difficulty,
                ideal_answer_snippet=data.get("ideal_answer_snippet"),
            )

        return ConversationalQuestionOutput(
            conversational_text=data.get("conversational_text"),
            raw_question=raw_question,
        )
    except (json.JSONDecodeError, KeyError) as exc:
        logger.warning(
            f"Fallback generation returned malformed JSON: {response.content}. Using raw text.",
            exc_info=True,
        )
        # The recovery logic now only uses the raw text, which is *still* bad
        # but the try block above should now succeed.
        raw_question = RawQuestionData(
            question_id=None,
            text=response.content,
            domain=domain,
            difficulty=difficulty,
            ideal_answer_snippet="Answer to the best of your ability.",
        )
        return ConversationalQuestionOutput(
            conversational_text=response.content, raw_question=raw_question
        )


# --- This is the retrieve_question function with the RAG FIX ---
# --- It REPLACES your teammate's broken one ---
async def retrieve_question(
    *,
    domain: str,
    resume_analysis: ResumeAnalysisOutput | dict | None = None,
    job_analysis: JobDescriptionAnalysisOutput | dict | None = None,
    last_topics: List[str] | None = None,
    difficulty_hint: int = 5,
    min_relevance: float = FALLBACK_MIN_RELEVANCE,
) -> ConversationalQuestionOutput:
    logger.info(f"--- Agent: Retrieving question for domain: {domain} ---")

    # This logic handles both dicts and Pydantic models
    resume_dict = None
    if resume_analysis:
        if isinstance(resume_analysis, dict):
            resume_dict = resume_analysis
            resume_analysis = ResumeAnalysisOutput(**resume_analysis)
        else:
            resume_dict = resume_analysis.model_dump()

    job_dict = None
    if job_analysis:
        if isinstance(job_analysis, dict):
            job_dict = job_analysis
            job_analysis = JobDescriptionAnalysisOutput(**job_analysis)
        else:
            job_dict = job_analysis.model_dump()

    transformed_query = await _transform_query(
        resume_summary=resume_dict,
        job_summary=job_dict,
        domain=domain,
    )
    logger.info(f"Transformed query: {transformed_query}")

    # --- RAG FIX ---
    # 1. Build a filter *only* for difficulty.
    difficulty_conditions: List[Dict[str, Any]] = []
    if difficulty_hint is not None:
        difficulty_conditions.append(
            {"difficulty": {"$gte": max(1, difficulty_hint - 2)}}
        )
        difficulty_conditions.append(
            {"difficulty": {"$lte": min(10, difficulty_hint + 2)}}
        )

    where = (
        {"$and": difficulty_conditions}
        if len(difficulty_conditions) > 1
        else (difficulty_conditions[0] if difficulty_conditions else {})
    )

    store = get_vector_store()

    # 2. Fetch more candidates
    candidates = store.query_similar(
        query_text=transformed_query,
        top_k=5,  # Fetch 5 to filter in Python
        where=where,
        namespace="updated-namespace",
    )

    best_match = None

    if candidates:
        # 3. Filter in Python
        for candidate in candidates:
            meta = candidate.get("metadata", {}) or {}
            meta_domain = str(meta.get("domain", "")).strip()

            is_match = (
                meta_domain == domain
                or meta_domain.endswith(f"-{domain}")
                or meta_domain.endswith(f":{domain}")
            )

            if is_match:
                best_match = candidate
                break  # Found the best, most relevant match

    if best_match:
        relevance = float(best_match.get("relevance_score", 0.0))
        logger.info(f"--- Best candidate relevance: {relevance} ---")

        if relevance >= min_relevance:
            meta = best_match.get("metadata", {}) or {}
            raw_question = RawQuestionData(
                question_id=str(best_match.get("id")) if best_match.get("id") else None,
                text=str(meta.get("text", "")),
                domain=str(meta.get("domain", domain)),
                difficulty=int(meta.get("difficulty", difficulty_hint)),
                ideal_answer_snippet=str(meta.get("ideal_answer_snippet") or ""),
                rubric_id=(
                    str(meta.get("rubric_id")) if meta.get("rubric_id") else None
                ),
                relevance_score=relevance,
            )
            return await _make_question_conversational(raw_question)

    logger.info(
        "--- Low relevance or no matching domain, triggering LLM fallback generation ---"
    )
    return await _generate_and_present_fallback(
        domain=domain,
        difficulty=difficulty_hint,
        last_topics=last_topics or [],
        resume_summary=resume_dict,  # Pass the dicts
        job_summary=job_dict,
    )
