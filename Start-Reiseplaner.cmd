@echo off
setlocal EnableExtensions
set "APP=%~dp0outputs\Reiseplaner\Start.cmd"
if not exist "%APP%" (
  echo [FEHLER] Der Reiseplaner wurde nicht gefunden.
  echo Bitte das gesamte GitHub-ZIP entpacken und dieses Skript im Hauptordner starten.
  echo Erwartet: outputs\Reiseplaner\Start.cmd
  pause
  exit /b 1
)
call "%APP%"
exit /b %errorlevel%
