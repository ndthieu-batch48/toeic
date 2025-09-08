# Document: https://ai.google.dev/gemini-api/docs/quickstart?lang=python
# Migration from googol-genativeai to gemini-api: https://ai.google.dev/gemini-api/docs/migrate
from google import genai
from ..core.app_config import app_config

gemini_client = genai.Client(api_key=app_config.GEMINI_API_KEY) 

def generate_text_with_gemini(prompt: str):
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    return response.text

def ask_gemini(prompt: str, language_id: int = 1):
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    return response.text
