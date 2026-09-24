# CRPE v6.29.4 — pełne repo

Wydanie integruje dostarczone zmiany v6.29.2 i v6.29.3 z poprzednim repo v6.29.1.

## Wgranie
1. Rozpakuj ZIP.
2. Skopiuj zawartość folderu cpd-app-main do swojego repozytorium.
3. Zachowaj własny folder .git oraz lokalne pliki .env.
4. Zatwierdź zmiany i wyślij je do GitHub jak wcześniej.

Nie są potrzebne zmiany SQL. Backend, migracje, zależności i package-lock.json pozostają bez zmian. Archiwum nie zawiera sekretów, node_modules ani katalogu .next.

## Zakres
- Mniejsza typografia i odstępy strony głównej, kompaktowy pierwszy ekran.
- Spójne strony medyka, placówki i organizatora ze wspólną nawigacją i stopką.
- Rozdzielenie funkcji dostępnych od funkcji w przygotowaniu.
- Zachowane wcześniejsze poprawki dostępności, menu mobilnego i oznaczeń danych przykładowych.
- Stare nieużywane zasoby pozostawiono dla zgodności; nie trzeba ręcznie usuwać HomeAudience.tsx.

## Sprawdzenie
- check:release: 23/23.
- Build produkcyjny i TypeScript: poprawne, z właściwym fontem Plus Jakarta Sans.
- ESLint: 0 błędów, 86 ostrzeżeń.
- Strona główna: kontrola szerokości 320, 390, 1280, 1536 i 1920 px.
- Wszystkie trzy podstrony: jeden main, bez poziomego przewijania przy 320 px.
- Formularz pilotażu: otwarcie i zamknięcie, kontrola wyglądu na telefonie.

Testy przeglądarkowe wykonano lokalnie bez logowania do produkcyjnej bazy. Nie wysyłano formularza kontaktowego i nie testowano rzeczywistej dostawy e-mail. Pozostałe podstrony aplikacji zachowują dotychczasowy wygląd.
