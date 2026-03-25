@echo off
title The Best Burgers - POS System
cd /d "%~dp0"
echo.
echo  ========================================
echo   THE BEST BURGERS - Sistema POS
echo  ========================================
echo.
echo  Iniciando servidor de desarrollo...
echo.
start "" http://localhost:5173/The_best_burguers/
npm run dev
pause
