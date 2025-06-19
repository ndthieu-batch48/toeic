@echo off
set APP=main:app
set VENV=fastapi_venv
set PORT=8000
set HOST=192.168.34.124

call %VENV%\Scripts\activate
uvicorn %APP% --host %HOST% --port %PORT% --reload
