from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Generator
from server.core.config import settings
from sqlalchemy.orm import Session
from server.apps.authentication.models import User

engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_db_and_tables():
    print("Creating database and tables...")
    SQLModel.metadata.create_all(bind=engine)

def drop_db_and_tables():
    SQLModel.metadata.drop_all(bind=engine)
    
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()