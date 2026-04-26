"""
explainability.py
-----------------
The "WHY" module of FairLens.

While bias_detection.py tells us THAT bias exists,
this module tells us WHAT is causing it.

It uses SHAP (SHapley Additive exPlanations) — a technique
that looks at each feature and says how much it contributed
to a model's decision. Think of it like a "blame assignment"
for each column in the dataset.
"""

import pandas as pd
import numpy as np
import shap
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split


def encode_dataframe(df: pd.DataFrame, outcome_col: str):
    """
    Converts text/categorical columns into numbers so ML models can read them.
    e.g.  "Male" → 0,  "Female" → 1

    Returns:
        X: feature columns (everything except outcome)
        y: outcome column (the decision)
        feature_names: list of column names
        encoders: dictionary of LabelEncoders used (for reference)
    """
    df_encoded = df.copy()
    encoders = {}

    for col in df_encoded.columns:
        if df_encoded[col].dtype == object:
            le = LabelEncoder()
            df_encoded[col] = le.fit_transform(df_encoded[col].astype(str))
            encoders[col] = le

    # Also handle numeric outcome that might be stored as string
    df_encoded = df_encoded.apply(pd.to_numeric, errors="coerce").fillna(0)

    X = df_encoded.drop(columns=[outcome_col])
    y = df_encoded[outcome_col].astype(int)

    return X, y, list(X.columns), encoders


def train_simple_model(X: pd.DataFrame, y: pd.Series) -> LogisticRegression:
    """
    Trains a simple Logistic Regression model on the dataset.

    Why Logistic Regression?
    - It's fast (runs in seconds even on big datasets)
    - SHAP works perfectly with it
    - It's good enough to find which features matter most

    We don't care about accuracy here — we just want feature importances.
    """
    model = LogisticRegression(max_iter=1000, random_state=42)

    # Use all data if small, else split
    if len(X) < 100:
        model.fit(X, y)
    else:
        X_train, _, y_train, _ = train_test_split(X, y, test_size=0.2, random_state=42)
        model.fit(X_train, y_train)

    return model


def compute_shap_importances(model: LogisticRegression, X: pd.DataFrame) -> dict:
    """
    Uses SHAP to calculate how much each feature (column) contributes
    to the model's decisions.

    Returns a dict like:
    {
        "gender":  0.42,  ← gender contributes 42% to decisions
        "age":     0.31,
        "income":  0.18,
        "zip_code": 0.09
    }

    Higher value = more influence on the outcome.
    If a protected column (like gender) has high influence → that's a red flag!
    """
    # Use a sample of max 200 rows for speed
    X_sample = X.sample(min(200, len(X)), random_state=42)

    # Linear SHAP explainer — works perfectly with Logistic Regression
    explainer = shap.LinearExplainer(model, X_sample, feature_perturbation="interventional")
    shap_values = explainer.shap_values(X_sample)

    # Mean absolute SHAP value per feature = overall importance
    mean_abs_shap = np.abs(shap_values).mean(axis=0)
    total = mean_abs_shap.sum()

    if total == 0:
        importances = {col: 0.0 for col in X.columns}
    else:
        # Convert to percentages
        importances = {
            col: round(float(val / total), 4)
            for col, val in zip(X.columns, mean_abs_shap)
        }

    # Sort by importance (highest first)
    importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
    return importances


def get_top_features(importances: dict, top_n: int = 5) -> list[dict]:
    """
    Returns the top N most influential features as a clean list.

    Example output:
    [
        {"feature": "gender",  "importance": 0.42, "rank": 1},
        {"feature": "age",     "importance": 0.31, "rank": 2},
        ...
    ]
    """
    top = []
    for rank, (feature, importance) in enumerate(list(importances.items())[:top_n], start=1):
        top.append({
            "feature": feature,
            "importance": importance,
            "importance_pct": f"{round(importance * 100, 1)}%",
            "rank": rank
        })
    return top


def explain_dataset(df: pd.DataFrame, outcome_col: str) -> dict:
    """
    MAIN FUNCTION — Call this to get SHAP feature importances for a dataset.

    Args:
        df: The pandas DataFrame
        outcome_col: Name of the outcome/target column

    Returns:
        A dict with all feature importances + top 5 most influential features
    """
    try:
        # Step 1: Encode all columns to numbers
        X, y, feature_names, _ = encode_dataframe(df, outcome_col)

        # Step 2: Train a quick logistic regression model
        model = train_simple_model(X, y)

        # Step 3: Compute SHAP importances
        importances = compute_shap_importances(model, X)

        # Step 4: Get top 5
        top_features = get_top_features(importances, top_n=5)

        return {
            "all_importances": importances,
            "top_features": top_features,
            "model_used": "LogisticRegression",
            "explanation_method": "SHAP LinearExplainer",
            "features_analyzed": feature_names
        }

    except Exception as e:
        # Return a safe fallback if SHAP fails
        return {
            "all_importances": {},
            "top_features": [],
            "model_used": "N/A",
            "explanation_method": "SHAP LinearExplainer",
            "features_analyzed": [],
            "error": str(e)
        }
