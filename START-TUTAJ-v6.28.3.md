# CRPE Home v6.28.3 — typografia, grafiki ról i proporcje

## Zmiany

- Usunięto Bricolage Grotesque. Nagłówki i tekst korzystają z Plus Jakarta Sans. Dopasowano wielkość i interlinię hero do spokojniejszej typografii.
- Medyk: dotychczasowe zdjęcie bez zmian.
- Placówka: nowa scena koordynatorki i lekarza przy stanowisku administracyjnym.
- Organizator: nowa scena warsztatu medycznego z prowadzącą i modelem anatomicznym.
- Każda rola używa tego samego własnego zdjęcia w hero oraz w swojej karcie „Trzy role”, z dopasowanym kadrowaniem.
- Podglądy placówki i organizatora są krótsze: usunięto powtarzającą się plakietkę i opis podglądu, skrócono wiersze. Informacja o funkcjach w rozwoju oraz link do bezpieczeństwa pozostają widoczne. Opisy wierszy są dostępne dla czytników ekranu.

Grafiki wygenerowano wbudowanym imagegen. Są ilustracjami fotograficznymi, nie zdjęciami rzeczywistych klientów. Pliki: `public/home/photo-placowka-v3.webp` i `public/home/photo-organizator-v3.webp`. Pełne prompty: `IMAGE-PROMPTS-v6.28.3.md`.

## Wgranie

Skopiuj całą zawartość folderu `cpd-app-main` do lokalnego repo `cpd-app`, zastępując pliki. Zapisz commit i wykonaj Push origin. Ta wersja zmienia m.in. layout, stronę Home i arkusze CSS oraz dodaje dwie grafiki. Nie wymaga SQL ani nowych zmiennych środowiskowych.

## Weryfikacja

Build produkcyjny i TypeScript: poprawne (testowe wartości Supabase, bez dostępu do rzeczywistych kont). Sprawdzono nowe kadry w hero i kartach na desktopie oraz szerokość mobilną. Kontrole dla bieżącego wydania: `npm run check:release`. Kod zmienionych komponentów sprawdzono ESLint.

Zmiana nie dotyka API, bazy danych, uprawnień, obliczeń CPD, raportów ani importera NIL. Font nagłówków jest wspólny dla całej aplikacji. Wcześniejsze ograniczenia testów historycznych opisano w RELEASE-HOME-v6.28.1.md. Przed produkcją sprawdź Preview.
