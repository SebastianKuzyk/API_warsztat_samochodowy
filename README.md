# System Zarządzania Warsztatem Samochodowym

Webowa aplikacja do kompleksowej obsługi warsztatu samochodowego, zbudowana w PHP 8.5 z frameworkiem Laravel 13. System umożliwia recepcji przyjmowanie aut, mechanikom zarządzanie naprawami, magazynierowi kontrolę części, a kierownictwu (admin) wgląd w finanse i pracowników.

**Jaki problem rozwiązuje?**
Papierowe karty napraw, Excel do zarządzania magazynem i telefon jako jedyna komunikacja między recepcją a mechanikiem — to codzienność wielu małych warsztatów. Ta aplikacja zastępuje to wszystko jednym systemem dostępnym z przeglądarki.

**Czym się wyróżnia?**
Większość gotowych systemów warsztatowych to drogie SaaS z subskrypcją miesięczną. Ten projekt działa lokalnie (XAMPP), jest open-source i można go dostosować. Dodatkową wartością jest panel klienta — klient dostaje unikalny kod dostępu po przyjęciu auta i może samodzielnie śledzić status naprawy przez przeglądarkę.

---

## Uruchomienie projektu (developer)

### Użyte technologie

| Technologia | Wersja | Link |
|---|---|---|
| PHP | 8.5.6 NTS x64 | https://www.php.net |
| Laravel | 13.12 | https://laravel.com |
| MySQL | 8.0+ (XAMPP) | https://www.mysql.com |
| Composer | 2.10 | https://getcomposer.org |
| HTML / CSS / JavaScript | — (vanilla) | — |
| Font Awesome | 6.4 (CDN) | https://fontawesome.com |
| Chart.js | latest (CDN) | https://www.chartjs.org |

### Wymagania programowe

- **System operacyjny:** Windows 10/11 (testowane), macOS i Linux powinny działać po zmianie ścieżek
- **PHP 8.5 NTS x64** — pobierz z https://windows.php.net/download/ (sekcja "Non Thread Safe")
- **Composer 2** — pobierz instalator z https://getcomposer.org/Composer-Setup.exe
- **MySQL 8.0** — najłatwiej przez XAMPP: https://www.apachefriends.org (wystarczy włączyć tylko moduł MySQL, Apache nie jest wymagany)
- **Git** — https://git-scm.com

Wymagane rozszerzenia PHP (sprawdź w `php.ini`):
```
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=pdo_sqlite
extension=zip
```

### Proces instalacji

**1. Sklonuj repozytorium**
```bash
git clone https://github.com/SebastianKuzyk/API_warsztat_samochodowy
cd warsztat-laravel
```

**2. Zainstaluj zależności PHP**
```bash
composer install
```

### Proces konfiguracji

**1. Zmienne środowiskowe**

Skopiuj plik przykładowy:
```bash
cp .env.example .env
```

Otwórz `.env` i ustaw połączenie z bazą danych:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=warsztat_laravel
DB_USERNAME=root
DB_PASSWORD=
```

Wygeneruj klucz aplikacji:
```bash
php artisan key:generate
```

**2. Baza danych**

Utwórz bazę w MySQL:
```sql
CREATE DATABASE warsztat_laravel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Lub przez phpMyAdmin: wejdź na `http://localhost/phpmyadmin` → "Nowa baza danych" → wpisz `warsztat_laravel`.

**3. Migracje — tworzenie struktury tabel**
```bash
php artisan migrate
```

**4. Dane początkowe (Seed)**
```bash
php artisan db:seed
```

Seed tworzy:
- 4 konta użytkowników (patrz tabela poniżej)
- 18 części w magazynie
- 15 typów usług warsztatowych

| Login | Hasło | Rola |
|---|---|---|
| `admin` | `admin123` | Administrator |
| `mechanik` | `mechanik123` | Mechanik |
| `recepcja` | `recepcja123` | Recepcja |
| `magazynier` | `magazynier123` | Magazynier |

**5. Uruchomienie serwera deweloperskiego**
```bash
php artisan serve
```

Aplikacja dostępna pod: **http://localhost:8000**

> Alternatywnie: kliknij dwukrotnie `URUCHOM.bat` (Windows) — sprawdza MySQL i uruchamia serwer automatycznie.

---

## Uruchomienie projektu (user)

Aplikacja jest webowa — działa w przeglądarce, nie wymaga instalacji po stronie użytkownika.

Wersja deweloperska uruchamiana lokalnie dostępna jest pod `http://localhost:8000` po wykonaniu kroków z sekcji developer.

**Wymagania sprzętowe (minimalne):**
- Procesor: 2 rdzenie
- RAM: 4 GB
- Dysk: 500 MB wolnego miejsca (zależności PHP + baza)
- Przeglądarka: Chrome 90+, Firefox 88+, Edge 90+

---

## Podręcznik użytkownika

### Role w systemie

System posiada 5 ról, każda z innym zakresem dostępu:

