@echo off
setlocal EnableExtensions
set "APP=%~dp0outputs\Reiseplaner\Pruefen.cmd"
if not exist "%APP%" (
  echo [FEHLER] Die Pruefdatei fehlt: outputs\Reiseplaner\Pruefen.cmd
  echo Bitte das gesamte GitHub-ZIP entpacken.
  pause
  exit /b 1
)
call "%APP%"
exit /b %errorlevel%
