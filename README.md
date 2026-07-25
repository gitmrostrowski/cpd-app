# CRPE

Aplikacja Next.js do prowadzenia własnej ewidencji aktywności, punktów i dokumentów.

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
