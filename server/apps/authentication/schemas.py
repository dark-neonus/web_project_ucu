from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str

    class Config:
        orm_mode = True
