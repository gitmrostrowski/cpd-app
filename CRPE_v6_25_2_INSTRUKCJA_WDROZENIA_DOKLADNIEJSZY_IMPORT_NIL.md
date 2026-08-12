# CRPE v6.25.2 — instrukcja wdrożenia dokładniejszego importu NIL

Ta wersja jest aktualizacją działającego v6.25.1. Nie uruchamia żadnej migracji,
nie zmienia konta technicznego i nie wymaga ponownego dodawania sekretów.

## Co pozostaje bez zmian

- nowe szkolenia i zmiany trafiają do ręcznej moderacji;
- importer rozpoznaje rekordy po `source_external_id`, więc nie tworzy duplikatów;
- pełne opisy NIL pozostają wyłączone;
- punkty pozostają niezweryfikowane do decyzji administratora;
- harmonogram pozostaje wyłączony, dopóki nie istnieje zmienna
  `NIL_IMPORT_ENABLED=true`.

## Etap 1 — branch i podmiana plików

1. W GitHub Desktop przełącz repozytorium CRPE na `main` i użyj **Fetch origin**.
2. Utwórz branch `feature/nil-importer-v6.25.2` z aktualnego `main`.
3. Rozpakuj paczkę v6.25.2.
4. Skopiuj zawartość katalogu `cpd-app-main` do lokalnego repozytorium CRPE,
   zgadzając się na podmianę istniejących plików.
5. Nie kopiuj zewnętrznego ZIP-a, katalogów `node_modules`, `.next` ani `.env`.
6. W GitHub Desktop sprawdź listę zmian i wykonaj commit:
   `CRPE v6.25.2 - dokładniejsze pobieranie danych NIL`.
7. Kliknij **Push origin**.

## Etap 2 — czego nie wykonywać

- Nie uruchamiaj żadnego SQL-a w Supabase.
- Nie twórz ponownie konta `importer.nil@crpe.pl`.
- Nie zmieniaj czterech istniejących sekretów GitHub Actions.
- Nie włączaj `NIL_IMPORT_FULL_DESCRIPTIONS`.
- Nie uruchamiaj jeszcze trybu `live`.

## Etap 3 — test brancha

1. GitHub → **Actions → Import szkoleń — NIL → Run workflow**.
2. Wybierz branch `feature/nil-importer-v6.25.2`.
3. Wybierz `local_dry_run` i uruchom workflow jeden raz.
4. Oczekiwane podsumowanie dla obecnego zestawu dziewięciu szkoleń:
   - 9 pozycji źródłowych;
   - 9 gotowych;
   - 0 pominiętych;
   - 9 pobranych stron szczegółowych;
   - 0 fallbacków do RSS.

Jeżeli jedna strona NIL będzie chwilowo niedostępna, workflow może nadal być
zielony i pokazać 1 fallback. To kontrolowane zachowanie. Nie uruchamiaj testu
ponownie od razu; sprawdź w logu, którego rekordu dotyczy ostrzeżenie.

W logu sprawdź szczególnie szkolenie `1806`:

- `profession_codes`: `doctor`, `dentist`;
- `start_time`: `18:00`;
- `end_time`: `20:00`;
- prowadząca: `dr n. med. Magdalena Antoszewska`;
- `enrollment_status`: `open`.

## Etap 4 — Pull Request i produkcja

1. Utwórz Pull Request z
   `feature/nil-importer-v6.25.2` do `main`.
2. Tytuł: `CRPE v6.25.2 – dokładniejsze pobieranie danych NIL`.
3. Poczekaj na zielone kontrole i preview Vercela.
4. Po kontroli kliknij **Merge pull request**.
5. Poczekaj na produkcyjny deployment Vercela ze statusem **Ready**.

## Etap 5 — bezpieczny test serwera

1. Uruchom workflow na branchu `main` w trybie `server_dry_run`.
2. Nic nie zostanie zapisane.
3. Dla dziewięciu wcześniej zaimportowanych rekordów oczekuj głównie statusów
   `would_queue_change`, `would_be_change_pending` albo `would_be_unchanged`.
4. Wynik zależy od tego, które rekordy były wcześniej ręcznie edytowane.
5. Błędy API muszą wynosić `0`.

## Etap 6 — aktualizacja kolejki

Po zielonym `server_dry_run`:

1. Uruchom workflow na `main` w trybie `live` tylko jeden raz.
2. Import nie utworzy drugiego kompletu szkoleń. Zmiany trafią do kolejki NIL.
3. Otwórz **Szkolenia (admin)** i użyj **Porównaj NIL**.
4. Sprawdź oraz zastosuj potrzebne pola, zwłaszcza:
   - tytuł;
   - adresatów;
   - godziny;
   - prowadzących;
   - lokalizację;
   - status zapisów.
5. Po zastosowaniu zmian rekord nadal ma status `do weryfikacji`. Dopiero po
   pełnej kontroli ustaw punkty jako zweryfikowane i zaakceptuj szkolenie.

## Opcjonalny wyłącznik stron szczegółowych

Jeżeli NIL trwale zmieni strukturę strony i parser zacznie zgłaszać błędy, można
tymczasowo dodać w GitHub Actions zmienną repozytorium:

`NIL_IMPORT_DETAILS_ENABLED=false`

Importer wróci wtedy do danych RSS. Po naprawie usuń zmienną. Nie jest ona
potrzebna podczas zwykłego wdrożenia.
