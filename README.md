# CRPE

Aplikacja Next.js do prowadzenia własnej ewidencji aktywności, punktów i dokumentów.

## Frankfurt fix v2

Wersja naprawia fałszywy wynik `0 pkt`, który pojawiał się, gdy opcjonalny
odczyt certyfikatu, szkolenia, typu aktywności albo roli administratora był
blokowany przez RLS. Punkty i okres CPD są teraz ładowane niezależnie od tych
danych, a prawdziwy błąd jest wyświetlany w panelu zamiast zastępowania go
pustą listą.

Po wdrożeniu element główny kalkulatora ma znacznik:

```html
data-crpe-build="frankfurt-fix-v2"
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
