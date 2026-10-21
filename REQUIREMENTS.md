# SecureScope - wymagania projektu

**Przedmiot:** Projektowanie, Bezpieczeństwo i Operacje (DevSecOps)  
**Autorzy:** Jan Bobrzyk, Julia Marek  

## 1. Cel i uzasadnienie

SecureScope ma ułatwiać wykrywanie znanych podatności w bibliotekach oraz potencjalnie niebezpiecznych ustawień w plikach konfiguracyjnych. Łączy wyniki kilku prostych analiz w jeden raport, zapisuje historię i pozwala sprawdzić, czy poprawki ograniczyły liczbę wykrytych problemów.

**Rozwiązywany problem:** manualna kontrola zależności i konfiguracji jest rozproszona między narzędziami, przez co łatwo przeoczyć znaną podatność lub niebezpieczne ustawienie.  
**Dlaczego aplikacja jest potrzebna:** oferuje prosty, wspólny interfejs i historię wyników dla niewielkich projektów.  
**Podstawowa czynność:** zalogowany użytkownik tworzy projekt, przesyła pojedynczy obsługiwany plik, uruchamia skan i przegląda raport.

Aplikacja nie służy do uruchamiania przesłanych plików ani do pełnego audytu bezpieczeństwa kodu źródłowego. Brak wykrytych problemów nie oznacza braku wszystkich podatności.

## 2. Użytkownicy i uprawnienia

| Rola | Możliwości |
| --- | --- |
| Gość | Rejestracja, logowanie, zapoznanie się z opisem aplikacji; bez dostępu do skanów i projektów |
| Zalogowany użytkownik | Tworzenie i zarządzanie własnymi projektami, przesyłanie plików, uruchamianie skanów, przeglądanie i porównywanie wyłącznie własnych wyników, zmiana statusów wykrytych problemów |

Nie planuje się panelu administratora jako osobnej funkcji użytkowej w MVP. Operacje utrzymaniowe będą realizowane poza publicznym interfejsem.

## 3. Wymagania funkcjonalne

| ID | Wymaganie | Priorytet | Kryterium akceptacji |
| --- | --- | --- | --- |
| F01 | Rejestracja konta | MVP | Użytkownik może utworzyć konto poprzez Supabase Auth |
| F02 | Logowanie i wylogowanie | MVP | Po zalogowaniu dostępne są funkcje prywatne, po wylogowaniu dostęp jest zablokowany |
| F03 | Zarządzanie własnymi projektami | MVP | Użytkownik może dodać, wyświetlić, edytować i usunąć swój projekt |
| F04 | Przesyłanie pojedynczego pliku | MVP | Aplikacja przyjmuje tylko obsługiwany format i odrzuca pozostałe |
| F05 | Analiza `requirements.txt` | MVP | Pakiety z przypiętymi wersjami są sprawdzane w OSV API, a problemy zapisane |
| F06 | Analiza `Dockerfile` | MVP | Generowany jest raport z Hadolint z opisami wykrytych problemów |
| F07 | Analiza Docker Compose | MVP | Aplikacja wykrywa wybrane ryzykowne ustawienia i wskazuje ich lokalizację |
| F08 | Raport z analizy | MVP | Wyniki zawierają typ, opis, poziom ważności (jeśli znany), plik/regułę i zalecenie |
| F09 | Filtrowanie i status problemów | MVP | Można filtrować wyniki i oznaczać problem jako otwarty, w trakcie lub rozwiązany |
| F10 | Historia skanów | MVP | Każdy skan ma datę, typ, status i przypisanie do projektu |
| F11 | Security Time Machine | Rozszerzenie po MVP | Można porównać dwa skany tego samego rodzaju w jednym projekcie i zobaczyć nowe, znikające i nadal wykrywane problemy |
| F12 | Import z publicznego GitHub | Opcjonalne | Aplikacja pobiera tylko dopuszczone konkretne pliki, bez klonowania pełnego repozytorium |

## 4. Wymagania bezpieczeństwa

| ID | Wymaganie | Plan realizacji / weryfikacja |
| --- | --- | --- |
| S01 | Bezpieczne uwierzytelnianie | Supabase Auth; backend niezależnie weryfikuje podpis, issuer, audience i ważność JWT; test żądania bez tokenu |
| S02 | Kontrola dostępu do danych (BOLA/IDOR) | Weryfikacja właściciela zasobu w API oraz RLS dla tabel; test dostępu z konta B do projektu A |
| S03 | Ochrona danych w transporcie | HTTPS/TLS w środowisku udostępnionym; brak przesyłania sekretów w URL |
| S04 | Ochrona przed SQL Injection | Parametryzowane zapytania i bezpieczna warstwa dostępu do danych; testy nietypowych wartości parametrów |
| S05 | Ochrona przed XSS | Domyślnie bezpieczne renderowanie wyników, bez wstrzykiwania HTML; kontrola CSP we wdrożeniu |
| S06 | Kontrola uploadu | Allowlista nazw/formatów, ograniczenie rozmiaru, bezpieczne parsowanie, zakaz archiwów i wykonywania przesłanej treści |
| S07 | Ochrona dostępności | Limit liczby skanów, timeouty analizatorów, limit CPU/pamięci i obsługa błędów API zewnętrznych |
| S08 | Bezpieczeństwo sesji i żądań | Bezpieczne przechowywanie tokenów, krótki czas życia i poprawna polityka CORS; ochrona CSRF, jeśli zastosowane będą sesje cookie |
| S09 | Ochrona sekretów aplikacji | Klucze uprzywilejowane tylko po stronie serwera, zmienne środowiskowe, Gitleaks w CI |
| S10 | Izolacja analizatorów | Uruchamianie analiz jako nieuprzywilejowane procesy/kontenery, bez montowania socketu Dockera i bez wykonywania plików użytkownika |
| S11 | Rejestrowanie działań | Audit log logowań (gdy dane dostępne), uruchomienia skanów i zmian statusów; bez przechowywania tokenów i sekretów |
| S12 | Kontrola bezpieczeństwa kodu i zależności | GitHub Actions uruchamia testy, Semgrep, Gitleaks i Trivy; wyniki i błędy widoczne w pull requestach |


