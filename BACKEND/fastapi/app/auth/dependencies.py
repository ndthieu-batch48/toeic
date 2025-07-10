from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer, OAuth2PasswordBearer
from typing import Optional
from ..core.security import verify_token

# Cho Swagger UI hiển thị token box (Bearer <token>)
http_bearer = HTTPBearer(auto_error=False)

# Cho OpenAPI hiển thị đúng flow OAuth2 Password
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    fallback: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer)
):
    # Nếu OAuth2 không có token (ví dụ do Swagger không gửi đúng flow), dùng HTTPBearer
    if not token and fallback:
        token = fallback.credentials

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    username = payload.get("sub")
    user_id = payload.get("user_id")
    role = payload.get("role")

    if not username or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user payload",
        )

    return {"username": username, "user_id": user_id, "role": role}