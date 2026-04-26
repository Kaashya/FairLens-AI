from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import os
import json

# Import the services and ml module
from app.services import gemini_service, firebase_service
import sys

# We add the root path to make sure ml module is discoverable
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml import bias_detection

router = APIRouter(prefix="/api")

@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    targetColumn: str = Form(""),
    protectedAttributes: str = Form("[]")
):
    try:
        protected_cols = json.loads(protectedAttributes)
        if targetColumn == "":
            targetColumn = None
            
        import csv
        sample = file.file.read(1024).decode('utf-8', errors='ignore')
        file.file.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample)
            sep = dialect.delimiter
        except Exception:
            sep = ','
            
        df = pd.read_csv(file.file, sep=sep)
        df.columns = df.columns.str.replace('"', '').str.strip()
        results = bias_detection.analyze_dataset(
            df, 
            outcome_col=targetColumn, 
            protected_cols=protected_cols
        )
        
        explanation_dict = gemini_service.explain_bias_with_gemini(results, file.filename)
        
        if "summary" in explanation_dict:
            ai_explanation = explanation_dict.get("summary", "") + " " + explanation_dict.get("what_it_means", "")
        else:
            ai_explanation = str(explanation_dict)
            
        response_data = {
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
        
        # Save to Firebase history (if configured)
        firebase_service.save_scan_to_firestore(response_data, file.filename)
        
        return response_data
    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            f.write(f"targetColumn: {targetColumn}\n")
            if 'df' in locals():
                f.write(f"df.columns: {df.columns.tolist()}\n")
            f.write(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
def history():
    return firebase_service.get_scan_history()

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
