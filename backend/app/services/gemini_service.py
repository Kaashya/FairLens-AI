"""
gemini_service.py
-----------------
The TRANSLATOR of FairLens.

Takes raw bias numbers (like "demographic_parity_difference = 0.34")
and sends them to Google's Gemini AI to get a plain-English explanation
that any non-technical person can understand.

It also suggests how to FIX the bias — making FairLens actionable,
not just diagnostic.
"""

import os
import json
import google.generativeai as genai


def init_gemini():
    """
    Initializes the Gemini API client.
    Reads the API key from the environment variable GEMINI_API_KEY.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is not set. "
            "Get your key from: https://aistudio.google.com/app/apikey"
        )
    genai.configure(api_key=api_key)
    return genai.GenerativeModel("gemini-1.5-flash")


def build_analysis_prompt(analysis_results: dict, dataset_name: str = "uploaded dataset") -> str:
    """
    Builds a detailed prompt for Gemini that includes all the bias metrics.
    The prompt asks Gemini to explain the results in plain English and suggest fixes.
    """
    bias_score = analysis_results.get("bias_score", 0)
    verdict = analysis_results.get("verdict", "")
    flagged_columns = analysis_results.get("flagged_columns", [])
    metrics = analysis_results.get("metrics", {})
    group_stats = analysis_results.get("group_stats", {})
    total_rows = analysis_results.get("total_rows", 0)

    # Format group stats for the prompt
    group_details = []
    for col, stats in group_stats.items():
        rates = stats.get("group_rates", {})
        di = stats.get("disparate_impact_ratio", 1.0)
        is_disc = stats.get("is_discriminatory", False)
        rates_str = ", ".join([f"{g}: {round(r*100,1)}% approval" for g, r in rates.items()])
        group_details.append(
            f"- Column '{col}': {rates_str} | Disparate Impact: {di} {'⚠️ DISCRIMINATORY' if is_disc else '✅ OK'}"
        )

    group_details_str = "\n".join(group_details) if group_details else "No protected columns detected."

    prompt = f"""
You are FairLens, an AI expert in algorithmic fairness and bias detection.
Analyze the following bias scan results and provide a clear, helpful explanation.

=== DATASET OVERVIEW ===
Dataset: {dataset_name}
Total Records: {total_rows}
Protected Columns Detected: {', '.join(flagged_columns) if flagged_columns else 'None detected'}

=== BIAS ANALYSIS RESULTS ===
Overall Bias Score: {bias_score}/100
Verdict: {verdict}

Key Metrics:
- Demographic Parity Difference: {metrics.get('demographic_parity_difference', 0)}
  (0 = perfectly fair, 1 = completely unfair)
- Disparate Impact Ratio: {metrics.get('disparate_impact_ratio', 1)}
  (1.0 = fair, below 0.8 = legally discriminatory under US law)
- Class Imbalance: {metrics.get('class_imbalance', 0)}
  (0 = balanced, 1 = very skewed outcomes)

Group Breakdown:
{group_details_str}

=== YOUR TASK ===
Please provide a response in the following JSON format ONLY (no extra text):
{{
    "summary": "A 2-3 sentence plain-English summary of what the bias analysis found. Make it clear and non-technical.",
    "what_it_means": "Explain what this bias means in real-world terms for people affected by it (e.g. job applicants, loan seekers). 2-3 sentences.",
    "key_findings": [
        "Finding 1 about a specific protected group",
        "Finding 2 about another pattern found",
        "Finding 3 if applicable"
    ],
    "recommendations": [
        "Specific recommendation 1 to fix or reduce the bias",
        "Specific recommendation 2",
        "Specific recommendation 3"
    ],
    "severity_label": "LOW | MODERATE | HIGH | CRITICAL",
    "one_liner": "A single punchy sentence summarizing the bias situation for a dashboard headline"
}}
"""
    return prompt


def build_chat_prompt(user_question: str, context: dict = None) -> str:
    """
    Builds a prompt for the chatbot endpoint.
    Optionally includes the last scan results as context.
    """
    context_str = ""
    if context:
        context_str = f"""
The user's most recent scan results:
- Bias Score: {context.get('bias_score', 'N/A')}/100
- Verdict: {context.get('verdict', 'N/A')}
- Flagged columns: {', '.join(context.get('flagged_columns', []))}
- Disparate Impact: {context.get('metrics', {}).get('disparate_impact_ratio', 'N/A')}
"""

    prompt = f"""
You are FairLens, a friendly and knowledgeable AI assistant specializing in 
algorithmic fairness, AI bias, and ethical AI practices.

{context_str}

User's question: {user_question}

Instructions:
- Answer in clear, friendly language that a non-technical person can understand
- Keep your answer focused and under 200 words
- If relevant, give practical advice on how to fix bias
- Don't use excessive jargon
"""
    return prompt


def explain_bias_with_gemini(analysis_results: dict, dataset_name: str = "dataset") -> dict:
    """
    MAIN FUNCTION — Sends bias analysis results to Gemini and gets a plain-English explanation.

    Args:
        analysis_results: The dict returned by bias_detection.analyze_dataset()
        dataset_name: Name of the uploaded file (for context)

    Returns:
        A dict with: summary, what_it_means, key_findings, recommendations, severity_label, one_liner
    """
    try:
        model = init_gemini()
        prompt = build_analysis_prompt(analysis_results, dataset_name)

        response = model.generate_content(prompt)
        response_text = response.text.strip()

        # Clean up the response — sometimes Gemini wraps JSON in markdown code blocks
        if response_text.startswith("```"):
            lines = response_text.split("\n")
            # Remove first and last lines (``` markers)
            response_text = "\n".join(lines[1:-1])

        explanation = json.loads(response_text)
        explanation["source"] = "gemini-1.5-flash"
        return explanation

    except json.JSONDecodeError:
        # Gemini returned non-JSON text — return it as a plain summary
        return {
            "summary": response.text if 'response' in locals() else "Unable to generate explanation.",
            "what_it_means": "",
            "key_findings": [],
            "recommendations": [],
            "severity_label": "UNKNOWN",
            "one_liner": "AI explanation unavailable.",
            "source": "gemini-1.5-flash",
            "error": "Response was not valid JSON"
        }
    except Exception as e:
        return {
            "summary": "Gemini AI explanation is currently unavailable.",
            "what_it_means": "",
            "key_findings": [],
            "recommendations": ["Please check your GEMINI_API_KEY environment variable."],
            "severity_label": "UNKNOWN",
            "one_liner": "AI explanation unavailable.",
            "source": "error",
            "error": str(e)
        }


def chat_with_gemini(user_question: str, context: dict = None) -> str:
    """
    Handles a freeform chatbot question about bias/fairness.

    Args:
        user_question: What the user typed in the chat
        context: Optional — the last scan results to give Gemini context

    Returns:
        A plain-English answer string
    """
    try:
        model = init_gemini()
        prompt = build_chat_prompt(user_question, context)
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        return f"Sorry, I couldn't connect to the AI service. Error: {str(e)}"
