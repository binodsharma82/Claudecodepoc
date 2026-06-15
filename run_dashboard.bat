@echo off
echo.
echo  =========================================
echo   Sample IQ2020 Model — GSK Field Rep POC
echo  =========================================
echo.
echo  Starting dashboard on http://localhost:8000
echo  Press Ctrl+C to stop
echo.
cd /d "%~dp0"
start "" http://localhost:8000
venv\Scripts\python.exe -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload
