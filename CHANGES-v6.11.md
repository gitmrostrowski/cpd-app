# CRPE v6.11 — uniwersalna tinta i logo w tle karty

Data: 2026-08-07

## Baza szkoleń

- prawa część karty otrzymała neutralną, chłodną tintę obejmującą około 1/3 szerokości;
- tło zaczyna się miękkim gradientem, bez twardej linii i efektu kolumny tabeli;
- usunięto małą plamę koloru z poprzedniej wersji;
- logo organizatora jest wyśrodkowane w stałym obszarze ekspozycji `168 × 76 px`;
- sam obraz ma niezależne limity szerokości i wysokości (`154 × 62 px`) oraz `object-contain`;
- szerokie, pionowe i kwadratowe logotypy zachowują proporcje i nie dominują karty;
- logo jest neutralizowane przez lekkie obniżenie nasycenia i kontrastu;
- tinta i logo nie przechwytują kliknięć;
- tekst i działania pozostają na warstwie pierwszoplanowej;
- przycisk zapisów ma lekko transparentne białe tło, zachowując pełny kontrast;
- na telefonie duży znak wodny jest ukryty, a strefa działań otrzymuje spokojne tło lokalne.

## Dane i wdrożenie

- brak zmian w Supabase, API i modelu danych;
- nie należy uruchamiać żadnego SQL-a;
- wystarczy wdrożenie kodu repozytorium.
