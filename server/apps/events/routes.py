from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import Event
from .schemas import EventCreate, EventResponse
from fastapi.responses import HTMLResponse
from pathlib import Path

router = APIRouter()

@router.post("/events/", response_model=EventResponse)
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    db_event = Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.get("/events/{event_id}", response_model=EventResponse)
def read_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.get("/events/", response_model=list[EventResponse])
def list_events(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    events = db.query(Event).offset(skip).limit(limit).all()
    return events

@router.get("/events", response_class=HTMLResponse)
def events_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/forum-page.html"
    # html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/forum-page.html?content=events"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Registration page not found</h1>", status_code=404)