## 5. Model zagrożeń

Model obejmuje wejście użytkownika, frontend, API, bazę danych, analizatory oraz opcjonalny import z GitHuba. Dla każdego zagrożenia podano element, konsekwencję i planowaną kontrolę.

| ID | Zagrożenie | Czego dotyczy? | Możliwe konsekwencje | Planowana kontrola |
| --- | --- | --- | --- | --- |
| T01 | Nieautoryzowany odczyt innego projektu (IDOR/BOLA) | API i baza | Ujawnienie raportów i historii skanów | RLS, weryfikacja właściciela po stronie API, testy dwóch kont |
| T02 | Podrobiony lub nieważny token | Uwierzytelnianie API | Uzyskanie nieuprawnionego dostępu | Pełna weryfikacja JWT i odrzucanie niepoprawnych tokenów |
| T03 | SQL Injection | Parametry wejściowe API i baza | Wykradzenie lub modyfikacja danych | Parametryzowane zapytania, testy API |
| T04 | XSS przez treść raportu | Frontend / opisy błędów | Wykonanie kodu w przeglądarce użytkownika | Bezpieczne renderowanie tekstu, CSP |
| T05 | Złośliwy lub ogromny YAML | Parser Compose | Nadmierne zużycie pamięci lub awaria | Bezpieczny parser, limity rozmiaru i złożoności, timeout |
| T06 | Nadużycie skanowania | Backend, OSV i analizatory | Brak dostępności lub nadmierne zużycie zasobów | Rate limiting, limity równoległości i czasu |
| T07 | Ucieczka z procesu analizy / niebezpieczne wykonanie | Analizatory plików | Wykonanie niepożądanego kodu, kompromitacja serwera | Nie wykonywać treści, izolacja analizatorów, najmniejsze uprawnienia |
| T08 | Wyciek uprzywilejowanego klucza Supabase | Repozytorium / konfiguracja | Pełen dostęp do danych | Klucze tylko po stronie backendu, Gitleaks, rotacja kluczy |
| T09 | Nieautoryzowana zmiana statusu problemu | API / historia wyników | Ukrycie nierozwiązanych problemów | Kontrola uprawnień, audyt zmian |
| T10 | Złośliwa zależność w aplikacji | Łańcuch dostaw oprogramowania | Przejęcie środowiska uruchomieniowego | SCA i kontrola zależności, aktualizacje, skanowanie CI |
| T11 | SSRF przez adres repozytorium (funkcja opcjonalna) | Pobieranie plików GitHub | Dostęp do zasobów wewnętrznych | Dopuszczone domeny i endpointy API GitHub, kontrola redirectów, brak dowolnych URL |


## 6. Ogólna architektura i przepływ

1. Użytkownik uwierzytelnia się w Supabase Auth z poziomu React.
2. Tworzy projekt i przesyła pojedynczy plik do FastAPI z tokenem dostępu.
3. FastAPI weryfikuje token, uprawnienia, nazwę/format, rozmiar i strukturę pliku.
4. Backend wybiera analizator: OSV (Python), Hadolint (Dockerfile), reguły Compose.
5. Wyniki zostają znormalizowane i zapisane do Supabase PostgreSQL w ramach projektu użytkownika.
6. Frontend pokazuje raport, statusy oraz historię i umożliwia porównywanie skanów po wdrożeniu rozszerzenia.


## 7. Plan implementacji i podział na osoby

| Obszar | Osoba 1 - AppSec & Vulnerability Analysis | Osoba 2 - Infrastructure Security & DevSecOps |
| --- | --- | --- |
| API, baza, Auth | FastAPI, RLS, API projektów i wyników, JWT | Endpoint uploadu, walidacja danych, obsługa zadań analizy |
| Moduły analizy | `requirements.txt`, OSV | `Dockerfile`, Compose |
| React | Logowanie, lista projektów, szczegóły podatności | Upload, dashboard, historia i porównanie skanów |
| Bezpieczeństwo | IDOR/BOLA, uprawnienia, SQL Injection, testy API | Bezpieczeństwo plików, izolacja, limity, sekrety, CI/CD |
| Testy | Pytest, RLS i scenariusze API | Testy parserów, uploadu, SAST/SCA/Trivy |

**Wspólnie:** schemat architektury, model zagrożeń, kontrakt API, review pull requestów, testy integracyjne i dokumentacja.

