import json
import os
import pathlib
import sys
import uuid
import textwrap
import asyncio
from typing import Any
from dotenv import load_dotenv
load_dotenv()

VERBOSE_DEBUG_LOGGING = True

# --- Boilerplate ---
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from interview_system.orchestration.graph import workflow
from interview_system.orchestration.state import SessionState
from langgraph.checkpoint.memory import MemorySaver


def pretty_print_chunk(chunk: dict[str, Any]):
    if not VERBOSE_DEBUG_LOGGING:
        return
    node_name = list(chunk.keys())[0]
    print(f"\n✅ === Node '{node_name}' Executed === ✅")


async def main():
    if not os.getenv("GOOGLE_API_KEY") or not os.getenv("PINECONE_API_KEY"):
        print("Error: Required API keys are not set.")
        return

    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)

    print("\n" + "=" * 80)
    print("--- 🤖 Starting Interactive Interview Session ---")
    print("Type your answer and press Enter. Type 'quit' or 'exit' to end the session.")
    print("=" * 80 + "\n")

    session_id = uuid.uuid4()
    config = {"configurable": {"thread_id": str(session_id)}, "recursion_limit": 150}

    initial_resume = input("📄 Paste resume text (or press Enter for default):\n")
    if not initial_resume:
        initial_resume = "Experienced Python developer with 5 years at Google..."
    initial_jd = input("\n📄 Paste job description (or press Enter for default):\n")
    if not initial_jd:
        initial_jd = "Seeking a senior Python engineer..."

    initial_state = {
        "session_id": str(session_id),
        "user_id": str(uuid.uuid4()),
        "namespace": "updated-namespace",
        "initial_resume_text": initial_resume,
        "initial_job_description_text": initial_jd,
        "question_history": [],
        "resume_summary": None,
        "job_summary": None,
        "current_question": None,
        "personalization_profile": None,
        "current_rubric": None,
        "interview_plan": [],
        "final_report": None,
        "current_topic": None,
    }

    print("\n--- Analyzing documents and creating interview plan... ---")
    async for chunk in graph.astream(initial_state, config=config):
        pretty_print_chunk(chunk)

    current_state = await graph.aget_state(config)
    initial_plan = current_state.values.get("interview_plan", [])
    print("\n" + "-" * 40)
    print(f"📝 Interview Plan Created: {initial_plan}")
    print("-" * 40)

    while True:
        current_state = await graph.aget_state(config)
        if not current_state.values.get("interview_plan"):
            print("\n--- Interview plan complete. ---")
            break

        current_question_obj = current_state.values.get("current_question")
        if not current_question_obj:
            break

        print("\n" + "=" * 80)
        print(f"Next Topic: {current_state.values.get('current_topic')}")
        print("🤖 INTERVIEWER:")
        wrapped_text = textwrap.fill(
            current_question_obj.conversational_text,
            width=100,
            initial_indent="   ",
            subsequent_indent="   ",
        )
        print(wrapped_text)
        print("-" * 80)

        user_answer = input("Your Answer: ")

        if not user_answer or user_answer.lower() in ["quit", "exit"]:
            print("\n--- Ending session early. ---")
            break

        current_question_obj.answer_text = user_answer
        await graph.aupdate_state(
            config,
            {
                "current_question": current_question_obj.model_dump(),
                "current_rubric": {},
            },
        )

        print("\n--- 🤔 Thinking... ---")

        async for chunk in graph.astream(None, config=config):
            node_name, node_state = list(chunk.items())[0]
            print(f"   -> Processing step: {node_name}...")
            if node_name == "fast_evaluator":
                print("\n" + "-" * 40)
                if node_state and node_state.get("current_question"):
                    fast_eval = node_state["current_question"]["evals"].get(
                        "fast_eval", {}
                    )
                    score = fast_eval.get("score", "N/A")
                    summary = fast_eval.get("quick_summary", "...")
                    print(f"⚡ Quick Feedback: {summary} ({score}/100)")
                print("-" * 40)

        updated_state = await graph.aget_state(config)
        if updated_state.values.get("question_history"):
            last_turn = updated_state.values["question_history"][-1]
            if last_turn and last_turn.feedback:
                feedback = last_turn.feedback
                print("\n💡 Deeper Feedback:")
                if feedback.get("improvement_points"):
                    for point in feedback["improvement_points"]:
                        print(f"   - {point.get('bullet', 'Consider other aspects.')}")
                else:
                    print("   - Well noted, thank you for your response.")

    print("\n--- Generating final reports... ---")
    async for chunk in graph.astream(None, config=config):
        pretty_print_chunk(chunk)

    final_state = await graph.aget_state(config)

    if final_state.values.get("final_report"):
        print("\n--- 📜 Final Report ---")
        print(json.dumps(final_state.values["final_report"], indent=2))
    if final_state.values.get("personalization_profile"):
        print("\n--- 💡 Personalization Plan ---")
        print(json.dumps(final_state.values["personalization_profile"], indent=2))
    print("\n" + "=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
