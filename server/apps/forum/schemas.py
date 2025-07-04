from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# Tag schemas
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int

    class Config:
        orm_mode = True

# Answer schemas
class AnswerBase(BaseModel):
    content: str

class AnswerCreate(AnswerBase):
    pass

class Answer(AnswerBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int
    question_id: int
    likes: int = 0
    # This will be expanded with user info from auth module
    username: Optional[str] = None

    class Config:
        orm_mode = True

# Question schemas
class QuestionBase(BaseModel):
    title: str
    content: str

class QuestionCreate(QuestionBase):
    tags: Optional[List[str]] = []

class QuestionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None

class Question(QuestionBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int
    views: int = 0
    likes: int = 0
    tags: List[Tag] = []
    # This will be expanded with user info from auth module
    username: Optional[str] = None

    class Config:
        orm_mode = True

class QuestionWithAnswers(Question):
    answers: List[Answer] = []

# Suggestion schemas
class SuggestionBase(BaseModel):
    content: str

class SuggestionCreate(SuggestionBase):
    question_id: int

class Suggestion(SuggestionBase):
    id: int
    created_at: datetime
    user_id: int
    question_id: int
    # This will be expanded with user info from auth module
    username: Optional[str] = None

    class Config:
        orm_mode = True

# Like/Dislike schemas
class LikeCreate(BaseModel):
    question_id: Optional[int] = None
    answer_id: Optional[int] = None

class CommentBase(BaseModel):
    content: str

class CommentCreate(CommentBase):
    post_id: int

class Comment(CommentBase):
    id: int
    created_at: datetime
    user_id: int
    post_id: int
    username: Optional[str] = None
    
    class Config:
        from_attributes = True