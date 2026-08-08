# CRPE v6.15.3 — spójne ścieżki ról na stronie głównej

## Zakres

- Sekcja „Jak to działa” ma formę numerowanej osi czasu zamiast kolejnego rzędu kafelków.
- Kroki zmieniają się wraz z wyborem roli i odpowiadają funkcjom faktycznie dostępnym dla medyka, placówki oraz organizatora.
- Demonstracja Panelu CPD i zestaw narzędzi medyka są renderowane tylko po wybraniu roli „Medyk”.
- Placówka i organizator otrzymują osobny blok „Działa dziś / Rozwijamy”.
- Zakres placówki wskazuje jako dostępne strukturę jednostki, zaproszenia, role i członkostwa. Zbiorczy status, weryfikacje, raporty oraz alerty są jasno oznaczone jako rozwijane.
- Zakres organizatora wskazuje jako dostępne zgłoszenie do publicznej bazy, stronę wydarzenia, dane i logo organizatora oraz link do zapisów. Panel uczestników i obsługa certyfikatów są jasno oznaczone jako rozwijane.
- Podglądy ról w Hero nie pokazują już przykładowych ekranów kompletności zespołu, uczestników ani certyfikatów jako gotowych funkcji.
- FAQ na stronie głównej zostało dopasowane do rzeczywistego zakresu produktu.

## Wdrożenie

Wersja nie wymaga migracji SQL ani zmian zmiennych środowiskowych. Należy wgrać zawartość katalogu `cpd-app-main` do repozytorium używanego przez Vercel.
