@echo off
cd /d "%~dp0"
echo.
echo  =============================================
echo   IQ2020 Flask API  --  http://localhost:5000
echo  =============================================
echo.
venv\Scripts\python.exe backend\app.py
pause
