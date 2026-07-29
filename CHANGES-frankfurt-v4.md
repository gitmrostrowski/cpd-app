# CRPE Frankfurt v4 — fundament merytoryczny

Data: 2026-07-29

## Cel wersji

V4 usuwa z aplikacji przykładowe cele i limity wpisane na sztywno oraz
wprowadza fundament pod wiarygodne, wersjonowane reguły CPD.

## Co zmieniono

### Baza danych

- `professions` pozostaje jedynym słownikiem zawodów;
- słownik można rozszerzać rekordami w bazie bez przebudowy list w aplikacji;
- dodano:
  - `cpd_rule_sets`,
  - `cpd_rule_sources`,
  - `cpd_rule_requirements`;
- cykl CPD może przechowywać:
  - przypiętą wersję reguły,
  - tryb `custom` lub `rule_set`,
  - status formalny potwierdzony poza CRPE;
- wszystkie wcześniejsze cykle pozostają bez zmian jako `custom`;
- RLS jest włączone, a zalogowani użytkownicy mają wyłącznie odczyt katalogu
  reguł.

### Reguły startowe

Jako zweryfikowaną regułę podstawową dodano wyłącznie:

- lekarz: 200 pkt / 48 miesięcy;
- lekarz dentysta: 200 pkt / 48 miesięcy.

Wersja: `2022.1`.

Źródło:

- Rozporządzenie Ministra Zdrowia z dnia 21 lutego 2022 r.
  w sprawie sposobu dopełnienia obowiązku doskonalenia zawodowego lekarzy
  i lekarzy dentystów (Dz.U. 2022 poz. 464);
- https://eli.gov.pl/eli/DU/2022/464/ogl

Zakres tej wersji to `target_only`: zweryfikowany jest cel i długość okresu,
ale CRPE nie kwalifikuje jeszcze automatycznie każdej formy aktywności.
Reguła zawiera ostrzeżenie o wyjątkach, w tym o obniżeniu celu dla okresów
objętych stanem zagrożenia epidemicznego lub stanem epidemii. Z tego powodu
nie jest automatycznie przypisywana istniejącym cyklom.

Pozostałe zawody mają rekordy `draft` bez punktów i długości okresu. Aplikacja
nie używa ich jako wymogów ustawowych.

### Aplikacja

- profil, onboarding, kalkulator i Baza szkoleń pobierają zawody z bazy;
- zapis profilu rozwiązuje zawód przez rekord `professions`, a nie mapę w kodzie;
- usunięto cele 100/120/200 przypisywane zawodom bez źródła;
- usunięto wspólny limit „Samokształcenie 20 pkt”;
- usunięto przykładowe limity webinarów, szkoleń wewnętrznych, prenumerat,
  towarzystw i komisji;
- kalkulator pokazuje trzy odrębne poziomy:
  1. punkty zadeklarowane,
  2. punkty według pełnych reguł CRPE,
  3. status formalny;
- przy braku pełnej reguły poziom 2 ma status „Nieobliczane”;
- wynik jest opisany jako „status ewidencji według danych w CRPE”;
- portfolio i raport użytkownika nie używają już komunikatu
  „wymagania spełnione”;
- widoczna jest wersja, data weryfikacji i oficjalne źródło reguły;
- istniejący cykl nie jest automatycznie zmieniany po wykryciu dostępnej reguły.

## Kolejność wdrożenia

1. W Supabase Frankfurt uruchom:
   `supabase/migrations/20260729_crpe_v4_professions_and_cpd_rules.sql`.
2. Sprawdź, czy końcowy raport zawiera 10 wyników `OK`.
3. Wgraj zawartość repozytorium v4 do dotychczasowego repozytorium GitHub.
4. Poczekaj na zakończenie wdrożenia Vercel.
5. Wyloguj się, zaloguj ponownie i wykonaj `Ctrl + F5`.

Nie wdrażaj aplikacji v4 przed migracją SQL. Nowy kod odczytuje tabele reguł.

## Testy

- `npm run check:v4` — 10/10 OK;
- `npx tsc --noEmit` — OK;
- pełny `next build` należy sprawdzić również w Vercel.

## Ograniczenia świadome

- CRPE nie potwierdza formalnie obowiązku;
- v4 nie nakłada szczegółowych limitów na formy aktywności;
- v4 nie zmienia automatycznie cykli przeniesionych z UK;
- włączenie reguł dla kolejnego zawodu wymaga źródła, daty weryfikacji
  i zmiany statusu zestawu z `draft` na `verified`;
- przypisanie szkoleń do zawodów pozostaje jeszcze tekstowe; relacja
  `training_target_professions` jest częścią późniejszego modułu organizatora.
