from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from server.core.database import get_db
from .models import Event
from .schemas import EventCreate, EventResponse
from fastapi.responses import HTMLResponse, RedirectResponse
from pathlib import Path

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


@router.get("/view_event/{event_id}", response_class=HTMLResponse)
def view_event_page(event_id: int, db: Session = Depends(get_db)):
    # event = db.query(Event).filter(Event.id == event_id).first()
    # if event is None:
    #     raise HTTPException(status_code=404, detail="Event not found")
    # return event
    html_file_path = Path(__file__).parent.parent.parent.parent / "src/pages/event-view-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>View event page not found</h1>", status_code=404)
