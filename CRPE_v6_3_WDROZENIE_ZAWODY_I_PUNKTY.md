# CRPE v6.3 — wdrożenie zawodów i punktów

## Co wykazał eksport z Supabase

W pliku z 7 sierpnia 2026 r. znajduje się:

- 9 aktywnych zawodów;
- 40 szkoleń;
- 39 szkoleń bez zapisanych adresatów;
- 38 szkoleń zaakceptowanych i 2 testowe ze statusem `pending`;
- tylko 1 szkolenie z jawnym tekstem „dla lekarzy i lekarzy dentystów”.

Dotychczasowy filtr traktował brak adresatów jak szkolenie ogólne. To było
źródłem błędnych wyników dla pielęgniarek, ratowników, farmaceutów i innych
zawodów.

## Kolejność wdrożenia

### 1. Supabase — najpierw migracja

1. Otwórz projekt Frankfurt w Supabase.
2. Wejdź w **SQL Editor → New query**.
3. Otwórz plik:
   `supabase/migrations/20260807_crpe_v6_3_training_professions_and_points.sql`.
4. Skopiuj całą zawartość do SQL Editora.
5. Kliknij **Run** tylko jeden raz i poczekaj na wynik.
6. Na końcu powinno pojawić się 5 wierszy z wynikiem `OK`.

Jeżeli wcześniejsza wersja skryptu zakończyła się komunikatem
`P0001: Przed akceptacją ustal adresatów szkolenia` albo
`P0001: Przed akceptacją ustal status punktów`, cała tamta próba została
wycofana przez transakcję. Oba błędy powodował trigger v5.2, który sprawdzał
starsze kolumny i starsze tabele. Ta wersja migracji wykrywa v5.2, zachowuje
jego dane i bezpiecznie zastępuje jego trigger zabezpieczeniem v6.3. Nie trzeba
wykonywać czyszczenia ani dodatkowego SQL.

Migracja jest addytywna: nie usuwa szkoleń, punktów ani dotychczasowego pola
tekstowego. Rekordy bez adresatów otrzymują stan `unknown`, a nie
`all_medical`.

Na końcu pierwszy test powinien brzmieć
`v5.2 zastąpione zabezpieczeniem v6.3` i mieć wynik `OK`.

### 2. Vercel — dopiero po 5 wynikach OK

Wdróż kod z tej paczki tak samo jak poprzednią działającą wersję CRPE.
Nie wdrażaj kodu przed wykonaniem migracji, ponieważ nowa aplikacja odczytuje
nowe kolumny i tabelę `training_profession_rules`.

### 3. Test po wdrożeniu

1. Otwórz `/baza-szkolen` bez logowania.
2. Sprawdź, czy lista domyślna nadal pokazuje przyszłe szkolenia.
3. W filtrze zawodu wybierz **Ratownik medyczny** — nie powinny pojawić się
   szkolenia z nieustalonymi adresatami.
4. Wybierz **Adresaci do weryfikacji** — tutaj powinny znaleźć się stare
   rekordy, których CRPE jeszcze nie sklasyfikowało.
5. Otwórz szczegóły szkolenia. Przy starych danych powinien być widoczny status
   punktów „niezweryfikowane”.
6. Zaloguj się jako administrator i otwórz `/admin/szkolenia`.
7. Edytuj jeden rekord testowy: wybierz adresatów, status punktacji, źródło i
   datę sprawdzenia. Przy statusie „Zweryfikowane” źródło oraz data są
   obowiązkowe.

## Porządkowanie istniejących danych

Najpierw uzupełnij 22 zaakceptowane szkolenia z terminem od 7 sierpnia 2026 r.
Przeszłe wydarzenia można uporządkować później.

Dla każdego szkolenia:

1. sprawdź stronę źródłową;
2. wybierz wyłącznie zawody wskazane przez organizatora;
3. pozostaw „Niezweryfikowane”, jeżeli źródło nie potwierdza punktów;
4. wybierz „Deklarowane przez organizatora”, gdy liczba pochodzi z jego strony;
5. wybierz „Zweryfikowane przez CRPE” dopiero po sprawdzeniu oficjalnego źródła
   i wpisaniu daty kontroli.

Nie zaznaczaj „Wszyscy medycy” tylko dlatego, że temat może być interesujący dla
różnych zawodów. Adresat szkolenia i prawo do punktów to dwie różne informacje.

## Co zmienia v6.3

- nowa tabela relacyjna `training_profession_rules`;
- punkty mogą być przechowywane osobno dla każdego zawodu;
- jawne statusy punktów: `unverified`, `organizer_declared`, `verified`;
- źródło punktacji i data ostatniej weryfikacji;
- filtr korzystający z kodów zawodów, a nie dopasowania fragmentów tekstu;
- osobny stan „Adresaci do weryfikacji”;
- walidacja nowych zgłoszeń po stronie klienta i serwera;
- panel administratora blokujący potwierdzenie punktów bez źródła i daty;
- RLS i granty ograniczające publiczny odczyt do zatwierdzonych szkoleń.

## Ważny efekt przejściowy

Po wdrożeniu filtr konkretnego zawodu może pokazywać mało wyników. To nie jest
błąd — 39 istniejących rekordów nie zawiera wiarygodnej informacji o
adresatach. Wraz z uzupełnianiem danych w panelu administratora będą pojawiały
się we właściwych filtrach.
