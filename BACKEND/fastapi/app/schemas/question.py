from typing import List, Optional
from pydantic import BaseModel

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
    translate_content: Optional[str] = None


class TestPartQuestion(BaseModel):
    part_id: int
    questions: List[Question] 




class Answer2(BaseModel):
    id: int
    content: str
    is_correct: bool