import json
import os
import pathlib
import sys
import uuid
from typing import Any

from dotenv import load_dotenv

# --- Configuration ---
VERBOSE_DEBUG_LOGGING = True

# --- Boilerplate ---
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from interview_system.orchestration.graph import workflow
from interview_system.orchestration.state import QuestionTurn, SessionState
from langgraph.checkpoint.memory import MemorySaver


def pretty_print_chunk(chunk: dict[str, Any]):
    if not VERBOSE_DEBUG_LOGGING:
        return
    node_name = list(chunk.keys())[0]
    print(f"\n✅ === Node '{node_name}' Executed === ✅")


def main():
    """
    Runs an interactive command-line interview session with improved output.
    """
    load_dotenv()
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
        initial_resume = "Experienced Python developer with 5 years at Google building distributed systems. Key project: 'Project Apollo'. Key Skill: TensorFlow."

    initial_jd = input("\n📄 Paste job description (or press Enter for default):\n")
    if not initial_jd:
        initial_jd = "Seeking a senior Python engineer for a role in building scalable cloud-native microservices."

    initial_state = {
        "session_id": str(session_id),
        "user_id": str(uuid.uuid4()),
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
    for chunk in graph.stream(initial_state, config=config):
        pretty_print_chunk(chunk)

    current_state = graph.get_state(config)
    initial_plan = current_state.values.get("interview_plan", [])
    print("\n" + "-" * 40)
    print(f"📝 Interview Plan Created: {initial_plan}")
    print("-" * 40)

    # --- Main Interactive Interview Loop ---
    while True:
        current_state = graph.get_state(config)
        if not current_state.values.get("interview_plan"):
            print("\n--- Interview plan complete. ---")
            break

        current_question_obj = current_state.values.get("current_question")
        if not current_question_obj:
            print("   - Error: No current question found. Exiting.")
            break

        print("\n" + "=" * 80)
        print(f"Next Topic: {current_state.values.get('current_topic')}")
        print("🤖 INTERVIEWER:")
        print(f"   {current_question_obj.conversational_text}")
        print("-" * (len(current_question_obj.conversational_text) + 5))

        user_answer = input("Your Answer: ")

        if not user_answer or user_answer.lower() in ["quit", "exit"]:
            print("\n--- Ending session early. ---")
            break  # Exit the loop to proceed to final reporting

        current_question_obj.answer_text = user_answer
        graph.update_state(
            config,
            {
                "current_question": current_question_obj.model_dump(),
                "current_rubric": {},
            },
        )

        print("\n--- 🤔 Thinking... ---")

        for chunk in graph.stream(None, config=config):
            pretty_print_chunk(chunk)

            node_name = list(chunk.keys())[0]
            node_state = list(chunk.values())[0]

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

        updated_state = graph.get_state(config)
        last_turn = updated_state.values.get("question_history", [])[-1]

        if last_turn and last_turn.feedback:
            feedback = last_turn.feedback
            print("\n💡 Deeper Feedback:")
            if feedback.get("improvement_points"):
                for point in feedback["improvement_points"]:
                    print(f"   - {point.get('bullet', 'Consider other aspects.')}")
            else:
                print("   - Well noted, thank you for your response.")

    # --- Final Reporting ---
    print("\n--- Generating final reports... ---")
    for chunk in graph.stream(None, config=config):
        pretty_print_chunk(chunk)

    final_state = graph.get_state(config).values

    if final_state.get("final_report"):
        print("\n--- 📜 Final Report ---")
        print(json.dumps(final_state["final_report"], indent=2))
    if final_state.get("personalization_profile"):
        print("\n--- 💡 Personalization Plan ---")
        print(json.dumps(final_state["personalization_profile"], indent=2))
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
