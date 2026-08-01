# CRPE v5.2 — TRAINING AUDIENCE & PROFESSION CREDITS

## Cel

Usunięcie błędnego założenia, że brak zawodu przy szkoleniu oznacza „dla
wszystkich”, oraz rozdzielenie grupy docelowej od formalnej punktacji.

## Zakres

- obowiązkowy wybór: wszystkie zawody medyczne albo wybrane zawody;
- wielokrotny wybór zawodów z tabeli `professions`;
- trzy stany punktacji: brak informacji, bez punktów, przyznaje punkty;
- punktacja osobno dla każdego zawodu wraz z podmiotem, podstawą i źródłem;
- transakcyjne zgłoszenie przez RPC i limit 10 zgłoszeń na godzinę;
- domyślny filtr „Dla mojego zawodu” obejmujący szkolenia ogólne;
- dokładne filtrowanie po UUID zawodu zamiast fragmentach tekstu;
- etykiety adresatów oraz informacja o punktach zależna od zawodu użytkownika;
- pełna edycja adresatów i punktacji w panelu operatora;
- blokada bazodanowa akceptacji rekordu z nieustaloną klasyfikacją;
- bezpieczna migracja rekordów historycznych.

## Model danych

- `trainings.audience_scope`: `all`, `selected`, `unknown`;
- `trainings.credit_status`: `unknown`, `none`, `awarded`;
- `training_target_professions`: relacja szkolenie–adresat;
- `training_profession_credits`: punktacja szkolenie–zawód;
- `submit_training_v5_2`: atomowe utworzenie kompletnego zgłoszenia;
- `admin_set_training_classification_v5_2`: atomowa edycja klasyfikacji przez operatora.

## Zachowanie danych historycznych

- tekst jednoznacznie oznaczający wszystkich zostaje zmapowany na `all`;
- tekst dokładnie odpowiadający zawodowi w słowniku zostaje zmapowany na
  `selected`;
- dodatnia liczba punktów przy jednym jednoznacznym zawodzie zostaje zachowana
  jako deklaracja organizatora;
- puste i niejednoznaczne wartości pozostają `unknown`;
- rekordy z `unknown` nie są pokazywane w publicznej bazie do czasu przeglądu
  operatora.
- automatyczne oznaczenie `all` korzysta wyłącznie z zamkniętej listy
  jednoznacznych określeń; sam fragment „ogóln” nie rozszerza grupy docelowej;
- zapis punktacji w panelu operatora oznacza ją jako zweryfikowaną przez
  operatora.

## Zgodność

Kolumny `points` i `target_profession_text` pozostają jako pola zgodności dla
starszych modułów. Ich wartości są wyliczane z nowego modelu i nie są już
źródłem prawdy.
