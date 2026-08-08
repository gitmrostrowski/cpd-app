# Instrukcja wdrożenia CRPE v6.16

## 1. Supabase

1. Otwórz projekt Supabase używany przez `crpe.pl`.
2. Wejdź w **SQL Editor** i wybierz **New query**.
3. Wklej cały plik `supabase/migrations/20260808_crpe_v6_16_training_schedule_and_speakers.sql`.
4. Kliknij **Run** tylko raz i poczekaj na zakończenie.
5. W tabeli wynikowej powinno pojawić się pięć wierszy z wynikiem `OK`.
6. Jeżeli pojawi się `BŁĄD` albo czerwony komunikat, nie wdrażaj jeszcze kodu i zachowaj zrzut ekranu.

Skrypt jest idempotentny: ponowne uruchomienie nie powinno tworzyć drugich kolumn. Nie usuwa ani nie zmienia dotychczasowych szkoleń.

## 2. GitHub i Vercel

1. Rozpakuj paczkę v6.16.
2. Wgraj do GitHuba zawartość katalogu `cpd-app-main`, zastępując wcześniejszą wersję.
3. Nie wgrywaj samego katalogu nadrzędnego jako dodatkowego poziomu.
4. Poczekaj, aż Vercel zakończy wdrożenie statusem **Ready**.

## 3. Test po wdrożeniu

1. Zaloguj się zwykłym kontem i otwórz `/baza-szkolen`.
2. Wybierz **Zgłoś szkolenie**.
3. Wprowadź datę, godziny, strefę `Europe/Warsaw` oraz dwóch prowadzących — każdego w osobnym wierszu.
4. Wyślij zgłoszenie.
5. Jako administrator otwórz `/admin/szkolenia`, sprawdź nowe pola i zatwierdź rekord.
6. W katalogu sprawdź godzinę w bloku daty i pierwszego prowadzącego w metadanych.
7. Otwórz stronę szczegółów i sprawdź pełną listę prowadzących, godziny oraz strefę czasową.

## Ważna kolejność

Nie wdrażaj kodu v6.16 przed SQL-em. Najpierw Supabase, potem GitHub/Vercel.
