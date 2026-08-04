# CRPE v6.2 — działający formularz kontaktowy

## Dlaczego wiadomość wcześniej nie dotarła

Poprzedni formularz nie wysyłał danych do CRPE. Po kliknięciu ustawiał w
przeglądarce adres `mailto:kontakt@crpe.pl`, zamykał okno i oczekiwał, że
urządzenie otworzy domyślny program pocztowy. Wiadomość trafiała do CRPE dopiero
po jej ręcznym wysłaniu z tego programu. Jeżeli obsługa `mailto:` nie była
skonfigurowana, kliknięcie mogło nie wywołać żadnej widocznej reakcji.

Wersja v6.2 wysyła formularz po stronie serwera przez Brevo i pokazuje wynik
operacji wraz z numerem zgłoszenia.

## Routing wiadomości

| Wybrana rola | Adres odbiorczy | Zakres |
|---|---|---|
| Medyk | `pomoc@crpe.pl` | konto, aktywności, dokumenty, punkty, Panel CPD |
| Placówka | `kontakt@crpe.pl` | moduł organizacyjny i współpraca |
| Organizator | `zgloszenia@crpe.pl` | szkolenia, wydarzenia i dokumentacja |

Adresy można opcjonalnie nadpisać zmiennymi Vercela:

```text
CRPE_SUPPORT_EMAIL=pomoc@crpe.pl
CRPE_CONTACT_EMAIL=kontakt@crpe.pl
CRPE_TRAINING_SUBMISSIONS_EMAIL=zgloszenia@crpe.pl
```

Pierwsze dwie zmienne są opcjonalne, ponieważ kod ma bezpieczne wartości
domyślne. Trzecia była już używana przez zgłoszenia szkoleń.

## Zmiany UX

- medyk podaje tylko imię i nazwisko, e-mail oraz treść wiadomości;
- pola placówki i skali są wyświetlane wyłącznie placówkom i organizatorom;
- przycisk pokazuje stan wysyłania, błąd albo jednoznaczne potwierdzenie;
- potwierdzenie zawiera numer w formacie `CRPE-XXXXXXXXXX`;
- czarna sekcja eksponuje wszystkie trzy skrzynki;
- każdy adres ma link pocztowy i niezależny przycisk kopiowania;
- link na stronie głównej kieruje do formularza zamiast wymagać programu pocztowego.

## Bezpieczeństwo i diagnostyka

- walidacja długości i formatu danych odbywa się po stronie serwera;
- endpoint akceptuje tylko żądania z tej samej domeny;
- honeypot i minimalny czas wypełnienia ograniczają proste boty;
- limit wynosi 5 wiadomości na godzinę dla kombinacji adresu i źródła;
- adres IP nie jest przechowywany — w bazie trafia jedynie jednokierunkowy hash;
- dane nie są dostępne przez klucz publiczny `anon` ani dla zwykłych użytkowników;
- status `pending`, `sent` lub `failed` oraz identyfikator Brevo pozwalają
  odróżnić błąd formularza od problemu dostarczenia przez operatora poczty.

## Kolejność wdrożenia

1. W Supabase SQL Editor uruchom cały plik:
   `supabase/migrations/20260804_crpe_v6_2_contact_form.sql`.
2. Sprawdź, czy pięć pól kontrolnych na końcu zwraca `OK`.
3. Upewnij się, że w Vercelu istnieją już:
   `BREVO_API_KEY`, `CRPE_NOTIFICATION_FROM_EMAIL`,
   `CRPE_TRAINING_SUBMISSIONS_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY` oraz
   publiczne zmienne Supabase.
4. Wgraj zawartość repozytorium do GitHuba. Deployment Vercela uruchomi się
   automatycznie.
5. Po statusie `Ready` wyślij po jednej krótkiej wiadomości jako medyk,
   placówka i organizator.
6. Potwierdź odbiór odpowiednio w `pomoc@crpe.pl`, `kontakt@crpe.pl` i
   `zgloszenia@crpe.pl`.

Nie trzeba wykonywać dodatkowego ręcznego redeployu po wgraniu kodu.

## Kontrole lokalne

```bash
npm run check:v6
npm run check:v6.1
npm run check:v6.2
npx tsc --noEmit
```

Wiadomości zawierają dane osobowe. Rekomendowana retencja tabeli
`contact_messages` to maksymalnie 12 miesięcy, o ile korespondencja nie wymaga
dłuższego przechowania.
