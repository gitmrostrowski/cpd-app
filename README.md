# CRPE

Aplikacja Next.js do prowadzenia własnej ewidencji aktywności, punktów i dokumentów.

## Wersja v5.2 — adresaci szkoleń i punktacja zawodowa

Wersja v5.2 rozdziela informację, dla kogo przeznaczone jest szkolenie, od
informacji, którym zawodom przysługują punkty. Dodaje wybór wielu zawodów,
punktację zależną od zawodu, dokładne filtrowanie i moderację w panelu
operatora.

Przed wdrożeniem kodu uruchom w Supabase Frankfurt migrację:

```text
supabase/migrations/20260731_crpe_v5_2_training_audience_and_credits.sql
```

Pełna kolejność wdrożenia i scenariusze testowe znajdują się w pliku
`CRPE_v5_2_instrukcja_wdrozenia.md`.

## Frankfurt fix v3

Wersja zawiera pełną zgodność aplikacji ze znormalizowaną bazą Frankfurt:

- punkty i okres CPD są ładowane niezależnie od opcjonalnych danych;
- prawdziwe błędy bazy są wyświetlane zamiast fałszywego wyniku `0`;
- profil wybiera cykl właściwy dla aktualnego zawodu;
- użytkownik może aktualizować własny cykl przeniesiony z bazy UK;
- migracja Supabase uzupełnia brakujące granty i bezpieczne polityki RLS;
- szkolenia zaakceptowane przed migracją są przywracane do katalogu.

Po wdrożeniu element główny kalkulatora ma znacznik:

```html
data-crpe-build="frankfurt-fix-v3"
```

Przed wdrożeniem kodu uruchom w SQL Editorze projektu Frankfurt migrację:

```text
supabase/migrations/20260729_crpe_frankfurt_permissions_and_trainings.sql
```

## Uruchomienie lokalne

1. Utwórz plik `.env.local` w głównym folderze projektu.
2. Dodaj publiczne dane projektu Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

3. Uruchom:

```bash
npm ci
npm run dev
```

Strona lokalna: `http://localhost:3000`.

## Publiczne podstrony

- `/dla-medyka`
- `/dla-placowki`
- `/dla-organizatora`
- `/narzedzia`
- `/bezpieczenstwo`
- `/pomoc`
- `/kontakt`

Formularze kontaktowe przygotowują wiadomość w domyślnym programie pocztowym użytkownika i nie zapisują danych w serwisie.

## Bezpieczeństwo repozytorium

Nie dodawaj do GitHuba:

- `.env.local`
- `node_modules`
- `.next`
- kluczy `service_role` lub `sb_secret_...`

## Baza danych Frankfurt

Ta wersja aplikacji korzysta ze znormalizowanego schematu CRPE:

- `educational_activities` — dane aktywności,
- `activity_point_entries` — punkty przypisane do aktywności,
- `activity_documents` — certyfikaty i pozostałe dokumenty,
- `cpd_cycles` — okresy rozliczeniowe,
- `medical_professionals`, `professions` i `professional_identifiers` — profil zawodowy,
- `platform_staff_roles` — uprawnienia administratora.

Warstwa zgodności w `lib/data/crpe.ts` udostępnia ten schemat istniejącym
widokom aplikacji. Nie należy ponownie dodawać zapytań do starej tabeli
`activities`.

Przed wdrożeniem ustaw publiczne zmienne środowiskowe projektu Frankfurt:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TWOJ-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Wersja v18 — design polish

- publiczne menu jest stałe na wszystkich stronach informacyjnych, także po zalogowaniu;
- zalogowany użytkownik otrzymuje przycisk „Otwórz Panel CPD”;
- dopracowano wybór roli, karty porównawcze, cztery kroki, podgląd Panelu CPD, FAQ, CTA i stopkę;
- ujednolicono szerokości, odstępy, zaokrąglenia, cienie i stany interakcji.
