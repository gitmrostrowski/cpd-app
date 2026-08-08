# CRPE v6.17 — wiarygodność i czytelność Panelu CPD

## Zakres

- rozdzielenie zadeklarowanego postępu na punkty z kompletnych wpisów i punkty z wpisów do uzupełnienia;
- jedna definicja kompletności dla wskaźników, kroków i listy aktywności;
- zastąpienie trzech powtarzających się kafelków zwartym paskiem zachowującym trzy poziomy wyniku z fundamentu v4;
- ukrycie pustej sekcji limitów oraz pozycji powiadomień w nawigacji;
- poprawna polska odmiana liczby wpisów;
- grupowanie znaczników osi czasu według miesiąca;
- zabezpieczenie akcji „Brakuje punktów” przed prowadzeniem do ukrytej sekcji.

## Ważne

Wersja nie zmienia sposobu generowania raportu ani modelu okresu rozliczeniowego. Panel nie twierdzi więc, że niekompletne wpisy są automatycznie odrzucane przez raport. Okres nadal jest przechowywany jako lata kalendarzowe; migracja na dokładne daty wymaga osobnego projektu i SQL-a.

## Wdrożenie

Nie jest wymagana migracja Supabase. Wystarczy wdrożyć repozytorium aplikacji.
