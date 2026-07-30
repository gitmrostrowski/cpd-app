# CRPE v5.1c — poprawiony start z zaproszenia

## Naprawione problemy

- link zaproszenia rozpoznaje, czy dla zaproszonego adresu istnieje konto;
- nowa osoba trafia domyślnie do formularza „Utwórz konto”;
- osoba z istniejącym kontem trafia do logowania;
- adres z zaproszenia jest uzupełniany automatycznie i nie można go zmienić;
- link aktywacyjny, magic link i reset hasła zapisują sesję w tym samym
  mechanizmie co pozostała część aplikacji;
- angielskie błędy `Invalid login credentials` i
  `Signups not allowed for this instance` otrzymały polskie komunikaty;
- magic link nie tworzy przypadkiem nowego konta.

Rozpoznanie konta odbywa się wyłącznie dla ważnego tokenu zaproszenia. Nie ma
publicznej wyszukiwarki adresów e-mail.

## Kolejność wdrożenia

1. Uruchom w Supabase SQL Editor cały plik:
   `supabase/migrations/20260730_crpe_v5_1c_invitation_onboarding.sql`.
2. Sprawdź, czy wszystkie 7 wierszy kontrolnych ma wynik `OK`.
3. W Supabase włącz tworzenie nowych użytkowników dla dostawcy Email.
4. Pozostaw włączone potwierdzanie adresu e-mail.
5. Ustaw Site URL na `https://www.crpe.pl` i dodaj dokładny dozwolony redirect:
   `https://www.crpe.pl/auth/callback`.
6. Przed testem na adresie spoza zespołu Supabase skonfiguruj w Supabase Auth
   własny SMTP Brevo. Domyślny SMTP Supabase nie jest przeznaczony do produkcji.
7. Wgraj zawartość paczki do głównego katalogu repozytorium i poczekaj na
   automatyczne wdrożenie Vercela.

Nie uruchamiaj ponownie migracji v4, v5 ani v5.1 FIX2. Nie zmieniaj
`BREVO_API_KEY` ani trzech istniejących zmiennych Vercela.

## Ważna uwaga o sesji

Wersja v5.1c ujednolica przechowywanie sesji w ciasteczkach. Po wdrożeniu
dotychczas zalogowana osoba może zostać jednorazowo poproszona o ponowne
zalogowanie. Nie oznacza to utraty konta ani danych.
