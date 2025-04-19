from datetime import datetime, timezone
from enum import Enum
from uuid import uuid4, UUID
from sqlmodel import SQLModel, Field

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
    date_scheduled: datetime = Field(default=None, nullable=True)
    category: str = Field(default=EventCategory.OTHER.value, index=True)
    author_id: UUID = Field(foreign_key="user.id", nullable=False)
    # New field for image path
    image_path: str = Field(default=None, nullable=True)
    # New field for image caption
    image_caption: str = Field(default=None, max_length=255, nullable=True)