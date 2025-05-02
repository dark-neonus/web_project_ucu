from __future__ import annotations
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime

from server.apps.authentication.models import User

class QuestionTagLink(SQLModel, table=True):
    question_id: int = Field(foreign_key="question.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)

class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=255)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="user.id")
    views: int = Field(default=0)
    likes: int = Field(default=0)
    user: Optional[User] = Relationship(back_populates="questions")
    answers: List[Answer] = Relationship(back_populates="question")
    tags: List[Tag] = Relationship(back_populates="questions", link_model=QuestionTagLink)

class Answer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="user.id")
    question_id: int = Field(foreign_key="question.id")
    likes: int = Field(default=0)
    user: Optional[User] = Relationship(back_populates="answers")
    question: Optional[Question] = Relationship(back_populates="answers")

class Tag(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, max_length=50)
    questions: List[Question] = Relationship(back_populates="tags", link_model=QuestionTagLink)

class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=100)
    content: str
    user_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    user: Optional[User] = Relationship(back_populates="posts")
    comments: List[Comment] = Relationship(back_populates="post")
    likes: List[Like] = Relationship()

class Suggestion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="user.id")
    question_id: int = Field(foreign_key="question.id")


class Comment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user_id: int = Field(foreign_key="user.id")
    post_id: int = Field(foreign_key="post.id")
    user: Optional[User] = Relationship(back_populates="comments")
    post: Optional[Post] = Relationship(back_populates="comments")

class Like(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    post_id: Optional[int] = Field(default=None, foreign_key="post.id")
    question_id: Optional[int] = Field(default=None, foreign_key="question.id")
    answer_id: Optional[int] = Field(default=None, foreign_key="answer.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    user: Optional[User] = Relationship()
    post: Optional[Post] = Relationship()
    question: Optional[Question] = Relationship()
    answer: Optional[Answer] = Relationship()