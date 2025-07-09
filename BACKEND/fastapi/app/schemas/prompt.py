from pydantic import BaseModel


class PromptRequest(BaseModel):
    prompt: str
    language_id: int


class PromptWithImageRequest(BaseModel):
    prompt: str
    id: int
    language_id: int