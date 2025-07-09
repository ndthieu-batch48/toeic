from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from ...auth.dependencies import get_current_user
from ...database.connection import connect
from ...database.queries import GET_ALL_LANGUAGES

router = APIRouter()

@router.get("/", response_model=dict)
async def get_languages(current_user: dict = Depends(get_current_user)):
    conn = connect()
    cursor = conn.cursor(dictionary=True)
    
    try:
        cursor.execute(GET_ALL_LANGUAGES)
        languages = cursor.fetchall()
        
        return {"success": True, "data": languages}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching languages: {str(e)}"
        )
    finally:
        cursor.close()
        conn.close()