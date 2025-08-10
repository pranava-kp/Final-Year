# src/interview_system/services/llm_clients.py

from langchain_google_genai import ChatGoogleGenerativeAI


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
        return ChatGoogleGenerativeAI(model="gemini-2.5-pro")
    elif model_type == "flash":
        # Gemini 2.5 Flash: For speed-critical, high-volume tasks.
        return ChatGoogleGenerativeAI(model="gemini-2.5-flash")
    else:
        raise ValueError("Invalid model type specified. Choose 'pro' or 'flash'.")
