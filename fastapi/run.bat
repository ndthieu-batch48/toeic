
@REM app=main:app <--- your app name
@REM venv=fastapi_venv <--- your app venv file
@REM port=8000 <--- your app port
@REM host=192.168.34.124  <--- your app local host

@REM Replace it with your terminal-compatible venv activation command 
source fastapi_venv\Scripts\activate @REM git bash
uvicorn main:app --host 192.168.34.124 --port 8000 --reload
