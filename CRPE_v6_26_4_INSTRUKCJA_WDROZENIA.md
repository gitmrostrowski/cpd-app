# CRPE v6.26.4 — instrukcja wdrożenia

Baza wersji: v6.26.3.

## Wymagania

- SQL: NIE
- nowe migracje Supabase: NIE
- nowe sekrety: NIE
- zmiany Vercel: NIE
- zmiany GitHub Actions: NIE
- ręczne uruchomienie importera NIL: NIE

## Zalecany branch

`feature/admin-szkolenia-karty-v6.26.4`

## Zalecany commit

`CRPE v6.26.4 - czytelny panel moderacji szkolen`

## Bezpieczna kolejność

1. W GitHub Desktop przełącz się na `main` i wykonaj Fetch/Pull.
2. Upewnij się, że `main` zawiera v6.26.3 i nie ma lokalnych zmian.
3. Utwórz branch `feature/admin-szkolenia-karty-v6.26.4` z `main`.
4. Skopiuj zawartość paczki v6.26.4 do lokalnego repozytorium.
5. Sprawdź listę zmian — oczekiwany zakres to panel admina, test v6.26, nowy test v6.26.4, package.json i dokumentacja.
6. Commit i Publish branch.
7. Sprawdź Vercel Preview.
8. W Admin → Szkolenia sprawdź kolejki: Do decyzji, Zmiany w istniejących, Nowe wpisy, Zapisy i miejsca, Wszystkie.
9. Otwórz co najmniej jeden nowy wpis i jeden rekord ze zmianą NIL.
10. Sprawdź `Edytuj wszystkie dane`, w tym format, kategorię, lokalizację, status zapisów, liczbę miejsc, nagranie i tematy.
11. Dopiero po pozytywnym Preview utwórz PR do `main`.
12. Po merge potwierdź Vercel Production / Ready.

## Ważne

Wersja v6.26.4 nie zmienia działania importera NIL. Nie uruchamiaj SQL-a ani nie zmieniaj `NIL_IMPORT_ENABLED` w ramach tego wdrożenia.
