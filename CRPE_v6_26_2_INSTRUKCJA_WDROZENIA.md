# CRPE v6.26.2 — instrukcja wdrożenia

## Co zmienia ta wersja

Wyłącznie warstwę prezentacji Panelu CPD i głównej nawigacji: większe fonty menu, mniejszą główną liczbę punktów, widoczne punkty z kompletnych wpisów oraz położenie przełącznika `Przebieg / Przegląd`.

## SQL

Ta wersja nie wnosi nowego SQL-a. Jeśli jednak wdrażasz całe repo począwszy od v6.25.4 i migracja v6.26 nie została jeszcze wykonana, najpierw należy wykonać istniejącą migrację:

`supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`

Nie uruchamiaj jej ponownie bez potwierdzenia aktualnego stanu bazy.

## Bezpieczna kolejność

1. Pracuj na osobnym branchu, nie bezpośrednio na `main`.
2. Skopiuj zawartość repo v6.26.2 do lokalnego repozytorium.
3. Sprawdź listę zmian w GitHub Desktop.
4. Uruchom testy, szczególnie `npm run check:v6.26.2` i `npm run check:v6.26.1`.
5. Opublikuj branch i sprawdź Vercel Preview.
6. W Preview sprawdź desktop i mobile Panelu CPD, oba widoki `Przebieg / Przegląd` oraz menu placówki.
7. Dopiero po kontroli utwórz PR do `main`.

## Sekrety i ustawienia

Brak nowych sekretów. Brak zmian w Vercel, Brevo/SMTP, GitHub Secrets i harmonogramie importera NIL.
