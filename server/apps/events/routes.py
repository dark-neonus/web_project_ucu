from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import Event
from .schemas import EventCreate, EventResponse
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from uuid import UUID
from pathlib import Path
from server.apps.events.models import EventCategory
from server.apps.authentication.models import User
from server.core.security import get_current_user,OAuth2PasswordBearer
from typing import Optional
from datetime import datetime

router = APIRouter()

# Set up Jinja2 templates
templates = Jinja2Templates(directory="src/pages")


# @router.get("/events/", response_model=list[EventResponse])
# def list_events(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
#     events = db.query(Event).offset(skip).limit(limit).all()
#     return events

@router.get("/", response_class=HTMLResponse)
def events_page(
    request: Request,
    start: Optional[int] = None,
    end: Optional[int] = None,
    db: Session = Depends(get_db),
):
    # Query the database for all events, sorted by date_created
    db_events = db.query(Event).order_by(Event.date_created).all()

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
def create_event(event: EventCreate, token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")), db: Session = Depends(get_db)):
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Ensure the author_id matches the current user
    if str(user.id) != str(event.author_id):
        raise HTTPException(status_code=403, detail="You are not authorized to create an event for this user")

    # Create a new event instance
    new_event = Event(
        title=event.title,
        description=event.description,
        date_scheduled=event.date_scheduled,
        category=event.category.value if isinstance(event.category, EventCategory) else event.category,
        location=event.location,
        author_id=event.author_id,
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
        date_created=new_event.date_created,  # Already converted to string
        location=new_event.location,
        date_scheduled=new_event.date_scheduled.isoformat() if isinstance(new_event.date_scheduled, datetime) else None,
        category=new_event.category,
        author_id=new_event.author_id,
        author_username=user.first_name + (" " + user.last_name if user.last_name else ""),
    )

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
