from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import Event
from .schemas import EventCreate, EventResponse
from fastapi.responses import HTMLResponse, JSONResponse
from uuid import UUID
from pathlib import Path
import json

router = APIRouter()


# @router.get("/events/", response_model=list[EventResponse])
# def list_events(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
#     events = db.query(Event).offset(skip).limit(limit).all()
#     return events

@router.get("/", response_class=HTMLResponse)
def events_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/forum-events-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Events page not found</h1>", status_code=404)

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

@router.post("/create_event", response_model=EventCreate)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    # Create a new event instance
    new_event = Event(
        title=event.title,
        description=event.description,
        date_scheduled=event.date_scheduled,
        category=event.category,
        author_id=event.author_id,
    )

    # Add the new event to the database session
    db.add(new_event)
    db.commit()
    db.refresh(new_event)

    return new_event

@router.get("/view_event/{event_id}", response_class=HTMLResponse)
def view_event_page(event_id: str, db: Session = Depends(get_db)):
    # Convert the event_id to UUID
    event_id = UUID(event_id)

    # Query the database for the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    # Convert the event to the EventResponse model
    event_data = EventResponse(
        title=event.title,
        description=event.description,
        date_created=str(event.date_created),
        location=event.location,
        date_scheduled=str(event.date_sheduled),
        category=str(event.category),
        # author_id=event.author_id,
    )

    # Path to the event-view-page.html file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/event-view-page.html"

    # Read the HTML file content
    if not html_file_path.exists():
        raise HTTPException(status_code=404, detail="Event view page not found")
    html_content = html_file_path.read_text(encoding="utf-8")

    # Embed the event data as a JSON object in a <script> tag
    event_data_json = json.dumps(event_data.dict())
    embedded_script = f'<script>const eventData = {event_data_json};</script>'

    # Inject the script into the HTML before the closing </body> tag
    html_with_data = html_content.replace("</body>", f"{embedded_script}</body>")

    return HTMLResponse(content=html_with_data)

