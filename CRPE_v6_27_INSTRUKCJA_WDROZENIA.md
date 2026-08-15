# CRPE v6.27 — instrukcja bezpiecznego wdrożenia

## Baza wersji

Paczka została przygotowana na bazie **CRPE v6.26.4**.

## Zakres wdrożenia

To wdrożenie zawiera wyłącznie kod frontendu, style, trzy lekkie obrazy WEBP strony głównej, dokumentację i test regresji v6.27.

### Nie jest wymagane

- nowe SQL — **NIE**;
- uruchamianie istniejących migracji ponownie — **NIE**;
- zmiana Supabase — **NIE**;
- nowe sekrety GitHub/Vercel — **NIE**;
- zmiana Brevo/SMTP — **NIE**;
- ręczne uruchamianie importera NIL — **NIE**;
- nowa biblioteka wykresowa — **NIE**.

## Rekomendowany branch

`feature/warm-home-charts-v6.27`

## Rekomendowany commit

`CRPE v6.27 - ocieplenie strony i wykresy Panelu CPD`

## Kolejność

1. Utwórz branch z aktualnego `main` zawierającego v6.26.4.
2. Skopiuj zawartość repo v6.27 do lokalnego repozytorium.
3. Sprawdź zakres zmian w GitHub Desktop.
4. Commit i push na branch.
5. Poczekaj na Vercel Preview / checks.
6. Ręcznie sprawdź stronę główną na desktopie i telefonie, przełączając wszystkie 3 role.
7. Ręcznie sprawdź Panel CPD → Status i kroki → `Przebieg` oraz `Przegląd` na danych z punktami kompletnymi i niekompletnymi.
8. Dopiero po tych kontrolach utwórz PR do `main`.

## Oczekiwane testy

- `npm run check:v6.27`
- `npm run check:v6.26.4`
- `npm run check:v6.26.3`
- `npm run check:v6.26.2`
- `npm run check:v6.25.4`

Ostatecznym testem typów i kompilacji jest Vercel Preview / `npm run build` w środowisku z pełnymi zależnościami.
