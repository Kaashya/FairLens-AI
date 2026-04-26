"""
bias_detection.py
-----------------
The BRAIN of FairLens.

This file reads a CSV dataset and detects hidden discrimination patterns.
It checks if certain groups (e.g. women, older people) are being treated
unfairly compared to others — and gives a bias score from 0 to 100.
"""

from typing import Optional, Union, List, Dict
import pandas as pd
import numpy as np
from fairlearn.metrics import (
    demographic_parity_difference,
    equalized_odds_difference,
)


# ─────────────────────────────────────────────
# KNOWN PROTECTED COLUMNS (we auto-detect these)
# These are columns that should NOT influence decisions
# ─────────────────────────────────────────────
PROTECTED_KEYWORDS = [
    "gender", "sex", "race", "ethnicity", "age",
    "religion", "nationality", "disability", "marital"
]

# Keywords that typically represent the final decision / outcome
OUTCOME_KEYWORDS = [
    "approved", "hired", "label", "target", "outcome",
    "result", "decision", "status", "y", "class", "loan"
]


def detect_protected_columns(df: pd.DataFrame) -> list[str]:
    """
    Automatically finds columns that look like protected attributes.
    e.g. if a column is named 'gender' or 'race', it flags it.
    """
    found = []
    for col in df.columns:
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in PROTECTED_KEYWORDS):
            found.append(col)
    return found


def detect_outcome_column(df: pd.DataFrame) -> Optional[str]:
    """
    Automatically finds the column that represents the final decision.
    e.g. 'loan_approved', 'hired', 'target'
    """
    for col in df.columns:
        col_lower = col.lower()
        if any(keyword in col_lower for keyword in OUTCOME_KEYWORDS):
            return col
    # Fallback: use the last column
    return df.columns[-1]


def compute_class_imbalance(series: pd.Series) -> float:
    """
    Checks how imbalanced the outcome is.
    e.g. if 90% are rejected and 10% approved → high imbalance.
    Returns a score from 0 (balanced) to 1 (very imbalanced).
    """
    counts = series.value_counts(normalize=True)
    if len(counts) < 2:
        return 0.0
    majority = counts.iloc[0]
    minority = counts.iloc[-1]
    return round(float(majority - minority), 4)


def compute_group_rates(df: pd.DataFrame, protected_col: str, outcome_col: str) -> dict:
    """
    For a given protected column (e.g. 'gender'), calculates
    the positive outcome rate for each group.

    Example output:
    {
        "Male": 0.82,    ← 82% of males got approved
        "Female": 0.41   ← only 41% of females got approved
    }
    """
    group_rates = {}
    # Normalize outcome to binary (1/0) if it's text like Yes/No
    outcome = df[outcome_col].copy()
    if outcome.dtype == object:
        unique_vals = outcome.unique()
        # Map the "positive" value to 1
        positive_vals = {"yes", "1", "true", "approved", "hired", "accept"}
        mapping = {}
        for v in unique_vals:
            mapping[v] = 1 if str(v).lower() in positive_vals else 0
        outcome = outcome.map(mapping)

    for group_val in df[protected_col].unique():
        mask = df[protected_col] == group_val
        group_outcome = outcome[mask]
        rate = group_outcome.mean() if len(group_outcome) > 0 else 0.0
        group_rates[str(group_val)] = round(float(rate), 4)

    return group_rates


def compute_disparate_impact(group_rates: dict) -> float:
    """
    Disparate Impact Ratio = (lowest approval rate) / (highest approval rate)

    A fair system should score close to 1.0.
    Below 0.8 is considered discriminatory (the "80% rule" in US law).

    Returns a value from 0 to 1.
    """
    if not group_rates or len(group_rates) < 2:
        return 1.0
    rates = list(group_rates.values())
    max_rate = max(rates)
    min_rate = min(rates)
    if max_rate == 0:
        return 1.0
    return round(min_rate / max_rate, 4)


