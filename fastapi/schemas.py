from pydantic import BaseModel
from typing import List, Dict, Union, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class Test(BaseModel):
    id: int
    title: str
    description: str
    duration: int

    class Config:
        model_config = {
        "from_attributes": True
    }

class PartPublic(BaseModel):
    id: int
    part_order: str
    title: str
    questionCount: int
    partOrderNum: int

class Part(BaseModel):
    id: int
    part_order: Optional[str] = None
    audio_url: Optional[str] = None
    title: Optional[str] = None
    questionCount: Optional[int] = None
    partOrderNum: Optional[int] = None

    class Config:
        model_config = {
        "from_attributes": True
    }

class Answer(BaseModel):
    id: int
    question_id: int
    content: str
    is_correct: bool


class Question(BaseModel):
    id: int
    content: str
    answers: List[Answer]

class PartQuestionsResponse(BaseModel):
    id: int
    part_id: int
    order: int  
    content: Optional[str] = None
    group_id: Optional[int] = None 
    translate_content: Optional[str] = None #moi sua
    

class TestPart(BaseModel):
    id: int
    part_id: int
    test_id :int 



class Media(BaseModel):
    id: int
    paragrap_main: Optional[str] = None
    media_name: Optional[str] = None
    create: Optional[str] = None
    test_id: Optional[int] = None
    audio_script: Optional[str] = None
    explain_question: Optional[str] = None
    translate_script: Optional[str] = None

class TestPartQuestion(BaseModel):
    part_id: int
    questions: List[Question]


class Answer2(BaseModel):
    id: int
    content: str
    is_correct: bool

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    date_joined: datetime = datetime.now()
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None



class History(BaseModel):
    id: int
    dataprogress: Dict[str, str]  
    part: List[str] 
    test_id: int
    time: int
    type: str
    user_id: int
    status: str
    time_left: Optional[int] = None

class HistoryCreate(BaseModel):
    dataprogress: Dict[str, str]  
    part: List[str] 
    test_id: int
    time: int
    type: str
    user_id: int
    status: str = "submit" #add status for test
    time_left: Optional[int] = None

class User(BaseModel):
    username: str
    email: EmailStr
    password: str

class TokenRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class PromptRequest(BaseModel):
    prompt: str
    language_id: int

# class PromptWithImageRequest(BaseModel):
#     prompt: str
#     image_base64: str
class PromptWithImageRequest(BaseModel):
    prompt: str
    id: int
    language_id: int

class TranslateScriptUpdate(BaseModel):
    media_id: int
    question_id: int
    # translate_script: str
    translate_content: str
    # created_at: Optional[str] = None
    # updated_at: Optional[str] = None
    language_id: Optional[int]

# schemas.py
class ExplainQuestionUpdate(BaseModel):
    media_id: int
    question_id: int
    explain_question: str
    language_id: Optional[int]

class Language(BaseModel):
    id: int
    language_name: str