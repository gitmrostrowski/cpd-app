# CHANGES v6.26 — przegląd zmian ze źródła, filtry dat i kolor w Panelu CPD

Data: 2026-08-13
Zakres: `components/Header.tsx`, `components/AppPageHeader.tsx`,
`app/panel-cpd/CalculatorClient.tsx`, `app/admin/szkolenia/page.tsx`,
`integrations/training-importer/src/sources/nil.ts`,
`supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql`.

Test: `npm run check:v6.26`

---

## 1. Skala ikon w kaflach — 62% zamiast 50%

**Było.** `IconBubble` rysował kafel 40 px z ikoną 16–20 px. Ikony konturowe mają
dużo światła w środku i przy 50 % powierzchni czytają się jako mniejsze, niż są —
w efekcie wyglądały jak plamka pływająca w kwadracie.

**Jest.** Kafel 44 px, ikona 28 px (63 %), kreska 1,75 px. Rozmiar wymuszany jest
na dziecku (`[&_svg]:h-7 [&_svg]:w-7 [&_svg]:stroke-[1.75]`), więc wszystkie
miejsca wywołania dostają tę samą proporcję bez zmiany call-site. To samo w
`AppPageHeader`.

**Uwaga przy skalowaniu.** Kreska musi rosnąć razem z ikoną. Kontur 1,5 px
rozciągnięty do 28 px wygląda anemicznie — stąd `stroke-[1.75]`.

---

## 2. Panel CPD → Twoje limity: kolory zamienione miejscami

**Było.** Zaznaczenie kategorii, obrys karty i górny akcent były zielone, a paski
postępu niebieskie — odwrotnie niż w reszcie projektu, gdzie niebieski jest
kolorem marki i zaznaczenia.

**Jest.**

