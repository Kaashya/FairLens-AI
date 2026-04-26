"""
analyze.py  (routes/analyze.py)
--------------------------------
The MAIN API ENDPOINT of FairLens.

This file defines what happens when the frontend sends a CSV file to analyze.
It:
  1. Receives the uploaded CSV file
  2. Hands it to bias_detection.py for analysis
  3. Hands results to gemini_service.py for plain-English explanation
  4. Saves everything to Firestore via firebase_service.py
  5. Returns everything to the frontend in one clean JSON response
"""

import io
import os

import pandas as pd
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

from ml.bias_detection import analyze_dataset
from ml.explainability import explain_dataset
from backend.app.services.gemini_service import explain_bias_with_gemini, chat_with_gemini
from backend.app.services.firebase_service import save_scan_to_firestore, get_scan_history, get_scan_by_id

router = APIRouter()


# ─────────────────────────────────────────────
# REQUEST / RESPONSE MODELS
# ─────────────────────────────────────────────

class ChatRequest(BaseModel):
    """What the chatbot endpoint receives"""
    question: str
    context: Optional[dict] = None  # Optional: last scan results for context


# ─────────────────────────────────────────────
# DEMO DATASETS
# Pre-loaded examples so judges can test without uploading a file
# ─────────────────────────────────────────────

