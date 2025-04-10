from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from . import schemas, services
from server.core.database import get_db

# Import from auth module (placeholder)
# from backend.apps.authentication.dependencies import get_current_user

# Mock function for get_current_user since auth is handled by another team
async def get_current_user(db: Session = Depends(get_db)):
    # In a real application, this would verify the JWT token
    # and return the user. For now, we return a mock user.
    return {"id": 1, "username": "test_user"}

router = APIRouter(
    prefix="/forum",
    tags=["forum"],
    responses={404: {"description": "Not found"}},
)

# Tag routes
@router.get("/tags", response_model=List[schemas.Tag])
def get_tags(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    return services.get_tags(db, skip=skip, limit=limit)

# Question routes
@router.post("/questions", response_model=schemas.Question)
def create_question(
    question: schemas.QuestionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.create_question(db, question, current_user["id"])

@router.get("/questions", response_model=List[schemas.Question])
def get_questions(
    skip: int = 0,
    limit: int = 100,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return services.get_questions(db, skip=skip, limit=limit, tag=tag, search=search)

@router.get("/questions/{question_id}", response_model=schemas.QuestionWithAnswers)
def get_question(
    question_id: int = Path(..., title="The ID of the question to get"),
    db: Session = Depends(get_db)
):
    db_question = services.get_question(db, question_id)
    if db_question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Increment view count
    db_question = services.increment_question_view(db, question_id)
    
    # Get answers for the question
    answers = services.get_answers(db, question_id)
    
    # Build response with answers
    question_dict = schemas.Question.from_orm(db_question).dict()
    question_dict["answers"] = answers
    
    return question_dict

@router.put("/questions/{question_id}", response_model=schemas.Question)
def update_question(
    question_id: int,
    question_update: schemas.QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.update_question(db, question_id, question_update, current_user["id"])

@router.delete("/questions/{question_id}")
def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.delete_question(db, question_id, current_user["id"])

# Answer routes
@router.post("/questions/{question_id}/answers", response_model=schemas.Answer)
def create_answer(
    question_id: int,
    answer: schemas.AnswerCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.create_answer(db, answer, current_user["id"], question_id)

@router.get("/questions/{question_id}/answers", response_model=List[schemas.Answer])
def get_answers(
    question_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return services.get_answers(db, question_id, skip=skip, limit=limit)

@router.put("/answers/{answer_id}", response_model=schemas.Answer)
def update_answer(
    answer_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.update_answer(db, answer_id, content, current_user["id"])

@router.delete("/answers/{answer_id}")
def delete_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.delete_answer(db, answer_id, current_user["id"])

# Like/Unlike routes
@router.post("/questions/{question_id}/like")
def like_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.like_question(db, question_id, current_user["id"])

@router.post("/questions/{question_id}/unlike")
def unlike_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.unlike_question(db, question_id, current_user["id"])

@router.post("/answers/{answer_id}/like")
def like_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.like_answer(db, answer_id, current_user["id"])

@router.post("/answers/{answer_id}/unlike")
def unlike_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.unlike_answer(db, answer_id, current_user["id"])

# User's own questions
@router.get("/my/questions", response_model=List[schemas.Question])
def get_my_questions(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return services.get_questions(db, skip=skip, limit=limit, user_id=current_user["id"])
