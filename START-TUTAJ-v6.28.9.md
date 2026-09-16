# CRPE v6.28.9 — scena pierwszego ekranu

Pełne repo oparte na v6.28.8 z przebudową hero z dostarczonej paczki. Wybór roli z miniaturami znajduje się po lewej, przed przyciskami. Po prawej duże zdjęcie roli oraz panel danych przykładowych. Zachowano lead i listy funkcji bez sugerowania procentu gotowości modułów.

Korekty do załączonej propozycji: początek obu kolumn wyrównany; poniżej 1280 px karta ma odstęp od zdjęcia zamiast nakładania. Na większych ekranach pozostaje w dolnym lewym rogu sceny. Zdjęcia nie zostały zastąpione ani sztucznie powiększone. Zdjęcie medyka ma 665 px szerokości i w dużym kadrze może być mniej ostre.

Wgranie: rozpakuj ZIP, skopiuj zawartość cpd-app-main do lokalnego repo, zastępując pliki. Commit i push. SQL nie jest potrzebny. Backend oraz zależności pozostają bez zmian.

Weryfikacja tej paczki: build produkcyjny, ESLint i 26 kontroli check-release zaliczone. Podgląd desktop 1440 px, przełączanie ról i telefon 320 px sprawdzone. Bez przewijania poziomego w tych widokach.
