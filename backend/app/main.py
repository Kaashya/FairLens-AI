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

app = FastAPI(title="FairLens API")

@app.get("/")
def root():
    return {"message": "FairLens API running"}