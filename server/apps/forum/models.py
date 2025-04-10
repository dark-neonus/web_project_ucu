from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey

# Link model for many-to-many relationship
class QuestionTagLink(SQLModel, table=True):
    __tablename__ = "question_tags"
    question_id: Optional[int] = Field(
        default=None, foreign_key="questions.id", primary_key=True
    )
    tag_id: Optional[int] = Field(
        default=None, foreign_key="tags.id", primary_key=True
    )

# Forum models
class Question(SQLModel, table=True):
    __tablename__ = "questions"
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    title: str = Field(sa_column=Column(String(255), nullable=False))
    content: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime, onupdate=datetime.utcnow))
    user_id: int = Field(foreign_key="users.id", nullable=False)
    views: int = Field(default=0)
    likes: int = Field(default=0)

    # Relationships
    user: "User" = Relationship(back_populates="questions")
    answers: List["Answer"] = Relationship(back_populates="question")
    tags: List["Tag"] = Relationship(
        back_populates="questions",
        link_model=QuestionTagLink
    )

class Answer(SQLModel, table=True):
    __tablename__ = "answers"
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    content: str = Field(sa_column=Column(Text, nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime))
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime, onupdate=datetime.utcnow))
    user_id: int = Field(foreign_key="users.id", nullable=False)
    question_id: int = Field(foreign_key="questions.id", nullable=False)
    likes: int = Field(default=0)
    
    # Relationships
    user: "User" = Relationship(back_populates="answers")
    question: Question = Relationship(back_populates="answers")

class Tag(SQLModel, table=True):
    __tablename__ = "tags"
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    name: str = Field(sa_column=Column(String(50), unique=True, index=True))
    
    # Relationships
    questions: List[Question] = Relationship(
        back_populates="tags",
        link_model=QuestionTagLink
    )

class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True, index=True)
    username: str = Field(sa_column=Column(String(50), unique=True, index=True))
    email: str = Field(sa_column=Column(String(100), unique=True, index=True))
    hashed_password: str = Field(sa_column=Column(String(100)))
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column=Column(DateTime))
    
    # Relationships
    questions: List[Question] = Relationship(back_populates="user")
    answers: List[Answer] = Relationship(back_populates="user")
