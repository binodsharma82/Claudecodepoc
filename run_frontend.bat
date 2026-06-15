@echo off
cd /d "%~dp0\frontend"
echo.
echo  ===================================================
echo   IQ2020 React App  --  http://localhost:3000
echo   (API proxied to http://localhost:5000)
echo  ===================================================
echo.
npm run dev
pause
