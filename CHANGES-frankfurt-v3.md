# CRPE — Frankfurt fix v3

## Diagnoza

Inwentaryzacja bazy Frankfurt wykazała, że polityki RLS zostały utworzone
poprawnie, ale granty roli `authenticated` nie odpowiadały tym politykom:

- `activity_documents` i `trainings` nie miały grantów aplikacyjnych;
- w tabelach z politykami `UPDATE` brakowało grantu `UPDATE`;
- `platform_staff_roles` nie pozwalało użytkownikowi odczytać własnej roli;
- 15 szkoleń zaakceptowanych w UK miało po migracji status `pending`;
- kod nie aktualizował własnego cyklu CPD o źródle `migration`;
- po zmianie zawodu profil mógł wybrać cykl przypisany do innego zawodu.

## Naprawa

Migracja:

`supabase/migrations/20260729_crpe_frankfurt_permissions_and_trainings.sql`

wykonuje atomowo:

1. wyrównanie grantów z istniejącymi politykami RLS;
2. bezpieczny odczyt własnej roli administratora;
3. możliwość aktualizacji własnych cykli `user` i `migration`;
4. przywrócenie 15 zaakceptowanych szkoleń do katalogu;
5. kontrolę grantów, danych, dokumentów i plików Storage.

Skrypt nie wyłącza RLS i nie udostępnia danych innych użytkowników.
W razie niespójnej liczby szkoleń albo braku administratora cała transakcja
zostaje wycofana.

## Weryfikacja kodu

- brak odwołań do starej tabeli `activities`;
- TypeScript przechodzi bez błędów;
- pełny build Next.js w środowisku roboczym jest blokowany przez błąd
  środowiska `uv_resident_set_memory`, niezwiązany z kodem aplikacji.
