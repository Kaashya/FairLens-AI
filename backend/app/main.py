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
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routes.bias import router as bias_router


# ─────────────────────────────────────────────
# Create the FastAPI app
# ─────────────────────────────────────────────

app = FastAPI(
    title="FairLens API",
    description=(
        "FairLens — Detect and explain bias in AI datasets and models. "
        "Upload a CSV file to get a full fairness audit powered by Fairlearn, SHAP, and Gemini AI."
    ),
    version="1.0.0",
    docs_url="/docs",       # Interactive docs at http://localhost:8000/docs
    redoc_url="/redoc",     # Alternative docs at http://localhost:8000/redoc
)


# ─────────────────────────────────────────────
# CORS — Allow the React frontend to call this API
# Without this, the browser will BLOCK all requests from the frontend
# ─────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server (your partner's frontend)
        "http://localhost:3000",   # Alternative React port
        "https://*.web.app",       # Firebase hosting URLs
        "https://*.firebaseapp.com",
        "*",                       # Allow all in development (tighten in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],           # Allow GET, POST, PUT, DELETE etc.
    allow_headers=["*"],           # Allow all headers
)


# ─────────────────────────────────────────────
# Register API Routes
# All bias-related endpoints live under /api prefix
# ─────────────────────────────────────────────

app.include_router(bias_router, prefix="/api", tags=["Bias Analysis"])


# ─────────────────────────────────────────────
# Root + Health Check Endpoints
# ─────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """Root endpoint — confirms the server is running."""
    return {
        "message": "🔍 FairLens API is running!",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "analyze_csv":    "POST /api/analyze",
            "demo_datasets":  "GET  /api/demo/{hiring|loan|medical}",
            "list_demos":     "GET  /api/datasets",
            "chat":           "POST /api/chat",
            "scan_history":   "GET  /api/history",
            "single_scan":    "GET  /api/history/{scan_id}",
        }
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Health check — used by deployment services to verify the app is alive."""
    return {"status": "ok", "service": "FairLens API"}