# CRPE v6.13 — art direction kart szkoleń

## Zakres

- prawa część karty nie jest już pionowym panelem trzech elementów;
- logo organizatora działa jako duży, czytelny motyw tła na neutralnej tincie;
- szerokie, pionowe i kwadratowe logotypy zachowują proporcje dzięki dwóm niezależnym limitom;
- przy braku logo subtelnym motywem graficznym staje się nazwa organizatora;
- punkty są osobną półprzezroczystą pieczęcią z ikoną czapki z v6.7;
- „Przejdź do zapisów” i „Dodaj do planu” tworzą jeden poziomy rząd dwóch równych przycisków;
- biały plus pozostaje w głównym działaniu „Dodaj do planu”;
- pełne etykiety przycisków nie przełamują się;
- na telefonie duże logo jest ukryte, a działania pozostają wygodne dotykowo.

## Wdrożenie

Nie uruchamiaj SQL-a. Zmiana dotyczy wyłącznie prezentacji i testów regresyjnych.

## Kontrola

- pełna regresja v4–v6.13;
- TypeScript bez błędów;
- produkcyjny build 40 stron.
