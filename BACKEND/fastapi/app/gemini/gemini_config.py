# Document: https://ai.google.dev/gemini-api/docs/quickstart?lang=python
# Migration from googol-genativeai to gemini-api: https://ai.google.dev/gemini-api/docs/migrate

import os
from google import genai


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

client = genai.Client(api_key=GOOGLE_API_KEY) 

def translate_question_with_options(question: str, options: str, language_id: int = 1) -> str | None:
    language_map = {
        1: "Vietnamese",
        2: "English",
        3: "Japanese"
    }
    target_language = language_map.get(language_id, "Vietnamese")
    
    prompt = f"Translate the following multiple-choice question: \"{question}\" and translate its answer options \"{options}\" into {target_language}. The output should follow the TOEIC question format. Do not explain anything."
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt  
    )
    
    print(response.text)
    print(response.model_dump_json(exclude_none=True, indent=4))
    
    return response.text or None
