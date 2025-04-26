from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from server.apps.authentication.routes import router as auth_router
from server.apps.events.routes import router as events_router
from server.apps.forum.routes import router as forum_router
from server.core.database import engine  # Import your database engine
from sqlmodel import SQLModel  # Import SQLModel for table creation
from pathlib import Path
from server.core.database import create_db_and_tables, drop_db_and_tables
from server.core.fill_database import fill_db
from sqlalchemy.sql import text 
from sqlalchemy import inspect  # Import the inspector to check for tables
from server.apps.events.routes import configure_app_with_schedulers
from apscheduler.schedulers.background import BackgroundScheduler
from server.apps.authentication.email.send_email import send_event_reminder_emails
import atexit
import logging
import apscheduler.events  # Import apscheduler events to resolve undefined variable

def lifespan(app: FastAPI):
    # Startup logic
    print("Checking if the database exists...")
    try:
        # Use SQLAlchemy's inspector to check for existing tables
        with engine.connect() as connection:
            inspector = inspect(connection)
            tables = inspector.get_table_names()  # Get a list of all tables in the database
            if tables:
                print("Database exists and has tables.")
            else:
                print("Database exists but has no tables. Dropping and recreating...")
                drop_db_and_tables()  # Drop all tables
                create_db_and_tables()  # Recreate the database and tables
                print("Database recreated successfully.")
                fill_db()  # Fill the database with initial data
    except Exception as e:
        print(f"Error accessing the database: {e}")
        print("Dropping and recreating the database...")
        drop_db_and_tables()  # Drop all tables
        create_db_and_tables()  # Recreate the database and tables
        print("Database recreated successfully.")
        fill_db()  # Fill the database with initial data

    yield  # This marks the end of the startup phase and the beginning of the shutdown phase
    # Shutdown logic (if needed)

logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.DEBUG)

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this as needed for your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the static files directory
app.mount("/src", StaticFiles(directory="src"), name="static")
app.mount("/static", StaticFiles(directory="static"), name="static")

app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(events_router, prefix="/events", tags=["events"])
app.include_router(forum_router, prefix="/forum", tags=["forum"])
app = configure_app_with_schedulers(app)

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to the FastAPI backend!"}

@app.get("/", response_class=HTMLResponse)
def home_page():
    # Path to the registration HTML file
    html_file_path = Path(__file__).parent.parent / "src/pages/home-page.html"

    # Read the HTML file content
    if html_file_path.exists():
        html_content = html_file_path.read_text(encoding="utf-8")
        return HTMLResponse(content=html_content)
    else:
        return HTMLResponse(content="<h1>Home page not found</h1>", status_code=404)

@app.on_event("startup")
def init_scheduler():
    scheduler = BackgroundScheduler()
    # Run daily at 8:00 AM
    scheduler.add_job(
        send_event_reminder_emails, 
        'cron', 
        hour=8, 
        minute=0,
        id='event_reminder_email_job',
        name='Daily Event Reminder Emails',
        misfire_grace_time=60*60  # Allow the job to be an hour late if server was down
    )
    
    # Add a logger to track when jobs are run
    scheduler.add_listener(
        lambda event: logging.info(f"Job {event.job_id} executed successfully"),
        mask=apscheduler.events.EVENT_JOB_EXECUTED
    )
    
    # Add a logger for job failures
    scheduler.add_listener(
        lambda event: logging.error(f"Job {event.job_id} failed with exception: {event.exception}"),
        mask=apscheduler.events.EVENT_JOB_ERROR
    )
    
    scheduler.start()
    logging.info("Scheduler started - Event reminder emails will be sent daily at 8:00 AM")
    
    # Shut down the scheduler when app exits
    atexit.register(lambda: scheduler.shutdown())