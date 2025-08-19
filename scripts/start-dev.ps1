Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Change to repo root
Set-Location -Path "$PSScriptRoot\.."

# Prevent CRA from auto-opening a browser
$env:BROWSER = "none"

# Start backend and frontend together
# Work around PowerShell npx.ps1 bug by invoking npx via cmd.exe
& cmd /c "npx --yes concurrently \"npx --yes nodemon --exec npx --yes ts-node server/index.ts\" \"npx --yes react-scripts start\""

