# Wdrożenie CRPE v6.4 — UX/UI bazy szkoleń

Ta wersja zmienia wyłącznie kod aplikacji. Nie uruchamiaj żadnego nowego SQL-a
w Supabase.

## Kolejność

1. Rozpakuj paczkę v6.4.
2. Wgraj całą zawartość katalogu `cpd-app-main` do repozytorium GitHub
   połączonego z produkcyjnym projektem CRPE w Vercel.
3. Zachowaj istniejące zmienne środowiskowe Vercel bez zmian.
4. Poczekaj na zakończenie deploymentu.
5. Otwórz `/baza-szkolen` i sprawdź:
   - przycisk „Zgłoś szkolenie” w górnym kaflu;
   - rozwijanie „Więcej filtrów”;
   - „Wyczyść” i „Pokaż wyniki”;
   - sortowanie nad listą;
   - przyciski na kartach na komputerze i telefonie.

## Supabase

Nie wykonuj ponownie migracji v6.3 i nie dodawaj nowej migracji dla v6.4.

