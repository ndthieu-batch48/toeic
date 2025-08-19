from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import json
from datetime import datetime

from ...schemas.translation import TranslateScriptUpdate, ExplainQuestionUpdate
from ...auth.dependencies import get_current_user
from ...database.connection import get_db_cursor

router = APIRouter()

@router.post("/translate", response_model=dict)
async def update_translate_script(
    update_data: TranslateScriptUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        with get_db_cursor() as cursor:
            # Validation
            if update_data.media_id <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid media_id",
                )
            if update_data.question_id <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid question_id",
                )
            if not update_data.translate_content:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="translate_content cannot be empty",
                )
            if update_data.language_id <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid language_id",
                )

            # Check if media exists
            cursor.execute(
                "SELECT id, translate_script FROM toeicapp_media WHERE id = %s",
                (update_data.media_id,),
            )
            media = cursor.fetchone()
            if not media:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
                )

            # Check if question exists
            cursor.execute(
                "SELECT id FROM toeicapp_question WHERE id = %s", (update_data.question_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Question not found"
                )

            # Check if language exists
            cursor.execute(
                "SELECT id FROM toeicapp_language WHERE id = %s", (update_data.language_id,)
            )
            if not cursor.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Language not found"
                )

            # Parse current translate_script
            try:
                translations = json.loads(media["translate_script"] or "[]")
                if not isinstance(translations, list):
                    translations = []
            except json.JSONDecodeError:
                translations = []

            # Update or add new translation
            updated = False
            new_translation = None
            current_time = datetime.now().isoformat()
            user_id = current_user["user_id"]

            for translation in translations:
                if (
                    translation.get("question_id") == update_data.question_id
                    and translation.get("language_id") == update_data.language_id
                ):
                    translation["translate_content"] = update_data.translate_content
                    translation["updated_at"] = current_time
                    translation["user_id"] = user_id
                    new_translation = translation
                    updated = True
                    break

            if not updated:
                new_translation = {
                    "question_id": update_data.question_id,
                    "language_id": update_data.language_id,
                    "translate_content": update_data.translate_content,
                    "created_at": current_time,
                    "updated_at": current_time,
                    "user_id": user_id,
                }
                translations.append(new_translation)

            # Update database
            cursor.execute(
                "UPDATE toeicapp_media SET translate_script = %s WHERE id = %s",
                (json.dumps(translations), update_data.media_id),
            )
            
            if cursor.rowcount == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to update translation",
                )

        return {
            "success": True,
            "message": "Translation updated successfully",
            "data": new_translation,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating translation: {str(e)}",
        )


@router.get("/translate", response_model=dict)
async def get_translate_script(
    media_id: int,
    question_id: Optional[int] = None,
    language_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    try:
        with get_db_cursor() as cursor:
            if media_id <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid media_id",
                )

            cursor.execute(
                "SELECT translate_script FROM toeicapp_media WHERE id = %s", (media_id,)
            )
            media = cursor.fetchone()
            if not media:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
                )

            try:
                translations = json.loads(media["translate_script"] or "[]")
                if not isinstance(translations, list):
                    translations = []
            except json.JSONDecodeError:
                translations = []

            # Clean translations
            cleaned_translations = []
            for t in translations:
                if isinstance(t, dict) and "question_id" in t:
                    translate_content = t.get("translate_content", "")
                    if isinstance(translate_content, (dict, list)):
                        translate_content = json.dumps(translate_content)
                    cleaned_translations.append(
                        {
                            "question_id": t["question_id"],
                            "language_id": t.get("language_id", 1),
                            "translate_content": translate_content,
                            "created_at": t.get("created_at"),
                            "updated_at": t.get("updated_at"),
                            "user_id": t.get("user_id"),
                        }
                    )

            # Filter by question_id and language_id
            if question_id is not None and language_id is not None:
                for translation in cleaned_translations:
                    if (
                        translation["question_id"] == question_id
                        and translation["language_id"] == language_id
                    ):
                        return {"success": True, "data": translation}
                return {
                    "success": True,
                    "data": None,
                    "message": "No translation found for the specified question_id and language_id",
                }

            # Filter by language_id
            if language_id is not None:
                cleaned_translations = [
                    t for t in cleaned_translations if t["language_id"] == language_id
                ]

        return {"success": True, "data": cleaned_translations}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching translation: {str(e)}",
        )


@router.post("/explain", response_model=dict)
async def update_explain_question(
    update_data: ExplainQuestionUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        with get_db_cursor() as cursor:
            # Validation (similar to translate)
            if update_data.media_id <= 0:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Invalid media_id",
                )
            # ... other validations

            # Check if media exists
            cursor.execute(
                "SELECT id, explain_question FROM toeicapp_media WHERE id = %s",
                (update_data.media_id,),
            )
            media = cursor.fetchone()
            if not media:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Media not found"
                )

            # Parse current explain_question
            try:
                explanations = json.loads(media["explain_question"] or "[]")
                if not isinstance(explanations, list):
                    explanations = []
            except json.JSONDecodeError:
                explanations = []

            # Update or add new explanation
            updated = False
            new_explanation = None
            current_time = datetime.now().isoformat()
            user_id = current_user["user_id"]

            for explanation in explanations:
                if (
                    explanation.get("question_id") == update_data.question_id
                    and explanation.get("language_id") == update_data.language_id
                ):
                    explanation["explain_question"] = update_data.explain_question
                    explanation["updated_at"] = current_time
                    explanation["user_id"] = user_id
                    new_explanation = explanation
                    updated = True
                    break

            if not updated:
                new_explanation = {
                    "question_id": update_data.question_id,
                    "language_id": update_data.language_id,
                    "explain_question": update_data.explain_question,
                    "created_at": current_time,
                    "updated_at": current_time,
                    "user_id": user_id,
                }
                explanations.append(new_explanation)

            # Update database
            cursor.execute(
                "UPDATE toeicapp_media SET explain_question = %s WHERE id = %s",
                (json.dumps(explanations), update_data.media_id),
            )
            
        return {
            "success": True,
            "message": "Explanation updated successfully",
            "data": new_explanation,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating explanation: {str(e)}",
        )


@router.get("/explain", response_model=dict)
async def get_explain_questions(
    media_id: int,
    question_id: Optional[int] = None,
    language_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user),
):
    # Similar implementation to get_translate_script but for explanations
    # ... implementation details similar to above
    pass