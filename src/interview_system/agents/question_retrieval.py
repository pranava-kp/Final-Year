import json
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import (
    JobDescriptionAnalysisOutput,
    QuestionRetrievalOutput,
    ResumeAnalysisOutput,
)
from interview_system.services.llm_clients import get_llm
from interview_system.services.vector_store import get_vector_store


FALLBACK_MIN_RELEVANCE = 0.75


def _build_query_from_signals(
    domain: str,
    resume_analysis: Optional[ResumeAnalysisOutput] = None,
    job_analysis: Optional[JobDescriptionAnalysisOutput] = None,
    last_topics: Optional[List[str]] = None,
) -> str:
    terms: List[str] = [domain]
    if resume_analysis:
        terms.extend(resume_analysis.topics)
        terms.extend([s.name for s in resume_analysis.skills])
    if job_analysis:
        terms.extend(job_analysis.required_skills)
        terms.extend(job_analysis.must_have_keywords)
    if last_topics:
        terms.extend(last_topics)
    # Deduplicate while preserving order
    seen: set[str] = set()
    unique_terms: List[str] = []
    for t in terms:
        if t and t.lower() not in seen:
            unique_terms.append(t)
            seen.add(t.lower())
    return ", ".join(unique_terms)


def retrieve_question(
    *,
    domain: str,
    difficulty_hint: Optional[int] = None,
    resume_analysis: Optional[ResumeAnalysisOutput] = None,
    job_analysis: Optional[JobDescriptionAnalysisOutput] = None,
    last_topics: Optional[List[str]] = None,
    top_k: int = 5,
    min_relevance: float = FALLBACK_MIN_RELEVANCE,
) -> QuestionRetrievalOutput:
    """
    Retrieve a question from the local vector DB by domain using signals from
    resume and job description analysis. If relevance is below threshold,
    fallback to LLM (Flash) to synthesize a question and ideal answer.
    """

    query = _build_query_from_signals(
        domain=domain,
        resume_analysis=resume_analysis,
        job_analysis=job_analysis,
        last_topics=last_topics,
    )

    # Build Chroma where filter with a single root operator when combining
    conditions: List[Dict[str, Any]] = [{"domain": domain}]
    if difficulty_hint is not None:
        conditions.append({"difficulty": {"$gte": max(1, difficulty_hint - 2)}})
        conditions.append({"difficulty": {"$lte": min(10, difficulty_hint + 2)}})
    where: Dict[str, Any]
    if len(conditions) == 1:
        where = conditions[0]
    else:
        where = {"$and": conditions}

    store = get_vector_store()
    candidates = store.query_similar(query_text=query, top_k=top_k, where=where)

    if candidates:
        best = candidates[0]
        meta = best.get("metadata", {}) or {}
        relevance = float(best.get("relevance_score", 0.0))
        if relevance >= min_relevance:
            return QuestionRetrievalOutput(
                question_id=str(best.get("id")) if best.get("id") else None,
                text=str(best.get("text")),
                domain=str(meta.get("domain", domain)),
                difficulty=int(meta.get("difficulty") or difficulty_hint or 5),
                ideal_answer_snippet=str(meta.get("ideal_answer_snippet") or ""),
                rubric_id=(str(meta.get("rubric_id")) if meta.get("rubric_id") else None),
                relevance_score=relevance,
            )

    # Fallback generation via Flash
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    profile_data: Dict[str, Any] = {
        "domain": domain,
        "difficulty": difficulty_hint or 5,
        "resume_topics": resume_analysis.topics if resume_analysis else [],
        "job_keywords": job_analysis.must_have_keywords if job_analysis else [],
        "last_topics": last_topics or [],
    }

    try:
        template = env.get_template("question_fallback.j2")
        prompt = template.render(
            domain=domain,
            difficulty=profile_data["difficulty"],
            resume_topics=profile_data["resume_topics"],
            job_keywords=profile_data["job_keywords"],
            last_topics=profile_data["last_topics"],
        )
    except Exception:
        # Inline backup prompt if template is missing
        prompt = (
            "You are a helpful assistant that generates one interview question and a short "
            "ideal answer snippet. Respond with ONLY JSON keys 'text', 'domain', 'difficulty', "
            "'ideal_answer_snippet'.\n"
            f"Profile: {json.dumps(profile_data)}"
        )

    llm = get_llm(model_type="flash")
    response = llm.invoke(prompt)

    try:
        clean = (
            response.content.strip().replace("```json", "").replace("```", "").strip()
        )
        data = json.loads(clean)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Fallback generation returned non-JSON: {response.content}") from exc

    return QuestionRetrievalOutput(
        question_id=None,
        text=str(data.get("text")),
        domain=str(data.get("domain", domain)),
        difficulty=int(data.get("difficulty", difficulty_hint or 5)),
        ideal_answer_snippet=str(data.get("ideal_answer_snippet", "")),
        rubric_id=None,
        relevance_score=0.0,
    )


