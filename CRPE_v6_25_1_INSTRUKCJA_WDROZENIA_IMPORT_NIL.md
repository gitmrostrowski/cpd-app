# CRPE v6.25.1 — wdrożenie importera NIL krok po kroku

Instrukcja zakłada, że obecne repo CRPE jest połączone z Vercel, a produkcyjna
baza znajduje się w projekcie Supabase Frankfurt. Nie uruchamiaj importu `live`
ani harmonogramu przed wykonaniem wszystkich testów opisanych poniżej.

## Co zmienia v6.25.1

- nowe szkolenia z NIL trafiają do moderacji jako `pending`;
- zmiana istniejącego szkolenia nie nadpisuje poprawek moderatora;
- panel pokazuje porównanie „obecnie w CRPE / nowa wartość NIL”;
- moderator wybiera konkretne pola do zastosowania albo odrzuca propozycję;
- po zastosowaniu zmiany szkolenie wraca do `pending` i wymaga finalnej akceptacji;
- wpisy bez ustalonego terminu są przechowywane jako „termin do ustalenia”;
- pełne opisy NIL są domyślnie pomijane;
- limit 128 KB działa także dla żądań bez `Content-Length`;
- RSS jest pobierany z identyfikującym `User-Agent`.

## Ważne przed rozpoczęciem

1. Jeżeli nie uruchamiałeś migracji v6.25 — uruchom wyłącznie nowy plik v6.25.1.
2. Jeżeli migracja v6.25 została już uruchomiona — nowy plik również jest
   właściwy; zaktualizuje funkcję importu i utworzy kolejkę zmian.
3. Nie uruchamiaj starego pliku `20260811_crpe_v6_25_training_imports.sql`.
   Nie ma go już w tej paczce.
4. Nie zapisuj `service_role` w GitHubie. Importer używa konta technicznego i
   publicznego klucza `anon`.
5. Nie ustawiaj jeszcze `NIL_IMPORT_ENABLED` ani `NIL_IMPORT_FULL_DESCRIPTIONS`.

## Etap 1 — branch i pliki

Zalecana nazwa brancha: `feature/nil-importer`.

### GitHub Desktop

1. Otwórz lokalne repo CRPE w GitHub Desktop.
2. Wybierz **Current branch → New branch**.
3. Nazwij branch `feature/nil-importer` i utwórz go z `main`.
4. Rozpakuj paczkę v6.25.1.
5. Skopiuj zawartość katalogu `cpd-app-main` do lokalnego katalogu repo.
6. Nie kopiuj zewnętrznego ZIP-a, `node_modules`, `.next` ani plików `.env`.
7. Sprawdź w GitHub Desktop listę zmian.
8. Wykonaj commit `CRPE v6.25.1 - bezpieczna kolejka zmian NIL`.
9. Kliknij **Push origin**.

### Kontrola na github.com

Na branchu muszą być widoczne między innymi:

- `.github/workflows/import-nil-trainings.yml`;
- `integrations/training-importer/`;
- `supabase/migrations/20260811_crpe_v6_25_1_training_imports.sql`;
- `supabase/setup/REGISTER_NIL_IMPORTER.sql`.

Vercel może już tworzyć preview, ale panel i katalog zaczną działać poprawnie po
wykonaniu migracji z następnego etapu.

## Etap 2 — migracja Supabase

1. Otwórz właściwy projekt Supabase Frankfurt.
2. Wejdź w **SQL Editor → New query**.
3. Otwórz lokalny plik
   `supabase/migrations/20260811_crpe_v6_25_1_training_imports.sql`.
4. Skopiuj całą zawartość do SQL Editor.
5. Kliknij **Run**.
6. Na końcu powinno pojawić się 8 kontroli — wszystkie z wynikiem `OK`.

Migracja najpierw sprawdza tabelę `trainings`. Jeżeli brakuje wymaganej kolumny
albo istniejący enum nie dopuszcza wartości importera, transakcja wycofa się i
pokaże komunikat zaczynający się od `CRPE v6.25.1:`. W takiej sytuacji skopiuj
cały komunikat błędu i nie uruchamiaj kolejnych kroków.

Migracja jest zgodna z v6.24: dodane kolumny i funkcje nie są używane przez
starszą aplikację, dopóki branch nie zostanie połączony z `main`.

## Etap 3 — preview Vercela

1. Otwórz Vercel → projekt CRPE → **Deployments**.
2. Znajdź wdrożenie brancha `feature/nil-importer`.
3. Jeżeli powstało przed migracją, użyj **Redeploy** albo poczekaj na nowy commit.
4. Poczekaj na status **Ready**.
5. Sprawdź stronę główną, logowanie, `/baza-szkolen` i `/admin/szkolenia`.
6. W panelu administratora nie powinien pojawić się błąd kolejki importu.

