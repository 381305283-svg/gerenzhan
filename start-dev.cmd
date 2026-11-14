@echo off
chcp 65001 >nul
rem 这台机器的全局环境里没有 npm，所以用随项目下载的便携版 Node。
set "PORTABLE_NODE=C:\Users\Administrator\.cache\codex-node\node-v24.21.0-win-x64"
if exist "%PORTABLE_NODE%\npm.cmd" set "PATH=%PORTABLE_NODE%;%PATH%"

cd /d "%~dp0"
echo 正在启动开发服务器，地址 http://127.0.0.1:5173/
call npm run dev
pause
