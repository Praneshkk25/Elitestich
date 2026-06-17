@echo off
echo Starting all EliteStitch microservices...

echo Starting Backend API (Port 5000)...
start "Backend API" cmd /k "cd Backend && npm run dev"

echo Starting Customer App (Port 3000)...
start "Customer App" cmd /k "cd Customer_App && npm run dev"

echo Starting Admin Portal (Port 3001)...
start "Admin Portal" cmd /k "cd Admin_Portal && npm run dev"

echo Starting Partner Portal (Port 3002)...
start "Partner Portal" cmd /k "cd Partner_Portal && npm run dev"

echo All servers are starting in separate windows!
echo - Customer App: http://localhost:3000
echo - Admin Portal: http://localhost:3001
echo - Partner Portal: http://localhost:3002
echo - Backend API: http://localhost:5000
