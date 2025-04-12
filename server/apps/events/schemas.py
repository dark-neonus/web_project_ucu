from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, validator
from sqlmodel import Field
from server.apps.events.models import EventCategory
from uuid import uuid4, UUID
from server.apps.authentication.models import User
from sqlalchemy.orm import Session


class EventCreate(BaseModel):
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    date_scheduled: Optional[datetime] = None
    category: EventCategory = Field(default=EventCategory.OTHER)
    location: str = Field(default="Unknown")
    author_id: UUID = Field(foreign_key="user.id", nullable=False)

    @classmethod
    @validator("date_scheduled", pre=True, always=True)
    def parse_date_scheduled(cls, value):
        if value is None:
            return None
        if isinstance(value, datetime):
            return value
        try:
            print("Trying to parse date_scheduled:", value)
            return datetime.fromisoformat(value)  # Parse ISO 8601 string
        except ValueError:
            print("Failed to parse date_scheduled:", value)
            raise ValueError("Invalid date format for 'date_scheduled'. Expected ISO 8601 format.")

    
    model_config = {"from_attributes": True}

class EventResponse(BaseModel):
    id: UUID
    title: str
    description: str
    date_created: str  # Ensure this is a string
    location: str = "Unknown"
    date_scheduled: Optional[str] = None  # Ensure this is a string
    category: str
    author_id: UUID
    author_username: Optional[str] = None

    @classmethod
    def from_orm(cls, event, db: Session):
        # Query the user by author_id
        user = db.query(User).filter(User.id == event.author_id).first()
        if not user:
            raise ValueError(f"User with ID {event.author_id} not found")

        # Construct the username
        author_username = user.first_name
        if user.last_name:
            author_username += f" {user.last_name}"

        # Return the EventResponse instance
        return cls(
            id=event.id,
            title=event.title,
            description=event.description,
            date_created=event.date_created.isoformat(),  # Convert datetime to ISO 8601 string
            location=event.location,
            date_scheduled=event.date_scheduled.isoformat() if event.date_scheduled else None,
            category=event.category,
            author_id=event.author_id,
            author_username=author_username,
        )

class EventListResponse(BaseModel):
    events: List[EventResponse]

    model_config = {"from_attributes": True}