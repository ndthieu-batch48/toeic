# Document: https://ai.google.dev/gemini-api/docs/quickstart?lang=python
# Migration from googol-genativeai to gemini-api: https://ai.google.dev/gemini-api/docs/migrate
from typing import Optional
from google import genai
from google.genai import types
from ..core.app_config import app_config

import os, ssl, certifi

custom_ca = "C:/cert/tma.com.vn/tma.com.vn-full.crt"

# Create a new PEM bundle at runtime (not stored permanently)
ctx = ssl.create_default_context(cafile=certifi.where())
ctx.load_verify_locations(cafile=custom_ca)

# Save the combined context into a temp file so google-genai can see it
import tempfile
with tempfile.NamedTemporaryFile(delete=False, suffix=".pem") as tmp:
    # Dump certifi + your CA into one file
    with open(certifi.where(), "rb") as f:
        tmp.write(f.read())
    with open(custom_ca, "rb") as f:
        tmp.write(f.read())
    tmp_path = tmp.name

# Point google-genai to that temporary file
os.environ["SSL_CERT_FILE"] = tmp_path

gemini_client = genai.Client(api_key=app_config.GEMINI_API_KEY)

def generate_text_with_gemini(prompt: str):
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    return response.text

def ask_gemini(prompt: str, language_id: Optional[int] = 1):
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt
    )
    
    return response.text
