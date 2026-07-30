# CRPE v5.1e — kontekst placówki i tożsamość konta

## Zakres

- stały przełącznik `Moje CRPE / placówka` w nagłówku;
- bezpośrednie wejście do panelu przy jednym członkostwie;
- lista placówek i ról przy wielu członkostwach;
- avatar z inicjałami i zielonym statusem zamiast pełnego adresu e-mail;
- sekcja `Placówki i role` w profilu użytkownika;
- komunikat po pierwszym przyjęciu zaproszenia;
- możliwość użycia istniejącego konta CRPE, gdy zaproszenie wysłano na inny
  adres e-mail.

## Zasady bezpieczeństwa dla różnych adresów

- system nie dopasowuje osób automatycznie po nazwisku, numerze PWZ ani innych
  danych medycznych;
- użytkownik musi wejść przez ważny, niezgadywalny link zaproszenia i zalogować
  się do istniejącego konta;
- różnica adresów wymaga osobnego, jawnego potwierdzenia;
- jeśli dla zaproszonego adresu istnieje już konto CRPE, inne konto nie może
  przejąć zaproszenia;
- adres logowania istniejącego konta nie jest ujawniany placówce ani zapisywany
  w szczegółach audytu;
- użycie istniejącego konta nie zmienia jego e-maila, nie łączy kont i nie
  przenosi danych między kontami.

## Wdrożenie

1. Uruchom migrację
   `supabase/migrations/20260730_crpe_v5_1e_organization_context.sql`.
2. Sprawdź, czy wszystkie 10 kontroli SQL zwraca `OK`.
3. Dopiero potem wgraj kod aplikacji do repozytorium i poczekaj na nowe
   wdrożenie Vercela.

Nie są potrzebne nowe zmienne środowiskowe ani zmiany w Brevo.