| Rola | Zakładki | Opis uprawnień |
|---|---|---|
| **Admin** | Dashboard, Pracownicy, Klienci, Naprawy, Faktury, Kody klientów | Pełny dostęp do wszystkiego, zarządzanie kontami pracowników |
| **Recepcja** | Dashboard, Nowe zlecenie, Auta do oddania, Zlecenia, Faktury, Kody klientów | Przyjmowanie aut, wystawianie faktur/paragonów, podgląd kodów klientów |
| **Mechanik** | Dashboard, Moje zlecenia, Magazyn, Moje zgłoszenia | Zarządzanie przypisanymi naprawami, zgłaszanie brakujących części |
| **Magazynier** | Dashboard, Magazyn części, Zgłoszenia mechaników | Zarządzanie stanem magazynu, obsługa zgłoszeń części |
| **Klient** | Moje zlecenia, Faktury | Podgląd statusu naprawy i historii (logowanie przez rejestrację + kod) |

---

### Logowanie

**Strona logowania** — `http://localhost:8000`

Dwie zakładki:
- **Pracownik** — login + hasło (np. `admin` / `admin123`)
- **Klient** — numer rejestracyjny auta + kod dostępu (przekazywany przez recepcję)

> Kod dostępu klienta to 6-znakowy ciąg generowany automatycznie przy przyjęciu auta do warsztatu. Recepcja i admin mogą go sprawdzić lub wygenerować nowy w zakładce "Kody klientów".

---

### Recepcja — Nowe zlecenie

**Ścieżka:** Zaloguj się jako recepcja → "Nowe zlecenie"

1. Wpisz dane klienta (imię, nazwisko, telefon, e-mail)
2. Wpisz dane pojazdu (marka, model, rok, rejestracja, VIN)
3. Wybierz mechanika z listy
4. Dodaj jedno lub więcej zadań:
   - wybierz typ usługi z listy (cena wypełnia się automatycznie) lub wybierz **"🛠️ Inne"** i wpisz własny opis
   - zmień cenę jeśli trzeba
5. Kliknij "Utwórz zlecenie"

Po zapisaniu wyświetli się **alert z kodem dostępu klienta**:
```
Login (rejestracja): WA12345
Kod dostępu:         A3F7B2
```
Ten kod przekaż klientowi — będzie mógł śledzić swoje zlecenie na stronie.

---

### Recepcja — Wystawienie faktury

**Ścieżka:** Recepcja → "Auta do oddania"

Gdy mechanik oznaczy wszystkie zadania jako wykonane, status zmienia się na **"Gotowe do odbioru"** i auto pojawia się w tym widoku.

1. Kliknij **"Wystaw fakturę i wydaj auto klientowi"**
2. Wybierz typ dokumentu:
   - **Faktura** — z danymi nabywcy i NIP
   - **Paragon** — bez danych nabywcy (szybsza obsługa)
3. Sprawdź/edytuj dane sprzedawcy (warsztatu)
4. Dla faktury: wpisz dane klienta (imię/firma, NIP, adres)
5. Wybierz sposób płatności i termin
6. Kliknij "Wystaw"

Faktura automatycznie ustawia zlecenie jako **"Odebrane"**. Dokument można wydrukować (`Ctrl+P` lub przycisk "Drukuj").

---

### Mechanik — Obsługa zlecenia

**Ścieżka:** Mechanik → "Moje zlecenia" → kliknij "Szczegóły"

W modalu szczegółów zlecenia:
- Zaznacz zadania jako **✓ Wykonane** — odznacza automatycznie "Brakuje części"
- Zaznacz **🔧 Brakuje części** — odznacza "Wykonane" i otwiera dialog wyboru części z magazynu lub zamówienia zewnętrznego
- Kliknij "Zapisz zmiany"

**Automatyczna zmiana statusu zlecenia:**
| Stan zadań | Status zlecenia |
|---|---|
| Żadne nie wykonane | Nierozpoczęte |
| Część wykonana | W trakcie |
| Jakiekolwiek czeka na część | Czeka na części |
| Wszystkie wykonane | Gotowe do odbioru |

---

### Mechanik — Odbiór części z magazynu

**Ścieżka:** Mechanik → "Moje zgłoszenia"

Gdy magazynier zmieni status zgłoszenia na **"Gotowa do odbioru"**, przy danym wierszu pojawia się zielony przycisk **"✓ Odebrane"**.

- Kliknięcie przycisku ustawia status na **"Odebrana"**
- Zgłoszenie znika z listy po **24 godzinach** od odbioru (zostaje w bazie, tylko nie jest domyślnie pokazywane)

---

### Magazynier — Zmiana statusu zgłoszenia

**Ścieżka:** Magazynier → "Zgłoszenia mechaników" → przycisk "Zmień status"

Zamiast okna `prompt`, otwiera się czysty modal z:
- nazwą części
- aktualnym statusem (badge kolorowy)
- selectem z dostępnymi statusami: `Brak odpowiedzi` → `Zamówiona` → `Gotowa do odbioru`

---

### Admin — Podgląd kodów klientów

**Ścieżka:** Admin → "Kody klientów" (lub Recepcja → "Kody klientów")

