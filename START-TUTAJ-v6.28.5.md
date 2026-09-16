# CRPE v6.28.5 — prostokątne zdjęcia i wskaźnik trzech ról

Zachowano wszystkie zdjęcia z v6.28.4. W hero zdjęcia mają proporcje 4:3 i zaokrąglone rogi. Panel pod zdjęciem ma tę samą szerokość, bez nakładania. W nagłówku panelu znajduje się pierścień z trzema segmentami i ikoną: aktywny segment odpowiada wybranej roli. Wersja mobilna zachowuje kompaktowy podgląd. Animacja respektuje ograniczenie ruchu.

Weryfikacja: build produkcyjny, 25 kontroli check-release, podgląd desktop i mobile 390 px, przełączanie segmentów. ESLint: bez błędów, jedno ostrzeżenie o nieużywanym roleThemes. Krytyczne moduły i package-lock niezmienione względem bazowego repo.

Wgranie: rozpakuj ZIP, skopiuj zawartość cpd-app-main do katalogu lokalnego repozytorium i zastąp pliki. Nie kopiuj samego ZIP ani dodatkowego folderu do repo. Następnie sprawdź Changes w GitHub Desktop, wykonaj commit i push. Ta wersja nie wymaga zmian SQL.
