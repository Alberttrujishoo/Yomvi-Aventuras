@echo off
title Yomvi Aventuras - Servidor Local
cd /d "%~dp0"

REM If the game is already being served on port 8080, just open it.
powershell -NoProfile -Command "try { $null = Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 'http://127.0.0.1:8080/index.html'; exit 0 } catch { exit 1 }"
if not errorlevel 1 (
  start "" "http://127.0.0.1:8080/index.html"
  exit /b
)

where node >nul 2>nul
if not errorlevel 1 (
  echo.
  echo  ============================================
  echo   YOMVI AVENTURAS - Servidor Node
  echo   http://127.0.0.1:8080
  echo   Cierra la ventana "Yomvi Server" para detenerlo.
  echo  ============================================
  echo.
  start "Yomvi Server" cmd /c "node scripts\serve.mjs"
  timeout /t 1 >nul
  start "" "http://127.0.0.1:8080/index.html"
  exit /b
)

where python >nul 2>nul
if not errorlevel 1 (
  echo.
  echo  ============================================
  echo   YOMVI AVENTURAS - Servidor Python
  echo   http://127.0.0.1:8080
  echo   Cierra la ventana "Yomvi Server" para detenerlo.
  echo  ============================================
  echo.
  start "Yomvi Server" cmd /c "python -m http.server 8080 --bind 127.0.0.1"
  timeout /t 1 >nul
  start "" "http://127.0.0.1:8080/index.html"
  exit /b
)

echo.
echo  No se encontro Node.js ni Python.
echo  Instala Node.js 22 o posterior, o Python, para iniciar el juego.
echo.
pause
