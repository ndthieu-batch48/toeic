import json
from fastapi import APIRouter, Depends, HTTPException, status

from ...database.queries.test_queries import SELECT_QUESTION_BLOCK_JSON_BY_ID
from ...helpers.prompt_helper import build_question_translation_prompt

from  ...schemas.translation import TranslateImageRequest, TranslateQuestionRequest, TranslateQuestionResponse

from ...database.connection import get_db_cursor

from ...gemini.gemini_client import generate_text_with_gemini, ask_gemini

from ...schemas.prompt import PromptRequest
from ...auth.dependencies import get_current_user

router = APIRouter()

@router.post("/genai")
def is_gemini_healthy():
    prompt = 'Hello. Is Gemini service available now ?'
    response = generate_text_with_gemini(prompt)
    return response


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


@router.post("/translate/question", response_model=TranslateQuestionResponse)
async def translate_question(request: TranslateQuestionRequest):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(SELECT_QUESTION_BLOCK_JSON_BY_ID, (request.question_id,))
            row = cursor.fetchone()
            if not row or not row.get('question_block_json'):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Question not found"
                )
            question_block_json = row['question_block_json']

            prompt = build_question_translation_prompt(question_block_json, request.language_id)
            gemini_response = generate_text_with_gemini(prompt)
            if not gemini_response:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to get translation from Gemini"
                )
            
            response = json.loads(gemini_response)            

        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in translate question controller: {str(e)}"
        )


SELECT_BASE64_IMAGE_BY_ID = """
select * from toeicapp_media where id = %s

"""
@router.post("/translate/image", response_model=dict)
async def translate_image(request: TranslateImageRequest):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(SELECT_BASE64_IMAGE_BY_ID, (request.media_id,))
            row = cursor.fetchone()
            if not row or not row.get('paragrap_main'):
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Image not found"
                )
            img = row['paragrap_main']

            return  {"img": img}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in translate question controller: {str(e)}"
        )







