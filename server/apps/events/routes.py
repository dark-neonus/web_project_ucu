from fastapi import APIRouter, HTTPException, Depends, Header, Request, File, UploadFile, Form, BackgroundTasks, FastAPI
from sqlalchemy.orm import Session
from sqlalchemy import or_
from server.core.database import get_db
from .models import Event, EventVote, EventRegistration, EventComment, CommentUpdate
from .schemas import EventCreate, EventResponse, EventListResponse, EventStatus, EventVoteResponse, EventRegistrationCreate, EventRegistrationResponse, EventRegistrationListResponse, EventCommentCreate, EventCommentResponse, EventCommentListResponse
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from uuid import UUID
from pathlib import Path
from server.apps.events.models import EventCategory
from server.apps.authentication.models import User
from server.core.security import get_current_user, OAuth2PasswordBearer
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import shutil
import os
import uuid
from server.apps.authentication.email.send_email import send_email

router = APIRouter()

# Set up Jinja2 templates
templates = Jinja2Templates(directory="src/pages")

# Define path for event images
UPLOAD_DIR = Path("static/uploads/events")
# Ensure the upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def update_event_statuses(db: Session):
    """
    Update event statuses based on their scheduled date.
    Events with a past date_scheduled will be marked as 'closed'.
    """
    now = datetime.now(timezone.utc)
    
    # Find all events with status 'open' and a scheduled date in the past
    events_to_update = (
        db.query(Event)
        .filter(
            Event.status == EventStatus.OPEN.value,
            Event.date_scheduled < now
        )
        .all()
    )
    
    # Update the status of these events to 'closed'
    for event in events_to_update:
        event.status = EventStatus.CLOSED.value
    
    # Commit the changes to the database
    if events_to_update:
        db.commit()
        print(f"Updated {len(events_to_update)} events to 'closed' status")
    
    return len(events_to_update)

# Create a background task to run the status update function periodically
def schedule_status_updates(app: FastAPI):
    """
    Schedule periodic updates of event statuses.
    
    Parameters:
    - app: The FastAPI application instance
    """
    scheduler = BackgroundScheduler()
    
    def task():
        # Correctly get a database session without using a context manager
        db = next(get_db())
        try:
            update_event_statuses(db)
        finally:
            db.close()  # Make sure to close the session when done
    
    # Run the task every 30 seconds (for testing, you can change it to hours in production)
    scheduler.add_job(
        task,
        IntervalTrigger(hours=1),  # Changed from hours=1 to seconds=30 for testing
        id="update_event_statuses",
        name="Update event statuses",
        replace_existing=True,
    )
    
    # Start the scheduler
    scheduler.start()
    
    # Add the scheduler to the app state to keep a reference
    app.state.scheduler = scheduler

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
    category: Optional[str] = None,
    search: Optional[str] = None,  # Search parameter for title, description, location, or author name
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
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        # Join with User table for author name search
        query = query.join(User, Event.author_id == User.id).filter(
            or_(
                Event.title.ilike(search_term),
                Event.description.ilike(search_term),
                Event.location.ilike(search_term),
                User.first_name.ilike(search_term),
                User.last_name.ilike(search_term),
                # Concatenate first_name and last_name for full name search
                (User.first_name + ' ' + User.last_name).ilike(search_term)
            )
        )
    
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
    try:
        event_id = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID format")

    # Query the database for the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    # Convert the event to the EventResponse model
    event_data = EventResponse.from_orm(event, db)
    
    # Get comment count
    comment_count = db.query(EventComment).filter(EventComment.event_id == event_id).count()
    
    # Get vote count
    vote_count = db.query(EventVote).filter(EventVote.event_id == event_id).count()

    # Add these counts to the event data
    event_dict = event_data.dict()
    event_dict["comment_count"] = comment_count
    event_dict["vote_count"] = vote_count

    # Render the template with event data
    return templates.TemplateResponse(
        "event-view-page.html",  # Path to the Jinja2 template
        {
            "request": request,  # Required for Jinja2 templates
            "event": event_dict,  # Pass the event data with comment and vote counts
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
    category: Optional[str] = None,
    search: Optional[str] = None,  # Add search parameter
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
    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Event.title.ilike(search_term),
                Event.description.ilike(search_term),
                Event.location.ilike(search_term)
            )
        )
    
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

def configure_app_with_schedulers(app: FastAPI):
    # Start the event status update scheduler
    schedule_status_updates(app)
    
    # Return the configured app
    return app

