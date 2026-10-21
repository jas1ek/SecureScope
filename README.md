# SecureScope - Vulnerability & Configuration Analyzer

**Przedmiot:** Projektowanie, Bezpieczeństwo i Operacje (DevSecOps)  
**Autorzy:** Jan Bobrzyk, Julia Marek  

## Opis projektu

SecureScope to aplikacja webowa służąca do analizy bezpieczeństwa zależności i wybranych plików konfiguracyjnych projektów programistycznych. Użytkownik zakłada konto, tworzy projekt, przesyła pojedynczy obsługiwany plik, a następnie otrzymuje raport wykrytych podatności lub ryzykownych konfiguracji wraz z zaleceniami ich poprawy. Aplikacja przechowuje historię analiz, umożliwia zarządzanie stanem wykrytych problemów oraz porównywanie skanów.

**Problem:** zależności i konfiguracje projektów mogą zawierać znane podatności lub błędy bezpieczeństwa; ręczne sprawdzanie ich wieloma narzędziami jest czasochłonne.  
**Odbiorcy:** programiści, studenci informatyki oraz małe zespoły AppSec/DevSecOps.  
**Podstawowa operacja:** po zalogowaniu użytkownik przesyła pojedynczy plik i uruchamia analizę, po czym przegląda raport przypisany do swojego konta.

## Obsługiwane dane wejściowe - MVP

| Plik | Analiza |
| --- | --- |
| `requirements.txt` | Wykrywanie znanych podatności bibliotek Python w oparciu o OSV API (dla jednoznacznie wskazanych wersji) |
| `Dockerfile` | Analiza dobrych praktyk i ryzykownych instrukcji, m.in. z wykorzystaniem Hadolint |
| `docker-compose.yml` / `compose.yml` | Reguły dotyczące uprawnień i niebezpiecznych ustawień kontenerów |
| `.env.example` | Kontrola potencjalnych sekretów i niebezpiecznych flag konfiguracyjnych; nie należy przesyłać rzeczywistych sekretów |

Użytkownik przesyła tylko **pojedyncze pliki** z allowlisty - nie foldery, repozytoria ani archiwa z pełnym kodem. Pliki traktowane są jako dane i nie są uruchamiane.

## Technologie

- **Frontend:** React, TypeScript, Vite
- **Backend i API:** Python, FastAPI
- **Baza danych, użytkownicy:** Supabase PostgreSQL, Supabase Auth, Row Level Security (RLS)
- **Analiza:** OSV API, Hadolint, dedykowane reguły walidacji konfiguracji, reguły wykrywania sekretów
- **Testowanie i automatyzacja:** Pytest, GitHub Actions, Semgrep, Gitleaks, Trivy
- **Uruchomienie lokalne:** Docker Compose
- **Organizacja pracy:** GitHub, GitHub Projects, pull requesty i code review

## Podział zadań

### Osoba 1 - Application Security & Vulnerability Analysis
- FastAPI, integracja Supabase Auth i weryfikacja tokenów.
- Schemat danych, RLS i kontrola dostępu do projektów oraz raportów.
- Analiza `requirements.txt`, OSV API i prezentacja podatności.
- Widoki logowania, projektów i wyników analiz.
- Testy autoryzacji, IDOR/BOLA i endpointów.

### Osoba 2 - Infrastructure Security & DevSecOps
- Bezpieczny upload, ograniczenia rozmiaru i walidacja wejścia.
- Analiza `Dockerfile`, `docker-compose.yml`, `.env.example`.
- Dashboard, historia skanów i widok porównania skanów.
- Docker Compose i GitHub Actions; SAST, skanowanie sekretów i zależności.
- Testy analizatorów, parserów, limitów i obsługi błędów.

**Wspólnie:** architektura, model zagrożeń, kontrakt API, Security Time Machine (logika w API i interfejs), testy integracyjne, przeglądy kodu oraz dokumentacja.


## Dokumentacja

- [`REQUIREMENTS.md`](REQUIREMENTS.md) - wymagania funkcjonalne i bezpieczeństwa, użytkownicy oraz model zagrożeń.
- [`DIAGRAM.md`](DIAGRAM.md) - schemat architektury i przepływu działania (Mermaid).

