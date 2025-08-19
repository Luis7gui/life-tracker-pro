@echo off
REM Change to repo root
cd /d "%~dp0\.."

REM Prevent CRA from auto-opening a browser
set BROWSER=none

REM Start backend and frontend together
npx --yes concurrently "npx --yes nodemon --exec npx --yes ts-node server/index.ts" "npx --yes react-scripts start"

