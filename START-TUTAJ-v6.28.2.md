# CRPE Home v6.28.2 — pełne repo

## Wgranie

Rozpakuj ZIP. Skopiuj całą zawartość folderu `cpd-app-main` do istniejącego folderu repo `cpd-app`, zgadzając się na zastąpienie plików. Nie kopiuj samego folderu jako podfolderu repo.

GitHub Desktop powinien pokazać m.in. nowy `app/crpe-visual-v6-28-2.css` i zmieniony `app/layout.tsx`. Zapisz commit, wykonaj Push origin i poczekaj na zakończenie wdrożenia właściwego commita.

## Rzeczywista zmiana względem poprzedniej paczki

Layout bezpośrednio importuje nowy, wersjonowany arkusz `crpe-visual-v6-28-2.css`. Arkusz zawiera kompletny system wizualny, a nie pojedynczą poprawkę koloru. Obejmuje fonty nagłówków, paletę, granatowe tła, dekoracje, pierścień, animacje i style druku. Kontrola Home sprawdza również podłączenie tego pliku.

Projekt desktopu pochodzi z przesłanej paczki wizualnej i odpowiada jej kompozycji. Zachowano poprawiony kontrast małych tekstów i mobilne CTA przed zdjęciem. Nie zmieniano API, uprawnień, bazy, NIL ani logiki paneli. Zależności pozostają takie same.

## Kontrola po wdrożeniu

Sprawdź cały Home: trzywierszowy nagłówek desktop, morski pierścień wokół zdjęcia, karty trzech ról, numerowane kroki, granatową sekcję Panel CPD, granatowy pasek narzędzi, sekcję bezpieczeństwa, FAQ, granatowe CTA i stopkę. Biały tekst nie może pozostawać na białym tle.

Ta paczka zawiera rzeczywiste zmiany plików i wymusza ponowną kompilację zależności CSS przez nowy import. Nie ustala jednak, dlaczego poprzednie wdrożenie serwowało stary arkusz; bez logów hostingu nie można rozstrzygnąć źródła tamtej rozbieżności. Przed produkcją sprawdź Preview i podstawowe operacje na rzeczywistym koncie.

Wcześniejsze wyniki oraz ograniczenia historycznych testów opisano w RELEASE-HOME-v6.28.1.md.
