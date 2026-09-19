# CRPE v6.28.10 — spokojna wizytówka

Kompromis między starszą paletą i nowszą prezentacją produktu: biel, neutralne szarości, grafitowe nagłówki, niebieskie działania i turkusowy wykres postępu. Podgląd produktu jest większy, bez zdjęcia w hero. Wybór roli z ikonami poprzedza główne działanie, a Zaloguj się jest spokojniejszym linkiem. Zdjęcia ról pozostają wyłącznie przy Trzech rolach. Duży blok demonstracji i końcowe CTA mają jasne tło; stopka pozostaje granatowa.

Zmiany palety ograniczono do publicznej strony głównej. Nie zmieniono API, bazy, uprawnień ani zależności. To pełne repo bazujące na dostarczonym cpd-app-main.zip, nie sama nakładka.

Rozpakuj ZIP i skopiuj zawartość cpd-app-main do swojego lokalnego repozytorium, zastępując pliki. Nie kopiuj samego ZIP ani dodatkowego folderu do repo. Następnie sprawdź Changes w GitHub Desktop, commit i push. SQL nie jest potrzebny.

Historyczne instrukcje w paczce opisują poprzednie wersje. Aktualna jest ta instrukcja. Historyczna kontrola sceny v6.28.9 została wyłączona z check-release, bo wymaga zdjęć w hero, z których świadomie zrezygnowano.

Weryfikacja: build produkcyjny zakończony poprawnie; 25 kontroli wydania zaliczonych. Podgląd desktop 1440 px i mobile 390 px, przełączanie trzech ról oraz zakończenie strony sprawdzone. Brak przewijania poziomego w sprawdzonych widokach. Build wymaga dostępu do Google Fonts, zgodnie z obecną konfiguracją projektu.
