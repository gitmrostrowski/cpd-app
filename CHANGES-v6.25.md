# CRPE v6.25 — import szkoleń NIL i GitHub Actions

> Wersja zastąpiona przed wdrożeniem przez v6.25.1. Nie używaj wskazanej niżej
> migracji ani instrukcji v6.25; aktualne pliki opisuje `CHANGES-v6.25.1.md`.

## Najważniejsze zmiany

- wspólny kontrakt importu gotowy na NIL oraz kolejne OIL;
- dedykowany endpoint `POST /api/integrations/[source]/trainings`;
- osobne konto techniczne Supabase przypisywane do konkretnego źródła;
- atomowy zapis szkolenia i zawodów przez funkcję bazy;
- deduplikacja po `(import_source, source_external_id)`;
- wyniki `created`, `updated`, `unchanged` oraz odpowiedniki dry-run;
- zmieniony, wcześniej zaakceptowany wpis wraca do kolejki moderacji;
- niezmieniony wpis zachowuje status i nie jest dublowany;
- panel administratora pokazuje źródło oraz zewnętrzne ID;
- parser NIL zachowuje polską datę kalendarzową i mapuje lekarza/dentystę;
- nieznane pola nie otrzymują zmyślonych wartości;
- workflow GitHub Actions z blokadą równoległych uruchomień i trzema trybami;
- harmonogram jest zabezpieczony zmienną `NIL_IMPORT_ENABLED`;
- Next.js, sharp i zależności pośrednie zaktualizowane; `npm audit` bez ostrzeżeń;

## Pliki wdrożeniowe

- `supabase/migrations/20260811_crpe_v6_25_training_imports.sql`
- `supabase/setup/REGISTER_NIL_IMPORTER.sql`
- `.github/workflows/import-nil-trainings.yml`
- `integrations/training-importer/`
- `CRPE_v6_25_INSTRUKCJA_WDROZENIA_IMPORT_NIL.md`