| Rola | Kolor |
| --- | --- |
| zaznaczenie, obrys, akcent chrome | `blue-300` / `blue-100` / `blue-600` |
| postęp (pasek kategorii, „Wykorzystanie limitu") | `emerald-500` |
| ostrzeżenie (blisko limitu) | `amber-400` |
| limit wyczerpany | `slate-400` |

Obrys `border-emerald-100` przy kafelku „Z wolnym miejscem" zszedł na
`border-slate-200` — status niesie liczba, nie ramka.

**Decyzja v6.26.** Główny pasek postępu okresu („Zebrane / Luka do tempa /
Pozostaje") pozostaje niebieski. Niebieski w tym miejscu niesie markę i faktycznie
zebrane punkty, a zieleń w zakładce Limitów oznacza bezpieczne wykorzystanie
dostępnego limitu. Nie wprowadzamy globalnej zasady „każdy postęp = zielony",
bo mieszałaby znaczenie statusu z samą wielkością postępu.

---

## 3. Nawigacja: „Moje CRPE" i długa nazwa placówki

**Było.** Pozycja „Moje CRPE" prowadziła do `/panel-cpd`, czyli do miejsca, do
którego prowadził też przycisk „Panel CPD" stojący 20 px obok. Przełącznik
placówki miał `max-w-56` i przy nazwie „Placówka pilotażowa CRPE…" rozpychał
prawą stronę paska, przesuwając nawigację.

**Jest.**

- „Moje CRPE" usunięte z paska desktopowego.
- Powrót do widoku osobistego przeniesiony do menu placówek — pokazuje się
  wyłącznie w kontekście `/placowka`, czyli wtedy, gdy jest potrzebny.
- Przełącznik placówki ma stałą szerokość 188 px. Nazwa się przycina, pełna
  wersja jest w `title` i na liście rozwijanej. Pasek nie zmienia układu zależnie
  od tego, jak nazwano placówkę.
- Przełącznik pojawia się od `lg` (było `xl`) i tylko gdy użytkownik ma choć
  jedną placówkę.
- „Moje CRPE" usunięto również z menu mobilnego, ponieważ mobilny `APP_NAV`
  już zawiera „Panel CPD". Powrót z kontekstu placówki nadal jest możliwy przez
  „Panel CPD", a na desktopie dodatkowo przez „Wróć do widoku osobistego"
  w przełączniku placówki.

---

## 4. Admin → Akceptacja i edycja szkoleń

### 4.1 Diagnoza

Dane były kompletne, prezentacja nie. Każda zmiana ze scrapera wyglądała
identycznie: fioletowa plakietka „NIL zgłosił zmianę (3)". Żeby dowiedzieć się,
czy chodzi o listę rezerwową czy o liczbę punktów, moderator musiał otworzyć
modal. Aktualny stan zapisów i liczba miejsc nie były w ogóle widoczne na
liście — mimo że baza je trzyma, a `fetchTrainings` je pobiera.

### 4.2 Klasyfikacja wagi zmian

Nowe stałe w `app/admin/szkolenia/page.tsx`:

- **operacyjne** — `enrollment_status`, `capacity`. Zmieniają się często, nie
  wpływają na to, czy szkolenie należy do bazy ani za co daje punkty.
- **merytoryczne** — `points`, `profession_codes`, `title`, `organizer`,
  `category`, `schedule_status`, daty i godziny. Zmieniają podstawę punktową.
- **redakcyjne** — reszta (opis, tematy, link, prowadzący, cena, nagranie).

`changeWeight(change)` zwraca najwyższą wagę występującą w zmianie:
merytoryczna > redakcyjna > operacyjna.

### 4.3 Co widzi moderator

- **Podgląd różnicy w wierszu** — do trzech pól w formacie
  `Status zapisów: wolne miejsca → lista rezerwowa`, wartość poprzednia
  przekreślona. Ramka i plakietka w kolorze wagi (niebieski operacyjna, różowy
  merytoryczna, fioletowy redakcyjna). Reszta pól za linkiem „otwórz porównanie".
- **Kolumna „Zapisy"** — bieżący stan (`wolne miejsca` / `lista rezerwowa` /
  `brak miejsc` / `nieokreślone`) i limit miejsc.
- **Zakładki kolejek z licznikami** — Wszystkie / Nowe do decyzji / Zmiany ze
  źródła / Zapisy i miejsca. Filtrowanie po stronie klienta, bez przeładowania.
  „Nowe do decyzji" = status `pending` bez oczekującej zmiany źródłowej.
- **Przycisk „Przyjmij zapisy"** — jedno kliknięcie dla zmian czysto
  operacyjnych, bez otwierania modala. Wywołuje osobny RPC
  `review_training_operational_import_change`, który istnieje dopiero po migracji
  v6.26 i odrzuca zmianę zawierającą jakiekolwiek pole nieoperacyjne.
- **W modalu** — znacznik wagi przy każdym polu i skrót „Zaznacz tylko
  operacyjne".
- **Częściowe zastosowanie jest trwałe** — jeśli moderator przyjmie tylko pola
  operacyjne z mieszanej zmiany, pozostałe pola (np. punkty) pozostają w tej
  samej pozycji `pending`. Nie znikają z kolejki i nie są oznaczane jako
  rozpatrzone.

### 4.4 Filtry dat

Rozdzielone na dwa niezależne zakresy:

- **Data dodania** (`created_at`) — odpowiada na „co przyszło w nocy".
- **Termin szkolenia** (`start_date`) — odpowiada na „co się zaraz odbędzie".

Szkolenia ze `schedule_status = 'to_be_determined'` wypadają z wyniku, gdy filtr
terminu jest aktywny — nie mają się jak zmieścić w przedziale. Jest o tym notka
pod filtrami.

Przy okazji poprawiono czyszczenie filtrów: wcześniejszy `setTimeout(load, 50)`
mógł uruchomić `load()` ze starymi wartościami zamkniętymi w closure. v6.26
przekazuje jawnie wyzerowany zestaw filtrów, więc „Wyczyść" nie pozostawia
starego zakresu dat w wynikach.

---

## 5. Dwa błędy znalezione przy okazji

### 5.1 Przyjęcie zmiany zdejmowało szkolenie z publicznej bazy

`review_training_import_change` ustawiała `approval_status = 'pending'` przy
każdym zastosowaniu zmiany. Oznaczało to, że przyjęcie informacji „lista
rezerwowa" cofało zaakceptowane szkolenie do moderacji i zdejmowało je z
publicznej bazy do czasu ponownej akceptacji. Moderator w praktyce ma dwa
wyjścia: nie przyjmować takich zmian (baza pokazuje nieaktualny stan) albo
akceptować dwa razy każdy rekord.

Migracja `20260813_crpe_v6_26_operational_import_fields.sql` wprowadza
`v_operational_only`: jeśli zastosowane pola mieszczą się w zbiorze
`{enrollment_status, capacity}`, `approval_status`, `approved_by`, `approved_at`
i `reject_reason` zostają nietknięte. Każde inne pole działa jak dotąd. Funkcja
zwraca dodatkowo `kept_approval`.

Dodatkowo powstał RPC `review_training_operational_import_change(uuid)`. Frontend
używa go dla przycisku „Przyjmij zapisy". Jeżeli ktoś omyłkowo wdroży frontend
przed migracją, RPC nie istnieje i kliknięcie kończy się błędem bez zmiany
szkolenia — nie ma już scenariusza, w którym stary backend po cichu cofa
publikację.

Naprawiono też przypadek częściowego zastosowania: `review_training_import_change`
nie ustawia już całej zmiany jako `applied`, gdy moderator wybrał tylko część pól.
Nierozstrzygnięte pola zostają w `changed_fields` ze statusem `pending`, a pełny
`source_payload_hash` jest zapisywany dopiero po rozpatrzeniu wszystkich pól.

### 5.2 Null ze scrapera był traktowany jak wartość

`extractEnrollmentStatus` zwraca `null`, gdy nie rozpozna frazy na stronie NIL.
Porównanie `is distinct from` w `import_training_from_source` uznawało to za
zmianę — czyli jedna zmiana szablonu strony NIL wygenerowałaby dla całej bazy
kolejkę „zapisy otwarte → brak wartości", a jej przyjęcie skasowałoby znany stan.

Dwie poprawki:

- **Po stronie bazy** — `null` ze źródła przy znanej wartości obecnej jest
  usuwany z porównania (`enrollment_status`, `capacity`). Null znaczy „parser nie
  rozpoznał", a nie „tego nie ma".
- **Po stronie scrapera** — poszerzony słownik: `LISTA REZERWOWA` sprawdzana
  jako pierwsza (fraza „ZAPIS OTWARTY - LISTA REZERWOWA" zawiera w sobie wzorzec
  otwarcia, więc kolejność była błędna), dodane `REKRUTACJA ZAKOŃCZONA` i
  `BRAK MIEJSC` bez słowa „WOLNYCH". Gdy nic nie pasuje, do
  `source_warnings` trafia „Nie rozpoznano stanu zapisów na stronie NIL —
  zachowano dotychczasową wartość", widoczne w wierszu admina.

---

## 6. Kolejność wdrożenia

1. `supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql` —
   migracja jest idempotentna (`create or replace`), kontrola po migracji
   zwraca siedem wierszy `OK`.
2. Deploy frontendu.
3. `npm run check:v6.26`.
4. W katalogu `integrations/training-importer`: `npm test` i `npm run typecheck`.

Migracja nadal ma być wykonana przed frontendem. v6.26 jest jednak fail-safe:
jeśli kolejność zostanie omyłkowo odwrócona, przycisk „Przyjmij zapisy" wywoła
nieistniejący jeszcze RPC i pokaże błąd zamiast zmienić status publikacji.

---

## 7. Decyzje przyjęte do v6.26

- **Globalny kolor postępu:** nie. Główny pasek okresu zostaje niebieski; zieleń
  jest używana lokalnie w Limitach dla bezpiecznego wykorzystania dostępnego
  limitu.
- **„Moje CRPE" w mobile:** usunięte jako duplikat „Panel CPD".
- **`price_pln`:** nie jest polem operacyjnym. Zostaje redakcyjne i wymaga
  świadomego przeglądu moderatora; zmiana ceny nie może wejść jednym kliknięciem
  razem ze stanem zapisów.
- **Powiadomienia o zmianach merytorycznych:** nie są częścią v6.26. Najpierw
  wdrażamy czytelną kolejkę i liczniki; kanał powiadomień (e-mail/in-app),
  częstotliwość i deduplikacja wymagają osobnego projektu, żeby nie generować
  spamu moderatorom.

## 8. Dodatkowe zabezpieczenia i testy po przeglądzie

- dodano testy importera dla `REKRUTACJA ZAKOŃCZONA`, `BRAK MIEJSC`,
  pierwszeństwa listy rezerwowej oraz zachowania znanego statusu przy braku
  rozpoznania frazy;
- `check:v6.26` sprawdza również brak duplikatu „Moje CRPE" w mobile, nowy
  fail-safe RPC, pozostawianie nierozstrzygniętych pól w kolejce oraz warunkowe
  zapisanie pełnego hasha źródła;
- przycisk „Przyjmij zapisy" ma niebieską, operacyjną stylistykę zamiast
  fioletowej, żeby kolor akcji był spójny z wagą zmiany.
