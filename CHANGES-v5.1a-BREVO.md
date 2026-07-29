# CRPE v5.1a — wysyłka zaproszeń przez Brevo

## Zakres poprawki

- zastąpiono integrację Resend usługą Brevo;
- klucz API jest odczytywany wyłącznie po stronie serwera;
- nadawcą jest `CRPE <zaproszenia@powiadomienia.crpe.pl>`;
- zachowano rejestrowanie identyfikatora wiadomości w Supabase;
- zachowano klucz idempotencji i identyfikator zaproszenia w nagłówkach;
- komunikaty błędów Brevo trafiają do rejestru zaproszeń;
- zaktualizowano test automatyczny i instrukcję wdrożenia.

## Zmienne Vercel

```text
BREVO_API_KEY=xkeysib-...
CRPE_INVITATION_FROM_EMAIL=zaproszenia@powiadomienia.crpe.pl
NEXT_PUBLIC_SITE_URL=https://www.crpe.pl
```

Klucza nie należy zapisywać w kodzie, repozytorium GitHub ani Supabase.
W Vercel zmienne należy przypisać do środowiska `Production`, a klucz oznaczyć
jako `Sensitive`, jeśli ta opcja jest dostępna.

## Wdrożenie

Ta poprawka nie zmienia struktury bazy danych. Nie uruchamiaj żadnej migracji
SQL. Po wgraniu kodu i dodaniu zmiennych wykonaj ponowne wdrożenie w Vercel,
a następnie wyślij jedno zaproszenie na własny drugi adres testowy.
