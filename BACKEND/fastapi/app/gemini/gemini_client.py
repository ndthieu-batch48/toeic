# Document: https://ai.google.dev/gemini-api/docs/quickstart?lang=python
# Migration from googol-genativeai to gemini-api: https://ai.google.dev/gemini-api/docs/migrate

from google import genai
from ..core.app_config import app_config

client = genai.Client(api_key=app_config.GEMINI_API_KEY) 


def generate_text_with_gemini(prompt: str):
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    return response.text