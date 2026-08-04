# CRPE v6.2.2 — kafle szkoleń, adresaci i odporność kontaktu

## Zakres

Ta wersja rozwija v6.2.1 i nie cofa wcześniejszych zmian: publicznej bazy
szkoleń, logo organizatorów, formularza kontaktowego, potwierdzeń e-mail ani
modułu organizacyjnego.

## 1. Adresaci szkolenia

Przyczyną błędu w panelu administratora była niespójność danych i interfejsu:
baza wymagała `target_profession_text` przed akceptacją, ale typ
`TrainingRow`, modal administratora i formularz nowego zgłoszenia nie
udostępniały tego pola. Adapter zapisu normalizował więc brakującą wartość do
`null`, a baza prawidłowo blokowała akceptację.

W v6.2.2:

- oba formularze używają wspólnego pola `TrainingAudienceField`;
- można wybrać „Wszyscy medycy” albo kilka zawodów;
- zawody są pobierane z `public.professions`, więc nowe pozycje z bazy pojawią
  się automatycznie;
- zgłoszenie bez adresatów jest blokowane po stronie klienta i API;
- kliknięcie „Akceptuj” przy starym rekordzie bez adresatów otwiera właściwe
  pole w modalu;
- błąd jest pokazywany wewnątrz modalu, nie za nim;
- powiadomienie operatora zawiera wskazaną grupę docelową.

## 2. Kafle bazy szkoleń

Kafel został uproszczony do czytelnej hierarchii:

- data pozostaje w jednej, spokojnej kolumnie;
- data jednodniowego wydarzenia nie jest powtarzana drugi raz;
- tytuł ma większą wagę i rozmiar;
- logo ma 36 × 36 px i znajduje się bezpośrednio przy organizatorze;
- metadane tworzą jeden naturalny ciąg zamiast czterech równych kolumn;
- wyświetlane są najwyżej dwa tagi, a reszta jako `+N`;
- „Zapisy u organizatora” są główną akcją;
- „Dodaj do planu” jest akcją drugorzędną;
- „Szczegóły” są spokojnym linkiem tekstowym;
- limit miejsc pozostaje w szczegółach, ponieważ sama pojemność nie mówi, ile
  miejsc faktycznie zostało.

## 3. Formularz kontaktowy

Dotychczas jeden komunikat `contact_unavailable` obejmował trzy różne
sytuacje: brak konfiguracji e-mail, błąd zapytania limitującego w Supabase oraz
błąd zapisu zgłoszenia. To oznaczało, że chwilowy problem diagnostyki bazy
blokował właściwą wysyłkę przez Brevo.

W v6.2.2:

- tylko brak konfiguracji Brevo/nadawcy blokuje rozpoczęcie wysyłki;
- błąd odczytu lub zapisu `contact_messages` jest logowany etapowo, ale wysyłka
  do CRPE i potwierdzenie dla zgłaszającego nadal są podejmowane;
- aktualizacja statusów jest bezpieczną operacją pomocniczą;
- komunikat błędu zawiera przycisk „Kopiuj adres”, niezależny od obsługi
  `mailto:`;
- migracja v6.2.2 naprawia kolumny diagnostyczne i granty, aby pełne statusy
  nadal trafiały do Supabase.

## Wdrożenie

1. W Supabase otwórz **SQL Editor → New query**.
2. Uruchom:
   `supabase/migrations/20260804_crpe_v6_2_2_contact_and_audience_repair.sql`.
3. Sprawdź, czy cztery kolumny wyniku pokazują `OK`.
4. Wgraj zawartość repozytorium do GitHuba.
5. Poczekaj na status `Ready` w Vercelu.
6. W panelu administratora otwórz stare szkolenie bez adresatów, wybierz grupę
   i zapisz je jako zaakceptowane.
7. Wyślij jeden test kontaktu jako medyk. Sprawdź `pomoc@crpe.pl`, folder Junk
   oraz potwierdzenie u zgłaszającego.

Nie są wymagane nowe zmienne środowiskowe. W produkcji nadal muszą istnieć
`BREVO_API_KEY` oraz co najmniej jedna z wartości
`CRPE_NOTIFICATION_FROM_EMAIL` lub `CRPE_INVITATION_FROM_EMAIL`.

## Kontrole

```bash
npm run check:v6.2.2
npx tsc --noEmit
npx eslint app/api/contact/route.ts components/RoleContactModal.tsx \
  components/TrainingAudienceField.tsx app/admin/szkolenia/page.tsx \
  app/baza-szkolen/TrainingHubClient.tsx \
  app/api/trainings/submissions/route.ts
```

Pełny build wymaga dostępu do Google Fonts, ponieważ `app/layout.tsx` używa
`next/font/google`. W środowisku bez dostępu do `fonts.googleapis.com` build
zatrzyma się na pobieraniu Plus Jakarta Sans, zanim Vercel wykona własny build
w środowisku sieciowym.
