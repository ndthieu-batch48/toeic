from pydantic import BaseModel
from typing import List, Optional

class Test(BaseModel):
    id: int
    title: str
    description: str
    duration: int

    class Config:
        model_config = {
            "from_attributes": True
        }

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

class TestPart(BaseModel):
    id: int
    part_id: int
    test_id: int


class AnswerDetail(BaseModel):
    answer_id: int
    content: str
    is_correct: bool

class QuestionDetail(BaseModel):
    question_id: int
    question_number: int
    question_content: str
    answer_list: List[AnswerDetail]

class MediaDetail(BaseModel):
    media_id: int
    media_name: str
    media_paragraph_main: str
    media_audio_script: Optional[str] = None
    media_explain_question: Optional[str] = None
    media_translate_script: Optional[str] = None
    question_list: List[QuestionDetail]

class PartDetail(BaseModel):
    part_id: int
    part_order: str
    part_title: str
    part_audio_url: Optional[str] = None
    media_list: List[MediaDetail]

class TestDetail(BaseModel):
    part_list: List[PartDetail]