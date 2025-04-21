from fastapi import APIRouter, HTTPException, Depends, Header, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import Event
from .schemas import EventCreate, EventResponse, EventListResponse
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from uuid import UUID
from pathlib import Path
from server.apps.events.models import EventCategory
from server.apps.authentication.models import User
from server.core.security import get_current_user, OAuth2PasswordBearer
from typing import Optional, List
from datetime import datetime
import shutil
import os
import uuid

router = APIRouter()

# Set up Jinja2 templates
templates = Jinja2Templates(directory="src/pages")

# Define path for event images
UPLOAD_DIR = Path("static/uploads/events")
# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_class=HTMLResponse)
def events_page(
    request: Request,
    start: Optional[int] = None,
    end: Optional[int] = None,
    db: Session = Depends(get_db),
):
    # Query the database for all events, sorted by date_created
    db_events = db.query(Event).order_by(Event.date_created.desc()).all()

    # Apply slicing if start and end are valid
    try:
        if start is not None or end is not None:
            db_events = db_events[start:end]
    except (TypeError, ValueError):
        # If slicing fails due to invalid start/end, return all events
        pass

    # Convert database events to EventResponse objects which include author_username
    events = [EventResponse.from_orm(event, db) for event in db_events]

    # Render the template with the list of events
    return templates.TemplateResponse(
        "forum-events-page.html",
        {
            "request": request,
            "events": events,  # Now contains processed events with author_username
        },
    )

@router.get("/api", response_class=JSONResponse)
def get_events(
    request: Request,
    sort: Optional[str] = None,
    order: Optional[str] = "desc",
    status: Optional[str] = None,
    category: Optional[str] = None,  # Add category parameter
    db: Session = Depends(get_db),
):
    # Start with base query
    query = db.query(Event)
    
    # Apply filters
    if status:
        query = query.filter(Event.status == status)
    
    # Apply category filter if provided
    if category:
        query = query.filter(Event.category == category)
    
    # Apply sorting
    if sort == "date_created" or sort is None:
        if order == "desc":
            query = query.order_by(Event.date_created.desc())
        else:
            query = query.order_by(Event.date_created)
    elif sort == "votes":
        if order == "desc":
            query = query.order_by(Event.votes.desc())
        else:
            query = query.order_by(Event.votes)
    
    # Execute query
    db_events = query.all()
    
    # Convert to response models
    events = [EventResponse.from_orm(event, db) for event in db_events]
    
    return {"events": [event.dict() for event in events]}

@router.get("/create_event", response_class=HTMLResponse)
def create_event_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/create-event-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Create event page not found</h1>", status_code=404)

@router.post("/create_event", response_model=EventResponse)
async def create_event(
    title: str = Form(...),
    description: str = Form(...),
    date_scheduled: str = Form(...),
    category: str = Form(...),
    location: str = Form(...),
    author_id: str = Form(...),
    image_file: Optional[UploadFile] = File(None),
    image_caption: Optional[str] = Form(None),
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Ensure the author_id matches the current user
    if str(user.id) != author_id:
        raise HTTPException(status_code=403, detail="You are not authorized to create an event for this user")
    
    # Process the image if provided
    image_path = None
    if image_file and image_file.filename:
        # Validate file type
        allowed_extensions = [".jpg", ".jpeg", ".png", ".gif"]
        file_ext = os.path.splitext(image_file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Generate a unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / unique_filename
        
        # Save the file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(image_file.file, buffer)
            image_path = f"static/uploads/events/{unique_filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Could not upload file: {str(e)}")

    # Create the event data
    try:
        # Parse the date
        date_scheduled_obj = datetime.fromisoformat(date_scheduled)
        
        # Create a new event instance
        new_event = Event(
            title=title,
            description=description,
            date_scheduled=date_scheduled_obj,
            category=category,
            location=location,
            author_id=UUID(author_id),
            image_path=image_path,
            image_caption=image_caption,
        )

        # Add the new event to the database session
        db.add(new_event)
        db.commit()
        db.refresh(new_event)

        # Ensure date_created is accessed as a datetime object
        if not isinstance(new_event.date_created, str):
            new_event.date_created = new_event.date_created.isoformat()

        # Convert the event to the EventResponse model
        return EventResponse(
            id=new_event.id,
            title=new_event.title,
            description=new_event.description,
            date_created=new_event.date_created,
            location=new_event.location,
            date_scheduled=new_event.date_scheduled.isoformat() if isinstance(new_event.date_scheduled, datetime) else new_event.date_scheduled,
            category=new_event.category,
            author_id=new_event.author_id,
            author_username=user.first_name + (" " + user.last_name if user.last_name else ""),
            image_path=new_event.image_path,
            image_caption=new_event.image_caption,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid data format: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating event: {str(e)}")

@router.get("/view_event/{event_id}", response_class=HTMLResponse)
def view_event_page(event_id: str, request: Request, db: Session = Depends(get_db)):
    # Convert the event_id to UUID
    event_id = UUID(event_id)

    # Query the database for the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    # Convert the event to the EventResponse model
    event_data = EventResponse.from_orm(event, db)

    # Render the template with event data
    return templates.TemplateResponse(
        "event-view-page.html",  # Path to the Jinja2 template
        {
            "request": request,  # Required for Jinja2 templates
            "event": event_data.dict(),  # Pass the event data as a dictionary
        },
    )

@router.get("/categories", response_model=list[str])
def get_event_categories():
    return [category.value for category in EventCategory]

@router.get("/user_events/{user_id}", response_class=HTMLResponse)
def your_events_page(
    request: Request,
    user_id: str,
    start: Optional[int] = None,
    end: Optional[int] = None,
    db: Session = Depends(get_db)
):
    db_events = db.query(Event).filter(Event.author_id == UUID(user_id)).order_by(Event.date_created.desc()).all()

    if start is not None or end is not None:
        try:
            db_events = db_events[start:end]
        except (TypeError, ValueError):
            # Log the error and return all events if slicing fails
            print("Invalid slicing parameters, returning all events")

    # Convert database events to EventResponse objects which include author_username
    events = [EventResponse.from_orm(event, db) for event in db_events]
    return templates.TemplateResponse(
        "user-events-page.html",
        {
            "request": request,
            "events": events,
        },
    )

@router.get("/user_events_api/{user_id}", response_class=JSONResponse)
def get_user_events(
    request: Request,
    user_id: str,
    sort: Optional[str] = None,
    order: Optional[str] = "desc",
    status: Optional[str] = None,
    category: Optional[str] = None,  # Add category parameter 
    db: Session = Depends(get_db),
):
    # Parse the user_id
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        return {"events": []}
    
    # Start with base query filtered by user_id
    query = db.query(Event).filter(Event.author_id == user_uuid)
    
    # Apply additional filters
    if status:
        query = query.filter(Event.status == status)
    
    # Apply category filter if provided
    if category:
        query = query.filter(Event.category == category)
    
    # Apply sorting
    if sort == "date_created" or sort is None:
        if order == "desc":
            query = query.order_by(Event.date_created.desc())
        else:
            query = query.order_by(Event.date_created)
    elif sort == "votes":
        if order == "desc":
            query = query.order_by(Event.votes.desc())
        else:
            query = query.order_by(Event.votes)
    
    # Execute query
    db_events = query.all()
    
    # Convert to response models
    events = [EventResponse.from_orm(event, db) for event in db_events]
    
    return {"events": [event.dict() for event in events]}