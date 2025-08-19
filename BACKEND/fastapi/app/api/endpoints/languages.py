from fastapi import APIRouter, Depends, HTTPException, status

from ...auth.dependencies import get_current_user
from ...database.connection import get_db_cursor
from ...database.queries import GET_ALL_LANGUAGES

router = APIRouter()

@router.get("", response_model=dict)
async def get_languages(_: dict = Depends(get_current_user)):
    try:
        with get_db_cursor() as cursor:
            cursor.execute(GET_ALL_LANGUAGES)
            languages = cursor.fetchall()
        
        return {"languages": languages}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Error in get languages controller",
                "error": str(e),
            },
        )
