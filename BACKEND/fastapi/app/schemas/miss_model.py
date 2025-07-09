from pydantic import BaseModel
from typing import List, Dict, Union, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class PartPublic(BaseModel):
    id: int
    part_order: str
    title: str
    questionCount: int
    partOrderNum: int

















class User(BaseModel):
    username: str
    email: EmailStr
    password: str







