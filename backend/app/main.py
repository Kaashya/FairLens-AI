"""
main.py
-------
The ENTRY POINT of the FairLens backend.

This is the file you run to start the server.
It:
  - Creates the FastAPI app
  - Enables CORS (so the React frontend can talk to the backend)
  - Registers all the API routes
  - Provides a health check endpoint

HOW TO RUN:
    cd backend
    uvicorn app.main:app --reload --port 8000

Then open: http://localhost:8000/docs  ← interactive API documentation!
"""

import sys
import os

# Add the project root (FairLens-AI) to sys.path
# This file is at backend/app/main.py, so root is two levels up from backend/
# or three levels up from backend/app/
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from dotenv import load_dotenv
load_dotenv()  # Automatically loads variables from .env file

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.routes import bias

app = FastAPI(title="FairLens API")
app.include_router(bias.router)

frontend_dist = os.path.join(project_root, "frontend", "dist")

if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "FairLens API running (Frontend not built)"}