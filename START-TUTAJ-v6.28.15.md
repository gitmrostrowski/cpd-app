# CRPE Home v6.28.15

Poprawka układu względem v6.28.14: tekst, karty odbiorców i zdjęcie pozostają w jednym wyśrodkowanym kontenerze. Usunięto ujemny margines zdjęcia zależny od szerokości okna. Rozmiar zdjęcia wynika z jego kolumny. Dekoracyjne tło również dopasowano do środka kompozycji.

Sprawdzenie: build produkcyjny i 21 kontroli wydania poprawne. Sprawdzono geometrię przy 1920 i 2560 px (szeroki obszar odpowiadający pomniejszonemu widokowi) oraz 390 px. Zdjęcie pozostaje w kontenerze, bez poziomego przewijania.

W tym wydaniu zmieniono wyłącznie CSS Home i instrukcję. Backend, baza i treści pozostają bez zmian względem v6.28.14. SQL nie jest potrzebny.

Rozpakuj ZIP i skopiuj zawartość folderu cpd-app-main do katalogu lokalnego repo wskazanego przez GitHub Desktop, zastępując pliki. Zachowaj .git i swoje pliki środowiska. Wykonaj commit i push. Aktualne instrukcje integracji nowego Home są w START-TUTAJ-v6.28.14.md; ta instrukcja opisuje dodatkową poprawkę.
