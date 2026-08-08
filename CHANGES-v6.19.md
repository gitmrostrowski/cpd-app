# CRPE v6.19 — status, kolejne kroki i wykres narastania

## Zakres

- połączono status ewidencji i listę kolejnych działań w jedną zwartą sekcję;
- usunięto osobną, powtarzającą treść sekcję „Co dalej?”;
- dodano zwijany wykres narastania punktów: zdobyte, zaplanowane i równomierne tempo;
- zachowano dokładne daty ukończonych wpisów, gdy są dostępne;
- starsze wpisy zawierające tylko rok są umieszczane umownie w jego połowie;
- suma zdobytych na wykresie zawsze zgadza się z liczbą w nagłówku, także przed połową bieżącego roku;
- pasek postępu ma pełną semantykę dostępności i nie pokazuje sztucznego postępu przy zerze;
- wykres zachowuje czytelny rozmiar etykiet na telefonie i może być przewijany poziomo;
- ograniczono liczbę etykiet lat w długich okresach;
- komunikat o tempie ma charakter wyłącznie planistyczny i nie przypisuje jednego organu wszystkim zawodom;
- zachowano trzy poziomy wiarygodności wyniku oraz testy regresji v6.17 i v6.18;
- dodano test v6.19 obejmujący logikę danych i przypadki brzegowe.

## Wdrożenie

Zmiana nie wymaga migracji SQL. Wystarczy wdrożyć kod aplikacji.
