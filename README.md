# ⚖️ FairLens-AI

FairLens-AI is an intelligent, user-friendly platform designed to detect, explain, and help mitigate bias in machine learning datasets. It bridges the gap between complex algorithmic fairness metrics and non-technical stakeholders by providing plain-English explanations powered by Google Gemini.

## ✨ Key Features
- **📊 Dataset Analysis**: Upload CSV datasets and instantly calculate fairness metrics like Demographic Parity and Disparate Impact.
- **🤖 AI Explanations**: Uses Google's **Gemini AI** to translate complex statistical bias scores into easy-to-understand summaries and actionable recommendations.
- **📂 Scan History**: Automatically saves all your past bias scans to a **Firebase** cloud database, allowing you to track progress over time.
- **💬 Chat Assistant**: Chat directly with FairLens to ask specific questions about algorithmic fairness or your dataset's results.

## 🛠️ Technology Stack
- **Frontend**: React, Vite, TailwindCSS (for modern UI)
- **Backend**: FastAPI (Python), Pandas, Scikit-Learn
- **AI Integration**: Google Gemini (`google-genai` SDK)
- **Database**: Firebase Firestore

## 🚀 Getting Started

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- A **Google Gemini API Key** (Get one free at [Google AI Studio](https://aistudio.google.com/app/apikey))
- A **Firebase Service Account Key** (Optional, required for History tab)

### 2. Configuration
1. Navigate to the `backend` folder.
2. Rename `.env.example` to `.env` (or create a new `.env` file).
3. Add your Gemini API key:
   ```text
   GEMINI_API_KEY=your_api_key_here
   ```
4. If you want the History tab to work, generate a Firebase Private Key `.json` file, place it in the `backend` folder, and add it to your `.env`:
   ```text
   FIREBASE_KEY_PATH=firebase-key.json
   ```

### 3. Running the Project
The easiest way to start the project on Windows is by using the included batch script. This will automatically build the React frontend and start the Python backend server.

1. Double-click **`start.bat`** in the main project folder.
2. Open your browser and go to: **`http://localhost:8000`**

*(Note: The `start.bat` script automatically stops any old hanging servers on port 8000 so you never get an "address already in use" error!)*

### 4. Optional: Custom Domain (Windows)
If you prefer to access your site by typing `http://fairlens:8000` instead of `localhost:8000`:
1. Run **Notepad** as Administrator.
2. Open `C:\Windows\System32\drivers\etc\hosts`.
3. Add this line at the bottom: `127.0.0.1  fairlens`
4. Save the file.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.
