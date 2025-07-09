from fastapi import APIRouter, Depends, HTTPException, status

from ...schemas.prompt import PromptRequest, PromptWithImageRequest
from ...auth.dependencies import get_current_user
from ...gemini.gemini_service import ask_gemini, ask_gemini_with_image  # Add this import

router = APIRouter()

@router.post("/", response_model=dict)
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

@router.post("/chat-with-image", response_model=dict)
async def chat_with_image(
    request: PromptWithImageRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        reply = ask_gemini_with_image(request.prompt, request.id, request.language_id)
        return {"response": reply}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image chat request: {str(e)}"
        )