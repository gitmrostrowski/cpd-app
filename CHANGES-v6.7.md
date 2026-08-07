# CRPE v6.7 — logo organizatora w hierarchii karty szkolenia

## Zakres

- przeniesiono logo organizatora z wiersza metadanych do prawej kolumny karty;
- logo oraz punkty tworzą jeden zwarty wiersz nad przyciskami;
- logo jest po lewej, a punktacja konsekwentnie po prawej;
- zwiększono dostępny obszar logo do `76 × 32 px`, zachowując jego proporcje;
- usunięto z logo dodatkową ramkę, tło i cień;
- tekstowa nazwa organizatora pozostała w głównej treści karty;
- brak logo nie tworzy pustego placeholdera ani ramki;
- ten sam układ działa na komputerze i telefonie;
- zachowano kompaktową wysokość kart uzyskaną w v6.6.

## Bez zmian w danych

Wersja v6.7 nie zawiera migracji Supabase. Korzysta z pól logo i punktacji
wdrożonych we wcześniejszych wersjach.

## Kontrola

```bash
npm run check:v6.7
npx tsc --noEmit
npm run build
```
