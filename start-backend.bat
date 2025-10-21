@echo off
echo Starting Programming Course Backend Server...
echo.

cd backend

echo Installing dependencies...
npm install

echo.
echo Starting server...
echo Server will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

npm start

pause
