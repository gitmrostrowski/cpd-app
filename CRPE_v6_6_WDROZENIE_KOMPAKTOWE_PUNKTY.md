# Wdrożenie CRPE v6.6 — kompaktowe punkty

Ta wersja zmienia wyłącznie kod aplikacji. Nie uruchamiaj żadnego nowego SQL-a
w Supabase.

## Kolejność

1. Rozpakuj paczkę v6.6.
2. Wgraj całą zawartość katalogu `cpd-app-main` do repozytorium GitHub
   połączonego z produkcyjnym projektem CRPE w Vercel.
3. Zachowaj istniejące zmienne środowiskowe Vercel bez zmian.
4. Poczekaj na zakończenie deploymentu.
5. Otwórz `/baza-szkolen` i sprawdź:
   - kompaktowy wskaźnik punktów bez osobnej ramki i podpisu;
   - niższe karty szkoleń;
   - neutralny przycisk „Więcej filtrów”;
   - ikonowy reset filtrów i podpowiedź „Wyczyść filtry”;
   - rozwijanie filtrów oraz działanie „Pokaż wyniki”;
   - układ na komputerze i telefonie.

## Supabase

Nie wykonuj ponownie migracji v6.3 i nie dodawaj nowej migracji dla v6.6.
