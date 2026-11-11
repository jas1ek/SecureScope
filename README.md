# Secure Scope - Vulnerability & Configuration Analyzer

**Przedmiot:** Projektowanie, Bezpieczeństwo i Operacje (DevSecOps)  
**Autorzy:** Jan Bobrzyk, Julia Marek

## Opis projektu

Secure Scope to aplikacja webowa rozwijana w ramach projektu DevSecOps. Docelowo pozwoli analizować podatności zależności i ryzykowne ustawienia w plikach konfiguracyjnych. Obecny etap 2 obejmuje działające uwierzytelnianie, zarządzanie projektami użytkowników, bazę danych, API i interfejs webowy. Skanery i raportowanie są planowane na kolejne etapy.

## Stan implementacji - etap 2

**Zaimplementowano i sprawdzono:**

- Rejestrację i logowanie użytkowników przez FastAPI.
- Przechowywanie hashy haseł w formacie Argon2id.
- Uwierzytelnianie za pomocą JWT.
- CRUD projektów: utworzenie, lista, szczegóły, edycja i usunięcie.
- Kontrolę właściciela projektu po stronie API.
- Walidację żądań i odpowiedzi błędów HTTP.
- PostgreSQL 17, modele SQLAlchemy i migracje Alembic.
- Interfejs React + TypeScript + Vite.
- Lokalną integrację trzech usług przez Docker Compose.
- Testy backendu oraz konfigurację GitHub Actions dla frontendu.

**Zweryfikowane scenariusze:**

- Użytkownik A nie widzi projektów użytkownika B na liście.
- Użytkownik B nie może odczytać, edytować ani usunąć projektu A po podaniu jego ID - HTTP 404.
- Po odmowie edycji i usunięcia projekt A pozostaje dostępny dla A - HTTP 200.
- Żądania chronione bez tokenu i z niepoprawnym tokenem są odrzucane - HTTP 401.
- Pusta lub brakująca nazwa projektu oraz nazwa o długości 151 znaków są odrzucane - HTTP 422.
- Logowanie z błędnym hasłem jest odrzucane - HTTP 401.
- Publiczny endpoint `/health` zwraca HTTP 200 i `{"status":"ok"}`.
- Relacje `users -> projects -> scans` istnieją w bazie.

## Funkcjonalności planowane

- Analiza pliku `requirements.txt` z wykorzystaniem OSV API.
- Analiza `Dockerfile`, np. z wykorzystaniem Hadolint.
- Analiza `docker-compose.yml` i `compose.yml` pod kątem ryzykownych ustawień.
- Analiza przykładowych plików `.env.example` bez przesyłania rzeczywistych sekretów.
- Kontrolowany upload jednego pliku z allowlisty, z limitami rozmiaru.
- Raporty wyników, historia skanów, statusy wykrytych problemów.
- Porównywanie skanów (Security Time Machine).


## Technologie

| Obszar | Technologia |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Python, FastAPI |
| Autoryzacja | JWT, Argon2id |
| ORM | SQLAlchemy |
| Baza | PostgreSQL 17 |
| Migracje | Alembic |
| Testy backendu | Pytest |
| Uruchomienie | Docker Compose |
| CI | GitHub Actions |
| Współpraca | GitHub, pull requesty, code review |

## Architektura i dane

Aplikacja składa się z usług `frontend`, `backend` i `db` uruchamianych w Docker Compose. Przeglądarka wysyła żądania HTTP do FastAPI, a API wykonuje operacje na PostgreSQL. Chronione endpointy wymagają nagłówka `Authorization: Bearer <token>`.

W bazie istnieją tabele:

- `users` - identyfikator, adres e-mail, hash hasła i data utworzenia.
- `projects` - projekty z `user_id` wskazującym właściciela.
- `scans` - rekordy powiązane z projektami przez `project_id` (podstawa przyszłych analiz).
- `alembic_version` - wersjonowanie migracji.

Klucze obce: `projects.user_id -> users.id`, `scans.project_id -> projects.id`.

Diagram: [DIAGRAM.md](DIAGRAM.md).

## Wymagania środowiskowe

- Git.
- Docker Desktop lub Docker Engine i Docker Compose.
- Dostępne porty `5173`, `8000`, `5432`.

Przy uruchamianiu całości przez Docker Compose nie trzeba instalować Pythona, Node.js ani PostgreSQL na komputerze hosta.

## Instalacja i uruchomienie

### 1. Pobranie repozytorium

```bash
git clone https://github.com/jas1ek/SecureScope.git
cd SecureScope
```

