# CRPE v5.1a — zaproszenia systemowe przez Brevo i proste Centrum pomocy

## Co zmienia v5.1

- CRPE wysyła zaproszenia do pracowników pocztą e-mail;
- można wkleić jeden adres albo listę maksymalnie 50 adresów;
- powtórzone adresy są automatycznie usuwane;
- administrator widzi rejestr zaproszeń;
- rejestr rozróżnia wysyłkę, błąd, wejście w link, logowanie, przyjęcie, wygaśnięcie i anulowanie;
- zaproszenie można ponowić lub anulować;
- link do ręcznego skopiowania pozostaje jako opcja awaryjna;
- Centrum pomocy zawiera rozwijane instrukcje krok po kroku dla nowych użytkowników.

## Ważna kolejność wdrożenia

1. Uruchom migrację SQL v5.1 w projekcie Supabase Frankfurt.
2. Sprawdź, czy wszystkie 10 testów na końcu ma wynik `OK`.
3. Skonfiguruj domenę nadawczą i klucz API Brevo.
4. Dodaj trzy zmienne środowiskowe w Vercel.
5. Dopiero potem wgraj kod v5.1 do GitHuba.
6. Po wdrożeniu wyślij jedno zaproszenie na własny drugi adres testowy.

Nie uruchamiaj ponownie migracji v4 ani v5.

## Konfiguracja wysyłki e-mail przez Brevo

Kod używa usługi Brevo przez bezpieczną funkcję serwerową. Klucz nie trafia do przeglądarki.

W Brevo:

1. Załóż konto.
2. Uwierzytelnij domenę `powiadomienia.crpe.pl`.
3. Dodaj nadawcę `CRPE <zaproszenia@powiadomienia.crpe.pl>`.
4. Sprawdź zielone statusy DKIM i DMARC.
5. Utwórz klucz API o nazwie `CRPE Vercel produkcja`.

W Vercel otwórz projekt CRPE, następnie `Settings → Environment Variables` i dodaj:

```text
BREVO_API_KEY=xkeysib-...
CRPE_INVITATION_FROM_EMAIL=zaproszenia@powiadomienia.crpe.pl
NEXT_PUBLIC_SITE_URL=https://www.crpe.pl
```

Zmienne ustaw dla środowiska `Production`. Nie wklejaj klucza do GitHuba, SQL
Editora ani kodu. Wartość klucza Brevo wklej wyłącznie do pola wartości
zmiennej `BREVO_API_KEY`. Jeżeli Vercel pokazuje opcję `Sensitive`, włącz ją
dla klucza.

Po zapisaniu zmiennych wykonaj ponowne wdrożenie ostatniej wersji.

Nie dodawaj zmiennych `RESEND_API_KEY` ani `CRPE_INVITATION_FROM` — v5.1a już
ich nie używa.

## Test po wdrożeniu

1. Zaloguj się jako właściciel placówki.
2. Otwórz `Panel placówki → Zespół`.
3. Wpisz własny drugi adres e-mail.
4. Pozostaw rolę `Pracownik` i kliknij `Wyślij zaproszenie`.
5. W rejestrze powinien pojawić się status `Wysłane`.
6. Otwórz wiadomość na drugim adresie i kliknij link.
7. Po odświeżeniu panel powinien pokazać `Link otwarty`.
8. Zaloguj się właściwym adresem.
9. Panel powinien pokazać `Zalogowano się`.
10. Kliknij `Przyjmij zaproszenie`.
11. Status powinien zmienić się na `Powiązana z placówką`, a osoba pojawić się na liście zespołu.

## Zasady bezpieczeństwa

- link jest ważny 14 dni;
- link działa wyłącznie dla konta używającego zaproszonego adresu;
- ponowienie tworzy nowy token i przedłuża ważność o 14 dni;
- anulowane zaproszenie przestaje działać;
- przyjęcie zaproszenia nie udostępnia automatycznie prywatnych aktywności ani certyfikatów;
- role są nadal egzekwowane w bazie, a nie tylko ukrywane w interfejsie.