# Add this to existing router in routes.py file
@router.post("/vote/{event_id}", response_model=EventVoteResponse)
async def vote_for_event(
    event_id: str,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Vote for an event. Each user can only vote once per event.
    Returns the updated vote count and whether the user has voted.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if the user has already voted for this event
    existing_vote = db.query(EventVote).filter(
        EventVote.event_id == event_uuid,
        EventVote.user_id == user.id
    ).first()
    
    if existing_vote:
        # User has already voted
        return EventVoteResponse(
            event_id=event_id,
            vote_count=event.votes,
            has_voted=True
        )
    
    # Create a new vote record
    new_vote = EventVote(
        event_id=event_uuid,
        user_id=user.id
    )
    
    # Increment the event's vote count
    event.votes += 1
    
    # Add the new vote to the database and commit changes
    db.add(new_vote)
    db.commit()
    
    return EventVoteResponse(
        event_id=event_id,
        vote_count=event.votes,
        has_voted=True
    )

@router.get("/vote/{event_id}/status", response_model=EventVoteResponse)
async def check_vote_status(
    event_id: str,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Check if the current user has voted for a specific event.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if the user has already voted for this event
    existing_vote = db.query(EventVote).filter(
        EventVote.event_id == event_uuid,
        EventVote.user_id == user.id
    ).first()
    
    return EventVoteResponse(
        event_id=event_id,
        vote_count=event.votes,
        has_voted=existing_vote is not None
    )

@router.delete("/vote/{event_id}", response_model=EventVoteResponse)
async def remove_vote_from_event(
    event_id: str,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Remove a user's vote from an event.
    Returns the updated vote count and vote status.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if the user has already voted for this event
    existing_vote = db.query(EventVote).filter(
        EventVote.event_id == event_uuid,
        EventVote.user_id == user.id
    ).first()
    
    if not existing_vote:
        # User hasn't voted, nothing to remove
        return EventVoteResponse(
            event_id=event_id,
            vote_count=event.votes,
            has_voted=False
        )
    
    # Delete the vote record
    db.delete(existing_vote)
    
    # Decrement the event's vote count
    if event.votes > 0:
        event.votes -= 1
    
    # Commit changes
    db.commit()
    
    return EventVoteResponse(
        event_id=event_id,
        vote_count=event.votes,
        has_voted=False
    )

@router.post("/register/{event_id}", response_model=EventRegistrationResponse)
async def register_for_event(
    event_id: str,
    background_tasks: BackgroundTasks,
    notes: Optional[str] = None,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Register the current user for an event.
    Returns the registration details.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if the event is open for registration
    if event.status != EventStatus.OPEN.value:
        raise HTTPException(status_code=400, detail="Event is not open for registration")
    
    # Check if user is already registered for this event
    existing_registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_uuid,
        EventRegistration.user_id == user.id
    ).first()
    
    if existing_registration:
        raise HTTPException(status_code=400, detail="You are already registered for this event")
    
    # Create a new registration
    new_registration = EventRegistration(
        event_id=event_uuid,
        user_id=user.id,
        notes=notes
    )
    
    try:
        # Add the registration to the database
        db.add(new_registration)
        db.commit()
        db.refresh(new_registration)
        
        # Schedule the email notification in the background
        if user.email:
            email_subject = f"Registration Confirmation: {event.title}"
            email_body = f"""
            Hi {user.first_name},
            
            Thank you for registering for the event: {event.title}
            
            Date: {event.date_scheduled.strftime('%Y-%m-%d %H:%M') if event.date_scheduled else 'To be announced'}
            Location: {event.location}
            
            We look forward to seeing you there!
            
            Best regards,
            The Community Events Team
            Tribuna
            """
            background_tasks.add_task(
                send_email, 
                recipient_email=user.email,
                subject=email_subject,
                body=email_body
            )
        
        # Return the registration data
        return EventRegistrationResponse.from_orm(new_registration, db)
    
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="You are already registered for this event")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error registering for event: {str(e)}")

@router.delete("/register/{event_id}", response_model=dict)
async def cancel_event_registration(
    event_id: str,
    background_tasks: BackgroundTasks,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Cancel a user's registration for an event.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Find the registration
    registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_uuid,
        EventRegistration.user_id == user.id
    ).first()
    
    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")
    
    # Get the event for the notification
    event = db.query(Event).filter(Event.id == event_uuid).first()
    
    # Delete the registration
    db.delete(registration)
    db.commit()
    
    # Send cancellation notification
    if user.email and event:
        email_subject = f"Registration Cancelled: {event.title}"
        email_body = f"""
        Hi {user.first_name},
        
        Your registration for the event: {event.title} has been cancelled.
        
        If this was unintentional, please register again.
        
        Best regards,
        The Community Events Team
        """
        background_tasks.add_task(
            send_email, 
            recipient_email=user.email,
            subject=email_subject,
            body=email_body
        )
    
    return {"message": "Registration cancelled successfully"}

@router.get("/register/{event_id}/status", response_model=dict)
async def check_registration_status(
    event_id: str,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Check if the current user is registered for a specific event.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Check if the user is registered for this event
    registration = db.query(EventRegistration).filter(
        EventRegistration.event_id == event_uuid,
        EventRegistration.user_id == user.id
    ).first()
    
    return {
        "event_id": event_id,
        "is_registered": registration is not None,
        "registration_id": str(registration.id) if registration else None,
        "registration_time": registration.registration_time.isoformat() if registration else None,
        "attendance_status": registration.attendance_status if registration else None
    }

@router.get("/user_registrations", response_model=EventRegistrationListResponse)
async def get_user_registrations(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get all events the current user is registered for.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Query for registrations
    query = db.query(EventRegistration).filter(EventRegistration.user_id == user.id)
    
    # Apply status filter if provided
    if status:
        query = query.filter(EventRegistration.attendance_status == status)
    
    # Execute query
    registrations = query.all()
    
    # Convert to response models
    registration_responses = [EventRegistrationResponse.from_orm(reg, db) for reg in registrations]
    
    return EventRegistrationListResponse(registrations=registration_responses)

@router.get("/event_registrations/{event_id}", response_model=EventRegistrationListResponse)
async def get_event_registrations(
    event_id: str,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Get all users registered for a specific event.
    Only the event author or administrators can access this.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Get the event
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if the user is authorized (event author or admin)
    if str(user.id) != str(event.author_id) and not user.is_admin:
        raise HTTPException(status_code=403, detail="You are not authorized to view this information")
    
    # Get all registrations for this event
    registrations = db.query(EventRegistration).filter(EventRegistration.event_id == event_uuid).all()
    
    # Convert to response models
    registration_responses = [EventRegistrationResponse.from_orm(reg, db) for reg in registrations]
    
    return EventRegistrationListResponse(registrations=registration_responses)

@router.post("/{event_id}/comments", response_model=EventCommentResponse)
async def create_comment(
    event_id: str,
    comment_data: EventCommentCreate,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Create a new comment for an event.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Create new comment
    new_comment = EventComment(
        event_id=event_uuid,
        user_id=user.id,
        content=comment_data.content,
        parent_comment_id=comment_data.parent_comment_id
    )
    
    db.add(new_comment)
    
    # Increment comments count on the event
    event.comments_count += 1
    
    db.commit()
    db.refresh(new_comment)
    
    return EventCommentResponse.from_orm(new_comment, db)

@router.get("/{event_id}/comments", response_model=EventCommentListResponse)
async def get_event_comments(
    event_id: str,
    db: Session = Depends(get_db)
):
    """
    Get all comments for a specific event.
    """
    try:
        # Convert the event_id to UUID
        event_uuid = UUID(event_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid event ID")
    
    # Check if the event exists
    event = db.query(Event).filter(Event.id == event_uuid).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get all non-deleted comments for this event
    comments = db.query(EventComment).filter(
        EventComment.event_id == event_uuid,
        EventComment.is_deleted == False
    ).order_by(EventComment.date_created.asc()).all()
    
    # Convert to response models
    comment_responses = [EventCommentResponse.from_orm(comment, db) for comment in comments]
    
    return EventCommentListResponse(comments=comment_responses)

# Fixed to use a Pydantic model for the update request
@router.put("/comments/{comment_id}", response_model=EventCommentResponse)
async def update_comment(
    comment_id: str,
    comment_data: CommentUpdate,  # Using a Pydantic model instead of raw string
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Update an existing comment.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the comment_id to UUID
        comment_uuid = UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid comment ID")
    
    # Get the comment
    comment = db.query(EventComment).filter(
        EventComment.id == comment_uuid,
        EventComment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if the user is the author of the comment
    if str(comment.user_id) != str(user.id) and not user.is_admin:
        raise HTTPException(status_code=403, detail="You can only update your own comments")
    
    # Update the comment
    comment.content = comment_data.content
    comment.date_updated = datetime.now(timezone.utc)
    
    # Commit changes
    db.commit()
    db.refresh(comment)
    
    # Return updated comment
    return EventCommentResponse.from_orm(comment, db)

@router.delete("/comments/{comment_id}", response_model=dict)
async def delete_comment(
    comment_id: str,
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="auth/login")),
    db: Session = Depends(get_db)
):
    """
    Soft delete a comment.
    """
    # Validate the token and get the current user
    user = get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    try:
        # Convert the comment_id to UUID
        comment_uuid = UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid comment ID")
    
    # Get the comment
    comment = db.query(EventComment).filter(
        EventComment.id == comment_uuid,
        EventComment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if the user is the author of the comment or an admin
    if str(comment.user_id) != str(user.id) and not user.is_admin:
        raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    # Get the associated event
    event = db.query(Event).filter(Event.id == comment.event_id).first()
    
    # Soft delete the comment
    comment.is_deleted = True
    # Don't change the content when deleted, just mark as deleted
    # This preserves the content if undeleting is needed in the future
    
    # Decrement the comments count if the event exists
    if event and event.comments_count > 0:
        event.comments_count -= 1
    
    # Commit changes
    db.commit()
    
    return {"message": "Comment deleted successfully"}

def migrate_comments_count(db: Session):
    """Update comments count for all events based on existing comments."""
    events = db.query(Event).all()
    
    for event in events:
        # Count non-deleted comments for this event
        comment_count = db.query(EventComment).filter(
            EventComment.event_id == event.id,
            EventComment.is_deleted == False
        ).count()
        
        # Update the event with the correct count
        event.comments_count = comment_count
    
    db.commit()
    print(f"Updated comments count for {len(events)} events")