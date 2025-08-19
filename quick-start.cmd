@echo off
echo.
echo ==============================================
echo    Life Tracker Pro v0.2 - Quick Start
echo ==============================================
echo.

echo [1/3] Iniciando servidor backend...
start /B npm run server:dev > server.log 2>&1

echo [2/3] Aguardando servidor inicializar...
timeout /t 5 /nobreak > nul

echo [3/3] Iniciando monitoramento automaticamente...
curl -X POST http://127.0.0.1:8000/api/monitor/start > nul 2>&1

echo.
echo ✅ Life Tracker Pro está rodando!
echo.
echo 🌐 API Server: http://127.0.0.1:8000
echo 📊 Status Monitor: http://127.0.0.1:8000/api/monitor/status
echo 📱 Dashboard: http://127.0.0.1:3000 (execute 'npm run client:dev' para frontend)
echo.
echo 🎯 Endpoints principais:
echo    GET  /api/monitor/status           - Status do monitor
echo    POST /api/monitor/start           - Iniciar monitoramento
echo    POST /api/monitor/stop            - Parar monitoramento
echo    GET  /api/monitor/sessions/today  - Sessões de hoje
echo.
echo ⚠️  Para parar o servidor, execute: quick-stop.cmd
echo.
pause