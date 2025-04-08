from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from sqlmodel import Field
from server.apps.events.models import EventCategory
from uuid import uuid4, UUID

class EventCreate(BaseModel):
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    date_scheduled: datetime = Field(default=None, nullable=True)
    category: EventCategory = Field(default=EventCategory.OTHER)
    author_id: UUID = Field(foreign_key="user.id", nullable=False)
    
    model_config = {"from_attributes": True}
class EventResponse(BaseModel):
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    # date_created: datetime = Field(nullable=False)
    date_created: str = Field(nullable=False)
    location: str = Field(default="Unknown")
    date_scheduled: Optional[str] = Field(default=None, nullable=True)
    category: str = Field(default="other")
    # category: EventCategory = Field(default=EventCategory.OTHER)
    # author_id: UUID = Field(foreign_key="user.id", nullable=False)

    model_config = {"from_attributes": True}

class EventListResponse(BaseModel):
    events: List[EventResponse]

    model_config = {"from_attributes": True}