from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime
from typing import List, Optional
from . import models, schemas

# Tag services
def get_tags(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Tag).offset(skip).limit(limit).all()

def create_tag(db: Session, tag_name: str):
    # Check if tag already exists
    db_tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
    if db_tag:
        return db_tag
    
    # Create new tag if it doesn't exist
    db_tag = models.Tag(name=tag_name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

# Question services
def create_question(db: Session, question: schemas.QuestionCreate, user_id: int):
    # Create the question
    db_question = models.Question(
        title=question.title,
        content=question.content,
        user_id=user_id
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    
    # Add tags
    if question.tags:
        for tag_name in question.tags:
            tag = create_tag(db, tag_name)
            db_question.tags.append(tag)
        db.commit()
        db.refresh(db_question)
    
    return db_question

def get_questions(
    db: Session, 
    skip: int = 0, 
    limit: int = 100, 
    tag: Optional[str] = None,
    search: Optional[str] = None,
    user_id: Optional[int] = None
):
    query = db.query(models.Question)
    
    # Filter by tag if provided
    if tag:
        query = query.join(models.Question.tags).filter(models.Tag.name == tag)
    
    # Filter by search term if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Question.title.ilike(search_term),
                models.Question.content.ilike(search_term)
            )
        )
    
    # Filter by user_id if provided
    if user_id:
        query = query.filter(models.Question.user_id == user_id)
    
    # Order by most recent
    query = query.order_by(models.Question.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

def get_question(db: Session, question_id: int):
    return db.query(models.Question).filter(models.Question.id == question_id).first()

def increment_question_view(db: Session, question_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if db_question:
        db_question.views += 1
        db.commit()
        db.refresh(db_question)
    return db_question

def update_question(db: Session, question_id: int, question_update: schemas.QuestionUpdate, user_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    
    if not db_question:
        return None
    
    if db_question.user_id != user_id:
        raise ValueError("Only the author can update this question")
    
    # Update fields if provided
    if question_update.title is not None:
        db_question.title = question_update.title
    
    if question_update.content is not None:
        db_question.content = question_update.content
    
    # Update tags if provided
    if question_update.tags is not None:
        # Clear existing tags
        db_question.tags = []
        
        # Add new tags
        for tag_name in question_update.tags:
            tag = create_tag(db, tag_name)
            db_question.tags.append(tag)
    
    db_question.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_question)
    return db_question

def delete_question(db: Session, question_id: int, user_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    
    if not db_question:
        return {"success": False, "message": "Question not found"}
    
    if db_question.user_id != user_id:
        return {"success": False, "message": "Only the author can delete this question"}
    
    db.delete(db_question)
    db.commit()
    return {"success": True, "message": "Question deleted successfully"}

# Answer services
def create_answer(db: Session, answer: schemas.AnswerCreate, user_id: int, question_id: int):
    db_answer = models.Answer(
        content=answer.content,
        user_id=user_id,
        question_id=question_id
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

def get_answers(db: Session, question_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Answer)\
        .filter(models.Answer.question_id == question_id)\
        .order_by(models.Answer.created_at.asc())\
        .offset(skip).limit(limit).all()

def update_answer(db: Session, answer_id: int, content: str, user_id: int):
    db_answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
    
    if not db_answer:
        return None
    
    if db_answer.user_id != user_id:
        raise ValueError("Only the author can update this answer")
    
    db_answer.content = content
    db_answer.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_answer)
    return db_answer

def delete_answer(db: Session, answer_id: int, user_id: int):
    db_answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
    
    if not db_answer:
        return {"success": False, "message": "Answer not found"}
    
    if db_answer.user_id != user_id:
        return {"success": False, "message": "Only the author can delete this answer"}
    
    db.delete(db_answer)
    db.commit()
    return {"success": True, "message": "Answer deleted successfully"}

# Like/Unlike services
def like_question(db: Session, question_id: int, user_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return {"success": False, "message": "Question not found"}
    
    # In a production app, you'd check if user already liked the question
    # This is a simplified version that just increments the like counter
    db_question.likes += 1
    db.commit()
    
    return {"success": True, "likes": db_question.likes}

def unlike_question(db: Session, question_id: int, user_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_question:
        return {"success": False, "message": "Question not found"}
    
    # In a production app, you'd check if user already liked the question
    # This is a simplified version that just decrements the like counter
    if db_question.likes > 0:
        db_question.likes -= 1
        db.commit()
    
    return {"success": True, "likes": db_question.likes}

def like_answer(db: Session, answer_id: int, user_id: int):
    db_answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
    if not db_answer:
        return {"success": False, "message": "Answer not found"}
    
    # In a production app, you'd check if user already liked the answer
    # This is a simplified version that just increments the like counter
    db_answer.likes += 1
    db.commit()
    
    return {"success": True, "likes": db_answer.likes}

def unlike_answer(db: Session, answer_id: int, user_id: int):
    db_answer = db.query(models.Answer).filter(models.Answer.id == answer_id).first()
    if not db_answer:
        return {"success": False, "message": "Answer not found"}
    
    # In a production app, you'd check if user