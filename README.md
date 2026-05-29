# Jak uruchomić aplikację — Laravel 13 + PHP 8.5

## Wymagania

- **PHP 8.5.6 NTS x64** w `C:\xampp\php85\` ✓
- **Composer 2.10** w `C:\xampp\composer\composer.phar` ✓
- **MySQL** z XAMPP (port 3306) ✓
- **Laravel 13.12** w `warsztat-laravel/` ✓
- **Baza `warsztat_laravel`** z tabelami i seedami ✓

## Uruchomienie

1. **Włącz MySQL** w XAMPP Control Panel (Apache nie jest potrzebny — Laravel ma własny serwer).
2. **Kliknij dwukrotnie `URUCHOM.bat`** w folderze `warsztat-laravel`.
   Albo ręcznie z PowerShell w katalogu `warsztat-laravel`:
   ```powershell
   C:\xampp\php85\php.exe artisan serve --host=127.0.0.1 --port=8000
   ```
3. Otwórz przeglądarkę: **http://localhost:8000**

## Konta domyślne

| Login        | Hasło           | Rola         |
|--------------|-----------------|--------------|
| `admin`      | `admin123`      | admin        |
| `mechanik`   | `mechanik123`   | mechanic     |
| `recepcja`   | `recepcja123`   | recepcja     |
| `magazynier` | `magazynier123` | magazynier   |

Klient loguje się **rejestracją + kodem dostępu** (przekazywanymi przez recepcję
po dodaniu zlecenia).

## Struktura projektu

```
warsztat-laravel/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/    # 11 kontrolerów REST
│   │   └── Middleware/         # auth.session, role
│   ├── Models/                 # Eloquent: User, Customer, Vehicle, ...
│   └── Support/                # ApiResponse helper
├── database/
│   ├── migrations/             # 9 migracji (kolejność z FK)
│   └── seeders/                # DatabaseSeeder z domyślnymi kontami
├── public/
│   ├── index.html              # frontend pracownika (logowanie)
│   ├── admin.html, mechanic.html, ...
│   ├── klient.html
│   ├── css/style.css
│   └── js/                     # common.js (klient REST), admin.js, ...
├── routes/
│   ├── api.php                 # /api/v1/* — 38 endpointów
│   └── web.php                 # / przekierowuje na index.html
├── .env                        # konfiguracja MySQL/sesji
└── URUCHOM.bat                 # skrypt startowy
```

## Komendy administracyjne

```powershell
# Reset bazy + ponowne wypełnienie domyślnymi danymi
C:\xampp\php85\php.exe artisan migrate:fresh --seed --force

# Lista wszystkich tras API
C:\xampp\php85\php.exe artisan route:list --path=api

# Wyczyść cache po zmianach
C:\xampp\php85\php.exe artisan optimize:clear
```
