# CRPE v6.27.11 — instrukcja wdrożenia

## WAŻNE: kolejność ma znaczenie

**1. Najpierw SQL w Supabase.**

W Supabase → SQL Editor uruchom cały plik:

`SQL_v6_27_11_NIL_OPIS.sql`

To dodaje ochronę `description=null` i porządkuje już oczekujące fałszywe zmiany opisu.

**2. Dopiero potem wdroż repo / merge do main.**

Importer po wdrożeniu zacznie wysyłać zwięzły opis z sekcji `Cel/Opis/O szkoleniu`, jeśli NIL taką sekcję publikuje.

## Po wdrożeniu

1. GitHub → Actions → `Import szkoleń — NIL`.
2. Uruchom ręcznie najpierw w trybie `dry-run`.
3. Sprawdź, że `npm test` przechodzi.
4. Dla szkolenia NIL 1806 opis w payloadzie powinien zawierać tekst zaczynający się od „Celem szkolenia jest podniesienie kwalifikacji lekarzy...”.
5. Następnie uruchom `live` lub poczekaj na harmonogram.
6. W Admin → Szkolenia istniejący rekord z innym ręcznym opisem może dostać poprawną zmianę redakcyjną z realnym opisem NIL. To normalne — moderator decyduje, czy ją zastosować.

## Czego nie robić

- Nie ustawiaj `NIL_IMPORT_FULL_DESCRIPTIONS=true` tylko po to, aby dostać opis. Nie jest już potrzebne do zwięzłego opisu.
- Nie stosuj starej oczekującej zmiany `Opis → —`; migracja ma ją usunąć/zamknąć.
- Nie wdrażaj nowego importera przed SQL-em — strony bez rozpoznanego opisu mogłyby jeszcze wygenerować fałszywe `description=null`.

## Branch / commit

Branch: `fix/nil-descriptions-v6.27.11`

Commit: `CRPE v6.27.11 - opis NIL i ochrona recznej redakcji`
