from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi import Query
from pathlib import Path
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import Post
from .schemas import PostCreate, PostResponse

router = APIRouter()

@router.post("/posts/", response_model=PostResponse)
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    db_post = Post(**post.dict())
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.get("/posts/{post_id}", response_model=PostResponse)
def read_post(post_id: int, db: Session = Depends(get_db)):
    post = db.query(Post).filter(Post.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

# @router.get("/posts/", response_model=list[PostResponse])
# def read_posts(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
#     posts = db.query(Post).offset(skip).limit(limit).all()
#     return posts

@router.get("/posts", response_class=HTMLResponse)
def events_page(content: str = Query("questions"), db: Session = Depends(get_db)):
    # Redirect to /events?content=events if the query parameter 'content' is missing
    # if content is None:
    #     return RedirectResponse(url="/forum/posts/?content=forum")

    # Check if the query parameter 'content' is equal to 'events'
    if content != "questions":
        raise HTTPException(status_code=400, detail="Invalid query parameter")

    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/forum-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Questions page not found</h1>", status_code=404)
