import json
from typing import Any, Dict, List

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import (
    ConversationalQuestionOutput,
    JobDescriptionAnalysisOutput,
    RawQuestionData,
    ResumeAnalysisOutput,
)
from interview_system.services.llm_clients import get_llm
from interview_system.services.vector_store import get_vector_store

FALLBACK_MIN_RELEVANCE = 0.35


def _transform_query(
    resume_summary: dict | None, job_summary: dict | None, domain: str
) -> str:
    """
    Uses a fast LLM to transform resume and job summaries into a natural language query.
    """
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("query_transformer.j2")

    prompt = template.render(
        domain=domain,  # Pass the specific domain for focus
        resume_summary=resume_summary,
        job_summary=job_summary,
    )

    llm = get_llm(model_type="flash")
    response = llm.invoke(prompt)
    return response.content.strip().strip('"')


def _make_question_conversational(
    raw_question: RawQuestionData,
) -> ConversationalQuestionOutput:
    """Uses a fast LLM to make a retrieved question sound more natural."""
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("make_question_conversational.j2")
    prompt = template.render(question_text=raw_question.text)
    llm = get_llm(model_type="flash")
    response = llm.invoke(prompt)
    return ConversationalQuestionOutput(
        conversational_text=response.content.strip().strip('"'),
        raw_question=raw_question,
    )


def _generate_and_present_fallback(
    domain: str,
    difficulty_hint: int,
    resume_analysis: ResumeAnalysisOutput | None,
    job_analysis: JobDescriptionAnalysisOutput | None,
    last_topics: List[str] | None,
) -> ConversationalQuestionOutput:
    """Generates a new question and presents it conversationally."""
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("generate_and_present_fallback.j2")
    prompt = template.render(
        domain=domain,
        difficulty=difficulty_hint,
        resume_topics=resume_analysis.topics if resume_analysis else [],
        job_keywords=job_analysis.keywords if job_analysis else [],
        last_topics=last_topics or [],
    )
    llm = get_llm(model_type="flash")
    response = llm.invoke(prompt)
    try:
        start_index = response.content.find("{")
        end_index = response.content.rfind("}") + 1
        json_str = response.content[start_index:end_index]
        data = json.loads(json_str)
        raw_question = RawQuestionData(**data["raw_question"])
        print("--- HITL: Sending generated question to review queue ---")
        print(json.dumps(raw_question.model_dump(), indent=2))
        return ConversationalQuestionOutput(
            conversational_text=data["conversational_text"], raw_question=raw_question
        )
    except (json.JSONDecodeError, KeyError) as exc:
        raise ValueError(
            f"Fallback generation returned malformed JSON: {response.content}"
        ) from exc


def retrieve_question(
    *,
    domain: str,
    resume_analysis: ResumeAnalysisOutput | dict | None = None,
    job_analysis: JobDescriptionAnalysisOutput | dict | None = None,
    last_topics: List[str] | None = None,
    difficulty_hint: int = 5,
    min_relevance: float = FALLBACK_MIN_RELEVANCE,
) -> ConversationalQuestionOutput:
    """
    Retrieves a question from the vector DB, making it conversational.
    Falls back to generating a new conversational question if relevance is low.
    """
    # 1. Ensure we are working with Pydantic objects for consistency
    if resume_analysis and isinstance(resume_analysis, dict):
        resume_analysis = ResumeAnalysisOutput(**resume_analysis)
    if job_analysis and isinstance(job_analysis, dict):
        job_analysis = JobDescriptionAnalysisOutput(**job_analysis)

    # 2. Transform the high-level context into a natural language query
    transformed_query = _transform_query(
        resume_summary=resume_analysis.model_dump() if resume_analysis else None,
        job_summary=job_analysis.model_dump() if job_analysis else None,
        domain=domain,
    )
    print(f"--- Transformed Query: {transformed_query} ---")

    # 3. Build a robust filter for the vector store query
    conditions: List[Dict[str, Any]] = [
        {"domain": {"$in": [domain, f"technical:{domain}"]}}
    ]
    if difficulty_hint is not None:
        conditions.append({"difficulty": {"$gte": max(1, difficulty_hint - 2)}})
        conditions.append({"difficulty": {"$lte": min(10, difficulty_hint + 2)}})
    where = {"$and": conditions} if len(conditions) > 1 else conditions[0]

    # 4. Query the vector store
    store = get_vector_store()

    # --- THIS IS THE ONLY CHANGE YOU NEED TO MAKE ---
    # Hardcode your desired namespace directly in the query call.
    candidates = store.query_similar(
        query_text=transformed_query,
        top_k=1,
        where=where,
        namespace="updated-namespace",  # <-- HARDCODED FIX
    )
    # ----------------------------------------------

    if candidates:
        best = candidates[0]
        relevance = float(best.get("relevance_score", 0.0))
        print(f"--- Best candidate relevance: {relevance} ---")

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
            return _make_question_conversational(raw_question)

    # 5. If retrieval fails or relevance is too low, trigger the fallback
    print("--- Low relevance, triggering LLM fallback generation ---")
    return _generate_and_present_fallback(
        domain=domain,
        difficulty_hint=difficulty_hint,
        resume_analysis=resume_analysis,
        job_analysis=job_analysis,
        last_topics=last_topics,
    )
