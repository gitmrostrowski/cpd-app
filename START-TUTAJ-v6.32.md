# CRPE v6.32 — nowy Panel CPD i zachowane poprawki serwisu

Pełne repo łączy nowy Panel CPD z `files (9).zip` (wewnętrzna paczka v6.31) z wcześniej przygotowanym repo v6.31. Nowy numer v6.32 rozróżnia te dwa wydania o tej samej nazwie.

## Zmiany

- Nowa karta okresu: wynik, linijka jako domyślny widok, trzy fakty w jednym rzędzie i „Najpierw to” po prawej. Wybór widoku „Przebieg” nadal jest zapamiętywany — wcześniejsza preferencja użytkownika ma pierwszeństwo przed nową wartością domyślną.
- Zwarta lista aktywności obok terminów; poprawny tekst „Brakuje: certyfikatu”. Bez powielonej osi aktywności i powtórzeń tempa.
- Limity na końcu, domyślnie zwinięte. Rozwija je przycisk nagłówka lub zakładka „Limity”.
- Zachowane wcześniejsze wyróżnienie placówek, poprawione menu, szerokość podglądu placówki, zawijanie zakładek Home i Plus Jakarta Sans. Pliki Header.tsx i home-v15.css z nowej paczki nie zastąpiły naszych nowszych poprawek.
- Dodatkowo: wykres „Przebieg” dopasowuje się do 390 px; bez ustawionego celu panel nie pokazuje „cel osiągnięty” i opisuje cel jako nieustawiony.

Obliczenia punktów, limitów, tempa i terminów pozostają bez zmian. Porównano kod funkcji i deklaracji obliczeniowych oraz pliki bibliotek. Zmiany stanu dotyczą tylko widoku wykresu i rozwijania limitów, a usunięty timelineRows służył wyłącznie usuniętej osi aktywności. Konta, placówki, admin, API i SQL nie zostały zmienione.

## Wdrożenie

1. Rozpakuj ZIP. Pełny kod jest w `cpd-app-main`.
2. Zrób kopię dotychczasowego repo. Przenieś pliki kodu, zachowując własne `.git` i `.env*`.
3. Uruchom `npm ci`, a następnie `npm run check:release`, `npx tsc --noEmit`, `npm run lint` i `npm run build`.
4. Wdróż dotychczasowym sposobem. Nowe migracje SQL ani zmiany zależności nie są potrzebne; package-lock.json pozostał identyczny.

Sprawdzono Node.js 24.19.0 i Next.js 16.3.0. Build korzysta z Plus Jakarta Sans przez next/font/google; przy pierwszej kompilacji potrzebny jest dostęp do Google Fonts. Paczka nie zawiera node_modules, .next, .env, testowych cookies ani danych dostępowych.

## Weryfikacja

- Zestaw wydaniowy: **25/25**.
- TypeScript: **0 błędów**; ESLint: **0 błędów, 86 istniejących ostrzeżeń**.
- Kompilacja produkcyjna: poprawna z właściwym fontem.
- Pełny audyt historycznych skryptów: **48/70**. Pozostałe 22 kontrole zawodziły również przed tą aktualizacją; raport i pełne logi są w paczce. Nie wszystkie historyczne testy są zielone.
- Przeglądarka: 24 sprawdzone stany, 390 i 1440 px, bez błędów JavaScript i bez poziomego przewijania strony ani wykresu. Sprawdzono dane przykładowe, brak celu, brak limitów, puste konto, przełączanie i zapamiętywanie widoku, oba sposoby otwierania limitów, filtry oraz ustawienia.
- Dane przykładowe: 38/200 pkt, okres 2025–2029, 2 zaległe, 6 do uzupełnienia. Wysokość całej strony przy 1440 px wyniosła **2180 px**; przy 390 px **4243 px**. Stan okresu i „Najpierw to” mieszczą się na pierwszym ekranie 1440×1000.

Zrzuty wykonano po ostatnich poprawkach z podstawioną sesją i odpowiedziami danych. Nie łączono się z produkcyjną bazą, nie zapisywano ustawień ani nie dodawano wpisów. Rzeczywiste konta i długie dane należy przejrzeć po wdrożeniu. Zrzuty nie są dowodem sprawdzenia produkcyjnych uprawnień ani poprawności wszystkich możliwych danych.

## Zmiany testów w otrzymanej paczce

Przyjęto nowy check-v6-31-panel-layout.mjs oraz dwie uzasadnione aktualizacje: check-v6-25-3 wymaga domyślnego widoku bar zamiast curve, a check-v6-24 sprawdza usunięcie odrębnej osi aktywności. Są to zmiany kontraktu prezentacji opisane w Twoim zleceniu. Nie zmieniano testów obliczeń, aby uzyskać poprawny wynik.
