# Wdrożenie CRPE v6.7 — logo w karcie szkolenia

Ta wersja zmienia wyłącznie kod aplikacji. Nie uruchamiaj żadnego nowego SQL-a
w Supabase.

## Kolejność

1. Rozpakuj paczkę v6.7.
2. Wgraj całą zawartość katalogu `cpd-app-main` do repozytorium GitHub
   połączonego z produkcyjnym projektem CRPE w Vercel.
3. Zachowaj istniejące zmienne środowiskowe Vercel bez zmian.
4. Poczekaj na zakończenie deploymentu.
5. Otwórz `/baza-szkolen` i sprawdź:
   - logo organizatora po lewej stronie punktacji;
   - punkty wyrównane do prawej strony;
   - brak małej ikony logo obok nazwy organizatora;
   - brak pustej ramki dla szkolenia bez logo;
   - niezmienioną, kompaktową wysokość kart;
   - układ na komputerze i telefonie.

## Supabase

Nie wykonuj ponownie migracji v6.3 i nie dodawaj nowej migracji dla v6.7.
