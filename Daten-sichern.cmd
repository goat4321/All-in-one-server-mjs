@echo off
setlocal EnableExtensions DisableDelayedExpansion
title Reiseplaner - lokale Datensicherung
set "DB=%~dp0outputs\Reiseplaner\private\reiseplan.sqlite"
echo.
echo === REISEPLANER-DATENSICHERUNG ===
echo Wichtig: Vorher das laufende Reiseplaner-Serverfenster mit Strg+C beenden!
echo.
if not exist "%DB%" goto :missing
if exist "%DB%-wal" goto :running
if exist "%DB%-shm" goto :running
where powershell.exe >nul 2>&1
if errorlevel 1 goto :no_powershell
set "STAMP="
for /f "usebackq delims=" %%S in (`powershell.exe -NoProfile -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"`) do set "STAMP=%%S"
if not defined STAMP goto :failed
set "DEST=%USERPROFILE%\Documents\Reiseplaner-Backups"
if not exist "%DEST%" mkdir "%DEST%"
if errorlevel 1 goto :failed
set "TARGET=%DEST%\reiseplan-%STAMP%.sqlite"
if exist "%TARGET%" goto :failed
copy /b "%DB%" "%TARGET%" >nul
if errorlevel 1 goto :failed
for %%F in ("%TARGET%") do if %%~zF LEQ 0 goto :failed
echo [OK] Datenbank gesichert:
echo "%TARGET%"
echo.
echo Diese Sicherung enthaelt persoenliche Reisedaten. Nicht oeffentlich hochladen.
echo Lokale Browser-Merklisten werden dabei NICHT mitgesichert.
pause
exit /b 0
:missing
echo [HINWEIS] Noch keine lokale SQLite-Datei gefunden.
echo Die Website muss zuvor mindestens einmal erfolgreich gestartet worden sein.
goto :failed
:running
echo [ABBRUCH] Es existiert noch eine SQLite-WAL-/SHM-Datei.
echo Server beenden und erneut probieren. Kein unsicheres Live-Kopieren.
goto :failed
:no_powershell
echo [FEHLER] Windows PowerShell wurde nicht gefunden.
:failed
echo Es wurde keine bestaetigte Datensicherung erstellt.
pause
exit /b 1
