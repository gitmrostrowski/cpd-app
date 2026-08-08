# CRPE v6.15.2 — zawody, karta szkolenia i strona główna

## Zakres

- Filtr konkretnego zawodu zachowuje szkolenia z niepotwierdzonymi adresatami, ale nie przedstawia ich jako pewnych dopasowań.
- Dopasowania są dzielone na `exact`, `general` i `unclear`; niepewne rekordy trafiają na koniec listy pod wyraźny separator.
- Główny licznik obejmuje pewne dopasowania, a liczba rekordów niepewnych jest podana osobno.
- Linia meta na karcie skraca sklejone pole lokalizacji do województwa i miasta oraz ukrywa domyślny status „Zapisy otwarte”.
- Wizualny podpis „Do sprawdzenia” nie jest powtarzany na każdej karcie. Informacja o stanie punktów pozostaje dostępna dla czytników ekranu.
- Na stronie głównej ponownie renderuje się Hero z jedynym nagłówkiem H1 i propozycją wartości CRPE.
- Wybór roli występuje tylko w Hero; następna sekcja od razu porównuje trzy zakresy.
- Statusy modułów organizacyjnych są nadal uczciwe, ale mają spokojniejszą hierarchię wizualną.
- Usunięto nieużywane komponenty `components/Hero.tsx`, `components/FeatureGrid.tsx`, `DashboardHeader`, `SelectedRoleSummary` oraz martwy mechanizm `Reveal.delay`.
- Zmniejszono nadmiar `font-black` w tytułach kart i FAQ oraz powiększono najważniejsze plakietki statusu.

## Wdrożenie

Ta wersja nie wymaga migracji SQL ani zmian zmiennych środowiskowych. Należy wgrać zawartość katalogu `cpd-app-main` do repozytorium używanego przez Vercel.

## Świadomie odłożone

- Uzupełnienie `training_profession_rules` pozostaje pracą moderacyjną w danych.
- Rozbicie lokalizacji na województwo, miasto i adres wymaga późniejszej migracji modelu.
- Sekcja najbliższych szkoleń na stronie głównej wymaga osobnego projektu pobierania danych i stanów pustych.
- Jasny lub ciemny wariant sekcji demonstracyjnej pozostaje decyzją wizualną; nie zmieniono go bez porównania obu wariantów w realnym renderze.
