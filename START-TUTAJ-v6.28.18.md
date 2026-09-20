# CRPE Home v6.28.18 — poprawki po audycie

## Wprowadzone poprawki

- Zalogowany użytkownik widzi na Home ten sam nagłówek aplikacji co na innych stronach, z nawigacją konta i wylogowaniem. Gość widzi nowy nagłówek publiczny. Główne CTA zmienia się na „Przejdź do panelu” po zalogowaniu.
- Naprawiono link „Dla kogo”; stara kotwica również pozostaje dostępna.
- Zakres funkcji w rozwoju jest jawnie widoczny pod kartami trzech odbiorców, a nie schowany w niewidocznym elemencie.
- Usunięto fotografię sugerującą wystawianie certyfikatów przez CRPE.
- Dodano CTA „Załóż konto”, drugie „Zobacz narzędzia”, końcową sekcję CTA i linki do Bazy szkoleń. Na telefonie treść i CTA są przed zdjęciem.
- Usunięto niespójny licznik miesięcy i średnią roczną w danych przykładowych. Nazwy przykładowych organizatorów są neutralne.
- Ujednolicono font Home z poprawnym fallbackiem next/font. Poprawiono hierarchię nagłówków, dekoracyjne opisy obrazków/SVG, fokus linku pomijającego nawigację oraz położenie header/footer poza main.
- Treść strony jest komponentem serwerowym. Małe komponenty klienckie obsługują sesję i ulepszenia interakcji. Zdarzenia przewijania są grupowane przez requestAnimationFrame, a sekcje wyszukiwane raz.
- Grafiki ról: 400 × 400 px, około 23–29 KB. CSS Home: około 87 KB zamiast 151 KB po usunięciu nieużywanych selektorów prototypu. Materiały źródłowe są w design/home-v14, poza public.
- globals.css jest teraz punktem zgodności importującym właściwy arkusz. Kontrole czytają faktycznie używany arkusz crpe-visual-v6-28-2.css. Dodano .gitattributes.

## Weryfikacja i ograniczenia

Kompilacja produkcyjna, lint zmienionych komponentów i 22 kontrole wydania przechodzą. Nowy test renderuje Home dla gościa i konta z kontrolowaną atrapą sesji, sprawdzając wybór nawigacji, CTA, strukturę strony i informacje o zakresie.

W lokalnej przeglądarce sprawdzono widoczność informacji o rozwoju, fokus po użyciu skip linku, obsługę zakładek klawiaturą, menu mobilne i Escape, brak błędów konsoli oraz brak poziomego przewijania przy 390 i 320 px. Przycisk rejestracji mieści się na pierwszym ekranie 320 × 780.

Test komponentu z atrapą sesji nie zastępuje rzeczywistego logowania. Nie wykonywano operacji na produkcyjnej bazie. Przed publikacją sprawdź Home po zalogowaniu swoim kontem na podglądzie wdrożenia oraz powrót do panelu.

Backend, reguły dostępu, baza i zależności nie zostały zmienione. Nie ma SQL. Nie przenoszono puppeteer między zależnościami bez osobnej analizy procesu wdrożenia. Przy instalacji bez potrzeby pobierania przeglądarki można ustawić PUPPETEER_SKIP_DOWNLOAD=1; npm ci nadal wymaga dostępu do rejestru pakietów, jeśli nie ma ich w cache.

Nie usuwano zbiorczo historycznych komponentów i obrazów z wcześniejszych wydań. Ich porządkowanie nie jest warunkiem poprawnego działania Home.

## Podmiana repo

1. Rozpakuj ZIP i skopiuj zawartość cpd-app-main do lokalnego repo, zastępując pliki. Zachowaj .git i pliki środowiska.
2. Przy kopiowaniu na starszą wersję stare PNG pozostają na dysku. Opcjonalny scripts/clean-home-v18.ps1 usuwa wyłącznie ich identyczne duplikaty po sprawdzeniu kopii w design. Nie usuwa katalogów ani zmodyfikowanych źródeł. W nowo rozpakowanej paczce te pliki są już uporządkowane.
3. Sprawdź listę zmian w GitHub Desktop, wykonaj commit i push.
4. Przed produkcją sprawdź podgląd z własną konfiguracją, w tym zalogowane konto.

Ta instrukcja zastępuje wcześniejsze zalecenia dotyczące Home.
