import json
import os
import pathlib
import sys
import time
import uuid
from typing import Any

from dotenv import load_dotenv

# This setup is necessary to run the script standalone from the project root
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

# Import the uncompiled workflow so we can attach a test-specific checkpointer
from interview_system.orchestration.graph import workflow
from interview_system.orchestration.state import QuestionTurn, SessionState
from langgraph.checkpoint.memory import MemorySaver
from interview_system.services.vector_store import get_vector_store


def seed_example_questions():
    """
    Seeds the Pinecone index with a few sample questions to ensure RAG can be tested.
    This function is idempotent and will skip seeding if the index is not empty.
    """
    store = get_vector_store()
    try:
        stats = store.index.describe_index_stats()
        if stats["total_vector_count"] > 0:
            print("--- Index already contains vectors. Skipping seeding. ---")
            return
    except Exception:
        print(
            "--- Could not describe index stats, proceeding with seeding attempt. ---"
        )

    print("--- Seeding example questions into Pinecone... ---")
    items = [
        {
            "id": "q-behavioral-1",
            "text": "Tell me about a time you had a conflict with a coworker and how you resolved it.",
            "domain": "behavioral",
            "difficulty": 4,
            "ideal_answer_snippet": "The candidate should use the STAR method (Situation, Task, Action, Result) to describe a specific professional conflict. The focus should be on respectful communication, understanding the other's perspective, and finding a collaborative, positive resolution.",
            "rubric_id": "rubric-behavioral-conflict-01",
        },
        {
            "id": "q-tech-sysdesign-1",
            "text": "Design a URL shortener service like TinyURL. Discuss the core components and potential bottlenecks.",
            "domain": "technical:system_design",
            "difficulty": 6,
            "ideal_answer_snippet": "The answer should cover key components like a hash function for generating short codes, a distributed key-value store (e.g., Redis) for fast lookups, and a relational database for storing mappings. It should also discuss scalability issues like hash collisions and write-heavy traffic.",
            "rubric_id": "rubric-sysdesign-01",
        },
    ]
    store.upsert_questions(items)
    print("Waiting 10 seconds for index to update...")
    time.sleep(10)


def pretty_print_chunk(chunk: dict[str, Any]):
    """A helper function to print the output of each graph step in a readable way."""
    node_name = list(chunk.keys())[0]
    state = list(chunk.values())[0]

    if state is None:
        print(f"\n✅ === Node '{node_name}' Executed (Internal State Update) === ✅")
        return

    print(f"\n✅ === Node '{node_name}' Executed === ✅")

    if node_name == "plan_creator":
        print(f"   - Interview Plan Created: {state.get('interview_plan')}")

    if state.get("current_question"):
        q_data = state["current_question"]

        if isinstance(q_data, dict) and "conversational_text" in q_data:
            q = QuestionTurn(**q_data)
            print(f'   - Question Presented: "{q.conversational_text}"')
        elif isinstance(q_data, QuestionTurn):
            print(f'   - Question Presented: "{q_data.conversational_text}"')

        evals = q_data.get("evals", {}) if isinstance(q_data, dict) else q_data.evals
        if evals and evals.get("canonical"):
            print("   - Canonical Evaluation Generated.")

        feedback = (
            q_data.get("feedback", {}) if isinstance(q_data, dict) else q_data.feedback
        )
        if feedback:
            print("   - Feedback/Follow-up Generated.")

    if node_name == "state_updater":
        print(
            f"   - History Updated. {len(state.get('question_history', []))} questions complete."
        )
        print(f"   - Plan Remaining: {state.get('interview_plan')}")

    if node_name in ["report_generator", "personalization_planner"]:
        print(f"   - Final synthesis step '{node_name}' complete.")


