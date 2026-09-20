# CRPE Home v6.28.14 — nowy projekt z „CRPE CALOSC.zip”

Pełne repo bazuje na ostatnim wydaniu v6.28.13. Do istniejącej aplikacji Next.js przeniesiono nowy projekt Home: kolory, font Montserrat, zdjęcia, karty odbiorców, podglądy narzędzi, bezpieczeństwo, FAQ, nagłówek i stopkę.

## Integracja

- Wszystkie odnośniki prowadzą do istniejących stron CRPE. Nie ma pustych linków ani dodatkowego serwera z prototypu.
- Nowy nagłówek i stopka dotyczą tylko strony głównej. Pozostałe podstrony zachowują dotychczasową nawigację i wygląd.
- Menu mobilne obsługuje Escape i zamknięcie po wyborze linku. Zakładki obsługują strzałki, Home i End. Ukryte menu nie przyjmuje fokusu.
- Poprawiono niewidoczną ikonę menu, położenie plakietki na telefonie i układ narzędzi na węższych ekranach.
- Grafiki wyświetlane na stronie mają format WebP. Oryginały PNG pozostawiono jako materiały źródłowe.
- Usunięto niepotwierdzone „20 000 medyków”. Opisy placówki i organizatora odpowiadają aktualnie dostępnym funkcjom. Podglądy narzędzi wyraźnie oznaczono jako dane przykładowe; nie są to działające panele ani dane konta użytkownika.
- Zdjęcia, w tym zdjęcie w sekcji bezpieczeństwa, pochodzą z nowej dostarczonej paczki.

## Zakres i sprawdzenie

Backend, logika logowania, baza, uprawnienia i plik zależności pozostają bez zmian. Nie potrzeba SQL ani instalowania nowych zależności. Build używa Google Fonts, więc podczas budowania potrzebny jest dostęp do ich serwera.

Kontrole starego układu Home nie opisują już aktualnego projektu i pozostają w repo jako historia. W zestawie wydania zastąpiono je kontrolą nowych odnośników, zasobów, zakresu ofert, zakładek i izolacji stylów. Pozostałe kontrole funkcjonalne pozostają aktywne.

Sprawdzono kompilację produkcyjną, lint zmienionych plików, zestaw kontroli wydania oraz lokalny podgląd desktop/mobile, zakładki myszą i klawiaturą, menu i przejście do oferty placówki. Nie wykonywano operacji na produkcyjnej bazie ani rzeczywistej rejestracji.

## Wgranie

1. Rozpakuj ZIP do osobnego katalogu.
2. W GitHub Desktop otwórz właściwe repo przez „Show in Explorer”.
3. Skopiuj zawartość folderu `cpd-app-main` z paczki do tego repo, zastępując pliki. Nie kopiuj samego ZIP ani folderu nadrzędnego.
4. Zachowaj `.git` i swoje pliki środowiska.
5. Sprawdź zmiany, wykonaj commit i push.
6. Przed publikacją sprawdź podgląd wdrożenia z własną konfiguracją: Home, logowanie, rejestrację i oferty trzech odbiorców.

Ta instrukcja zastępuje wcześniejsze instrukcje dotyczące wyglądu Home.
