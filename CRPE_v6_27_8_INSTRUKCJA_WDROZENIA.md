# CRPE v6.27.8 — instrukcja wdrożenia

## Branch
`feature/home-panel-balance-v6.27.8`

## Commit
`CRPE v6.27.8 - balans hero i karty statusu Panelu CPD`

## Kolejność
1. Utwórz branch z aktualnego `main`.
2. Skopiuj zawartość paczki v6.27.8 do lokalnego repo.
3. Przed commitem sprawdź listę zmian.
4. Commit i Publish/Push branch.
5. Sprawdź Vercel Preview.
6. Na Preview sprawdź:
   - Home: Medyk / Placówka / Organizator — tekst zakładek jest stały, zmienia się tylko akcent ikony,
   - Home: przełącznik i podgląd są jedną ramką,
   - Home: `w jednym miejscu.` pozostaje brand blue,
   - Panel CPD: „Najpierw to” zaczyna się przy górze bocznej kolumny, bez dużej pustej przestrzeni.
7. Dopiero po akceptacji wizualnej utwórz/merge PR do `main`.

## Konfiguracja
- SQL: NIE
- Supabase: bez zmian
- GitHub Actions / NIL: bez zmian
- Vercel env: bez zmian
