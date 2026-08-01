# CRPE v5.2 — instrukcja wdrożenia

## Co wdrażamy

Wersja v5.2 dodaje poprawną obsługę adresatów szkolenia i punktacji zależnej od
zawodu. Nie wymaga nowych zmiennych środowiskowych w Vercel.

## Weryfikacja gotowego pakietu

- kontrola v5.2: `12/12 OK`;
- kontrola zgodności v5.1e: `12/12 OK`;
- TypeScript: bez błędów;
- kompilacja i generowanie stron Next.js: `38/38`;
- archiwum nie zawiera `.env`, kluczy, `node_modules`, `.next` ani plików
  `*.tsbuildinfo`.

## Ważna kolejność

1. Nie uruchamiaj ponownie migracji v4, v5 ani v5.1.
2. Produkcja powinna być na kodzie v5.1e, a wykonana wcześniej migracja v5.1f
   (`waiting_list`) pozostaje w bazie i nie może być uruchamiana ponownie.
3. Zachowaj wykonaną ręcznie kopię `roles.sql`, `schema.sql` i `data.sql`.
4. Otwórz `SQL Editor → New query`.
5. Wklej cały plik:
   `supabase/migrations/20260731_crpe_v5_2_training_audience_and_credits.sql`.
6. Kliknij `Run` tylko raz i poczekaj na zakończenie.
7. Na końcu wyniku sprawdź osiem testów. Każdy musi mieć wynik `OK`.
8. Dopiero wtedy rozpakuj ZIP z kodem v5.2 i wgraj jego zawartość do
   repozytorium GitHub połączonego z Vercel.
9. Poczekaj na zielony status wdrożenia w Vercel. Nie zmieniaj zmiennych
   środowiskowych.
10. Wykonaj testy opisane poniżej.

Jeśli którykolwiek test SQL zwróci `BŁĄD`, nie wdrażaj jeszcze kodu. Zapisz wynik
i zrzut ekranu, aby można było bezpiecznie ustalić przyczynę.

## Co stanie się ze starymi szkoleniami

Migracja nie uzna pustych danych za „dla wszystkich”. Jednoznaczne wpisy
zostaną zmapowane automatycznie, a pozostałe otrzymają status
`niezweryfikowane` i znikną z publicznych wyników do czasu uzupełnienia w panelu
operatora. Dane nie są usuwane.

Po wdrożeniu otwórz:

`Profil → Admin → Akceptacja i edycja szkoleń`

Dla każdego rekordu oznaczonego jako niezweryfikowany:

1. kliknij `Edytuj`;
2. wybierz „Wszystkie zawody medyczne” albo konkretne zawody;
3. ustal: „Bez punktów” albo „Przyznaje punkty”;
4. przy punktach wskaż zawód, liczbę oraz — jeśli jest dostępna — instytucję,
   numer decyzji i link źródłowy;
5. zapisz rekord;
6. zaakceptuj dopiero po sprawdzeniu informacji.

## Test 1 — zgłoszenie dla kilku zawodów

1. Zaloguj się zwykłym kontem testowym.
2. Otwórz `Baza szkoleń → Dodaj szkolenie`.
3. Wybierz `Wybrane zawody`.
4. Zaznacz lekarza, pielęgniarkę i ratownika medycznego.
5. Wybierz `Przyznaje punkty`.
6. Wpisz punkty tylko dla lekarza i pielęgniarki.
7. Wyślij do akceptacji.
8. Oczekiwany wynik: komunikat o wysłaniu, jeden rekord `pending`, poprawne
   relacje widoczne w panelu operatora.

## Test 2 — walidacja

Sprawdź kolejno, że formularz blokuje wysłanie, gdy:

- nie wybrano adresatów;
- wybrano `Wybrane zawody`, ale nie zaznaczono zawodu;
- nie ustalono statusu punktów;
- wybrano `Przyznaje punkty`, ale nie wpisano dodatniej liczby.

## Test 3 — panel operatora

1. Otwórz nowe zgłoszenie.
2. Sprawdź adresatów i punktację.
3. Zmień jedną wartość punktów i dodaj źródło.
4. Zapisz, ponownie otwórz rekord i sprawdź trwałość danych.
5. Zaakceptuj szkolenie.
6. Oczekiwany wynik: szkolenie pojawia się w bazie.

## Test 4 — blokada niepełnej akceptacji

1. Utwórz zgłoszenie ze statusem punktów `Brak informacji`.
2. W panelu operatora spróbuj zaakceptować je bez uzupełnienia.
3. Oczekiwany wynik: panel otwiera edycję i pokazuje informację o konieczności
   ustalenia statusu punktów; baza również odrzuci bezpośrednią próbę.

## Test 5 — dopasowanie do profilu

1. Zaloguj się kontem z zawodem `Lekarz`.
2. Otwórz bazę szkoleń.
3. Oczekiwany wynik: domyślnie wybrane jest `Dla mojego zawodu`, a lista
   zawiera szkolenia dla lekarzy oraz szkolenia dla wszystkich.
4. Szkolenie wyłącznie dla farmaceutów nie może się pojawić.
5. Zmień filtr na `Wszystkie`, aby potwierdzić, że rekord nadal istnieje.

## Kontrole lokalne

Przed wysłaniem kodu można uruchomić:

```bash
npm ci
npm run check:v5.2
npx tsc --noEmit
npm run build
```

W środowisku produkcyjnym Vercel `npm run build` musi zakończyć się zielonym
statusem. Ostrzeżenie Next.js o konwencji `middleware` pochodzi z wcześniejszej
wersji i nie jest częścią v5.2.

## Cofnięcie

Nie usuwaj nowych tabel po pojawieniu się zgłoszeń v5.2, ponieważ zawierają
dane adresatów i punktacji. W razie problemu cofnij wyłącznie wdrożenie kodu w
Vercel i pozostaw bazę bez zmian; następnie przeanalizuj błąd. Migracja jest
wstecznie zgodna dzięki zachowaniu pól `points` i `target_profession_text`.
