@echo off
REM Start MongoDB service
net start MongoDB

REM Start the server
node server.js
pause