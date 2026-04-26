from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import os

# Import the services and ml module
from app.services import gemini_service
import sys

# We add the root path to make sure ml module is discoverable
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml import bias_detection

router = APIRouter(prefix="/api")

class AnalyzeRequest(BaseModel):
    targetColumn: Optional[str] = None
    protectedAttributes: Optional[List[str]] = None

@router.post("/analyze")
def analyze(req: AnalyzeRequest):
    # Load dummy CSV for merge test
    csv_path = os.path.join(project_root, "frontend", "dummy.csv")
    
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        # Fallback dummy data
        data = {
            "id": [1, 2, 3, 4],
            "gender": ["Male", "Female", "Male", "Female"],
            "age": [35, 28, 42, 30],
            "race": ["White", "Black", "Asian", "Hispanic"],
            "loan_approved": [1, 0, 1, 1]
        }
        df = pd.DataFrame(data)

    try:
        results = bias_detection.analyze_dataset(
            df, 
            outcome_col=req.targetColumn, 
            protected_cols=req.protectedAttributes
        )
        
        explanation_dict = gemini_service.explain_bias_with_gemini(results, "dummy.csv")
        
        if "summary" in explanation_dict:
            ai_explanation = explanation_dict.get("summary", "") + " " + explanation_dict.get("what_it_means", "")
        else:
            ai_explanation = str(explanation_dict)
            
        return {
            "bias_score": results.get("bias_score", 0),
            "verdict": results.get("verdict", "Unknown"),
            "flagged_columns": results.get("flagged_columns", []),
            "metrics": {
                "demographic_parity_diff": results.get("metrics", {}).get("demographic_parity_difference", 0),
                "disparate_impact": results.get("metrics", {}).get("disparate_impact_ratio", 1)
            },
            "group_stats": results.get("group_stats", {}),
            "ai_explanation": ai_explanation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def history():
    return []

class ExplainRequest(BaseModel):
    question: str
    context: Optional[dict] = None

@router.post("/explain")
def explain(req: ExplainRequest):
    try:
        answer = gemini_service.chat_with_gemini(req.question, req.context)
        return {"explanation": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
