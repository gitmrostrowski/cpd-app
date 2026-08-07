# CRPE v6.12 — wdrożenie

## Zakres

Wersja poprawia kompozycję prawej części kart w publicznej bazie szkoleń. Dwa równe przyciski obejmują pas marki z czytelnym logo organizatora i punktacją.

## Wdrożenie

1. Wgraj zawartość katalogu `cpd-app-main` do repozytorium GitHub.
2. Poczekaj na automatyczne wdrożenie w Vercel.
3. Otwórz `/baza-szkolen` i sprawdź kartę z logo szerokim, pionowym oraz bez logo.

## Supabase

Nie uruchamiaj SQL-a. Ta wersja nie zmienia bazy danych, uprawnień ani Storage.

## Kontrola po wdrożeniu

- „Przejdź do zapisów” i „Dodaj do planu” mają identyczną szerokość;
- między przyciskami jest widoczne logo po lewej i punktacja po prawej;
- logo nie jest przycięte ani rozciągnięte;
- czapeczka przy punktach ma proporcje znane z v6.7;
- napisy przycisków pozostają w jednym wierszu;
- na telefonie karta zachowuje czytelny pionowy układ.
