@echo off
REM _open-log.bat — open the shared PowerShell log in Notepad.
REM Used by the Property Inspector "Open log" button.
set "LOGFILE=%TEMP%\streamdock-widget-ps.log"
if not exist "%LOGFILE%" (
    echo (no log yet — run a script first) > "%LOGFILE%"
)
start "" notepad.exe "%LOGFILE%"
