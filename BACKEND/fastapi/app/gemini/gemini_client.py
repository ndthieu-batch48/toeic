# Document: https://ai.google.dev/gemini-api/docs/quickstart?lang=python
# Migration from googol-genativeai to gemini-api: https://ai.google.dev/gemini-api/docs/migrate
import os
from google import genai
from ..core.app_config import app_config
import requests
import certifi

ca_cert_path = "C:\\cert\\ca_bundle.pem"
os.environ['REQUESTS_CA_BUNDLE'] = ca_cert_path

gemini_client = genai.Client(api_key=app_config.GEMINI_API_KEY,) 

def generate_text_with_gemini(prompt: str):
    # response = gemini_client.models.generate_content(
    #     model='gemini-2.5-flash',
    #     contents=prompt
    # )
        
    response = requests.post(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        headers={"X-goog-api-key": "AIzaSyCUePQB3SwZd66I102owzR2wpXf-U84wxc"},
        json={
            "contents": [
                {
                    "parts": [
                        {
                            "text": "Explain how AI works in a few words"
                        }
                    ]
                }
            ]
        },
    )
    return response.text




#  # Import thư việntry:
#     # Khi gọi API, thêm tham số 'verify'    
# response = requests.get(        'https://generativelanguage.googleapis.com/...', 
#         verify=certifi.where() # Chỉ định đường dẫn đến bộ chứng chỉ    )    print("Kết nối thành công!")
#     # Xử lý response ở đâyexcept requests.exceptions.SSLError as e:
#     print(f"Lỗi SSL: {e}")
#     print("Vui lòng thử Cách 1 hoặc Cách 2.")
 