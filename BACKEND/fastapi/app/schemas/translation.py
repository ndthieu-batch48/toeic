from pydantic import BaseModel
from typing import Optional


class TranslateScriptUpdate(BaseModel):
    media_id: int
    question_id: int
    translate_content: str
    language_id: Optional[int]


class ExplainQuestionUpdate(BaseModel):
    media_id: int
    question_id: int
    explain_question: str
    language_id: Optional[int]