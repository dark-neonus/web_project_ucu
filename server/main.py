from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from server.apps.authentication.routes import router as auth_router
from server.apps.events.routes import router as events_router
from server.apps.forum.routes import router as forum_router
from server.core.database import engine  # Import your database engine
from sqlmodel import SQLModel  # Import SQLModel for table creation

def lifespan(app: FastAPI):
    # Startup logic
    SQLModel.metadata.create_all(engine)
    yield  # This marks the end of the startup phase and the beginning of the shutdown phase
    # Shutdown logic (if needed)

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

app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(events_router, prefix="/events", tags=["events"])
app.include_router(forum_router, prefix="/forum", tags=["forum"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the FastAPI backend!"}