from http.client import HTTPException
import google.generativeai as genai
import os
from PIL import Image
import io
import base64
import re
import urllib.parse
from ..database.connection import connect
import requests
from google.auth.transport.requests import AuthorizedSession
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Cấu hình API key
genai.configure(api_key="AIzaSyCY8sQenbX5I3IDLl61IxowMiF1AgQidFM", transport="rest")


original_request = AuthorizedSession.request

def unsafe_request(self, *args, **kwargs):
    kwargs['verify'] = False
    return original_request(self, *args, **kwargs)

AuthorizedSession.request = unsafe_request


def ask_gemini(prompt: str, language_id: int = 1) -> str:
    # Map language_id to language name
    language_map = {
        1: "Vietnamese",
        2: "English",
        3: "Japanese"
    }
    
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text


def ask_gemini_with_image(prompt: str, media_id: int, language_id: int = 1) -> str:
    # Map language_id to language name
    language_map = {
        1: "Vietnamese",
        2: "English",
        3: "Japanese"
    }
    target_language = language_map.get(language_id, "Vietnamese")
    
    # Thêm chỉ thị ngôn ngữ vào prompt
    modified_prompt = f"{prompt}\n\nTranslate the response to {target_language}."
    
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Truy vấn paragrap_main từ bảng toeicapp_media
        cursor.execute("SELECT paragrap_main FROM toeicapp_media WHERE id = %s", (media_id,))
        result = cursor.fetchone()
        
        base_dir = os.getcwd()
        media_dir = os.path.join(base_dir, "..", "..", "DB", "media").replace("\\", "/")
        media_dir = os.path.normpath(media_dir)
        
        if not result:
            raise HTTPException(status_code=404, detail="Media not found")
        
        paragrap_main = result["paragrap_main"]
        
        # Kiểm tra xem paragrap_main có chứa base64 hay URL
        base64_pattern = r'data:image/[a-zA-Z]+;base64,([^\s"]+)'
        url_pattern = r'src="([^"]+)"'
        
        base64_match = re.search(base64_pattern, paragrap_main)
        url_match = re.search(url_pattern, paragrap_main)
        
        if base64_match:
            # Nếu là base64
            image_data = base64.b64decode(base64_match.group(1))
            image = Image.open(io.BytesIO(image_data))
        elif url_match:
            # Nếu là đường dẫn file
            image_path = url_match.group(1)
            if image_path.startswith("http://localhost:8000/media/"):
                image_path = image_path.replace("http://localhost:8000/media/", f"{media_dir}/")
            try:
                image_path = urllib.parse.unquote(image_path)
                image = Image.open(image_path)
                # Chuyển ảnh thành base64
                buffered = io.BytesIO()
                image.save(buffered, format=image.format if image.format else "PNG")
                image_data = base64.b64encode(buffered.getvalue()).decode("utf-8")
            except FileNotFoundError:
                raise HTTPException(status_code=404, detail="Image file not found")
        else:
            raise HTTPException(status_code=400, detail="Invalid paragrap_main format")
        
        # Gửi yêu cầu đến mô hình Gemini
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([modified_prompt, image])
        return response.text
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")
    
    finally:
        cursor.close()
        conn.close()