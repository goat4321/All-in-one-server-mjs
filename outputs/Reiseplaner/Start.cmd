@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Reiseplaner - lokaler Server
cd /d "%~dp0"
if errorlevel 1 goto :folder_error
if not exist "server.mjs" goto :folder_error
if not exist "package.json" goto :folder_error
where node.exe >nul 2>&1
if errorlevel 1 goto :node_missing
set "NODE_MAJOR="
for /f "delims=" %%V in ('node -p "Number(process.versions.node.split('.')[0])" 2^>nul') do set "NODE_MAJOR=%%V"
if not defined NODE_MAJOR goto :node_missing
if %NODE_MAJOR% LSS 24 goto :node_old
echo.
echo === REISEPLANER ===
echo Ordner: "%CD%"
echo Node: 
node --version
echo Start: http://127.0.0.1:4173
echo Browser oeffnet sich auf Windows automatisch.
echo Dieses Fenster offen lassen. Beenden mit Strg+C.
echo.
node server.mjs --open
set "START_EXIT=%errorlevel%"
echo.
echo [HINWEIS] Der lokale Server wurde beendet (Code %START_EXIT%).
if not "%START_EXIT%"=="0" (
  echo [FEHLER] Pruefe die Fehlermeldung oben.
  echo Falls Port 4173 belegt ist, schliesse einen alten Reiseplaner.
  echo Fuer eine Diagnose: Pruefen-Reiseplaner.cmd im ZIP-Hauptordner.
  pause
)
exit /b %START_EXIT%
:folder_error
echo [FEHLER] App-Dateien fehlen. ZIP komplett entpacken.
echo Die Dateien server.mjs und package.json muessen neben Start.cmd liegen.
pause
exit /b 1
:node_missing
echo [FEHLER] Node.js fehlt oder ist nicht ueber PATH erreichbar.
echo Installiere Node.js 24 oder neuer von https://nodejs.org/en/download
echo Danach den Explorer bzw. die Konsole neu starten.
pause
exit /b 1
:node_old
echo [FEHLER] Node.js 24 oder neuer erforderlich. Installiert:
node --version
echo Download: https://nodejs.org/en/download
pause
exit /b 1
