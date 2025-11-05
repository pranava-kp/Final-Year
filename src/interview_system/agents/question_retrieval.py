import json
import logging
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import (
    ConversationalQuestionOutput,
    RawQuestionData,
)
from interview_system.services.llm_clients import get_llm
from interview_system.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)

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


async def _generate_and_present_fallback(
    domain: str,
    difficulty: int,
    last_topics: List[str],
    resume_summary: dict | None,
    # --- FIX 1: Add job_summary to the function signature ---
    job_summary: dict | None,
) -> ConversationalQuestionOutput:
    """
    If no relevant question is found, generates a new one and presents it.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("generate_and_present_fallback.j2")

    # --- FIX 2: Extract resume_topics AND job_keywords ---
    resume_topics = resume_summary.get("topics", []) if resume_summary else []
    # This provides a default empty list if the summary or keywords are missing
    # I'm using "must_have_keywords" as that's what's in your project's README.md plan
    job_keywords_list = job_summary.get("must_have_keywords", []) if job_summary else []

    # --- FIX 3: Pass both variables to the template ---
    prompt = template.render(
        domain=domain,
        difficulty=difficulty,
        last_topics=last_topics,
        resume_topics=resume_topics,
        job_keywords=job_keywords_list,  # This fixes the 'Undefined' error
    )
    
    llm = get_llm(model_type="flash")
    response = await llm.ainvoke(prompt)

    try:
        data = json.loads(response.content)
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
    except json.JSONDecodeError:
        logger.warning("Fallback LLM output was not valid JSON. Using raw text.")
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


async def retrieve_question(
    domain: str,
    resume_analysis: Optional[Dict[str, Any]],
    job_analysis: Optional[Dict[str, Any]],
    last_topics: List[str],
) -> ConversationalQuestionOutput:
    """
    Retrieves a relevant question from the vector store or generates a new one.
    """
    logger.info(f"--- Agent: Retrieving question for domain: {domain} ---")

    difficulty_hint = 5
    min_relevance = FALLBACK_MIN_RELEVANCE

    transformed_query = await _transform_query(
        resume_summary=resume_analysis, job_summary=job_analysis, domain=domain
    )
    logger.info(f"Transformed query: {transformed_query}")

    where = {"domain": domain, "difficulty": {"$lte": difficulty_hint + 1}}

    store = get_vector_store()
    candidates = store.query_similar(
        query_text=transformed_query,
        top_k=1,
        where=where,
        namespace="updated-namespace",
    )

    if candidates:
        best = candidates[0]
        relevance = float(best.get("relevance_score", 0.0))
        logger.info(f"--- Best candidate relevance: {relevance} ---")
        if relevance >= min_relevance:
            meta = best.get("metadata", {}) or {}
            raw_question = RawQuestionData(
                question_id=str(best.get("id")) if best.get("id") else None,
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

    logger.info("--- Low relevance, triggering LLM fallback generation ---")
    
    # --- FIX 4: Pass both summaries to the fallback function ---
    return await _generate_and_present_fallback(
        domain=domain,
        difficulty=difficulty_hint,
        last_topics=last_topics,
        resume_summary=resume_analysis,
        job_summary=job_analysis, # This argument was missing
    )