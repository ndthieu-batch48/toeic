from typing import Dict, List, Optional
from pydantic import BaseModel


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