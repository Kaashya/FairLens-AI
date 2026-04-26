"""
firebase_service.py
-------------------
The MEMORY of FairLens.

Saves each bias scan to Firebase Firestore (a cloud database)
and retrieves the history of past scans.

Without this, every result disappears on page refresh.
With this, organizations can track if they're getting fairer over time.
"""

import os
from datetime import datetime, timezone
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, firestore


# ─────────────────────────────────────────────
# Firebase Initialization
# Only initialize once (Firebase throws error if initialized twice)
# ─────────────────────────────────────────────

_db = None  # Will hold the Firestore client after init

def init_firebase():
    """
    Initializes the Firebase Admin SDK.

    Looks for a service account key file at the path stored in
    the FIREBASE_KEY_PATH environment variable.

    HOW TO GET THIS FILE:
    1. Go to Firebase Console → Project Settings → Service Accounts
    2. Click "Generate New Private Key"
    3. Save the JSON file somewhere safe
    4. Set: FIREBASE_KEY_PATH=path/to/your-service-account.json
    """
    global _db

    if _db is not None:
        return _db  # Already initialized

    # Check if already initialized by another module
    if not firebase_admin._apps:
        key_path = os.getenv("FIREBASE_KEY_PATH")

        if key_path and os.path.exists(key_path):
            # Initialize with service account key (production)
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
        else:
            # Initialize with application default credentials (for local dev / testing)
            # This won't actually save to Firebase, but won't crash
            try:
                firebase_admin.initialize_app()
            except Exception:
                # Return None — Firebase not configured, just skip saving
                return None

    try:
        _db = firestore.client()
        return _db
    except Exception:
        return None


def save_scan_to_firestore(scan_result: dict, dataset_name: str) -> Optional[str]:
    """
    Saves a completed bias scan to the 'scans' collection in Firestore.

    What gets saved:
    {
        dataset_name: "hiring_data.csv",
        bias_score: 72,
        verdict: "High Bias Detected",
        flagged_columns: ["gender", "age"],
        metrics: { demographic_parity_difference: 0.34, ... },
        timestamp: "2026-04-25T13:00:00Z"
    }

    Returns:
        The document ID of the saved record (e.g. "abc123xyz")
        or None if saving failed
    """
    db = init_firebase()
    if db is None:
        # Firebase not configured — silently skip
        return None

    try:
        doc_data = {
            "dataset_name": dataset_name,
            "bias_score": scan_result.get("bias_score", 0),
            "verdict": scan_result.get("verdict", ""),
            "flagged_columns": scan_result.get("flagged_columns", []),
            "metrics": scan_result.get("metrics", {}),
            "total_rows": scan_result.get("total_rows", 0),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Add to Firestore — auto-generates a unique document ID
        doc_ref = db.collection("scans").add(doc_data)

        # doc_ref is a tuple: (timestamp, DocumentReference)
        return doc_ref[1].id

    except Exception as e:
        print(f"[Firebase] Failed to save scan: {e}")
        return None


def get_scan_history(limit: int = 20) -> list[dict]:
    """
    Retrieves the most recent bias scans from Firestore.

    Args:
        limit: How many records to return (default: 20)

    Returns:
        A list of scan records, newest first. Each item looks like:
        {
            "id": "abc123",
            "dataset_name": "hiring_data.csv",
            "bias_score": 72,
            "verdict": "High Bias Detected",
            "timestamp": "2026-04-25T13:00:00Z",
            ...
        }
    """
    db = init_firebase()
    if db is None:
        return []

    try:
        # Query the 'scans' collection, ordered by timestamp descending
        docs = (
            db.collection("scans")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(limit)
            .stream()
        )

        history = []
        for doc in docs:
            record = doc.to_dict()
            record["id"] = doc.id  # Include the document ID
            history.append(record)

        return history

    except Exception as e:
        print(f"[Firebase] Failed to fetch history: {e}")
        return []


def get_scan_by_id(scan_id: str) -> Optional[dict]:
    """
    Retrieves a single past scan by its document ID.

    Useful for when user clicks on a history item to re-view it.
    """
    db = init_firebase()
    if db is None:
        return None

    try:
        doc = db.collection("scans").document(scan_id).get()
        if doc.exists:
            record = doc.to_dict()
            record["id"] = doc.id
            return record
        return None
    except Exception as e:
        print(f"[Firebase] Failed to fetch scan {scan_id}: {e}")
        return None
