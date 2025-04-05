from sqlmodel import SQLModel, Field
from uuid import uuid4, UUID
from typing import Optional, List
from enum import Enum

class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"

class User(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    first_name: str = Field(index=True, unique=False, max_length=50)
    last_name: str = Field(index=True, unique=False, max_length=50)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    roles: List[Role] = Field(default=[Role.USER])
