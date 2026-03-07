@echo off
echo Starting Vulcanizer System...
docker compose up -d
timeout /t 5
start http://localhost
pause