DEMO_DATASETS = {
    "hiring": pd.DataFrame({
        "gender":       ["Male","Female","Male","Female","Male","Female","Male","Female","Male","Female",
                         "Male","Female","Male","Female","Male","Female","Male","Female","Male","Female"],
        "age":          [25,30,35,28,42,38,29,33,45,27,31,36,40,24,29,34,47,26,38,30],
        "experience":   [2,4,8,3,15,10,4,7,18,2,5,9,14,1,4,8,20,3,12,5],
        "education":    ["Bachelor","Bachelor","Master","Bachelor","PhD","Master","Bachelor","Master","PhD","Bachelor",
                         "Master","Bachelor","PhD","Bachelor","Master","Bachelor","PhD","Bachelor","Master","Bachelor"],
        "hired":        [1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    }),
    "loan": pd.DataFrame({
        "race":         ["White","Black","White","Hispanic","White","Black","White","Asian","White","Black",
                         "White","Hispanic","White","Black","White","Asian","White","Black","White","Hispanic"],
        "gender":       ["Male","Female","Male","Male","Female","Female","Male","Male","Female","Male",
                         "Male","Female","Male","Male","Female","Female","Male","Male","Female","Male"],
        "income":       [75000,42000,95000,51000,88000,39000,62000,105000,48000,35000,
                         82000,55000,70000,38000,92000,115000,58000,41000,78000,47000],
        "loan_amount":  [200000,150000,350000,180000,300000,120000,220000,400000,160000,130000,
                         280000,190000,240000,140000,320000,450000,210000,145000,260000,170000],
        "loan_approved":[1,0,1,0,1,0,1,1,0,0,1,0,1,0,1,1,0,0,1,0],
    }),
    "medical": pd.DataFrame({
        "gender":       ["Male","Female","Male","Female","Male","Female","Male","Female","Male","Female",
                         "Male","Female","Male","Female","Male","Female","Male","Female","Male","Female"],
        "age":          [45,38,62,55,30,70,48,25,58,42,35,65,52,29,61,44,37,68,50,33],
        "insurance":    ["Private","Public","Private","None","Private","Public","None","Private","Public","Private",
                         "Private","None","Public","Private","None","Private","Public","Private","None","Public"],
        "treatment_approved":[1,0,1,0,1,0,0,1,0,1,1,0,0,1,0,1,0,1,0,1],
    }),
}


# ─────────────────────────────────────────────
# ROUTE 1: POST /api/analyze
# Upload a CSV file and get a full bias report
# ─────────────────────────────────────────────

@router.post("/analyze")
async def analyze_csv(
    file: UploadFile = File(...),
    outcome_col: Optional[str] = Form(None),
    protected_cols: Optional[str] = Form(None),  # comma-separated string
):
    """
    Main endpoint: receives a CSV file, runs full bias analysis.

    How to call it (from frontend):
        POST /api/analyze
        Content-Type: multipart/form-data
        Body:
            file: <the CSV file>
            outcome_col: "loan_approved"      (optional)
            protected_cols: "gender,race,age" (optional, comma-separated)

    Returns:
        Full bias report JSON
    """
    # ── Validate file type ──
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    # ── Read the CSV ──
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read CSV file: {str(e)}")

    if df.empty or len(df.columns) < 2:
        raise HTTPException(status_code=400, detail="CSV must have at least 2 columns and some data rows.")

    # ── Parse protected_cols if provided ──
    protected_list = None
    if protected_cols:
        protected_list = [c.strip() for c in protected_cols.split(",") if c.strip()]

    # ── Run bias detection ──
    try:
        analysis = analyze_dataset(df, outcome_col=outcome_col, protected_cols=protected_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bias analysis failed: {str(e)}")

    # ── Run SHAP explainability ──
    try:
        detected_outcome = analysis.get("outcome_column", outcome_col or df.columns[-1])
        explanation_data = explain_dataset(df, detected_outcome)
    except Exception:
        explanation_data = {"top_features": [], "all_importances": {}, "error": "SHAP analysis failed"}

    # ── Get Gemini AI explanation ──
    ai_explanation = explain_bias_with_gemini(analysis, dataset_name=file.filename)

    # ── Save to Firestore ──
    doc_id = save_scan_to_firestore(analysis, dataset_name=file.filename)

    # ── Build final response ──
    response = {
        **analysis,                        # All bias metrics
        "explainability": explanation_data, # SHAP importances
        "ai_explanation": ai_explanation,  # Gemini plain-English explanation
        "scan_id": doc_id,                 # Firestore document ID (for history)
        "dataset_name": file.filename,
    }

    return JSONResponse(content=response)


# ─────────────────────────────────────────────
# ROUTE 2: GET /api/demo/{dataset_name}
# Try a pre-loaded demo dataset without uploading anything
# ─────────────────────────────────────────────

@router.get("/demo/{dataset_name}")
async def analyze_demo(dataset_name: str):
    """
    Run bias analysis on one of the built-in demo datasets.

    Available demo datasets:
        GET /api/demo/hiring
        GET /api/demo/loan
        GET /api/demo/medical
    """
    if dataset_name not in DEMO_DATASETS:
        raise HTTPException(
            status_code=404,
            detail=f"Demo dataset '{dataset_name}' not found. Choose from: {list(DEMO_DATASETS.keys())}"
        )

    df = DEMO_DATASETS[dataset_name]

    # Run the full pipeline
    analysis = analyze_dataset(df)
    detected_outcome = analysis.get("outcome_column", df.columns[-1])
    explanation_data = explain_dataset(df, detected_outcome)
    ai_explanation = explain_bias_with_gemini(analysis, dataset_name=f"{dataset_name} (demo)")
    doc_id = save_scan_to_firestore(analysis, dataset_name=f"{dataset_name}_demo.csv")

    return JSONResponse(content={
        **analysis,
        "explainability": explanation_data,
        "ai_explanation": ai_explanation,
        "scan_id": doc_id,
        "dataset_name": f"{dataset_name}_demo.csv",
        "is_demo": True,
    })


# ─────────────────────────────────────────────
# ROUTE 3: POST /api/chat
# Ask the AI chatbot a question about bias/fairness
# ─────────────────────────────────────────────

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Chatbot endpoint: ask FairLens AI any question about bias or fairness.

    Body:
    {
        "question": "Why is gender bias harmful in hiring?",
        "context": { ...last scan results... }  // optional
    }
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    answer = chat_with_gemini(
        user_question=request.question,
        context=request.context
    )

    return {"answer": answer, "question": request.question}


# ─────────────────────────────────────────────
# ROUTE 4: GET /api/history
# Get list of past scans from Firestore
# ─────────────────────────────────────────────

@router.get("/history")
async def get_history(limit: int = 20):
    """
    Returns past bias scan results from Firestore.

    Query params:
        limit: how many records to return (default: 20)
    """
    history = get_scan_history(limit=limit)
    return {"scans": history, "count": len(history)}


# ─────────────────────────────────────────────
# ROUTE 5: GET /api/history/{scan_id}
# Get one specific past scan by ID
# ─────────────────────────────────────────────

@router.get("/history/{scan_id}")
async def get_scan(scan_id: str):
    """
    Returns a single past scan by its Firestore document ID.
    Used when user clicks on a history item to re-view it.
    """
    scan = get_scan_by_id(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail=f"Scan '{scan_id}' not found.")
    return scan


# ─────────────────────────────────────────────
# ROUTE 6: GET /api/datasets
# List available demo dataset names
# ─────────────────────────────────────────────

@router.get("/datasets")
async def list_demo_datasets():
    """Returns the names of all available demo datasets."""
    return {
        "demo_datasets": list(DEMO_DATASETS.keys()),
        "descriptions": {
            "hiring": "Company hiring decisions — check for gender/age discrimination",
            "loan": "Bank loan approvals — check for racial/gender bias",
            "medical": "Medical treatment approvals — check for gender/insurance bias",
        }
    }