def main():
    """
    Runs a full end-to-end simulation of a multi-turn interview using the compiled graph.
    """
    load_dotenv()
    if not os.getenv("GOOGLE_API_KEY") or not os.getenv("PINECONE_API_KEY"):
        print(
            "Error: Required API keys (GOOGLE_API_KEY, PINECONE_API_KEY) are not set in .env"
        )
        return

    seed_example_questions()

    memory = MemorySaver()
    graph = workflow.compile(checkpointer=memory)

    print("\n--- 🚀 Starting Full Interview Simulation ---")

    session_id = uuid.uuid4()
    user_id = uuid.uuid4()

    # We use a base config for the initial run, before the limit is calculated
    initial_config = {"configurable": {"thread_id": str(session_id)}}

    initial_state: SessionState = {
        "session_id": str(session_id),
        "user_id": str(user_id),
        "initial_resume_text": "Experienced Python developer with 5 years at Google building distributed systems. Key project: 'Project Apollo'. Key Skill: TensorFlow.",
        "initial_job_description_text": "Seeking a senior Python engineer for a role in building scalable cloud-native microservices.",
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

    print("\n--- 1. Kicking off the graph with initial analysis and planning ---")
    for chunk in graph.stream(initial_state, config=initial_config):
        pretty_print_chunk(chunk)

    # ==============================================================================
    # START: DYNAMIC RECURSION LIMIT LOGIC
    # ==============================================================================

    # 2. Get the state to inspect the plan and calculate the dynamic limit
    current_state = graph.get_state(initial_config)
    interview_plan = current_state.values.get("interview_plan", [])
    plan_length = len(interview_plan)

    # 3. Define the calculation constants
    # A safe estimate for the number of graph nodes executed per interview turn.
    NODES_PER_TURN = 8
    # A buffer for initial setup nodes (analysis, planning) and final nodes (reporting).
    SETUP_TEARDOWN_NODES = 10
    # A safety buffer for potential follow-up questions or other unpredictable graph paths.
    SAFETY_BUFFER = 20

    # 4. Calculate the dynamic limit
    dynamic_limit = (
        SETUP_TEARDOWN_NODES + (plan_length * NODES_PER_TURN) + SAFETY_BUFFER
    )

    print(
        f"\n--- 📊 Dynamic recursion limit calculated: {dynamic_limit} for a {plan_length}-item plan. ---\n"
    )

    # 5. Create a new config object to use for the remainder of the graph execution
    loop_config = {
        "configurable": {"thread_id": str(session_id)},
        "recursion_limit": dynamic_limit,
    }

    # ==============================================================================
    # END: DYNAMIC RECURSION LIMIT LOGIC
    # ==============================================================================

    # --- Main Interview Loop ---
    turn_num = 1
    while True:
        # We now use loop_config to get the current state
        current_state = graph.get_state(loop_config)
        if not current_state.values.get("interview_plan"):
            print("\n--- Interview plan complete. Proceeding to final reporting. ---")
            # And we use loop_config for the final reporting run
            for chunk in graph.stream(None, config=loop_config):
                pretty_print_chunk(chunk)
            break

        print(f"\n\n--- 🔄 Starting Interview Turn {turn_num} ---")

        current_question_obj = current_state.values.get("current_question")
        if not current_question_obj:
            print("   - Error: No current question found. Exiting.")
            break

        user_answer = f"This is my simulated answer for turn {turn_num} regarding the question about '{current_question_obj.raw_question_text}'."
        current_question_obj.answer_text = user_answer

        placeholder_rubric = {
            "technical_accuracy": "Evaluates correctness.",
            "clarity": "Assesses clarity of explanation.",
        }

        graph.update_state(
            loop_config,  # Use the new config here
            {
                "current_question": current_question_obj.model_dump(),
                "current_rubric": placeholder_rubric,
            },
        )
        print(f'   - User Answer Provided: "{user_answer}"')

        print("   - Resuming graph for evaluation and next question...")
        # And finally, use loop_config for the main stream execution
        for chunk in graph.stream(None, config=loop_config):
            pretty_print_chunk(chunk)

        turn_num += 1

    print("\n\n--- 🏁 Interview Simulation Complete ---")
    final_state = graph.get_state(
        loop_config
    ).values  # Use the new config to get the final state
    if final_state.get("final_report"):
        print("\n--- 📜 Final Report ---")
        print(json.dumps(final_state["final_report"], indent=2))

    if final_state.get("personalization_profile"):
        print("\n--- 💡 Personalization Plan ---")
        print(json.dumps(final_state["personalization_profile"], indent=2))


if __name__ == "__main__":
    main()
