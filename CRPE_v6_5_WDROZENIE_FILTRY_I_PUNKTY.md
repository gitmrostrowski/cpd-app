# Wdrożenie CRPE v6.5 — filtry i punkty

Ta wersja zmienia wyłącznie kod aplikacji. Nie uruchamiaj żadnego nowego SQL-a
w Supabase.

## Kolejność

1. Rozpakuj paczkę v6.5.
2. Wgraj całą zawartość katalogu `cpd-app-main` do repozytorium GitHub
   połączonego z produkcyjnym projektem CRPE w Vercel.
3. Zachowaj istniejące zmienne środowiskowe Vercel bez zmian.
4. Poczekaj na zakończenie deploymentu.
5. Otwórz `/baza-szkolen` i sprawdź:
   - trzy działania filtrów w jednym górnym pasku;
   - rozwijanie „Więcej filtrów”;
   - działanie „Wyczyść” i „Pokaż wyniki”;
   - wyraźny moduł punktów z ikoną biretu;
   - szczegóły punktacji po otwarciu karty;
   - układ na komputerze i telefonie.

## Supabase

Nie wykonuj ponownie migracji v6.3 i nie dodawaj nowej migracji dla v6.5.

