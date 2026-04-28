# 🚀 FairLens Deployment Guide

Because FairLens is built with a React frontend and a FastAPI backend, we use a **Docker container** to package both pieces of software into one single, deployable unit.

You have two great options for deploying your application to the public internet. 

---

## Option 1: Deploy to Google Cloud Run (Recommended for Solution Challenge)
*Google highly encourages using Google Cloud technologies for the Solution Challenge. This option will earn you more points.*

### Prerequisites
1. You need a Google Cloud account (you get $300 in free credits when you sign up).
2. Download and install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) on your computer.

### Step-by-Step Instructions
1. **Open your terminal** (Command Prompt or PowerShell).
2. **Authenticate your Google account** by running:
   ```bash
   gcloud auth login
   ```
3. **Set your Google Cloud Project ID** (replace `YOUR_PROJECT_ID` with your actual project ID from the Google Cloud Console):
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```
4. **Enable the necessary Google APIs**:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com
   ```
5. **Deploy the application!** Make sure you are in the `FairLens-AI` root folder (where the `Dockerfile` is), and run:
   ```bash
   gcloud run deploy fairlens-app --source . --region us-central1 --allow-unauthenticated
   ```
6. **Set your Environment Variables**: The terminal will ask you a few setup questions. Once deployed, it will give you a public URL! Finally, go to your Google Cloud Console -> Cloud Run -> `fairlens-app` -> "Edit & Deploy New Revision" -> "Variables & Secrets" and add your `GEMINI_API_KEY`.

---

## Option 2: Deploy to Render.com (Easiest & Free)
*If you want the fastest possible deployment without dealing with command-line tools, use Render. I have already generated the `render.yaml` file for this.*

### Step-by-Step Instructions
1. **Push your code to GitHub:** Make sure the `Dockerfile` and `render.yaml` files I created for you are committed and pushed to your GitHub repository.
   ```bash
   git add .
   git commit -m "Add deployment files"
   git push
   ```
2. **Go to Render:** Open [Render.com](https://render.com/) and sign up or log in using your GitHub account.
3. **Create a Blueprint:** 
   * Click the **"New +"** button at the top right of the dashboard.
   * Select **"Blueprint"** from the dropdown menu.
4. **Connect your Repository:**
   * Find your `FairLens-AI` repository in the list and click **"Connect"**.
   * Render will automatically read the `render.yaml` file and configure everything (Frontend, Backend, and Port 8000) for you!
5. **Add your API Key:**
   * Go to the **Environment** tab of your new web service on the Render dashboard.
   * Add a new environment variable.
   * Key: `GEMINI_API_KEY`
   * Value: *(paste your actual Gemini API key here)*
6. **Wait for the Build:** Render will now build your Docker container. This usually takes about 3-5 minutes. Once it's done, you'll see a green "Live" badge and a public URL (e.g., `https://fairlens-ai.onrender.com`) where your app is hosted!