def compute_bias_score(
    dpd: float,
    disparate_impact: float,
    class_imbalance: float
) -> int:
    """
    Combines multiple fairness metrics into one intuitive score: 0 to 100.
    Higher score = MORE bias = WORSE.

    Components:
    - Demographic Parity Difference (how different are approval rates?)
    - Disparate Impact (does ratio fall below 0.8 threshold?)
    - Class Imbalance (is the dataset itself skewed?)
    """
    # Demographic parity: 0 = perfect, 1 = extreme. Weight: 50%
    dpd_score = min(abs(dpd) * 100, 100) * 0.50

    # Disparate impact: 1.0 = fair, 0.0 = totally unfair. Weight: 35%
    di_score = (1 - disparate_impact) * 100 * 0.35

    # Class imbalance: 0 = balanced, 1 = totally skewed. Weight: 15%
    ci_score = class_imbalance * 100 * 0.15

    total = dpd_score + di_score + ci_score
    return min(int(round(total)), 100)


def get_verdict(score: int) -> str:
    """Converts a numeric score into a human-readable verdict."""
    if score < 25:
        return "Low Bias — System appears fair"
    elif score < 50:
        return "Moderate Bias — Some unfairness detected"
    elif score < 75:
        return "High Bias — Significant discrimination found"
    else:
        return "Critical Bias — Severe discrimination detected"


def analyze_dataset(df: pd.DataFrame, outcome_col: Optional[str] = None, protected_cols: Optional[List] = None) -> dict:
    """
    MAIN FUNCTION — Call this to analyze a dataset for bias.

    Args:
        df: The pandas DataFrame (loaded from CSV)
        outcome_col: The column name of the decision (e.g. 'loan_approved')
                     If None, we auto-detect it.
        protected_cols: List of sensitive columns to check (e.g. ['gender', 'age'])
                        If None, we auto-detect them.

    Returns:
        A dictionary with everything: bias score, metrics, group stats, etc.
    """
    results = {}

    # ── Step 1: Auto-detect columns if not provided ──
    if outcome_col is None:
        outcome_col = detect_outcome_column(df)

    if protected_cols is None or len(protected_cols) == 0:
        protected_cols = detect_protected_columns(df)

    results["outcome_column"] = outcome_col
    results["flagged_columns"] = protected_cols
    results["total_rows"] = len(df)
    results["total_columns"] = len(df.columns)

    # ── Step 2: Compute class imbalance on the outcome column ──
    class_imbalance = compute_class_imbalance(df[outcome_col])
    results["class_imbalance"] = class_imbalance

    # ── Step 3: Normalize the outcome column to binary ──
    outcome = df[outcome_col].copy()
    if outcome.dtype == object:
        unique_vals = outcome.unique()
        positive_vals = {"yes", "1", "true", "approved", "hired", "accept"}
        mapping = {v: (1 if str(v).lower() in positive_vals else 0) for v in unique_vals}
        outcome = outcome.map(mapping)
    outcome = pd.to_numeric(outcome, errors="coerce").fillna(0).astype(int)

    # ── Step 4: Analyze each protected column ──
    group_stats = {}
    all_dpds = []
    all_dis = []

    for col in protected_cols:
        if col not in df.columns:
            continue

        group_rates = compute_group_rates(df, col, outcome_col)
        di = compute_disparate_impact(group_rates)

        # Compute Demographic Parity Difference using fairlearn
        try:
            dpd = demographic_parity_difference(
                y_true=outcome,
                y_pred=outcome,   # using outcome as pred for dataset-level check
                sensitive_features=df[col].astype(str)
            )
        except Exception:
            # Fallback: compute manually
            rates = list(group_rates.values())
            dpd = max(rates) - min(rates) if rates else 0.0

        group_stats[col] = {
            "group_rates": group_rates,
            "demographic_parity_difference": round(float(dpd), 4),
            "disparate_impact_ratio": di,
            "is_discriminatory": di < 0.8  # US legal threshold
        }

        all_dpds.append(abs(float(dpd)))
        all_dis.append(di)

    results["group_stats"] = group_stats

    # ── Step 5: Compute overall metrics ──
    avg_dpd = float(np.mean(all_dpds)) if all_dpds else 0.0
    avg_di = float(np.mean(all_dis)) if all_dis else 1.0

    results["metrics"] = {
        "demographic_parity_difference": round(avg_dpd, 4),
        "disparate_impact_ratio": round(avg_di, 4),
        "class_imbalance": class_imbalance,
    }

    # ── Step 6: Compute final bias score ──
    bias_score = compute_bias_score(avg_dpd, avg_di, class_imbalance)
    results["bias_score"] = bias_score
    results["verdict"] = get_verdict(bias_score)

    return results
