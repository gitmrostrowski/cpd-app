# CRPE v6.19.1 — widoczny wykres i układ statusu

## Zakres

- wykres narastania jest widoczny domyślnie po ustawieniu celu;
- usunięto stan i przełącznik `showAccrual`;
- wykres oraz trzy kolejne kroki tworzą układ dwóch kolumn `1.25fr / 1fr`, który na wąskich ekranach przechodzi w jeden stos;
- usunięto cienki pasek postępu i dublujące objaśnienie kreski tempa;
- główna liczba zdobytych punktów ma 34 px i wagę `font-black`;
- wykres ma format 380 × 190, dwie linie siatki, wypełnienie pod krzywą i krzywą o grubości 3 px;
- przy braku celu wyświetlany jest czytelny stan pusty;
- zachowano dokładne daty aktywności, jeśli są dostępne, oraz bezpieczne przybliżenie połową roku dla wpisów bez daty;
- zachowano neutralny opis planistyczny i trzy jawne poziomy wiarygodności wyniku.

## Kontrole

- zaktualizowano trwały test v6.18 do nowego zapisu głównej liczby;
- rozszerzono test v6.19 o brak `showAccrual`, domyślny render wykresu, układ kolumn, stan pusty, wypełnienie i brak dublującego paska;
- zachowano osobne skrypty kontrolne v6.17 i v6.18.

Ta wersja nie wymaga migracji SQL.
