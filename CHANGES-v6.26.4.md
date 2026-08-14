# CHANGES v6.26.4 — czytelny panel moderacji szkoleń

Data: 2026-08-14
Baza: CRPE v6.26.3 (v6.26.2 + hotfix testów NIL)

Zakres tej wersji jest celowo ograniczony do widoku `Admin → Szkolenia` i jego testów. Nie zmieniono scrapera NIL, workflow importu, Supabase, migracji, Panelu CPD ani publicznej Bazy szkoleń.

## 1. Lista nie jest już szeroką tabelą

Stary widok wymuszał tabelę `min-w-[1180px]`. Przy wielu rekordach powstawała bardzo długa, trudna do skanowania lista, a najważniejsze informacje były rozrzucone między kolumnami.

Nowy widok używa kompaktowych kart. Każda karta ma:

- wyraźną etykietę rodzaju rekordu;
- tytuł i źródło;
- cztery najważniejsze bloki: organizator, termin, punkty i zapisy;
- podgląd zmiany źródłowej tylko wtedy, gdy zmiana faktycznie istnieje;
- prawy panel decyzji moderatora;
- zwijane „Więcej danych i ślad audytowy”.

## 2. Nowy wpis i zmiana istniejącego wpisu są rozdzielone znaczeniowo

Reguła jest jednoznaczna:

- `NOWY WPIS` — rekord ma status `pending` i nie ma oczekującego wpisu w `training_import_changes`;
- `ZMIANA ISTNIEJĄCEGO WPISU` — dla szkolenia istnieje oczekująca zmiana źródłowa;
- `ISTNIEJĄCY WPIS` — rekord nie jest nowy i nie ma oczekującej zmiany źródłowej.

Dodano domyślną kolejkę `Do decyzji`, która łączy nowe wpisy i zmiany istniejących rekordów. Osobne zakładki nadal pozwalają przejść do `Zmiany w istniejących`, `Nowe wpisy`, `Zapisy i miejsca` oraz `Wszystkie`.

## 3. Zmiana NIL jest widoczna bez otwierania modala

Dla istniejącego wpisu karta pokazuje do czterech zmienionych pól w formie:

`stara wartość → nowa wartość`

Pełne porównanie pozostaje dostępne jednym przyciskiem. W modalu porównania dodano również `Edytuj wpis ręcznie`, żeby moderator mógł przejść bezpośrednio do pełnego formularza zamiast najpierw zamykać porównanie.

## 4. Każdy rekord ma zawsze edycję

Przycisk `Edytuj wszystkie dane` jest zawsze widoczny na karcie — niezależnie od tego, czy rekord jest nowy, zaakceptowany, odrzucony, czy ma zmianę ze źródła.

Formularz edycji rozszerzono o pola, których wcześniej nie dało się zmienić z panelu admina:

- format;
- kategoria;
- lokalizacja / województwo;
- status zapisów;
- liczba miejsc;
- informacja o nagraniu;
- flaga Partner CRPE;
- tematy.

Wcześniejsze pola nadal są edytowalne: tytuł, organizator, logo, adresaci, punkty i ich weryfikacja, cena, termin i godziny, strefa czasowa, link, prowadzący, opis, status akceptacji i powód odrzucenia.

Pola audytowe i techniczne pozostają tylko do odczytu: identyfikatory źródła, osoba/źródło dodające rekord, daty utworzenia/aktualizacji i identyfikatory importera.

## 5. Modal edycji

- szerokość zwiększona z `max-w-2xl` do `max-w-4xl`;
- nagłówek i pasek akcji są przyklejone podczas przewijania;
- formularz jasno informuje, które dane są edytowalne, a które są śladem audytowym.

## 6. Filtry

Układ filtrów został wyrównany do dwóch logicznych rzędów:

- status + wyszukiwanie + dodane przez;
- data dodania + termin szkolenia.

Nie zmieniono logiki filtrowania ani zapytań do bazy.

## 7. Bezpieczeństwo i zakres

Nie zmieniono:

- `integrations/training-importer/src/sources/nil.ts`;
- `.github/workflows/import-nil-trainings.yml`;
- migracji Supabase;
- funkcji RPC;
- sekretów i zmiennych GitHub/Vercel;
- Panelu CPD;
- publicznego katalogu szkoleń.

Wersja nie wymaga SQL-a ani nowych sekretów.

## 8. Testy

Dodano `npm run check:v6.26.4`.

Historyczny `check:v6.26` zaktualizowano wyłącznie tak, aby akceptował zarówno dawną kolumnę `Zapisy` w tabeli, jak i nowy blok `Zapisy` w kartach. Pozostałe warunki testu v6.26 są zachowane.
