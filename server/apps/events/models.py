from sqlmodel import SQLModel, Field
from uuid import uuid4, UUID
from typing import Optional, List
from enum import Enum
from datetime import datetime

class Event(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str
    date: datetime
    user_id: int