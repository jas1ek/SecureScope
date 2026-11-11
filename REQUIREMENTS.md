# Secure Scope - wymagania projektu

**Przedmiot:** Projektowanie, Bezpieczeństwo i Operacje (DevSecOps)  
**Autorzy:** Jan Bobrzyk, Julia Marek

## 1. Cel i zakres

Secure Scope ma ułatwić wykrywanie podatności w zależnościach oraz ryzykownych konfiguracji projektów programistycznych. Docelowo użytkownik będzie mógł przesłać pojedynczy obsługiwany plik, uruchomić analizę i przejrzeć raport, historię oraz porównanie skanów.

**Zakres etapu 2:** działający szkielet aplikacji, baza danych z relacjami, uwierzytelnianie, bezpieczne operacje na własnych projektach, podstawowa walidacja, uruchomienie kontenerowe i dokumentacja.

**Poza ukończonym zakresem etapu 2:** upload plików, uruchamianie analizatorów, raporty podatności, historia i porównywanie wyników. Ich realizacja pozostaje zaplanowana.

## 2. Użytkownicy i uprawnienia

| Rola | Zakres |
| --- | --- |
| Gość | Rejestracja i logowanie; bez dostępu do projektów |
| Zalogowany użytkownik | Tworzenie, lista, odczyt, edycja i usuwanie wyłącznie własnych projektów |

Panel administratora nie stanowi funkcji użytkowej planowanego MVP.

## 3. Wymagania funkcjonalne

**Statusy:** `Wykonane` = implementacja i podstawowe działanie potwierdzone; `Planowane` = nie należy przedstawiać jako gotowego elementu etapu 2.

| ID | Wymaganie | Priorytet projektu | Status | Kryterium akceptacji |
| --- | --- | --- | --- | --- |
| F01 | Rejestracja konta | Podstawowy | Wykonane | Nowy użytkownik może utworzyć konto przez FastAPI |
| F02 | Logowanie i dostęp do funkcji prywatnych | Podstawowy | Wykonane | Poprawne dane dają JWT, błędne hasło daje HTTP 401 |
| F03 | CRUD własnych projektów | Podstawowy | Wykonane | Użytkownik może tworzyć, odczytywać, edytować i usuwać własne projekty |
| F04 | Publiczny health check | Podstawowy | Wykonane | GET `/health` -> HTTP 200 i `{"status":"ok"}` |
| F05 | Trwała baza danych z relacjami | Podstawowy | Wykonane | PostgreSQL: `users`, `projects`, `scans`, klucze obce |
| F06 | Automatyczne migracje | Podstawowy | Wykonane | Alembic uruchamia się przy starcie backendu |
| F07 | Przesyłanie pojedynczego pliku | MVP docelowe | Planowane | Allowlista typów, walidacja i limity |
| F08 | Analiza `requirements.txt` | MVP docelowe | Planowane | Zapytania do OSV API dla jednoznacznych wersji |
| F09 | Analiza `Dockerfile` | MVP docelowe | Planowane | Raport Hadolint / reguł bezpieczeństwa |
| F10 | Analiza pliku Compose | MVP docelowe | Planowane | Wykrywanie wybranych niebezpiecznych ustawień |
| F11 | Analiza `.env.example` | MVP docelowe | Planowane | Wykrywanie podejrzanych wpisów bez ujawniania sekretów |
| F12 | Raport, filtrowanie i statusy problemów | MVP docelowe | Planowane | Wyniki z opisem, priorytetem i zaleceniami |
| F13 | Historia skanów | MVP docelowe | Planowane | Skany powiązane z projektem i datą wykonania |
| F14 | Security Time Machine | Rozszerzenie | Planowane | Porównanie nowych, usuniętych i powtarzających się wyników |
| F15 | Import plików z publicznego GitHub | Opcjonalne | Planowane | Tylko dopuszczone pliki, bez pełnego klonowania repozytorium |

## 4. Wymagania bezpieczeństwa

