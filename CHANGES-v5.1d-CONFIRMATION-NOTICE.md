# CRPE v5.1d — wyraźne potwierdzenie konta

## Zmieniony komunikat

- informacja o niepotwierdzonym koncie jest teraz wyraźnym alertem;
- komunikat wyjaśnia, że konto istnieje, ale nie jest jeszcze aktywne;
- użytkownik widzi adres, na który wysłano wiadomość;
- instrukcja prowadzi przez trzy kroki: otwarcie wiadomości, kliknięcie linku
  oraz powrót do CRPE;
- alert przypomina o folderach Spam, Oferty i Inne;
- można ponownie wysłać wiadomość aktywacyjną bez zakładania drugiego konta;
- ten sam sposób komunikacji działa po rejestracji i po próbie logowania przed
  aktywacją konta;
- linki aktywacyjne i resetujące korzystają z produkcyjnego adresu
  `NEXT_PUBLIC_SITE_URL`, zamiast przypadkowo przechodzić na `localhost`.

## Wdrożenie

1. W Supabase ustaw `Authentication → URL Configuration → Site URL` na
   `https://www.crpe.pl`.
2. Dodaj do Redirect URLs:
   - `https://www.crpe.pl/auth/callback`
   - `https://crpe.pl/auth/callback`
3. Wgraj zawartość paczki do głównego katalogu repozytorium i poczekaj na
   automatyczne wdrożenie Vercela.

Ta poprawka nie wymaga SQL-a ani zmian zmiennych środowiskowych Vercela.
