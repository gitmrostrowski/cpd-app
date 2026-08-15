# CRPE v6.27.1 — instrukcja bezpiecznego wdrożenia

## Baza

Ta paczka jest zbudowana bezpośrednio na **v6.27** i zawiera wszystkie jej zmiany, w tym poprawione wykresy Panelu CPD.

## Co zmienia

Tylko warstwę wizualną strony głównej i testy regresji palety:

- jeden stały niebieski kolor marki dla CTA i głównych akcji;
- zawężone kolory Medyk / Placówka / Organizator wyłącznie do tabów i ikon;
- neutralne tła i spójniejszą hierarchię statusów.

## Czego nie zmienia

- brak nowego SQL;
- brak zmian Supabase / RLS / RPC;
- brak zmian w importerze NIL i workflow GitHub Actions;
- brak zmian w Admin → Szkolenia;
- brak zmian w logice Panelu CPD i jego wykresach względem v6.27;
- brak nowych sekretów i ustawień Vercela.

## Rekomendowany branch

`feature/brand-palette-v6.27.1`

## Rekomendowany commit

`CRPE v6.27.1 - spójna paleta marki i akcenty ról`

## Bezpieczna kolejność

1. Na GitHub Desktop przejdź na aktualny `main` i wykonaj `Fetch origin` / `Pull origin`.
2. Upewnij się, że nie ma lokalnych zmian.
3. Utwórz branch `feature/brand-palette-v6.27.1` z `main`.
4. Skopiuj zawartość tej paczki do lokalnego repozytorium.
5. Sprawdź listę zmian przed commitem.
6. Commit i Publish branch.
7. Sprawdź Vercel Preview i oba warianty desktop/mobile strony głównej.
8. W szczególności szybko przełącz Medyk / Placówka / Organizator: powinny zmieniać się tab, ikona i treść, ale H1, CTA i tło powinny pozostać stabilne.
9. Sprawdź Panel CPD → Przebieg / Przegląd, aby potwierdzić brak regresji wykresów.
10. Utwórz Pull Request do `main` dopiero po pozytywnym Preview.

## Oczekiwany test

`npm run check:v6.27.1`

Powinien zakończyć się komunikatem `OK v6.27.1`.
