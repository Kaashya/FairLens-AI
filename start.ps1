# start.ps1
# This script will build the frontend and start the backend server

Write-Host "Building Frontend..."
cd frontend
npm run build
cd ..

Write-Host "Starting Backend..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
