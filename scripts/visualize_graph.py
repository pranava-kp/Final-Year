import pathlib
import sys
import nest_asyncio # <-- Add this import

# --- Boilerplate to set up path for imports ---
PROJECT_ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))
# --- End Boilerplate ---

# Import your compiled graph application
from interview_system.orchestration.graph import app as interview_graph
# Import the necessary drawing method enum
from langgraph.graph import MermaidDrawMethod

# nest_asyncio is often needed for Pyppeteer to run in certain environments
nest_asyncio.apply()

def main():
    """
    Generates a PNG image of the interview graph's structure locally using Pyppeteer.
    """
    print("--- Generating graph visualization using local renderer (Pyppeteer)... ---")

    try:
        # --- THIS IS THE KEY CHANGE ---
        # We now explicitly tell the function to use the local PYPPETEER method.
        png_data = interview_graph.get_graph().draw_mermaid_png(
            draw_method=MermaidDrawMethod.PYPPETEER
        )
        # ---------------------------

        # Define the output file path
        output_file_path = PROJECT_ROOT / "graph_visualization.png"

        # Write the bytes to a file
        with open(output_file_path, "wb") as f:
            f.write(png_data)

        print(f"\n✅ Successfully saved graph visualization to: {output_file_path}")
        print("   You can now open this file to see your graph.")

    except Exception as e:
        print("\n❌ An error occurred while generating the graph visualization.")
        print("   Please ensure you have installed the required drawing dependencies:")
        print("   pip install 'langgraph[draw]' pyppeteer")
        print(f"\n   Error details: {e}")


if __name__ == "__main__":
    main()