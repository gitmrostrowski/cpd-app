# CRPE v6.31 – nowy układ Panelu CPD

## Wgranie
Rozpakuj ZIP i skopiuj zawartość cpd-app-main do lokalnego repo (zawiera też wszystko z v6.30). Zachowaj .git i .env. Commit i push. SQL nie jest potrzebny, zależności i package-lock.json bez zmian.

## Co się zmieniło
Logika obliczeń jest nietknięta: punkty, limity, tempo, zaległości i terminy liczą te same funkcje. Zmienił się układ i prezentacja.

1. Karta „Okres rozliczeniowy 2025–2029” na górze: zawód, cel i tryb okresu w jednej linii, obok etykieta tempa i „Zmień ustawienia”. Duży wynik (38 z 200 pkt), pod nim linijka okresu ze znacznikiem „dziś” jako domyślny widok (wykres „Przebieg” dalej do wyboru, wybór zapamiętuje się jak wcześniej). Trzy fakty w jednym rzędzie: Zebrane, Luka do tempa / Zapas, Pozostaje. Po prawej „Najpierw to”.
2. Pod spodem dwie kolumny: „Aktywności w okresie” jako zwarta lista (jeden wiersz na wpis, kropka statusu, „Brakuje: certyfikatu”) oraz „Najbliższe terminy” (zaległe w kolorze danger, opisy już się nie ucinają).
3. „Limity kategorii” na końcu, domyślnie zwinięte do jednej linii z małymi miernikami każdej kategorii. Pełne szczegóły po kliknięciu „Pokaż szczegóły” albo zakładki „Limity”.
4. Pasek sekcji: tekstowe zakładki w kolejności strony (Stan okresu, Aktywności, Terminy, Limity).

Usunięte duplikaty: osobna „Oś aktywności” (te same wpisy co lista), powtórzone zdanie o tempie pod terminami, opisowy akapit pod paskiem, trzy kolorowe karty z paskami, linki na dole limitów.
Efekt: przy danych jak na zrzucie panel ma ok. 2200 px wysokości zamiast ok. 4600 px, a stan okresu i najważniejsze kroki mieszczą się na pierwszym ekranie.

## Testy
- check:release 25/25; nowy check-v6-31-panel-layout.mjs.
- Świadomie zaktualizowane asercje: check-v6-25-3 (domyślny widok „bar” zamiast „curve”) i check-v6-24 (brak osobnej osi aktywności).
- TypeScript bez błędów, ESLint 0 błędów.
- Zrzuty 1440 i 390 px z podstawioną sesją i danymi odtworzonymi ze zrzutu (Lekarz, 200 pkt, 2025–2029, 38 pkt, 2 zaległe, 6 do uzupełnienia); bez połączenia z produkcyjną bazą.
