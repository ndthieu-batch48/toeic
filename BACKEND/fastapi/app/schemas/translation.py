from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from app.helpers.prompt_helper import LANGUAGE_MAP

# Define valid language codes based on LANGUAGE_MAP
LanguageCode = Literal["vi", "ja", "en"]


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


# NEW
class TranslateQuestionResponse(BaseModel):
    question_id: int
    question_content: str
    answer_list: list[str]
    language_id: LanguageCode
    
    @field_validator('language_id')
    @classmethod
    def validate_language_id(cls, v):
        if v not in LANGUAGE_MAP:
            raise ValueError(f'Invalid language code. Must be one of: {list(LANGUAGE_MAP.keys())}')
        return v


class TranslateQuestionRequest(BaseModel):
    question_id: int
    language_id: LanguageCode
    
    @field_validator('language_id')
    @classmethod
    def validate_language_id(cls, v):
        if v not in LANGUAGE_MAP:
            raise ValueError(f'Invalid language code. Must be one of: {list(LANGUAGE_MAP.keys())}')
        return v


class TranslateImageRequest(BaseModel):
    media_id: int
    language_id: LanguageCode
    
    @field_validator('language_id')
    @classmethod
    def validate_language_id(cls, v):
        if v not in LANGUAGE_MAP:
            raise ValueError(f'Invalid language code. Must be one of: {list(LANGUAGE_MAP.keys())}')
        return v