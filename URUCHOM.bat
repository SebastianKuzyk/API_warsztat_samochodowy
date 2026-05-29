@echo off
REM === Uruchomienie aplikacji Warsztat Samochodowy (Laravel 13 + PHP 8.5) ===

echo Sprawdzam MySQL...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "SELECT 1" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [BLAD] MySQL nie dziala. Wlacz go w XAMPP Control Panel i ponow uruchomienie.
    echo.
    pause
    exit /b 1
)

echo MySQL: OK
echo.
echo Uruchamiam serwer Laravel na http://localhost:8000 ...
echo.
echo  Aby otworzyc aplikacje: http://localhost:8000
echo  Aby zatrzymac: nacisnij Ctrl+C
echo.
"C:\xampp\php85\php.exe" artisan serve --host=127.0.0.1 --port=8000
