from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4, UUID
from sqlmodel import SQLModel, Field, Column, Integer, String, DateTime, UniqueConstraint

class EventStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    CANCELLED = "cancelled"

class EventCategory(str, Enum):
    HEALTH="health"
    EMPLOYMENT="employment"
    SUPPORT="support"
    CHARITY="charity"
    NETWORKING="networking"
    ENTERTAINING="entertaining"
    OTHER="other"

class Event(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=150, index=True)
    description: str = Field(max_length=1000)
    location: str = Field(default="Unknown")
    date_created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    date_scheduled: datetime = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    category: str = Field(default=EventCategory.OTHER.value, index=True)
    author_id: UUID = Field(foreign_key="user.id", nullable=False)
    image_path: str = Field(default=None, nullable=True)
    image_caption: str = Field(default=None, max_length=255, nullable=True)
    status: str = Field(default=EventStatus.OPEN.value)  # Use enum value instead of "open"
    votes: int = Field(default=0)

class EventVote(SQLModel, table=True):
    """Model for tracking user votes on events"""
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    event_id: UUID = Field(foreign_key="event.id", nullable=False)
    user_id: UUID = Field(foreign_key="user.id", nullable=False)
    date_voted: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Add a unique constraint on event_id and user_id to prevent duplicate votes
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="unique_event_user_vote"),
    )