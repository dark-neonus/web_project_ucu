from typing import List
from pydantic import BaseModel
from datetime import datetime

class EventCreate(BaseModel):
    title: str
    description: str
    date: datetime
    user_id: int

class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    date: datetime
    user_id: int

class EventListResponse(BaseModel):
    events: List[EventResponse]