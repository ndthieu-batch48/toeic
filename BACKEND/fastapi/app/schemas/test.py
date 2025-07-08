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