from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel


class History(BaseModel):
    id: int
    dataprogress: Dict[str, str]  # JSON field
    type: str                     # varchar(20) - "Practice", "FullTest", etc.
    part: List[str]              # JSON field - ["Part 5"]
    time: int                    # int field
    test_id: int                 # bigint field
    user_id: int                 # bigint field  
    create_at: datetime          # datetime field (note: create_at, not created_at)
    status: str                  # varchar(10) - "submit", etc.
    time_left: Optional[int] = None  # int field, can be NULL


class HistoryCreate(BaseModel):
    dataprogress: Dict[str, str]  
    type: str
    part: List[str] 
    time: int
    test_id: int
    # user_id: int
    status: str = "submit" #add status for test
    time_left: Optional[int] = None