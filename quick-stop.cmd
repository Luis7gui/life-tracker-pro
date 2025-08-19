@echo off
echo.
echo ==============================================
echo    Life Tracker Pro v0.2 - Parar Serviços
echo ==============================================
echo.

echo [1/2] Parando monitoramento...
curl -X POST http://127.0.0.1:8000/api/monitor/stop > nul 2>&1

echo [2/2] Parando servidor...
taskkill /F /IM node.exe > nul 2>&1
taskkill /F /IM ts-node.exe > nul 2>&1

echo.
echo ✅ Life Tracker Pro foi parado com sucesso!
echo.
pause