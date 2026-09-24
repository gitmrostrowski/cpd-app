# CRPE Home v6.29.1 — pełne repo

Wersja v6.29 od Claude’a przeniesiona na dostarczone repo v6.28.29 i sprawdzona po integracji. Zachowano zaakceptowany układ, kolory i font Plus Jakarta Sans.

## Wgranie
1. Rozpakuj ZIP.
2. Skopiuj zawartość folderu `cpd-app-main` do swojego lokalnego repo, zastępując pliki.
3. Zachowaj swoje `.git` i pliki `.env`.
4. Zrób commit i push jak poprzednio.

Nie potrzeba SQL ani zmian ustawień bazy. Zależności i package-lock.json są identyczne z v6.28.29.

Nie musisz usuwać HomeAudience.tsx. W tej paczce pozostawiono go jako nieużywany plik zgodności, aby aktualizacja przez kopiowanie była prosta. Home v15 go nie importuje. Dawne zdjęcia i CSS również pozostały nieużywane. Niniejsza instrukcja zastępuje uwagę o usunięciu pliku w instrukcji v6.29.

## Poprawki podczas integracji
- Przykładowy panel ma jawną datę 24.09.2026 zamiast starzejącego się znacznika „Dziś”.
- Opisy nie sugerują automatycznego dopasowywania certyfikatów ani niepotwierdzonego czasu dodawania wpisu.
- Menu zamyka się przy rzeczywistym przejściu do nawigacji desktopowej.
- Nagłówek i tabela aktywności mieszczą się na ekranie 320 px.
- Naprawiono konfigurację ESLint dla skryptów CommonJS, bez wyłączania kontroli kodu aplikacji.

## Sprawdzenie
- 22/22 kontrole `npm run check:release`.
- Produkcyjny build i TypeScript — poprawne, z oryginalnym fontem Google, bez zamiany na font zastępczy.
- ESLint — 0 błędów, 88 ostrzeżeń w istniejącym kodzie repo.
- Sprawdzone zakładki, strzałki klawiatury, menu mobilne, Escape i FAQ.
- Układ kontrolowany przy 320, 390, 768, 1024, 1280, 1440 i 1920 px.
- Widok gościa sprawdzony w przeglądarce; wariant zalogowany testem renderowania z podstawioną sesją. Nie wykonywano logowania do produkcyjnej bazy.

Podczas builda użyto wyłącznie lokalnych wartości zastępczych konfiguracji Supabase. Nie są zapisane w repo ani ZIP-ie. Panel Home pokazuje oznaczone dane przykładowe.
