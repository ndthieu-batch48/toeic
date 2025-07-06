import os
from passlib.context import CryptContext
from pydantic import BaseModel
from jose import jwt, JWTError
from datetime import datetime, timedelta


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire.timestamp()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire.timestamp()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
    

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload["exp"] < datetime.now().timestamp():
            return None
        return payload
    except JWTError:
        return None
    

class User(BaseModel):
    username: str
    email: str
    password: str

class UserInDB(User):
    hashed_password: str


class UserLogin(BaseModel):
    username: str
    password: str

