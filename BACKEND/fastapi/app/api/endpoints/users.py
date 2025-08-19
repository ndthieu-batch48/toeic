from fastapi import APIRouter, Depends, HTTPException, status

from ...schemas.auth import UserResponse

from ...auth.dependencies import get_current_user
from ...database.connection import get_db_cursor
from ...database.queries import SELECT_USER_BY_ID

router = APIRouter()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(current_user: dict = Depends(get_current_user)):
    user_id = current_user.get("user_id")
    try:
        with get_db_cursor() as cursor:
            cursor.execute(SELECT_USER_BY_ID, (user_id,))
            user = cursor.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            return UserResponse(
                id=user["id"],
                username=user["username"],
                email=user["email"],
                role=user["role"],
                date_joined=user["date_joined"],
                access_token="",  # Don't return token in user info
                refresh_token="",
                token_type="bearer"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "message": "Error in get user controller",
                "error": str(e),
            },
        )