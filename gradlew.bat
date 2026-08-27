@echo off
setlocal
where gradle >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  gradle %*
  exit /b %ERRORLEVEL%
)
echo Gradle 9.3.1 is not installed. Please install Gradle or use Android Studio/Codemagic.
exit /b 1
