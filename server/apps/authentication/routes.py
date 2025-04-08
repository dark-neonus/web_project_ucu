from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import User
from .schemas import UserCreate, UserResponse, UserLogin
from server.core.security import hash_password, verify_password
from datetime import timedelta
from pathlib import Path
from server.core.security import create_access_token
from server.core.security import get_current_user
from server.apps.authentication.models import User
from server.core.database import get_db
from fastapi import Request
from fastapi.templating import Jinja2Templates
from uuid import UUID

router = APIRouter()

templates = Jinja2Templates(directory="src/pages")

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        hashed_password=hashed_password
        )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/register", response_class=HTMLResponse)
def register_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/registration-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Registration page not found</h1>", status_code=404)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

@router.post("/login", response_model=dict)
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    # Generate JWT token
    access_token_expires = timedelta(minutes=30)  # Token expiration time
    access_token = create_access_token(
        data={"sub": db_user.email}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/login", response_class=HTMLResponse)
def login_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/login-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Login page not found</h1>", status_code=404)

@router.get("/get_user_id", response_model=dict)
def get_user_id(token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")), db: Session = Depends(get_db)):
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Return the user's ID
    return {"user_id": str(user.id)}


@router.get("/profile/{user_id}", response_class=HTMLResponse)
def view_profile_page(user_id: str, request: Request, db: Session = Depends(get_db)):
    # Convert the user_id to UUID
    user_id = UUID(user_id)

    # Query the database for the event
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert the event to the EventResponse model
    event_data = UserResponse(
        id=str(user.id),
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
    )

    # Render the template with event data
    return templates.TemplateResponse(
        "user-profile-page.html",  # Path to the Jinja2 template
        {
            "request": request,  # Required for Jinja2 templates
            "event": event_data.dict(),  # Pass the event data as a dictionary
        },
    )

