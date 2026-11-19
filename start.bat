@echo off
title YOMVI ADVENTURES - Servidor Local
cd /d "%~dp0"

REM If the game is already being served on port 8080, just open it.
powershell -NoProfile -Command "try { $null = Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 'http://localhost:8080/index.html'; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  start "" "http://localhost:8080/index.html"
  exit /b
)

where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo  No se encontro Python. Instala Python o abre index.html directamente
  echo  (el juego usara el pixel-art procedural como respaldo; el MP3 si funciona).
  echo.
  start "" "index.html"
  pause
  exit /b
)

echo.
echo  ============================================
echo   YOMVI ADVENTURES - Galerias Mall '91
echo   Servidor local en http://localhost:8080
echo   Cierra la ventana "Yomvi Server" para detenerlo.
echo  ============================================
echo.

start "Yomvi Server" cmd /c "python -m http.server 8080"
timeout /t 1 >nul
start "" "http://localhost:8080/index.html"

echo  Servidor iniciado. Presiona una tecla para cerrar este lanzador.
pause >nul
