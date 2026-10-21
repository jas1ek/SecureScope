# SecureScope - diagram działania aplikacji

```mermaid

flowchart TD
    A["Użytkownik"] --> B["React - interfejs webowy"]
    B --> C["Supabase Auth - logowanie"]
    C --> B
    B --> D["FastAPI - backend"]
    D --> E{"Walidacja pliku"}
    E -->|Odrzucony| F["Komunikat błędu"]
    E -->|Poprawny| G{"Rodzaj analizy"}
    G --> H["OSV API - requirements.txt"]
    G --> I["Hadolint - Dockerfile"]
    G --> J["Reguły - Docker Compose"]
    H --> L["Normalizacja wyników"]
    I --> L
    J --> L
    L --> M[("Supabase PostgreSQL")]
    M --> N["Raport bezpieczeństwa"]
    N --> O["Historia i porównanie skanów"]
  
```

## Zasady bezpieczeństwa

- API weryfikuje token JWT i uprawnienia niezależnie od frontendu.
- Baza ma polityki RLS dla danych użytkowników.
- Tylko obsługiwane typy plików są dozwolone; brak uruchamiania przesłanych plików.
- Skanowanie odbywa się z limitami zasobów i czasowymi, w izolowanym środowisku.
- Wyniki są zapisywane bez ujawniania pełnych sekretów z przesłanych plików.
- Import z GitHuba to opcjonalne rozszerzenie, nieujęte w podstawowym diagramie.

## Prosty diagram procesu z perspektywy użytkownika

```mermaid
flowchart LR
    A[Założenie konta] --> B[Logowanie]
    B --> C[Utworzenie projektu]
    C --> D[Przesłanie pliku]
    D --> E[Walidacja i analiza]
    E --> F[Raport bezpieczeństwa]
    F --> G[Wprowadzenie poprawek]
    G --> H[Nowy skan]
    H --> I[Porównanie wyników]
```
