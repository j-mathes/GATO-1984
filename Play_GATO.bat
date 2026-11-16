@echo off
setlocal
title GATO launcher

set "APP=%~dp0remake"
set "PORT=4173"
set "URL=http://localhost:%PORT%/"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found on PATH. Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

pushd "%APP%" || (echo Cannot find "%APP%" & pause & exit /b 1)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install || goto :fail
)

if not exist "dist\" (
  echo Building GATO...
  call npm run build || goto :fail
)

echo Starting the preview server on %URL%
start "GATO server (close this window to stop)" cmd /c "npx vite preview --port %PORT% --strictPort"

rem wait up to 30 s for the server to answer
set /a TRIES=0
:wait
curl -s -o nul "%URL%"
if not errorlevel 1 goto :open
set /a TRIES+=1
if %TRIES% geq 30 goto :fail
timeout /t 1 /nobreak >nul
goto :wait

:open
where chrome >nul 2>nul
if not errorlevel 1 (
  start "" chrome "%URL%"
) else if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%URL%"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%URL%"
) else if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
  start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" "%URL%"
) else (
  start "" "%URL%"
)
popd
exit /b 0

:fail
echo.
echo GATO could not be started. See the messages above.
popd
pause
exit /b 1
