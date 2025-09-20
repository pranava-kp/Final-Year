import json
import os
import pathlib

# This setup is necessary to run the script standalone
import sys
import time
import uuid

from dotenv import load_dotenv

PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

# Import the uncompiled workflow to add a checkpointer
from interview_system.orchestration.graph import workflow
from interview_system.orchestration.state import SessionState, QuestionTurn
from langgraph.checkpoint.memory import MemorySaver
from interview_system.services.vector_store import get_vector_store


def seed_example_questions():
    """Seeds the Pinecone index with a few sample questions."""
    store = get_vector_store()
    stats = store.index.describe_index_stats()
    if stats["total_vector_count"] > 0:
        print("--- Index already contains vectors. Skipping seeding. ---")
        return

    print("--- Seeding example questions into Pinecone... ---")
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
            "id": "q-tech-python-1",
            "text": "Explain Python's Global Interpreter Lock (GIL) and its implications for multi-threaded applications.",
            "domain": "technical",
            "difficulty": 7,
            "ideal_answer_snippet": "The answer must explain that the GIL is a mutex that allows only one thread to execute Python bytecode at a time, making it difficult to achieve true parallelism for CPU-bound tasks. It should also mention workarounds like multiprocessing.",
            "rubric_id": "rubric-python-gil-01",
        },
    ]
    store.upsert_questions(items)
    print("Waiting 10 seconds for index to update...")
    time.sleep(10)


def main():
    """
    Runs a full end-to-end test of the graph, simulating a single turn.
    """
    load_dotenv()
    if not os.getenv("GOOGLE_API_KEY") or not os.getenv("PINECONE_API_KEY"):
        print("Error: GOOGLE_API_KEY and PINECONE_API_KEY must be set.")
        return

    seed_example_questions()

    memory = MemorySaver()
    graph_with_checkpointing = workflow.compile(checkpointer=memory)

    print("\n--- 🚀 Testing Full Graph Flow ---")

    session_id = uuid.uuid4()
    user_id = uuid.uuid4()

    initial_state: SessionState = {
        "session_id": session_id,
        "user_id": user_id,
        "initial_resume_text": "Experienced Python developer with 5 years in backend systems, specializing in Django and distributed systems.",
        "initial_job_description_text": "Seeking a senior Python engineer for a role in building scalable cloud-native microservices.",
        "question_history": [],
        "resume_summary": None,
        "job_summary": None,
        "current_question": None,
        "personalization_profile": None,
        "current_rubric": None,
    }
    print("\n--- Initial State Created ---")
    print(f"Resume Text: '{initial_state['initial_resume_text']}'")
    print(f"Job Desc Text: '{initial_state['initial_job_description_text']}'")

    config = {"configurable": {"thread_id": str(session_id)}}

    print("\n--- Invoking graph: Initial analysis and question retrieval ---")
    final_state_after_retrieval = None
    for chunk in graph_with_checkpointing.stream(initial_state, config=config):
        node_name = list(chunk.keys())[0]
        print(f"Node '{node_name}' executed.")
        final_state_after_retrieval = list(chunk.values())[0]

    print("\n--- Graph finished first run (paused for user answer) ---")

    current_question_obj = final_state_after_retrieval.get("current_question")

    if current_question_obj:
        print(
            f"Conversational Question Presented: {current_question_obj.question_text}"
        )

        print("\n--- Simulating user answer and providing a rubric ---")
        user_answer = "To design a URL shortener, I would use a distributed key-value store like Redis for fast lookups, and a base62 encoding of a unique counter for the short IDs to ensure they are URL-safe."
        print(f"User Answer: '{user_answer}'")

        current_question_obj.answer_text = user_answer

        placeholder_rubric = {
            "technical_accuracy": "Evaluates the correctness of the technical solution.",
            "clarity_of_explanation": "Assesses how clearly the concept was communicated.",
        }

        graph_with_checkpointing.update_state(
            config,
            {
                "current_question": current_question_obj.model_dump(),
                "current_rubric": placeholder_rubric,
            },
        )
        print("State updated with user's answer and a test rubric.")

        print("\n--- Resuming graph for parallel evaluation ---")
        final_state_after_eval = None
        for chunk in graph_with_checkpointing.stream(None, config=config):
            node_name = list(chunk.keys())[0]
            print(f"Node '{node_name}' executed.")
            final_state_after_eval = list(chunk.values())[0]

        print("\n--- ✅ Full interview turn complete! ---")

        # --- THIS IS THE CORRECTED SECTION ---
        # We access the Pydantic object's attributes with dot notation, not .get()
        if final_state_after_eval:
            final_question_turn = final_state_after_eval.get("current_question")
            if final_question_turn and final_question_turn.evals:
                final_eval = final_question_turn.evals.get("canonical_evaluation")
                print("\nFinal Synthesized Evaluation:")
                print(json.dumps(final_eval, indent=2))
            else:
                print("\nError: Final evaluation was not found in the state.")
        # --- END OF CORRECTION ---

    else:
        print("Error: Graph did not produce a question.")


if __name__ == "__main__":
    main()
