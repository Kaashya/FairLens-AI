# start.ps1
# This script will build the frontend and start the backend server

Write-Host "Building Frontend..."
cd frontend
npm run build
cd ..

Write-Host "Starting Backend..."
cd backend

# Stop any existing server running on port 8000
$port = 8000
$tcpConnections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcpConnections) {
    Write-Host "Port $port is already in use. Stopping the old server..."
    $tcpConnections | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
