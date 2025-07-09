from pydantic import BaseModel
from typing import Optional


class Media(BaseModel):
    id: int
    paragrap_main: Optional[str] = None
    media_name: Optional[str] = None
    create: Optional[str] = None
    test_id: Optional[int] = None
    audio_script: Optional[str] = None
    explain_question: Optional[str] = None
    translate_script: Optional[str] = None