Tabela wszystkich pojazdów z widocznym kodem dostępu (wyróżniony czerwoną czcionką). Możliwość:
- Wyszukiwania po rejestracji, nazwisku klienta lub VIN
- Generowania **nowego kodu** (przycisk "Nowy kod") gdy klient zgubił poprzedni — stary kod natychmiast przestaje działać, nowy wyświetla się w dużym modalu do przekazania klientowi

---

### Dane przechowywane w systemie

Baza danych `warsztat_laravel` zawiera 10 tabel:

| Tabela | Opis |
|---|---|
| `users` | Konta pracowników (login, hasło, rola, dane kontaktowe) |
| `customers` | Dane klientów |
| `vehicles` | Pojazdy klientów z kodem dostępu |
| `repair_orders` | Zlecenia naprawcze ze statusem i przypisanym mechanikiem |
| `repair_tasks` | Zadania w ramach zlecenia (opis, cena, status) |
| `service_types` | Słownik predefiniowanych typów usług z cenami domyślnymi |
| `parts` | Magazyn części (nazwa, cena, ilość na stanie) |
| `order_parts` | Części użyte w konkretnym zleceniu |
| `part_requests` | Zgłoszenia mechanika do magazyniera o brakującą część |
| `invoices` | Wystawione faktury i paragony |

---

### Przypadki brzegowe

- **Numer telefonu** — system waliduje dokładnie 9 cyfr; litery lub inny format są odrzucane z komunikatem błędu
- **E-mail** — musi zawierać znak `@`; brak tego znaku = błąd
- **Login pracownika** — musi być unikalny; próba dodania duplikatu zwraca błąd "Login już istnieje"
- **Usunięcie samego siebie** — admin nie może usunąć własnego konta
- **Faktura dla zamkniętego zlecenia** — próba wystawienia drugiej faktury dla tego samego zlecenia zwraca błąd 409
- **Stan magazynowy** — mechanik nie może pobrać więcej sztuk niż jest na stanie; operacja jest blokowana
- **Walidacja formularza zlecenia** — wymagane: imię, nazwisko klienta, marka, model, rejestracja, co najmniej jedno zadanie

---

### Responsywność

Interfejs korzysta z CSS flexbox i grid zdefiniowanych w `public/css/style.css`. Sidebar na małych ekranach (< 768px) zwęża się lub można go zwinąć. Tabele mają klasę `table-container` z `overflow-x: auto` — na telefonie przewijają się poziomo zamiast ucinać dane.

> Aplikacja jest przede wszystkim narzędziem desktopowym dla personelu warsztatu. Klient ma dedykowany, uproszczony panel (`klient.html`) który jest lepiej dostosowany do urządzeń mobilnych.

---

## Plany rozbudowy

**Czego zabrakło w v1.0:**

- Brak hashowania haseł (hasła przechowywane plain-text dla zgodności z prototypem; w produkcji należy użyć bcrypt)
- Brak powiadomień e-mail/SMS do klienta gdy auto jest gotowe
- Brak eksportu do PDF (faktura działa przez `window.print()` zamiast prawdziwego PDF)
- Brak obsługi wielu filii warsztatu
- Brak wersji mobilnej aplikacji natywnej

**Funkcjonalności v2.0:**

- **Hashowanie haseł** — migracja na `password_hash()` / bcrypt
- **Powiadomienia SMS** (np. Twilio) — auto-SMS do klienta "Twój pojazd WA12345 jest gotowy do odbioru"
- **Eksport PDF** — biblioteka `dompdf` zamiast wydruku przeglądarki; faktury jako pliki `.pdf` z możliwością e-mail
- **Kalendarz przyjęć** — widok tygodniowy dla recepcji, rezerwacje terminów
- **VAT na fakturach** — podział pozycji na netto/VAT/brutto (wymóg polskich przepisów podatkowych)
- **Kody QR** na fakturze — skan przenosi klienta na stronę z jego zleceniem
- **Multi-warsztat** — kolumna `branch_id` w zleceniach, oddzielne loginy dla każdej filii
- **API mobilne** — endpointy JSON + token JWT dla aplikacji Android/iOS

**Optymalizacje techniczne:**

- **Cache Redis** dla statystyk admina (obecnie każde wejście na dashboard odpytuje bazę 10+ razy)
- **Queue** dla operacji wysyłki e-mail (nie blokuje odpowiedzi HTTP)
- **Indeksy bazy** na `repair_orders.status`, `vehicles.license_plate` (duże warsztaty, tysiące rekordów)
- **Testy automatyczne** — brak jakichkolwiek testów w v1.0; PHPUnit + Feature tests dla kontrolerów API
- **Docker** — `docker-compose.yml` z PHP + MySQL + Nginx zamiast XAMPP, łatwiejszy onboarding

---

*Projekt: System Zarządzania Warsztatem Samochodowym*
*Stack: PHP 8.5 · Laravel 13 · MySQL 8.0 · HTML/CSS/JS (vanilla)*
*Autorzy: Sebastian Kuzyk*
