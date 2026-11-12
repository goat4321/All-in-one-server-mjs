@echo off
setlocal
cd /d "%~dp0"
where node.exe >nul 2>&1
if errorlevel 1 (
  echo Node.js 24 wird zum Starten des Reiseplaners benoetigt.
  pause
  exit /b 1
)
node server.mjs --open
if errorlevel 1 pause
