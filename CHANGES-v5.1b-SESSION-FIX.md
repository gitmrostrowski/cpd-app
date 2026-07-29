# CRPE v5.1b — poprawka sesji zaproszeń

## Naprawiony problem

Panel placówki przechowywał aktywną sesję Supabase po stronie przeglądarki,
natomiast serwerowy endpoint wysyłki zaproszeń sprawdzał wyłącznie sesję
dostępną w ciasteczkach. W rezultacie zalogowany właściciel placówki otrzymywał
komunikat „Zaloguj się ponownie.” przy wysyłaniu, ponawianiu i anulowaniu
zaproszenia.

## Zakres poprawki

- panel przekazuje token aktywnej sesji w nagłówku `Authorization`;
- endpoint weryfikuje token bezpośrednio w Supabase przed wykonaniem operacji;
- ten sam mechanizm chroni tworzenie, ponawianie i anulowanie zaproszeń;
- klucz Brevo nadal pozostaje wyłącznie po stronie serwera.

## Wdrożenie

Nie uruchamiaj migracji SQL i nie zmieniaj zmiennych środowiskowych Vercela.
Wgraj zawartość paczki do głównego katalogu repozytorium i zatwierdź commit.
Vercel automatycznie utworzy nowe wdrożenie.

## Kontrola

- CRPE v4: 10/10 testów OK;
- CRPE v5: 15/15 testów OK;
- CRPE v5.1b: 16/16 testów OK;
- TypeScript: bez błędów.
