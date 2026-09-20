# CRPE Home v6.28.19 — proporcje pierwszego ekranu

Zmniejszono nagłówek i zdjęcie, podniesiono fotografię, skrócono odstępy hero oraz przerwy między sekcjami. Nie zmieniano zoomu przeglądarki ani wielkości tekstów i przycisków w kartach.

Przy obszarze przeglądarki 1366 x 768 px wszystkie trzy karty mieszczą się na pierwszym ekranie (dolna krawędź około 683 px). Sprawdzono również 390 x 844 px: CTA widoczne, brak poziomego przewijania. Kompilacja produkcyjna i 22 kontrole wydania przeszły poprawnie.

Zmiana względem v6.28.18 dotyczy tylko CSS Home. Pozostają poprawki po audycie, w tym nawigacja zalogowanego użytkownika, dostępność i widoczny zakres funkcji. Backend i baza bez zmian. SQL nie jest potrzebny.

Rozpakuj ZIP i skopiuj zawartość cpd-app-main do lokalnego repo, zastępując pliki. Zachowaj .git i własne pliki środowiska. Następnie commit i push. W przypadku aktualizacji ze starszej wersji niż v6.28.18 przeczytaj również START-TUTAJ-v6.28.18.md.
