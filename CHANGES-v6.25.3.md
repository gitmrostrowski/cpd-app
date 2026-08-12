# CRPE v6.25.3 — widoki statusu i czytelniejsze limity

- Sekcja „Twój status i kolejne kroki” ma dwa równoważne widoki:
  „Przebieg” z krzywą narastania punktów oraz „Przegląd” z paskiem postępu.
- Domyślnie pozostaje widok „Przebieg”; wybór użytkownika jest zapamiętywany
  wyłącznie lokalnie w przeglądarce.
- Wykres przebiegu otrzymał subtelny gradient, dodatkowe linie pomocnicze,
  prowadnicę „dziś” i wyraźniejszy punkt aktualnego wyniku.
- Widok „Przegląd” pokazuje zebrane punkty, lukę lub zapas względem równego
  tempa oraz liczbę punktów pozostałych do celu.
- Sekcja limitów ma listę kategorii po lewej i szczegóły wybranej kategorii po
  prawej, co skraca drogę wzroku i ułatwia porównanie kilku limitów.
- Karty kategorii pokazują jednostkę limitu, wolne punkty i wykorzystanie, a
  ich aktywny stan jest dostępny dla technologii asystujących.
- Podsumowanie źródła reguły i rekomendowany „Najlepszy ruch” znajdują się pod
  szczegółami wybranej kategorii.
- Nowy pasek zachowuje semantykę dostępności: opis grupuje wizualizację, ale
  nie ukrywa tekstu kart przed czytnikiem ekranu.
- Aktualizacja nie zmienia danych, obliczeń punktów, limitów prawnych, API,
  importera NIL ani schematu Supabase.
- Nie są wymagane migracje SQL, nowe sekrety ani zmienne środowiskowe.