| ID | Wymaganie | Status etapu 2 / weryfikacja |
| --- | --- | --- |
| S01 | Hasła przechowywane bezpiecznie | Wykonane: `password_hash` w formacie Argon2id, zweryfikowane dla dwóch kont |
| S02 | Uwierzytelnianie | Wykonane: JWT, żądania bez tokenu i z błędnym tokenem odrzucane (HTTP 401) |
| S03 | Kontrola dostępu BOLA/IDOR | Wykonane: weryfikacja właściciela w FastAPI; testy GET/PATCH/DELETE cudzego projektu zwracają HTTP 404 |
| S04 | Walidacja danych | Wykonane: Pydantic; brak nazwy, pusta nazwa, nazwa >150 znaków zwracają HTTP 422 |
| S05 | Ochrona przed SQL Injection | Dostęp przez SQLAlchemy; dodatkowe negatywne testy bezpieczeństwa zalecane |
| S06 | Bezpieczeństwo sesji i CORS | JWT i konfiguracja CORS są zaimplementowane; przegląd przechowywania tokenów i polityk wdrożeniowych zalecany |
| S07 | Sekrety aplikacji | `.env` poza Git, `JWT_SECRET_KEY` w konfiguracji backendu; placeholder w `.env.example` |
| S08 | HTTPS/TLS | Planowane dla środowiska udostępnionego; lokalny development wykorzystuje HTTP |
| S09 | Bezpieczny upload i parsowanie | Planowane: allowlista, limity, zakaz wykonywania przesłanych plików |
| S10 | Izolacja i ograniczenia skanerów | Planowane: nieuprzywilejowane uruchamianie, timeouty, limity zasobów |
| S11 | Ochrona przed XSS i bezpieczne raporty | Do weryfikacji wraz z implementacją raportów; bez wstrzykiwania HTML |
| S12 | Logowanie zdarzeń i monitoring | Planowane: audyt istotnych operacji bez logowania tokenów i sekretów |
| S13 | Bezpieczeństwo łańcucha dostaw | GitHub Actions dla frontendu działa; dalsze narzędzia SAST/SCA/sekrety/obrazy zgodnie z planem |


## 5. Model zagrożeń

| ID | Zagrożenie | Konsekwencja | Kontrola / stan |
| --- | --- | --- | --- |
| T01 | IDOR/BOLA w projektach | Odczyt lub zmiana cudzych danych | Weryfikacja `user_id` w API; przetestowana |
| T02 | Podrobiony lub nieważny JWT | Nieuprawniony dostęp | Weryfikacja tokenu i HTTP 401; podstawowe testy wykonane |
| T03 | SQL Injection | Odczyt lub zmiana bazy | ORM i parametryzacja |
| T04 | XSS przez przyszły raport | Wykonanie skryptu w przeglądarce | Bezpieczne renderowanie wyników; planowane testy |
| T05 | Złośliwy / ogromny YAML | Nadmierne zużycie zasobów | Limity rozmiaru, bezpieczny parser; planowane |
| T06 | Nadużycie analizatorów | Spadek dostępności API | Rate limiting, limity czasu i współbieżności; planowane |
| T07 | Niebezpieczne wykonanie pliku | Kompromitacja serwera | Plik traktowany jako dane, izolacja procesu; planowane |
| T08 | Wyciek klucza JWT lub hasła DB | Podszywanie się / dostęp do danych | `.env` poza Git, rotacja sekretów, kontrola CI |
| T09 | Nieuprawniona zmiana statusu podatności | Ukrycie problemu | Kontrola właściciela i audit log; planowane |
| T10 | Złośliwa zależność aplikacji | Kompromitacja procesu budowy | Audyty zależności, CI, aktualizacje; dalszy rozwój |
| T11 | SSRF przy imporcie z GitHub | Dostęp do zasobów wewnętrznych | Allowlista API i domen, kontrola redirectów; opcjonalne |

## 6. Architektura i przepływ

**Zaimplementowany etap 2:**

1. Użytkownik rejestruje się albo loguje poprzez React i FastAPI.
2. Backend przechowuje hash hasła w PostgreSQL i wydaje JWT po poprawnym logowaniu.
3. React wysyła żądania projektowe z JWT.
4. FastAPI weryfikuje token, dane wejściowe i właściciela projektu.
5. SQLAlchemy zapisuje lub odczytuje dane PostgreSQL.
6. Frontend wyświetla wyłącznie projekty danego użytkownika.

**Przyszły proces skanowania:**

1. Użytkownik wybiera projekt i przesyła pojedynczy obsługiwany plik.
2. Backend sprawdza format, rozmiar i bezpieczeństwo treści.
3. Wybierany jest analizator zależności lub konfiguracji.
4. Wyniki są normalizowane i zapisywane w bazie.
5. Frontend prezentuje raport, historię i opcjonalne porównanie skanów.

Zobacz [DIAGRAM.md](DIAGRAM.md).

## 7. Podział pracy

| Obszar | Julia Marek - backend / AppSec | Jan Bobrzyk - frontend / infrastruktura |
| --- | --- | --- |
| Etap 2 | FastAPI, rejestracja, logowanie, JWT, Argon2id, CRUD, SQLAlchemy, Alembic | React, ekrany użytkowników, obsługa CRUD, integracja API, Docker Compose, frontend CI, dokumentacja |
| Bezpieczeństwo | Testy API i kontroli dostępu | Testy integracyjne, uruchamianie na drugim komputerze, weryfikacja konfiguracji |
| Kolejne etapy | OSV / analiza zależności, rozwój backendu i API wyników | Upload, analiza Dockerfile/Compose, dashboard, historia i infrastruktura analizatorów |

Wspólnie: architektura, model zagrożeń, testy integracyjne, code review i dokumentacja.

