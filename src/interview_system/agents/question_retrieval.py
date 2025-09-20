import json
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader

from interview_system.schemas.agent_outputs import (
    ConversationalQuestionOutput,
    JobDescriptionAnalysisOutput,
    QuestionRetrievalOutput,
    ResumeAnalysisOutput,
)
from interview_system.services.llm_clients import get_llm
from interview_system.services.vector_store import get_vector_store

# We will add a function here later to send generated questions to a review queue
# from ..repositories.review_queue_repository import ReviewQueueRepository

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
        terms.extend(job_analysis.keywords)  # Corrected field name
    if last_topics:
        terms.extend(last_topics)

    seen: set[str] = set()
    unique_terms: List[str] = []
    for t in terms:
        if t and t.lower() not in seen:
            unique_terms.append(t)
            seen.add(t.lower())
    return ", ".join(unique_terms)


def _make_question_conversational(
    raw_question: QuestionRetrievalOutput,
) -> ConversationalQuestionOutput:
    """Uses a fast LLM to make a retrieved question sound more natural."""
    env = Environment(loader=FileSystemLoader("src/interview_system/prompts/"))
    template = env.get_template("make_question_conversational.j2")
    prompt = template.render(question_text=raw_question.text)

    llm = get_llm(model_type="flash")
    response = llm.invoke(prompt)

    return ConversationalQuestionOutput(
        conversational_text=response.content.strip(), raw_question=raw_question
    )


def _generate_and_present_fallback_question(
    domain: str,
    difficulty_hint: int,
    resume_analysis: Optional[ResumeAnalysisOutput],
    job_analysis: Optional[JobDescriptionAnalysisOutput],
    last_topics: Optional[List[str]],
) -> ConversationalQuestionOutput:
    """Generates a new question and presents it conversationally in one step."""
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
        clean = (
            response.content.strip().replace("```json", "").replace("```", "").strip()
        )
        data = json.loads(clean)

        # Create the raw question object for the HITL system
        raw_question = QuestionRetrievalOutput(
            text=data["raw_question"]["text"],
            domain=data["raw_question"]["domain"],
            difficulty=data["raw_question"]["difficulty"],
            ideal_answer_snippet=data["raw_question"]["ideal_answer_snippet"],
            relevance_score=0.0,
        )

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
    difficulty_hint: Optional[int] = None,
    resume_analysis: Optional[ResumeAnalysisOutput | dict] = None,
    job_analysis: Optional[JobDescriptionAnalysisOutput | dict] = None,
    last_topics: Optional[List[str]] = None,
    top_k: int = 5,
    min_relevance: float = FALLBACK_MIN_RELEVANCE,
) -> ConversationalQuestionOutput:
    """
    Retrieves a question from the vector DB, making it conversational.
    Falls back to generating a new conversational question if relevance is low.
    """
    # Re-validate the input data at the agent's boundary.
    if resume_analysis and isinstance(resume_analysis, dict):
        resume_analysis = ResumeAnalysisOutput(**resume_analysis)
    if job_analysis and isinstance(job_analysis, dict):
        job_analysis = JobDescriptionAnalysisOutput(**job_analysis)

    query = _build_query_from_signals(
        domain=domain,
        resume_analysis=resume_analysis,
        job_analysis=job_analysis,
        last_topics=last_topics,
    )

    conditions: List[Dict[str, Any]] = [{"domain": domain}]
    if difficulty_hint is not None:
        conditions.append({"difficulty": {"$gte": max(1, difficulty_hint - 2)}})
        conditions.append({"difficulty": {"$lte": min(10, difficulty_hint + 2)}})

    where = {"$and": conditions} if len(conditions) > 1 else conditions[0]

    store = get_vector_store()
    candidates = store.query_similar(query_text=query, top_k=top_k, where=where)

    if candidates:
        best = candidates[0]
        relevance = float(best.get("relevance_score", 0.0))

        if relevance >= min_relevance:
            meta = best.get("metadata", {}) or {}
            raw_question = QuestionRetrievalOutput(
                question_id=str(best.get("id")) if best.get("id") else None,
                text=str(best.get("text")),
                domain=str(meta.get("domain", domain)),
                difficulty=int(meta.get("difficulty") or difficulty_hint or 5),
                ideal_answer_snippet=str(meta.get("ideal_answer_snippet") or ""),
                rubric_id=(
                    str(meta.get("rubric_id")) if meta.get("rubric_id") else None
                ),
                relevance_score=relevance,
            )
            return _make_question_conversational(raw_question)

    # If we reach here, it's a fallback scenario
    print("--- Low relevance, triggering LLM fallback generation ---")
    fallback_output = _generate_and_present_fallback_question(
        domain=domain,
        difficulty_hint=(difficulty_hint or 5),
        resume_analysis=resume_analysis,
        job_analysis=job_analysis,
        last_topics=last_topics,
    )

    # Here we will add the call to send the raw question to the review queue
    print("--- HITL: Sending generated question to review queue ---")
    print(json.dumps(fallback_output.raw_question.model_dump(), indent=2))
    # send_to_review_queue(fallback_output.raw_question)

    return fallback_output
