import os
import re
import io
import base64
import urllib.parse
from http.client import HTTPException
from PIL import Image
from ..database.connection import connect
import google.generativeai as genai
from google.auth.transport.requests import AuthorizedSession

# ✅ Ensure cert is set correctly
os.environ["SSL_CERT_FILE"] = "C:\\cert\\tma.com.vn-full.pem"  # <- customize this

# ✅ Configure API key (transport='rest' still works, but 'http' is default now)
genai.configure(api_key="AIzaSyCY8sQenbX5I3IDLl61IxowMiF1AgQidFM")

# ✅ Restore original request method (NO override with verify=False)
# Do not patch or disable verify anymore!

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

        base_dir = os.getcwd()
        media_dir = os.path.normpath(os.path.join(base_dir, "..", "..", "DB", "media"))

        if not result:
            raise HTTPException(status_code=404, detail="Media not found")

        paragrap_main = result["paragrap_main"]

        base64_pattern = r'data:image/[a-zA-Z]+;base64,([^\s"]+)'
        url_pattern = r'src="([^"]+)"'

        base64_match = re.search(base64_pattern, paragrap_main)
        url_match = re.search(url_pattern, paragrap_main)

        if base64_match:
            image_data = base64.b64decode(base64_match.group(1))
            image = Image.open(io.BytesIO(image_data))
        elif url_match:
            image_path = url_match.group(1)
            if image_path.startswith("http://localhost:8000/media/"):
                image_path = image_path.replace("http://localhost:8000/media/", f"{media_dir}/")

            image_path = urllib.parse.unquote(image_path)
            image = Image.open(image_path)

            buffered = io.BytesIO()
            image.save(buffered, format=image.format if image.format else "PNG")
            image_data = base64.b64encode(buffered.getvalue()).decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Invalid paragrap_main format")

        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content([modified_prompt, image])
        return response.text

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing image: {str(e)}")

    finally:
        cursor.close()
        conn.close()
