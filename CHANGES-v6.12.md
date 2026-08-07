# CRPE v6.12 — rytm marki i równe działania karty

Data: 2026-08-07

## Baza szkoleń

- oba przyciski w prawej części karty mają identyczną, pełną szerokość;
- między przyciskami powstał osobny pas marki o kontrolowanej wysokości;
- logo organizatora znajduje się po lewej stronie pasa, a punkty po prawej;
- logo ma obszar `160 × 38 px`, wyższy kontrast i osobne limity obrazu `148 × 34 px`;
- `object-contain` i niezależne limity chronią proporcje logo szerokiego, pionowego i kwadratowego;
- przywrócono ikonę czapeczki z v6.7: `20 × 20 px`, `strokeWidth={2.1}`;
- zachowano biały plus w głównym działaniu „Dodaj do planu”;
- prawa tinta nadal miękko przechodzi w biel i nie tworzy twardej kolumny;
- pełne etykiety przycisków nie przełamują się;
- na telefonie oba działania pozostają pełnoszerokie i mają wygodną wysokość dotykową.

## Dane i wdrożenie

- brak zmian w Supabase, API i modelu danych;
- nie należy uruchamiać żadnego SQL-a;
- wystarczy wdrożenie kodu repozytorium.
