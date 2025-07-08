from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from ..core.security import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")  # Added leading slash

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if payload is None:
        raise credentials_exception

    username = payload.get("sub")
    user_id = payload.get("user_id")
    role = payload.get("role")

    if not username or not role:
        raise credentials_exception

    return {"username": username, "user_id": user_id, "role": role}