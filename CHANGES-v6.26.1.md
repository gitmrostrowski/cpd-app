# CHANGES v6.26.1 — spójność wizualna Panelu CPD z Bazą szkoleń

Data: 2026-08-13

Bazowa wersja: **finalne CRPE v6.26**. Ta poprawka nie cofa zmian v6.26 w adminie szkoleń, importerze NIL, filtrach, nawigacji ani migracji SQL.

Zakres kodu:
- `app/panel-cpd/CalculatorClient.tsx`
- `components/Header.tsx`
- `package.json`
- testy zgodności w `scripts/`

Test: `npm run check:v6.26.1`

---

## 1. Panel CPD zaczyna się od statusu, nie od formularza

**Było:** po wejściu do Panelu CPD pierwszą dużą sekcją były „Ustawienia okresu i zawodu”.
To ustawienia konfiguracyjne, więc zabierały najważniejsze miejsce informacjom, po które użytkownik wchodzi do panelu.

**Jest:** kolejność nawigacji i treści to:

1. `Status i kroki`
2. `Limity`
3. `Aktywności`
4. `Najbliższe terminy`

Ustawienia nie są osobną pozycją głównej nawigacji. Zostały schowane pod akcją
`Zmień ustawienia` w podsumowaniu statusu. Po otwarciu formularz pozostaje pełny i zachowuje dotychczasową funkcjonalność.

Dodatkowo akcje statusu prowadzące wcześniej do `#ustawienia` otwierają teraz ukryty formularz i przewijają do niego, więc zmiana struktury nie tworzy martwego odnośnika.

---

## 2. Status jest hero Panelu CPD

W sekcji „Twój status i kolejne kroki”:

- liczba zdobytych punktów ma teraz **60–64 px** i jest główną kotwicą typograficzną;
- pasek postępu ma **16 px** wysokości zamiast cienkiej linii;
- zdobyte punkty są niebieskie;
- luka do równego tempa jest bursztynowa i kreskowana;
- pozycja „dziś” pozostaje oznaczona markerem;
- przy wystarczającej szerokości segmentu liczby są podpisane bezpośrednio na pasku;
- kafle `Zebrane`, `Luka do tempa`, `Pozostaje` dostały 4-pikselowe semantyczne paski po lewej stronie.

System znaczeń:

| Znaczenie | Kolor |
| --- | --- |
| zdobyte / plan / aktywna akcja | niebieski |
| wymaga uzupełnienia / luka do tempa | bursztynowy |
| po terminie | czerwony / różany |
| kompletne | zielony |
| neutralne / pozostało | szary |

Nie wprowadzono globalnej zasady „każdy postęp = zielony”. Niebieski pozostaje kolorem marki oraz zdobytego postępu w głównym cyklu, a zieleń oznacza stan kompletny/pozytywny.

---

## 3. Aktywności dostały rytm wizualny Bazy szkoleń

Lista aktywności nie rozciąga już luźnej treści na całą szerokość ekranu.

Każdy rekord ma teraz:

- stały blok daty/roku po lewej jako wizualną kotwicę;
- 3-pikselowy pasek statusu po lewej krawędzi karty;
- duże, niebieskie punkty po prawej (`+5 pkt`, `+2 pkt` itd.);
- semantyczny status: czerwony po terminie, bursztynowy do uzupełnienia, niebieski zaplanowany, zielony kompletny;
- mocniejszą akcję dla rekordów wymagających działania (`Rozstrzygnij`, `Uzupełnij`, `Otwórz plan`), zamiast powtarzanego słabego linku `Otwórz →`.

Dla aktywności kompletnych pozostaje spokojniejsza akcja `Szczegóły`.

---

## 4. Dwukolumnowy szkielet Panelu

Od dużych ekranów (`lg`) sekcja aktywności używa układu:

- główna kolumna — lista aktywności;
- prawa kolumna — **320 px** sidebar.

Do sidebara przeniesiono:

- `Oś aktywności`;
- `Najbliższe terminy`.

Sidebar pozostaje przyklejony podczas przewijania na większych ekranach. Dzięki temu główne wiersze są krótsze, gęstsze i wizualnie bliższe układowi Bazy szkoleń. Na mniejszych ekranach całość wraca do jednej kolumny.

---

## 5. Limity — pojemność zamiast cienkiej dekoracyjnej linii

W widoku limitów:

- kategorie dostały semantyczną kropkę i **segmentowany pasek pojemności**;
- zaznaczenie kategorii pozostaje niebieskie;
- pojemność jest czytelna także bez polegania wyłącznie na kolorze;
- wartość `Możesz jeszcze … pkt` została wzmocniona do **34 px** i jest najważniejszą liczbą karty;
- ograniczono wersaliki w mikroetykietach.

Znaczenie kolorów limitu pozostało zgodne z v6.26: zielony = bezpieczny zapas, bursztynowy = blisko limitu, szary = limit wyczerpany, niebieski = zaznaczenie/interakcja.

---

## 6. Mniej wersalików i lepsza hierarchia tekstu

Zmniejszono liczbę drobnych, rozstrzelonych etykiet pisanych wersalikami w Panelu CPD.
Zwykłe etykiety formularza i elementów statusu używają teraz normalnej pisowni oraz mocniejszego kontrastu.

Wersaliki pozostają tylko tam, gdzie pełnią rolę prawdziwego nagłówka technicznego/sekcyjnego i nie konkurują z treścią użytkową.

---

## 7. Przełącznik placówki — bez uciętej nazwy udającej błąd

### Jedna placówka

Użytkownik widzi prostą pigułkę:

`[ikona budynku] Placówka`

Bez chevronu i bez uciętej nazwy. Pigułka prowadzi do placówki, a pełna nazwa jest dostępna jako `title`.

### Wiele placówek

Pigułka jest dwuliniowa:

- pierwsza linia: `Placówka · N`;
- druga linia: pełna nazwa aktywnej placówki, przycięta tylko w tej pomocniczej linii, albo `Wybierz kontekst` w widoku osobistym;
- chevron informuje o możliwości przełączenia.

Menu ma około 300 px i zawiera:

- nagłówek `Aktywna placówka` / `Wybierz placówkę`;
- pełną nazwę bieżącego kontekstu;
- listę placówek z rolą użytkownika jako drugą linią;
- zaznaczenie aktywnej placówki;
- wyszukiwarkę przy więcej niż 6 placówkach;
- `Pokaż wszystkie placówki`;
- `Zarządzaj placówkami`;
- powrót do widoku osobistego w kontekście placówki.

Po przełączeniu pokazywany jest krótki toast `Przełączono na …`.

**Świadoma decyzja:** nie dodano miasta ani liczby osób w placówce, ponieważ obecny `OrganizationContext` nie dostarcza tych danych. Zamiast robić niepotrzebne zapytanie/API/SQL wyłącznie dla dekoracyjnej drugiej linii, używana jest istniejąca rola użytkownika. Rozszerzenie kontekstu można zrobić później jako osobny zakres.

---

## 8. Czego v6.26.1 nie zmienia

- nie zmienia reguł CPD ani obliczeń punktowych;
- nie zmienia danych aktywności ani cykli;
- nie zmienia schematu Supabase;
- nie zmienia API;
- nie zmienia importera NIL ani workflow GitHub Actions;
- nie zmienia admina szkoleń z v6.26;
- nie zmienia sekretów, SMTP/Brevo ani konfiguracji Vercel.

To jest warstwa układu, hierarchii wizualnej i nawigacji Panelu CPD z zachowaniem logiki v6.26.

---

## 9. SQL i zależność od v6.26

**v6.26.1 nie dodaje nowej migracji SQL.**

Jednak paczka jest pełnym repo zbudowanym na v6.26. Jeżeli środowisko produkcyjne nadal działa na potwierdzonej v6.25.4 i wdrażamy od razu tę paczkę, przed frontendem nadal trzeba wykonać istniejącą migrację v6.26:

`supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`

Jeżeli v6.26 i ta migracja byłyby wcześniej już wdrożone, v6.26.1 nie wymaga kolejnego SQL-a.

---

## 10. Kontrole

Dodano:

`npm run check:v6.26.1`

Test pilnuje m.in. nowej kolejności sekcji, skali hero, grubszego paska postępu,
semantycznych pasków, dwukolumnowego układu, segmentowanych limitów oraz zachowania przełącznika placówki.

Zaktualizowano także wcześniejsze testy v6.25.4 i v6.26 wyłącznie w tych asercjach,
które sprawdzały stary szczegół prezentacji. Ich wymagania funkcjonalne pozostają zachowane.
