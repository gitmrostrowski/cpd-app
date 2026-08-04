# CRPE v6 — publiczna baza szkoleń i komunikacja

## Efekt wdrożenia

- baza szkoleń jest dostępna i widoczna w menu bez logowania;
- anonimowy użytkownik widzi wyłącznie zatwierdzone wydarzenia i bezpieczne
  kolumny publiczne;
- adres e-mail zgłaszającego, identyfikator użytkownika, ślady moderacji i
  `legacy_data` nie są dostępne dla roli `anon`;
- publiczny ekran nie czeka na zakończenie sprawdzania sesji;
- użytkownik nie widzi surowych błędów Supabase;
- karta pokazuje moderowane logo organizatora i przycisk „Szczegóły”;
- zgłoszenie wydarzenia przechodzi przez chroniony endpoint serwerowy;
- po zapisaniu zgłoszenia CRPE może powiadomić operatora przez Brevo na
  skrzynkę Microsoft 365.

## Kolejność wdrożenia

1. W Supabase SQL Editor uruchom cały plik:
   `supabase/migrations/20260804_crpe_v6_public_training_directory.sql`.
2. Sprawdź tabelę kontrolną na końcu skryptu. Wszystkie pięć wierszy musi mieć
   wynik `OK`.
3. W Microsoft 365 podłącz i zweryfikuj domenę `crpe.pl`.
4. Utwórz jednego licencjonowanego użytkownika do codziennej pracy, np.
   `krzysztof@crpe.pl`.
5. Utwórz skrzynki współdzielone opisane niżej i nadaj użytkownikowi
   `krzysztof@crpe.pl` uprawnienia `Full Access` oraz `Send As`.
6. W Vercel dodaj zmienne środowiskowe z sekcji „Zmienne Vercel”.
7. Wdróż kod aplikacji.
8. Sprawdź stronę `/baza-szkolen` w oknie incognito oraz po zalogowaniu.
9. Wyślij jedno testowe zgłoszenie i potwierdź, że pojawiło się w panelu
   `/admin/szkolenia` oraz w skrzynce `zgloszenia@crpe.pl`.

Migrację należy wykonać przed wdrożeniem kodu, ponieważ nowy kod pobiera
kolumnę `organizer_logo_url`.

## Docelowy układ poczty Microsoft 365

| Adres | Typ | Zastosowanie |
|---|---|---|
| `krzysztof@crpe.pl` | użytkownik z 1 licencją | codzienne logowanie do Outlooka |
| `kontakt@crpe.pl` | skrzynka współdzielona | ogólny kontakt i sprawy handlowe |
| `zgloszenia@crpe.pl` | skrzynka współdzielona | nowe szkolenia i korespondencja z organizatorami |
| `pomoc@crpe.pl` | skrzynka współdzielona | obsługa użytkowników |
| `organizatorzy@crpe.pl` | alias `zgloszenia@crpe.pl` | czytelny adres dla partnerów |

Nie używaj `admin@crpe.pl` jako codziennego loginu do poczty. Obecne konto
administracyjne `Krzysztof.Ostrowski@Medicai.pl.onmicrosoft.com` powinno
pozostać kontem technicznym bez licencji i być używane tylko do panelu
Microsoft 365. Skrzynki współdzielone nie służą do bezpośredniego logowania.

Automatyczne wiadomości CRPE nadal wysyła Brevo z subdomeny
`powiadomienia.crpe.pl`. Microsoft 365 odbiera wiadomości i służy do odpowiedzi
człowieka; aplikacja nie przechowuje hasła do Outlooka i nie korzysta z SMTP
użytkownika.

## Zmienne Vercel

```text
BREVO_API_KEY=xkeysib-...
CRPE_INVITATION_FROM_EMAIL=zaproszenia@powiadomienia.crpe.pl
CRPE_NOTIFICATION_FROM_EMAIL=powiadomienia@powiadomienia.crpe.pl
CRPE_TRAINING_SUBMISSIONS_EMAIL=zgloszenia@crpe.pl
NEXT_PUBLIC_SITE_URL=https://www.crpe.pl
```

`CRPE_NOTIFICATION_FROM_EMAIL` musi być wcześniej uwierzytelnionym nadawcą w
Brevo. Jeżeli ta zmienna nie zostanie ustawiona, endpoint użyje istniejącego
`CRPE_INVITATION_FROM_EMAIL`. Jeżeli zabraknie adresu odbiorcy lub klucza Brevo,
zgłoszenie nadal zostanie zapisane, ale powiadomienie nie zostanie wysłane.

## Testy obowiązkowe

1. Incognito: lista pokazuje zatwierdzone wydarzenia bez logowania.
2. Incognito: w żądaniach sieciowych nie ma `submitted_email`, `submitted_by`,
   `approved_by`, `reject_reason` ani `legacy_data`.
3. Zwykły użytkownik: „Dodaj do planu” tworzy planowaną aktywność.
4. Niezalogowany użytkownik: „Dodaj do planu” prowadzi do logowania.
5. Zgłaszający: formularz tworzy rekord `pending`, nigdy `approved`.
6. Administrator: może dodać logo HTTPS, opis, link i zatwierdzić wydarzenie.
7. Po zatwierdzeniu wydarzenie pojawia się publicznie; po odrzuceniu znika.
8. Powiadomienie o zgłoszeniu przychodzi na `zgloszenia@crpe.pl`, a odpowiedź
   trafia na adres użytkownika, który złożył zgłoszenie.

Lokalna kontrola kodu:

```bash
npm run check:v6
npx tsc --noEmit
```

## Kolejny etap po v6

- osobne, indeksowalne adresy URL szczegółów wydarzeń;
- dane strukturalne `Event` i Open Graph dla każdego szkolenia;
- rejestr organizatorów zamiast powtarzania nazwy i logo w każdym rekordzie;
- upload logo do wydzielonego bucketu Supabase Storage;
- publiczny formularz bez konta dopiero po dodaniu CAPTCHA, limitów i kolejki
  `training_submissions` oddzielonej od tabeli `trainings`;
- szablony odpowiedzi i status obsługi zgłoszenia w panelu operatora.
