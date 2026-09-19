# CRPE v6.28.12 — przywrócenie oferty dla trzech odbiorców

Ta instrukcja zastępuje wcześniejsze instrukcje dotyczące wyglądu strony głównej.

## Zmiany

- Placówka jest domyślnie wybraną rolą na stronie głównej. Opis, podgląd oraz wezwanie do działania odpowiadają tej roli.
- Przywrócono nagłówek „Punkty edukacyjne i certyfikaty w jednym miejscu”, wcześniejsze opisy ofert oraz pełną sekcję „Trzy role” dla medyka, placówki i organizatora kształcenia.
- Usunięto fotografię z certyfikatem oraz dodaną ostatnio kartę przykładowego załącznika. Zdjęcia odbiorców pozostają w sekcji trzech ról.
- Zachowano rozróżnienie funkcji dostępnych i rozwijanych. Zmiana nie dodaje nowych funkcji placówki.
- Zachowano poprawki prezentacji formularza rejestracji z poprzedniej paczki.

## Wgranie przez GitHub Desktop

1. Rozpakuj ZIP do osobnego katalogu.
2. W GitHub Desktop wybierz właściwe repo i użyj „Show in Explorer”.
3. Skopiuj zawartość folderu `cpd-app-main` z rozpakowanej paczki bezpośrednio do otwartego katalogu repo, zastępując istniejące pliki. Nie kopiuj samego ZIP ani dodatkowego folderu `cpd-app-main` do środka repo.
4. Zachowaj lokalny folder `.git` i swoje pliki konfiguracji środowiska.
5. W GitHub Desktop sprawdź listę zmian, wykonaj commit i push.

## Weryfikacja

- Kompilacja produkcyjna: poprawna.
- Kontrole wydania: 25/25.
- ESLint strony głównej: bez uwag.
- Sprawdzono widok desktopowy i mobilny, wybór trzech ról oraz brak poziomego przewijania w sprawdzonych widokach.
- Kontrola pakowania porównuje krytyczne katalogi i plik zależności z repo bazowym. Nie jest potrzebna migracja SQL.
- Kompilację wykonano z przykładową konfiguracją Supabase. Nie przeprowadzono operacji na produkcyjnej bazie ani pełnego testu logowania i rejestracji.

Przed publikacją sprawdź podgląd wdrożenia z własną konfiguracją: stronę główną, trzy role, odnośniki, logowanie i rejestrację.
