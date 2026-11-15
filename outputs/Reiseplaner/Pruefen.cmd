@echo off
setlocal EnableExtensions
cd /d "%~dp0"
echo.
echo === REISEPLANER - LOKALE PRUEFUNG ===
where node.exe >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] Node.js 24 ist nicht installiert.
  goto :failed
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [FEHLER] npm wurde nicht gefunden.
  goto :failed
)
for /f %%V in ('node -p "process.versions.node.split('.') [0]"') do set "NODE_MAJOR=%%V"
if not "%NODE_MAJOR%"=="24" (
  echo [FEHLER] Node.js 24 erforderlich. Installiert: 
  node --version
  goto :failed
)
echo [1/4] Portable Tests, Kartenbericht und lokaler HTTP-Startcheck...
call npm run check:portable
if errorlevel 1 goto :failed
echo [2/4] Pruefe die 4 privaten Tripsy-Rohkopien im Verzeichnis data...
set "MISSING=0"
for %%I in (1297194 1312180 1275516 1273324) do (
  if not exist "data\tripsy-%%I.json" (
    echo [FEHLT] data\tripsy-%%I.json
    set "MISSING=1"
  )
)
if "%MISSING%"=="1" goto :missing
echo [3/4] Vollstaendige bestehende Core-Regressionen...
call npm test
if errorlevel 1 goto :failed
echo [4/4] Vollstaendige originale Chrome-/Edge-Browsertests...
call npm run test:browser
if errorlevel 1 goto :failed
echo.
echo [OK] Alle verfuegbaren Modell-, Core- und Browserpruefungen bestanden.
echo Achtung: Das bestaetigt keine echten 2027-Fahrplaene oder Buchungen.
pause
exit /b 0
:missing
echo.
echo [TEILPRUEFUNG] Portable Tests, Kartenbericht und HTTP-Startcheck bestanden; private Rohkopien fehlen.
echo Vollstaendige Original-Tests wurden bewusst NICHT ausgefuehrt.
echo Kopiere sie NUR lokal aus deinem bisherigen Projekt nach data\.
echo NICHT nach GitHub pushen. Mehr unter TEST_LOCAL.md.
pause
exit /b 2
:failed
echo.
echo [FEHLER] Mindestens eine erforderliche Pruefung ist fehlgeschlagen.
echo Details stehen im Konsolenfenster. Keine Abnahme behaupten.
pause
exit /b 1
