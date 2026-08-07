# CRPE v6.11 — wdrożenie

## Zakres

Wersja poprawia wyłącznie kompozycję kart w publicznej bazie szkoleń. Prawa część karty ma teraz neutralną tintę i uniwersalny obszar dla logo organizatora.

## Wdrożenie

1. Wgraj zawartość katalogu `cpd-app-main` do repozytorium GitHub.
2. Poczekaj na automatyczne wdrożenie w Vercel.
3. Otwórz `/baza-szkolen` i sprawdź kartę z logo szerokim oraz kartę z logo pionowym.

## Supabase

Nie uruchamiaj SQL-a. Ta wersja nie zmienia bazy danych, uprawnień ani Storage.

## Kontrola po wdrożeniu

- tinta zajmuje około prawej 1/3 karty i miękko przechodzi w biel;
- logo jest widoczne jako element tła, ale nie konkuruje z przyciskami;
- oba przyciski zachowują pełne etykiety w jednej linii;
- czapeczka pozostaje przy liczbie punktów;
- na telefonie karta nie pokazuje dużego znaku wodnego pod tekstem.
