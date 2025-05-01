from fastapi import APIRouter, HTTPException, Depends, Path, status
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from pathlib import Path as FilePath
from server.apps.forum.models import Post, Comment, Like, Question, Answer
from server.core.database import get_db
from server.core.security import get_current_user
from server.apps.forum.schemas import CommentBase, CommentCreate, Comment as CommentSchema


router = APIRouter()

# Optional current user dependency that doesn't raise an exception if user is not authenticated
async def get_optional_user(db: Session = Depends(get_db)):
    try:
        return await get_current_user(db)
    except:
        return None

# HTML Page routes
@router.get("/", response_class=HTMLResponse)
def events_page():
    # Path to the forum HTML file
    html_file_path = FilePath(__file__).parent.parent.parent.parent / "src/pages/forum-posts-page.html"
    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Forum page not found</h1>", status_code=404)

@router.get("/create_post", response_class=HTMLResponse)
async def create_post_page(current_user: dict = Depends(get_optional_user)):
    # Check if user is authenticated
    if not current_user:
        # Redirect to login page if user is not authenticated
        return RedirectResponse(url="/auth/login?next=/forum/create_post", status_code=status.HTTP_302_FOUND)

    # Path to the create post HTML file
    html_file_path = FilePath(__file__).parent.parent.parent.parent / "src/pages/create-post-page.html"
    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Create post page not found</h1>", status_code=404)

@router.get("/view_post/{post_id}", response_class=HTMLResponse)
def view_post_page(post_id: int, db: Session = Depends(get_db)):
    # Check if post exists - any user can view posts
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        return HTMLResponse(content="<h1>Post not found</h1>", status_code=404)

    html_file_path = FilePath(__file__).parent.parent.parent.parent / "src/pages/post-view-page.html"
    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>View post page not found</h1>", status_code=404)

# Post routes - Create requires authentication
@router.post("/posts")
async def create_post(
    post: dict,  # Use your actual schema here if available
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Will raise 401 if not authenticated
):
    # Create a post using your actual model
    new_post = Post(
        title=post.get("title"),
        content=post.get("content"),
        user_id=current_user.get("id")
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

# View routes - No authentication required
@router.get("/posts")
def get_posts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Get posts using your actual model - anyone can view posts
    posts = db.query(Post).offset(skip).limit(limit).all()
    return posts

@router.get("/posts/{post_id}")
def get_post(
    post_id: int = Path(..., title="The ID of the post to get"),
    db: Session = Depends(get_db)
):
    # Get a specific post - anyone can view posts
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post
# Update and delete - require authentication and user ownership
@router.put("/posts/{post_id}")
async def update_post(
    post_id: int,
    post_update: dict,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Will raise 401 if not authenticated
):
    # Get the post
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if the user is the owner of the post
    if db_post.user_id != current_user.get("id"):
        raise HTTPException(status_code=403, detail="You can only update your own posts")

    # Update the post
    for key, value in post_update.items():
        if hasattr(db_post, key):
            setattr(db_post, key, value)

    db.commit()
    db.refresh(db_post)
    return db_post

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # Will raise 401 if not authenticated
):
    # Get the post
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if db_post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check if the user is the owner of the post
    if db_post.user_id != current_user.get("id"):
        raise HTTPException(status_code=403, detail="You can only delete your own posts")

    # Delete the post
    db.delete(db_post)
    db.commit()
    return {"message": "Post deleted successfully"}

@router.post("/posts/{post_id}/comments")
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Перевіряємо чи існує пост
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Створюємо коментар
    new_comment = Comment(
        content=comment.content,
        post_id=post_id,
        user_id=current_user.get("id")
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.get("/posts/{post_id}/comments")
def get_post_comments(
    post_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Перевіряємо чи існує пост
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Отримуємо коментарі до поста
    comments = db.query(Comment).filter(Comment.post_id == post_id).offset(skip).limit(limit).all()
    return comments

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Отримуємо коментар
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if comment is None:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Перевіряємо чи користувач є автором коментаря
    if comment.user_id != current_user.get("id"):
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    # Видаляємо коментар
    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}

# Роути для лайків
@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Перевіряємо чи існує пост
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Перевіряємо чи користувач вже лайкнув цей пост
    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.get("id")
    ).first()

    if existing_like:
        # Якщо лайк вже існує, видаляємо його (тобто "знімаємо" лайк)
        db.delete(existing_like)
        db.commit()
        return {"message": "Like removed successfully"}
    else:
        # Інакше додаємо новий лайк
        new_like = Like(
            post_id=post_id,
            user_id=current_user.get("id")
        )
        db.add(new_like)
        db.commit()
        return {"message": "Post liked successfully"}

@router.get("/posts/{post_id}/likes")
def get_post_likes(
    post_id: int,
    db: Session = Depends(get_db)
):
    # Перевіряємо чи існує пост
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Рахуємо кількість лайків
    likes_count = db.query(Like).filter(Like.post_id == post_id).count()
    return {"likes_count": likes_count}

@router.get("/posts/{post_id}/likes/check")
async def check_post_like(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_optional_user)
):
    # Якщо користувач не авторизований, повертаємо що він не лайкнув
    if not current_user:
        return {"liked": False}

    # Перевіряємо чи існує пост
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")

    # Перевіряємо чи користувач лайкнув цей пост
    like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.get("id")
    ).first()

    return {"liked": like is not None}
# Аналогічні роути для лайків питань і відповідей
@router.post("/questions/{question_id}/like")
async def like_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Перевіряємо чи існує питання
    question = db.query(Question).filter(Question.id == question_id).first()
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")

    # Перевіряємо чи користувач вже лайкнув це питання
    existing_like = db.query(Like).filter(
        Like.question_id == question_id,
        Like.user_id == current_user.get("id")
    ).first()

    if existing_like:
        # Якщо лайк вже існує, видаляємо його
        db.delete(existing_like)
        db.commit()
        return {"message": "Like removed successfully"}
    else:
        # Інакше додаємо новий лайк
        new_like = Like(
            question_id=question_id,
            user_id=current_user.get("id")
        )
        db.add(new_like)
        db.commit()
        return {"message": "Question liked successfully"}

@router.post("/answers/{answer_id}/like")
async def like_answer(
    answer_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Перевіряємо чи існує відповідь
    answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if answer is None:
        raise HTTPException(status_code=404, detail="Answer not found")

    # Перевіряємо чи користувач вже лайкнув цю відповідь
    existing_like = db.query(Like).filter(
        Like.answer_id == answer_id,
        Like.user_id == current_user.get("id")
    ).first()

    if existing_like:
        # Якщо лайк вже існує, видаляємо його
        db.delete(existing_like)
        db.commit()
        return {"message": "Like removed successfully"}
    else:
        # Інакше додаємо новий лайк
        new_like = Like(
            answer_id=answer_id,
            user_id=current_user.get("id")
        )
        db.add(new_like)
        db.commit()
        # Оновлюємо лічильник лайків у відповіді
        answer.likes += 1
        db.commit()
        return {"message": "Answer liked successfully"}