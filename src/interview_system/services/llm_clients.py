# src/interview_system/services/llm_clients.py

import os
from langchain_google_genai import ChatGoogleGenerativeAI

# Get the API key from the environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    # This will raise an error when the module is loaded if the key isn't set,
    # preventing the app from running without proper configuration.
    raise ValueError("GOOGLE_API_KEY environment variable not set.")


def get_llm(model_type: str = "pro"):
    """
    Returns an instance of the ChatGoogleGenerativeAI model.

    Args:
        model_type (str): The type of model to return, either "pro" or "flash".

    Returns:
        ChatGoogleGenerativeAI: An instance of the specified Gemini model.
    """
    if model_type == "pro":
        # Gemini 2.5 Pro: For high-quality, complex reasoning tasks.
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY  # Pass the key here
        )
    elif model_type == "flash":
        # Gemini 2.5 Flash: For speed-critical, high-volume tasks.
        return ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=GOOGLE_API_KEY  # Pass the key here
        )
    else:
        raise ValueError("Invalid model type specified. Choose 'pro' or 'flash'.")