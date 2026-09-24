# CRPE Home v6.29.2
Strona główna w mniejszej, spokojniejszej skali. Na typowym laptopie (1920 px ze skalowaniem Windows 125%, czyli ok. 1536×730 px w przeglądarce) pierwszy ekran pokazuje teraz nagłówek, przyciski i linijkę okresu. Wcześniej linijka była poniżej krawędzi ekranu.

Zmiany tylko w app/home-v15.css:
- nagłówki: h1 60 px (było 68), h2 38 px (było 46), h3 18 px; tekst 16 px (było 17), lead 17 px,
- luźniejszy odstęp liter, bo Plus Jakarta Sans jest ciasna z natury (wcześniej sklejało się „bez segregatora”),
- przyciski 44 px, nagłówek strony 64 px,
- odstęp między sekcjami 96 px (tablet 80, telefon 64), nagłówki sekcji 40 px nad treścią,
- zwarty panel w hero (liczba 68 px zamiast 88),
- lista w bloku „Dla medyka” nie łamie się w połowie punktu.
Strona jest krótsza o ok. 13% (5170 → 4510 px przy szerokości 1440).

Rozpakuj ZIP i skopiuj zawartość cpd-app-main do lokalnego repo, zastępując pliki. Zachowaj .git i .env. Commit i push. SQL nie jest potrzebny.
