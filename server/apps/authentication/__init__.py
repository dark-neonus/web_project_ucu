# backend/apps/authentication/__init__.py

from fastapi import APIRouter

router = APIRouter()

from . import routes  # Import routes to register them with the router

def include_router(app):
    app.include_router(router, prefix="/auth", tags=["authentication"])