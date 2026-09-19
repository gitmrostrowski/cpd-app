# CRPE v6.28.11 — strona skierowana do medyka

Wdrożenie uwag i makiet z files (4).zip. ZIP zawierał tylko dwa obrazy, dlatego zmiany wykonano w kodzie pełnego repo v6.28.10.

- Hero pokazuje korzyść: Sprawdź, ile punktów Ci brakuje. Opis jasno mówi o wpisaniu punktów i dołączeniu pliku; nie sugeruje odczytu punktów ze zdjęcia.
- Rejestracja przed opcjonalnym wyborem organizacji; drugi przycisk prowadzi do Jak to działa. Logowanie zostaje w nagłówku.
- Podgląd aplikacji zawiera przykładowe aktywności i informację o dołączonym certyfikacie. Dane są oznaczone jako przykładowe.
- Kolejność: hero, kroki, przykład panelu, narzędzia, bezpieczeństwo, kompaktowy pas organizacji, FAQ, granatowe CTA.
- Przyciski rejestracji po krokach i narzędziach. Usunięto trzy duże karty oraz zbędne białe dekoracje jasnej sekcji.
- Rejestracja: krótka lista korzyści, poprawne powiązanie etykiet z polami i informacja o długości hasła. Autoryzacja, zaproszenia, zgody i przekierowania niezmienione.

Nie dodano niepotwierdzonej ceny, opinii ani licznika szkoleń. Nie przenoszono dużych kart na podstrony, bo było to opcjonalne w uwagach. Formularz nie obiecuje przejścia bezpośrednio do aktywności, ponieważ zachowano istniejącą aktywację e-mail i przekierowania.

Sprawdzenie: produkcyjny build, 25 kontroli check-release, desktop 1440 px, mobile 390 px, przełączanie roli i przejście do formularza. Lint: brak błędów; istniejące ostrzeżenie set-state-in-effect w rejestracji. Nie testowano tworzenia rzeczywistego konta. Backend, baza i zależności niezmienione.

Wgranie: rozpakuj ZIP, skopiuj zawartość cpd-app-main do lokalnego repo i zastąp pliki. Następnie commit i push. SQL nie jest potrzebny. Aktualne instrukcje to ten plik; pozostałe START-TUTAJ są historyczne.