## Etap 4 — konto techniczne NIL

Pomiń tworzenie nowego konta, jeżeli konto importera NIL już istnieje.

1. Supabase → **Authentication → Users**.
2. Kliknij **Add user → Create new user**.
3. Użyj osobnego adresu, np. `importer.nil@crpe.pl`.
4. Wygeneruj losowe hasło o długości co najmniej 24 znaków.
5. Zapisz je w menedżerze haseł i utwórz użytkownika jako potwierdzonego.
6. Nie używaj tego konta do zwykłego logowania w CRPE.

Przypisanie konta do źródła:

1. Otwórz `supabase/setup/REGISTER_NIL_IMPORTER.sql`.
2. Zastąp `WPISZ_TUTAJ_EMAIL_IMPORTERA_NIL` adresem konta.
3. Wklej skrypt do nowej kwerendy w SQL Editor i kliknij **Run**.
4. Wynik powinien zawierać `source_code = nil`, `is_active = true` i `OK`.

## Etap 5 — Pull Request i produkcja

1. GitHub → **Pull requests → New pull request**.
2. Ustaw `base: main`, `compare: feature/nil-importer`.
3. Utwórz Pull Request i sprawdź listę plików.
4. Po zielonym preview kliknij **Merge pull request**.
5. Poczekaj na produkcyjny deployment Vercela ze statusem **Ready**.

