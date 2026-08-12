# CRPE v6.25.3 — instrukcja wdrożenia panelu, widoków i limitów

Ta wersja jest aktualizacją działającego v6.25.2. Zmienia wyłącznie prezentację
panelu CPD oraz testy regresji. Nie zmienia bazy danych ani importera NIL.

## Etap 1 — branch i podmiana plików

1. W GitHub Desktop przełącz repozytorium CRPE na `main` i kliknij **Fetch origin**.
2. Upewnij się, że produkcyjna v6.25.2 została wcześniej scalona z `main`.
3. Utwórz z aktualnego `main` branch `feature/panel-widoki-limity-v6.25.3`.
4. Rozpakuj paczkę v6.25.3.
5. Skopiuj zawartość katalogu `cpd-app-main` do lokalnego repozytorium CRPE,
   zgadzając się na podmianę istniejących plików.
6. Nie kopiuj zewnętrznego ZIP-a, `node_modules`, `.next`, `.env` ani plików
   zawierających sekrety.
7. W GitHub Desktop sprawdź listę zmian i wykonaj commit:
   `CRPE v6.25.3 - widoki statusu i czytelniejsze limity`.
8. Kliknij **Push origin**.

## Etap 2 — kontrola Preview

1. Poczekaj na deployment Vercel Preview ze statusem **Ready**.
2. Otwórz Preview i zaloguj się na konto testowe z ustawionym celem punktowym.
3. W `/panel-cpd` sprawdź:
   - domyślny widok **Przebieg**;
   - przełączenie na **Przegląd**;
   - zachowanie widoku po odświeżeniu strony;
   - poprawne liczby „Zebrane”, „Luka/Zapas” i „Pozostaje”;
   - wybór każdej kategorii limitu;
   - zmianę panelu szczegółów po wyborze kategorii;
   - układ jednokolumnowy na telefonie i dwukolumnowy na szerokim ekranie.
4. Sprawdź też, czy dodawanie aktywności oraz katalog szkoleń nadal się otwierają.

## Etap 3 — Pull Request

1. Utwórz Pull Request:
   - `base`: `main`;
   - `compare`: `feature/panel-widoki-limity-v6.25.3`.
2. Tytuł:
   `CRPE v6.25.3 – widoki statusu i czytelniejsze limity`.
3. Poczekaj na zielone kontrole GitHuba i Vercela.
4. Przed scaleniem sprawdź, czy PR nie zawiera `.env`, `node_modules`, `.next`
   ani plików z sekretami.
5. Po kontroli kliknij **Merge pull request** i **Confirm merge**.

## Etap 4 — produkcja

1. Poczekaj na deployment `main` oznaczony jako **Production** i **Ready**.
2. Otwórz produkcyjne `crpe.pl`, wykonaj twarde odświeżenie i powtórz krótki
   test przełącznika widoku oraz kategorii limitów.
3. Nie uruchamiaj SQL-a, nie zmieniaj sekretów i nie uruchamiaj importera NIL
   tylko z powodu tego wdrożenia.

## Powrót awaryjny

Jeżeli Preview lub produkcja pokaże błąd panelu, nie wykonuj żadnych zmian w
Supabase. Cofnij wyłącznie commit v6.25.3 w GitHubie i ponownie wdroż `main`.
