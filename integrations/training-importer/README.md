# Importer szkoleń CRPE v1.2

Importer ma wspólny proces wysyłki i osobne adaptery źródeł. NIL jest pierwszym
adapterem w `src/sources/nil.ts`. Kolejne OIL powinny dostarczać obiekt
`SourceAdapter` i mapować własne RSS/API/HTML do `TrainingImportPayload`.

Importer najpierw pobiera RSS, a następnie oficjalną stronę szczegółową każdego
szkolenia. Strona szczegółowa uzupełnia tytuł, adresatów, format, prowadzących,
lokalizację, godziny, status zapisów oraz zwięzły opis z wydzielonej sekcji
`Cel szkolenia` / `Opis szkolenia` / `O szkoleniu`, jeśli taka sekcja istnieje.
Jeśli pojedyncza strona jest niedostępna, rekord nadal powstaje na podstawie RSS
i otrzymuje ostrzeżenie dla moderatora.

Pobrania wysyłają identyfikujący nagłówek `User-Agent`. Zwięzły opis wydzielony
przez NIL jest importowany domyślnie. Pełna długa treść RSS pozostaje opt-in i może
być włączona ustawieniem `NIL_IMPORT_FULL_DESCRIPTIONS=true`. Brak opisu w źródle
nie jest traktowany jako polecenie usunięcia ręcznie zredagowanego opisu CRPE.

## Polecenia

```bash
npm ci
npm run typecheck
npm test
npm run import:nil
```

Domyślnie `npm run import:nil` wykonuje lokalny dry-run. Do wysyłki potrzebne są:

- `DRY_RUN=false`;
- `SERVER_DRY_RUN=true` dla walidacji bez zapisu albo `false` dla live;
- `SUPABASE_URL`;
- `SUPABASE_ANON_KEY`;
- `NIL_IMPORT_EMAIL`;
- `NIL_IMPORT_PASSWORD`;
- opcjonalnie `INTEGRATION_ENDPOINT_OVERRIDE`.
- opcjonalnie `IMPORTER_USER_AGENT`;
- opcjonalnie `NIL_IMPORT_FULL_DESCRIPTIONS=true` po uzyskaniu zgody na opisy.
- awaryjnie `NIL_IMPORT_DETAILS_ENABLED=false`, aby tymczasowo pracować tylko na RSS.

Zmiana istniejącego szkolenia nie nadpisuje rekordu. API zwraca
`change_queued`, a moderator porównuje pola w `/admin/szkolenia`. Powtórne
pobranie tej samej propozycji zwraca `change_pending`; odrzucona wersja zwraca
`change_rejected` aż do kolejnej faktycznej zmiany w źródle.

Żadnych plików `.env`, haseł ani `node_modules` nie wolno commitować.

## Dodawanie następnego źródła

1. Dodaj adapter `src/sources/<kod>.ts`.
2. Dopisz adapter do rejestru w `src/run.ts`.
3. Dodaj zapis źródła do `training_import_sources` nową migracją.
4. Utwórz osobne konto techniczne i przypisz je tylko do tego źródła.
5. Dodaj fixture oraz testy mapowania.
6. Utwórz osobny workflow i osobny zestaw sekretów.

Nie należy współdzielić konta ani hasła NIL z importerem OIL.
