@echo off
title Yomvi Adventures
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Instala Node.js 22 o posterior para iniciar el juego.
  pause
  exit /b 1
)
echo Abre la direccion que aparecera abajo mientras esta ventana esta abierta.
node scripts\serve.mjs
