# CRPE v6.18 — zwarty status CPD i poprawiona oś czasu

## Zakres

- cztery responsywne KPI zamiast powtarzających się kart statusu;
- warunkowe CTA dla brakujących punktów i prawdziwy link do uzupełniania wpisów;
- jedna zwarta stopka z trzema poziomami wiarygodności wyniku;
- pozycjonowanie ukończonych wpisów według daty aktywności lub środka wskazanego roku, nigdy według `created_at`;
- grupowanie miesięczne oraz dwukierunkowe rozsuwanie znaczników przy krawędziach;
- etykiety lat ustawione na tej samej skali czasu co znaczniki;
- test regresyjny `check:v6.18`.

## Wdrożenie

Zmiana nie wymaga migracji SQL. Wgraj pełną zawartość katalogu `cpd-app-main`.
