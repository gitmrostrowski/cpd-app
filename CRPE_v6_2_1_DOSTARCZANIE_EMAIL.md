# CRPE v6.2.1 — wysyłka kontaktu i potwierdzenia

## Co było nie tak w v6.2

Formularz wysyłał przez Brevo tylko jedną wiadomość — do skrzynki CRPE.
Nie wysyłał żadnego potwierdzenia do osoby zgłaszającej, mimo że komunikat
na ekranie mógł sugerować inaczej.

Wiadomość testowa do `pomoc@crpe.pl` została odnaleziona w folderze Junk.
Oznacza to, że formularz i routing działały, a problem po stronie skrzynki CRPE
dotyczył klasyfikacji antyspamowej Outlooka, nie braku wysyłki.

Pole `status = sent` oznaczało jedynie przyjęcie żądania przez API Brevo.
Nie rozróżniało wiadomości do CRPE od potwierdzenia dla zgłaszającego i nie
potwierdzało dostarczenia do skrzynki odbiorczej.

Routing mógł być także nadpisany opcjonalną zmienną środowiskową. W v6.2.1
adresy są jednoznaczne:

- medyk: `pomoc@crpe.pl`;
- placówka: `kontakt@crpe.pl`;
- organizator: `zgloszenia@crpe.pl`.

## Zmiany

- osobna wiadomość operacyjna do CRPE;
- osobne potwierdzenie z numerem zgłoszenia do użytkownika;
- osobny status i identyfikator Brevo dla każdej wiadomości;
- status `partial`, gdy CRPE przyjęło zgłoszenie, ale potwierdzenie nie zostało
  przyjęte przez dostawcę;
- brak fałszywego sukcesu przy nieprawidłowym czasie wypełnienia formularza;
- precyzyjniejszy komunikat: API przyjęło wiadomość do wysyłki, co nie jest
  jeszcze równoznaczne z dostarczeniem do skrzynki.

Repozytorium zawiera także zaakceptowaną korektę kafla szkolenia: data i górna
część treści tworzą pierwszy rząd, a logo oraz metadane drugi. Logo ma 66 × 60
px, mniejszy margines wewnętrzny i pozostaje opcjonalne. Dzięki temu jego
położenie nie zależy od liczby wierszy tytułu.

## Wdrożenie

1. W Supabase SQL Editor uruchom cały plik:
   `supabase/migrations/20260804_crpe_v6_2_1_contact_delivery.sql`.
2. Cztery pola pierwszego wyniku muszą pokazać `OK`.
3. Drugi wynik pokaże bezpieczną diagnostykę ostatnich zgłoszeń, bez treści i
   adresu zgłaszającego.
4. Wgraj zawartość repozytorium do GitHuba i poczekaj na `Ready` w Vercelu.
5. Wyślij jeden test jako medyk. Formularz powinien wyświetlić numer zgłoszenia,
   `pomoc@crpe.pl` powinna dostać wiadomość, a zgłaszający jej kopię.

## Outlook kieruje wiadomość do Junk

Kod nie może sam nadać domenie reputacji ani zmienić werdyktu filtra Microsoft.
Po wdrożeniu:

1. w Outlooku otwórz wiadomość w Junk i wybierz `To nie jest wiadomość-śmieć`;
2. dodaj `powiadomienia@powiadomienia.crpe.pl` do bezpiecznych nadawców;
3. w Brevo sprawdź, czy domena `powiadomienia.crpe.pl` ma zielone statusy
   uwierzytelnienia DKIM i DMARC;
4. sprawdź w DNS, czy dla domeny nadawczej istnieje tylko jeden poprawny rekord
   SPF i obejmuje on Brevo;
5. w logach transakcyjnych Brevo odszukaj numer wiadomości i potwierdź zdarzenie
   `delivered`, a nie `blocked` lub `bounced`.

Po oznaczeniu kilku prawidłowych wiadomości jako bezpieczne filtr Outlooka
powinien nauczyć się nadawcy. Nie należy omijać problemu przez losową zmianę
adresu `From`; pogorszyłoby to spójność SPF/DKIM/DMARC i reputację domeny.

## Jak odczytać diagnostykę

- brak rekordu: żądanie nie utworzyło zgłoszenia;
- `recipient_status = failed`: Brevo odrzuciło wiadomość do CRPE, a kod jest w
  `error_code`;
- `recipient_status = accepted`: Brevo przyjęło wiadomość do CRPE; brak w
  skrzynce należy sprawdzić w logach transakcyjnych Brevo po identyfikatorze;
- `confirmation_status = failed`: Brevo odrzuciło potwierdzenie do użytkownika;
- `confirmation_status = accepted`: Brevo przyjęło także potwierdzenie.

API Brevo zwraca identyfikator po przyjęciu wiadomości. Ostateczne zdarzenia,
takie jak `delivered`, `blocked`, `soft bounce` lub `hard bounce`, są widoczne
w logach transakcyjnych Brevo. Sama odpowiedź HTTP 201 nie gwarantuje pojawienia
się wiadomości w skrzynce odbiorczej.

## Wymagane zmienne Vercela

- `BREVO_API_KEY`;
- `CRPE_NOTIFICATION_FROM_EMAIL` lub `CRPE_INVITATION_FROM_EMAIL`;
- `NEXT_PUBLIC_SUPABASE_URL`;
- `SUPABASE_SERVICE_ROLE_KEY`.

Nie dodawaj już `CRPE_SUPPORT_EMAIL` ani `CRPE_CONTACT_EMAIL`; v6.2.1 celowo
nie używa ich do routingu.

## Kontrole lokalne

```bash
npm run check:v6
npm run check:v6.1
npm run check:v6.1.1
npm run check:v6.2
npm run check:v6.2.1
npx tsc --noEmit
npx eslint app/api/contact/route.ts components/RoleContactModal.tsx
```
