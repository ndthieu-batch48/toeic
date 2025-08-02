from fastapi import APIRouter, Depends, HTTPException, status

from ...gemini.gemini_client import generate_text_with_gemini, ask_gemini

from ...schemas.prompt import PromptRequest, PromptWithImageRequest
from ...auth.dependencies import get_current_user

router = APIRouter()

@router.post("/chat", response_model=dict)
async def chat(
    request: PromptRequest, current_user: dict = Depends(get_current_user)
):
    try:
        reply = ask_gemini(request.prompt, request.language_id)
        return {"response": reply}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat request: {str(e)}"
        )


@router.post("/genai")
def is_gemini_healthy():
    prompt = 'How are you today gemini ?'
    response = generate_text_with_gemini(prompt)
    return response