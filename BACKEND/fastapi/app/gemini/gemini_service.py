from http.client import HTTPException
import google.generativeai as genai
import os
from PIL import Image
import io
import base64
import re
import urllib.parse
from ..database.connection import connect
from ..core.config import settings

# Configure API key
genai.configure(api_key=settings.GEMINI_API_KEY, transport="rest")

def ask_gemini(prompt: str, language_id: int = 1) -> str:
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text

def ask_gemini_with_image(prompt: str, media_id: int, language_id: int = 1) -> str:
    language_map = {
        1: "Vietnamese",
        2: "English", 
        3: "Japanese"
    }
    target_language = language_map.get(language_id, "Vietnamese")
    modified_prompt = f"{prompt}\n\nTranslate the response to {target_language}."
    
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT paragrap_main FROM toeicapp_media WHERE id = %s", (media_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Media not found")
        
        # Process image logic here...
        model = genai.GenerativeModel("gemini-2.5-flash")
        # ... rest of the image processing logic
        
    finally:
        cursor.close()
        conn.close()