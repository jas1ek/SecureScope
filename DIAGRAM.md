# Secure Scope - diagram architektury


## 1. Zaimplementowana architektura

```mermaid
flowchart TD
    U[Użytkownik / przeglądarka] --> FE[React + TypeScript / Vite]
    FE -->|HTTP: rejestracja, logowanie, projekty| API[FastAPI]
    API -->|JWT i kontrola dostępu do projektów| AUTH[Uwierzytelnianie / autoryzacja]
    API -->|SQLAlchemy| DB[(PostgreSQL 17)]
    MIG[Alembic - migracje] --> DB
    DB --> USERS[users]
    DB --> PROJECTS[projects]
    DB --> SCANS[scans - podstawa pod przyszłe skany]
```

Usługi `frontend`, `backend` i `db` działają w Docker Compose. Przeglądarka kontaktuje się z API na `localhost:8000`; backend łączy się z bazą przez wewnętrzny host `db:5432`.

## 2. Logowanie i obsługa projektów - etap 2

```mermaid
flowchart TD
    A[Użytkownik] --> B[Rejestracja lub logowanie]
    B --> C[FastAPI: weryfikacja danych]
    C --> D[PostgreSQL: users / hash Argon2id]
    D --> E[Wydanie JWT po poprawnym logowaniu]
    E --> F[React: żądanie z Bearer JWT]
    F --> G[FastAPI: weryfikacja JWT]
    G --> H{Czy użytkownik jest właścicielem projektu?}
    H -->|Tak| I[Odczyt / edycja / usunięcie projektu]
    H -->|Nie| J[HTTP 404]
    I --> K[(PostgreSQL: projects)]
```

Dla tworzenia projektu backend przypisuje właściciela na podstawie zalogowanego użytkownika. Lista projektów jest filtrowana po `user_id`. Dla brakującego/niepoprawnego tokenu endpointy chronione zwracają HTTP 401.

## 3. Model relacji

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    PROJECTS ||--o{ SCANS : contains
    USERS {
        int id PK
        varchar email UK
        varchar password_hash
        timestamptz created_at
    }
    PROJECTS {
        int id PK
        int user_id FK
        varchar name
        text description
        timestamptz created_at
    }
    SCANS {
        int id PK
        int project_id FK
        varchar status
        timestamptz created_at
    }
```

Tabela `scans` istnieje, ale sam fakt jej istnienia nie oznacza, że interfejs skanowania i analizatory zostały zaimplementowane.

## 4. Docelowy proces analizy - plan

Poniższy diagram opisuje **funkcje na kolejne etapy**, a nie aktualnie działające endpointy.

```mermaid
flowchart TD
    A[Zalogowany użytkownik] --> B[Wybór projektu i przesłanie jednego pliku]
    B --> C{Walidacja typu, rozmiaru i treści}
    C -->|Odrzucony| D[Komunikat błędu]
    C -->|Zaakceptowany| E{Typ pliku}
    E --> F[requirements.txt - OSV API]
    E --> G[Dockerfile - Hadolint / reguły]
    E --> H[Compose - reguły konfiguracji]
    E --> I[.env.example - reguły / sekrety]
    F --> J[Ujednolicenie wyników]
    G --> J
    H --> J
    I --> J
    J --> K[(PostgreSQL: historia i raporty)]
    K --> L[Raport i zalecenia]
    L --> M[Porównanie skanów - rozszerzenie]
```

## 5. Zabezpieczenia

**Zaimplementowane i przetestowane w etapie 2:**

- Hashe haseł w formacie Argon2id.
- JWT dla chronionych endpointów.
- Weryfikacja właściciela przy operacjach na projekcie (BOLA/IDOR).
- Walidacja nazw i opisów projektów.
- Parametryzowany dostęp do bazy przez SQLAlchemy.
- Sekrety konfiguracyjne przekazywane przez zmienne środowiskowe.

**Planowane / wymagające dalszej weryfikacji:**

- Bezpieczny upload, ograniczenia wielkości pliku, izolacja analizatorów i timeouty.
- Rate limiting, dodatkowe zabezpieczenia wdrożeniowe i audyt zdarzeń.
- Skanowanie kodu, zależności, sekretów i obrazów w CI zgodnie z planem projektu.
- TLS/HTTPS i nagłówki bezpieczeństwa przy wdrożeniu poza środowiskiem lokalnym.

## 6. Granice zaufania

1. **Przeglądarka -> API:** token i dane wejściowe są niezaufane, backend samodzielnie weryfikuje uwierzytelnianie, parametry i uprawnienia.
2. **API -> baza:** dostęp realizowany przez usługę backendu; kontrola własności projektu jest w logice API, a nie w Supabase RLS.
3. **Przyszły upload -> analizator:** zawartość pliku będzie traktowana jako niezaufane dane i nie może być wykonywana jako kod użytkownika.
