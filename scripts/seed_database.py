import json
import hashlib
import os
import sys
import pathlib
import argparse  # Import the argument parser library
from collections import Counter
from dotenv import load_dotenv

# --- Boilerplate to set up path for imports ---
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
# --- End Boilerplate ---

from interview_system.services.vector_store import get_vector_store

INPUT_FILE = "questions.txt"


def process_questions(questions: list) -> list:
    """
    Transforms questions and reports duplicates. This logic is preserved from your original script.
    """
    transformed_questions = []

    print("--- Checking for duplicate question texts ---")
    text_counts = Counter(q.get("text", "") for q in questions)
    duplicates_found = False
    for text, count in text_counts.items():
        if count > 1:
            duplicates_found = True
            duplicate_id = hashlib.sha256(text.encode("utf-8")).hexdigest()
            print(f"\nWARNING: Duplicate question found ({count} times).")
            print(f"  - Generated ID: {duplicate_id}")
            cleaned_text = text[:80].replace("\n", " ")
            print(f'  - Text: "{cleaned_text}..."')

    if not duplicates_found:
        print("No duplicate question texts found.")

    for q in questions:
        original_id = q.get("id", "")
        original_domain = q.get("domain", "")
        question_text = q.get("text", "")
        new_id = hashlib.sha256(question_text.encode("utf-8")).hexdigest()
        new_domain = original_domain
        if original_id.startswith("q-") and original_id.count("-") >= 2:
            parts = original_id.split("-")
            topic = "-".join(parts[1:-1])
            if topic:
                new_domain = f"{original_domain}-{topic}"
        if q.get("rubric_id") is None:
            q["rubric_id"] = ""
        q["id"] = new_id
        q["domain"] = new_domain
        transformed_questions.append(q)

    return transformed_questions


def main():
    """
    Main function to read, process, and upsert questions into a specified namespace.
    """
    # 1. Set up the command-line argument parser
    parser = argparse.ArgumentParser(
        description="Seed the Pinecone database from a questions file."
    )
    parser.add_argument(
        "--namespace",
        type=str,
        help="The Pinecone namespace to upsert the questions into. If not provided, the default namespace is used.",
    )
    args = parser.parse_args()

    # 2. Load environment variables
    load_dotenv()
    if not all(os.getenv(k) for k in ["PINECONE_API_KEY"]):
        print("Error: PINECONE_API_KEY must be set in .env file.")
        return

    # 3. Load and process questions from the file
    try:
        with open(INPUT_FILE, "r", encoding="utf-8") as f:
            questions_data = json.load(f)
        print(f"Loaded {len(questions_data)} questions from {INPUT_FILE}.")
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error reading {INPUT_FILE}: {e}")
        return

    questions_to_upsert = process_questions(questions_data)

    # 4. Connect to the vector store and upsert the data
    print("\n--- Connecting to vector store and upserting data ---")
    store = get_vector_store()

    # 5. Pass the namespace from the command-line to the upsert function
    store.upsert_questions(questions_to_upsert, namespace=args.namespace)

    # 6. Provide clear user feedback
    if args.namespace:
        print(
            f"\nSuccessfully sent {len(questions_to_upsert)} records for upserting to namespace '{args.namespace}'."
        )
    else:
        print(
            f"\nSuccessfully sent {len(questions_to_upsert)} records for upserting to the default namespace."
        )


if __name__ == "__main__":
    main()