### 2. Konfiguracja środowiska

**Tylko przy pierwszej instalacji** skopiuj szablon:

```bash
cp .env.example .env
```


Wygeneruj klucz JWT:

```bash
openssl rand -hex 32
```

Otwórz `.env`:

```bash
nano .env
```

Przykładowy układ pliku (wartości są przykładowe):

```dotenv
POSTGRES_USER=securescope
POSTGRES_PASSWORD=change_me
POSTGRES_DB=securescope

DATABASE_URL=postgresql+psycopg://securescope:change_me@db:5432/securescope
JWT_SECRET_KEY=REPLACE_WITH_RANDOM_SECRET
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

VITE_API_URL=http://localhost:8000
```

- Zastąp `change_me` własnym hasłem **w obu miejscach**.
- Zastąp `REPLACE_WITH_RANDOM_SECRET` wynikiem `openssl rand -hex 32`.
- Host PostgreSQL wewnątrz Docker Compose to `db`, a **nie** `localhost`.
- Znaki specjalne w haśle osadzonym w `DATABASE_URL` muszą być poprawnie zakodowane jako URL.
- Trzymaj `.env` wyłącznie lokalnie; nie dodawaj go do Git.
- Przy już istniejącym wolumenie PostgreSQL zmiana `POSTGRES_PASSWORD` w `.env` **nie zmienia automatycznie** hasła użytkownika zapisanego w bazie.

### 3. Start aplikacji

Uruchom Docker Desktop i w katalogu głównym repozytorium wykonaj:

```bash
./start.sh
```

Skrypt automatycznie:
- Sprawdza dostępność Dockera i Docker Compose.
- Tworzy plik `.env`, jeśli jeszcze nie istnieje.
- Generuje losowe hasło PostgreSQL i klucz JWT przy pierwszym uruchomieniu.
- Zachowuje istniejącą konfigurację `.env`.
- Uruchamia PostgreSQL, backend FastAPI i frontend React.
- Uruchamia migracje Alembic podczas startu backendu.

Alternatywnie, jeśli plik `.env` jest już skonfigurowany, aplikację można uruchomić bezpośrednio:

```bash
docker compose up -d --build
```

Sprawdź:

```bash
docker compose config --services
docker compose ps
```

Oczekiwane usługi: `db`, `frontend`, `backend`. PostgreSQL powinien być `healthy`, a pozostałe usługi `Up`. Backend podczas startu wykonuje migracje Alembic.
### 4. Adresy usług

| Funkcja | Adres |
| --- | --- |
| Aplikacja | http://localhost:5173 |
| Rejestracja | http://localhost:5173/register |
| Logowanie | http://localhost:5173/login |
| Dokumentacja API (Swagger) | http://localhost:8000/docs |
| Health check | http://localhost:8000/health |

### 5. Test działania

```bash
curl -i http://localhost:8000/health
```

Oczekiwane HTTP 200 i odpowiedź:

```json
{"status":"ok"}
```

Następnie zarejestruj konto na stronie, zaloguj się i sprawdź tworzenie, edycję i usuwanie projektów.

Aby zobaczyć tabele bazy:

```bash
docker compose exec db psql -U securescope -d securescope -c "\dt"
```

Powyższe polecenie zakłada wartości `POSTGRES_USER=securescope` i `POSTGRES_DB=securescope` z przykładowej konfiguracji.

### 6. Zatrzymanie i ponowny start

```bash
docker compose down
```

```bash
docker compose up -d --build
```



## Endpointy API

| Metoda | Endpoint | Wymaga JWT | Przeznaczenie |
| --- | --- | --- | --- |
| GET | `/health` | Nie | Stan API |
| POST | `/auth/register` | Nie | Rejestracja |
| POST | `/auth/login` | Nie | Logowanie, pobranie JWT |
| GET | `/projects` | Tak | Lista własnych projektów |
| POST | `/projects` | Tak | Nowy projekt |
| GET | `/projects/{project_id}` | Tak | Szczegóły własnego projektu |
| PATCH | `/projects/{project_id}` | Tak | Edycja własnego projektu |
| DELETE | `/projects/{project_id}` | Tak | Usunięcie własnego projektu |




## Dokumentacja

- [REQUIREMENTS.md](REQUIREMENTS.md) - wymagania z rozróżnieniem etap 2 / funkcje planowane.
- [DIAGRAM.md](DIAGRAM.md) - architektura bieżąca i docelowa.

## Repozytorium

https://github.com/jas1ek/SecureScope
