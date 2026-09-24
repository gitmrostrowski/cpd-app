# CRPE v6.31 — pełne repozytorium

Bazą jest pełne v6.30 znalezione wewnątrz `files (8).zip`, porównane plik po pliku z `CRPE_Home_v6.29.4_PELNE_REPO.zip`. Zachowano zmiany wizualne v6.30 i uzupełniono je o poprawki nawigacji oraz responsywności.

## Co zawiera wydanie

- Wyróżnione „Dla placówek” w nawigacji publicznej i aplikacji, również na telefonie i dla zalogowanego użytkownika.
- Odnośnik pod przyciskami hero, bez odrywającej się strzałki i bez łamania etykiety „Dla placówek”.
- Granatowa sekcja po „Trzech krokach”: funkcje, panel przykładowej placówki i oba przyciski. Więcej miejsca dla jednostek i osób; jedna kolumna na mniejszych ekranach.
- Kontakt z pierwszą, największą, ciemną kartą placówki; nowy układ Narzędzi i Bezpieczeństwa.
- Wspólne logo, jasna stopka, płaskie nagłówki ekranów i warstwa `app-v15.css`; główne pozycje menu bez ikon.
- Plus Jakarta Sans w `app/layout.tsx`, także w sprawdzonej kompilacji — bez zastępczego fontu.
- Zakładki narzędzi na Home zawijają się zamiast przewijać poziomo.

## Wdrożenie

1. Rozpakuj `CRPE_v6.31_PELNE_REPO.zip`. Kod znajduje się w `cpd-app-main`; zrzuty i raporty są osobno.
2. Zrób kopię swojego repozytorium. Przenieś zawartość `cpd-app-main`, zachowując własne `.git` oraz pliki `.env*`. Paczka nie zawiera danych dostępowych ani testowej sesji.
3. Użyj Node.js 24 (sprawdzono 24.19.0) i uruchom `npm ci`.
4. Zachowaj dotychczasową konfigurację Supabase i pozostałe zmienne środowiska. To wydanie nie wymaga nowych migracji SQL ani zmian zależności. `package-lock.json` pozostał identyczny z paczką wejściową.
5. Uruchom `npm run check:release`, `npx tsc --noEmit`, `npm run lint`, następnie `npm run build`. Kompilacja potrzebuje dostępu do Google Fonts do pobrania Plus Jakarta Sans.
6. Uruchom `npm start` lub wdróż projekt dotychczasowym sposobem. Sprawdź własne konto, przełączanie placówek i uprawnienia admina na rzeczywistych danych.

## Zakres i ograniczenia sprawdzenia

Bieżący zestaw wydaniowy: **24/24**. TypeScript: **0 błędów**. ESLint: **0 błędów, 86 ostrzeżeń**. Kompilacja produkcyjna: **poprawna**.

Uruchomiono także wszystkie 69 skryptów kontrolnych: **47 poprawnych, 22 nieudane**. Wszystkie 22 nieudane kontrole zawodzą również w bazowym v6.29.4. Nie zmieniano ich wymagań ani nie przepisywano aplikacji pod historyczne testy. Szczegóły zawiera `RAPORT-TESTOW-v6.31.md` i katalog `validation`.

Zrzuty wykonano na szerokościach 390 i 1440 px. Ekrany konta używają sztucznej sesji i pustych danych; to sprawdzenie wyglądu, a nie integracja z produkcyjną bazą. Formularz kontaktowy otwarto i sprawdzono wizualnie, bez wysyłania wiadomości. Brak poziomego przewijania stwierdzono w sprawdzonych widokach; nie jest to gwarancja dla wszystkich możliwych danych, dynamicznych ekranów placówki ani stanów admina.

Nie zmieniano logiki autoryzacji, kont, placówek ani admina. Wnętrza Panelu CPD, Aktywności, Bazy szkoleń, Raportów i Profilu pozostają zachowane poza stylem. W Panelu CPD zachowano zmianę klas z v6.30: trzy kolumny zakładek i dostosowany odstęp pod nagłówkiem. Pomoc, Regulamin, Polityka prywatności i Logowanie nie zostały przepisane.
