from typing import Optional
from pydantic import BaseModel


class PromptRequest(BaseModel):
    prompt: str
    language_id: Optional[int] = 1


class PromptWithImageRequest(BaseModel):
    prompt: str
    id: int
    language_id: int