Przycisk ręcznego uruchomienia wymaga, aby workflow z `workflow_dispatch`
znajdował się na domyślnym branchu. Po merge możesz uruchamiać go z zakładki
**Actions**. Dokumentacja: [ręczne uruchamianie workflow](https://docs.github.com/actions/managing-workflow-runs/manually-running-a-workflow).

## Etap 6 — sekrety GitHub Actions

Repozytorium GitHub → **Settings → Secrets and variables → Actions → Secrets**.

Dodaj cztery **repository secrets**:

| Nazwa | Wartość |
|---|---|
| `SUPABASE_URL` | wartość `NEXT_PUBLIC_SUPABASE_URL` z działającego Vercela |
| `SUPABASE_ANON_KEY` | wartość `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `NIL_IMPORT_EMAIL` | adres konta technicznego NIL |
| `NIL_IMPORT_PASSWORD` | hasło konta technicznego NIL |

Nie używaj `service_role`. GitHub opisuje tę ścieżkę w dokumentacji
[Using secrets in GitHub Actions](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions).

W zakładce **Variables** możesz opcjonalnie dodać:

| Nazwa | Wartość |
|---|---|
| `CRPE_INTEGRATION_ENDPOINT` | `https://www.crpe.pl/api/integrations/nil/trainings` |

Adres jest już domyślny, więc zmienna nie jest wymagana.

Na tym etapie nie twórz:

- `NIL_IMPORT_ENABLED`;
- `NIL_IMPORT_FULL_DESCRIPTIONS`.

## Etap 7 — trzy testy GitHub Actions

GitHub → **Actions → Import szkoleń — NIL → Run workflow**.

### Test 1: `local_dry_run`

1. Wybierz branch `main`.
2. Wybierz tryb `local_dry_run`.
3. Kliknij **Run workflow**.
4. Otwórz przebieg i sprawdź podsumowanie.

Oczekiwany rezultat dla feedu z 11 sierpnia 2026: 9 pozycji źródłowych,
9 gotowych i 0 pominiętych. Liczba może się później zmienić wraz z RSS, ale
workflow musi zakończyć się na zielono. Ten tryb nie loguje się do CRPE i niczego
nie zapisuje.

Sprawdź w logu przynajmniej:

- pozycja `1300` ma `schedule_status: to_be_determined` i puste daty;
- webinary mają `voivodeship: null`;
- daty nie są przesunięte o jeden dzień;
- `description` jest `null`;
- ostrzeżenia parsera są czytelne.

### Test 2: `server_dry_run`

1. Uruchom workflow ponownie.
2. Wybierz `server_dry_run`.
3. Sprawdź, czy logowanie i wszystkie requesty zakończyły się powodzeniem.

Możliwe statusy:

- `would_create` — nowe szkolenie;
- `would_queue_change` — istnieje rekord, ale NIL proponuje zmianę;
- `would_be_unchanged` — brak zmiany;
- `would_be_change_pending` — identyczna propozycja już czeka;
- `would_be_change_rejected` — ta wersja została wcześniej odrzucona.

Ten tryb przechodzi przez endpoint i funkcję bazy, ale niczego nie zapisuje.

### Test 3: `live`

1. Uruchom workflow trzeci raz w trybie `live`.
2. Poczekaj na zielony wynik.
3. Otwórz `https://www.crpe.pl/admin/szkolenia`.
4. Sprawdź rekordy oznaczone `IMPORT: NIL`.
5. Nowe wpisy popraw ręcznie i zaakceptuj dopiero po kontroli.

Powtórny `live` bez zmiany RSS powinien zwrócić głównie `unchanged`, bez
duplikatów.

## Etap 8 — obsługa zmiany istniejącego szkolenia

Gdy NIL zmieni zaakceptowane szkolenie:

1. Bieżąca publiczna wersja pozostaje bez zmian.
2. W `/admin/szkolenia` pojawi się fioletowe oznaczenie
   **NIL zgłosił zmianę**.
3. Kliknij **Porównaj NIL**.
4. W tabeli zobaczysz obecną i nową wartość każdego zmienionego pola.
5. Odznacz pola, których nie chcesz nadpisywać.
6. Kliknij **Zastosuj wybrane** albo **Odrzuć zmianę NIL**.
7. Po zastosowaniu szkolenie ma status `do weryfikacji`; sprawdź całość i kliknij
   zwykłe **Akceptuj**.

Odrzucona wersja źródła nie będzie wracać co 6 godzin. Nowa propozycja powstanie
dopiero wtedy, gdy NIL faktycznie zmieni treść ponownie.

## Etap 9 — włączenie automatu

Dopiero po udanym `live`:

1. GitHub → **Settings → Secrets and variables → Actions → Variables**.
2. Kliknij **New repository variable**.
3. Dodaj `NIL_IMPORT_ENABLED` z wartością `true`.

Importer działa co 6 godzin, 17 minut po pełnej godzinie. Minuta 17 ogranicza
ryzyko opóźnień przy dużym obciążeniu GitHub Actions na początku godziny.

Wyłączenie automatu:

- ustaw `NIL_IMPORT_ENABLED=false` albo usuń zmienną;
- dodatkowo możesz ustawić `is_enabled=false` dla `nil` w
  `training_import_sources`;
- w sytuacji awaryjnej ustaw `is_active=false` przy koncie importera.

Nie usuwaj rekordów ani konta technicznego podczas diagnozy.

## Pełne opisy NIL

Domyślnie CRPE importuje tytuł, termin, format, punkty, zawody i link, ale nie
kopiuje pełnego opisu NIL. Po uzyskaniu potwierdzenia zasad wykorzystania treści
możesz ustawić zmienną repozytorium:

`NIL_IMPORT_FULL_DESCRIPTIONS=true`

Zrób to dopiero po potwierdzeniu. Pierwszy import po włączeniu utworzy propozycje
zmian opisów, które nadal wymagają decyzji moderatora.

## Dodawanie OIL jako kolejnych źródeł

Każda OIL otrzymuje:

1. osobny kod, np. `oil_warszawa`;
2. osobny adapter w `integrations/training-importer/src/sources/`;
3. fixture i testy mapowania;
4. wpis w `training_import_sources` dodany nową migracją;
5. osobne konto techniczne Supabase;
6. osobne sekrety i workflow GitHub Actions;
7. osobny przełącznik harmonogramu.

Wspólne pozostają endpoint, walidacja, blokada duplikatów, limit requestu,
kolejka porównawcza i panel moderacji. Nie współdziel kont ani haseł pomiędzy
NIL i OIL.

## Najczęstsze problemy

### Nie ma przycisku „Run workflow”

Sprawdź, czy `.github/workflows/import-nil-trainings.yml` istnieje na `main` i
zawiera `workflow_dispatch`. GitHub wymaga obecności workflow na domyślnym
branchu.

### Workflow jest czerwony przy logowaniu

Sprawdź nazwy czterech sekretów, konto importera oraz skrypt
`REGISTER_NIL_IMPORTER.sql`. Nie wklejaj wartości sekretów do logów ani do czatu.

### SQL zwrócił `CRPE v6.25.1: ...`

Nie uruchamiaj importu. Zachowaj pełny komunikat — wskazuje brakującą kolumnę,
typ albo niedozwoloną wartość istniejącej tabeli `trainings`.

### Harmonogram nie ruszył dokładnie o czasie

GitHub zaznacza, że zadania `schedule` mogą być opóźnione przy dużym obciążeniu.
Sprawdź historię w **Actions**; ręczny `live` nadal pozostaje dostępny.
