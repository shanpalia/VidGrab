@echo off
setlocal
set "GRADLE_VERSION=9.3.1"
set "DIST=%USERPROFILE%\.gradle\vidgrab-dist\gradle-%GRADLE_VERSION%"
if exist "%DIST%\bin\gradle.bat" goto runGradle
if not exist "%USERPROFILE%\.gradle\vidgrab-dist" mkdir "%USERPROFILE%\.gradle\vidgrab-dist"
set "TMP=%USERPROFILE%\.gradle\vidgrab-dist\gradle-%GRADLE_VERSION%-bin.zip"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri 'https://services.gradle.org/distributions/gradle-%GRADLE_VERSION%-bin.zip' -OutFile '%TMP%'"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force '%TMP%' '%USERPROFILE%\.gradle\vidgrab-dist'"
:runGradle
call "%DIST%\bin\gradle.bat" %*
exit /b %ERRORLEVEL%
