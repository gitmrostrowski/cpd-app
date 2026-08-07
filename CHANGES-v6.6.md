# CRPE v6.6 — kompaktowe punkty i spójne działania filtrów

## Zakres

- usunięto duży, zagnieżdżony kafel punktów z kart szkoleń;
- pozostawiono zwarty wskaźnik: ikona biretu, liczba oraz skrót `pkt`;
- usunięto podpis „punkty edukacyjne” i dodatkową ikonę statusu z listy;
- prawa kolumna akcji nie narzuca już minimalnej wysokości karcie;
- zmniejszono odstępy między wskaźnikiem punktów a przyciskami;
- „Więcej filtrów” otrzymało neutralny styl przycisku drugiego poziomu;
- „Wyczyść” zastąpiono dostępnym przyciskiem ikonowym z podpowiedzią;
- wszystkie trzy działania filtrów mają wspólną wysokość i rytm;
- na wąskim ekranie użyto krótszej etykiety „Filtry”.
- dostosowano typ parametrów strony szczegółów aktywności do Next.js 16,
  aby pełny build produkcyjny przechodził poprawnie.

## Wiarygodność danych

Informacja o statusie punktacji pozostaje dostępna w szczegółach szkolenia
oraz dla technologii asystujących. Na liście nie zajmuje miejsca i nie buduje
niepotrzebnego niepokoju.

## Bez zmian w danych

Wersja v6.6 nie zawiera migracji Supabase. Zachowuje model danych wdrożony
w v6.3.

## Kontrola

```bash
npm run check:v6.6
npx tsc --noEmit
npm run build
```
