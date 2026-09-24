# CRPE v6.30 – placówka na pierwszym planie i jeden styl w całej aplikacji

## Wgranie
Rozpakuj ZIP i skopiuj zawartość cpd-app-main do lokalnego repo, zastępując pliki. Zachowaj .git i .env. Commit i push. SQL nie jest potrzebny, zależności i package-lock.json bez zmian.

## Placówka wyraźnie wyróżniona
- Menu (Home, strony publiczne i nagłówek aplikacji): podświetlona pozycja „Dla placówek”.
- Hero strony głównej: odnośnik „Dla placówek – zespół, jednostki i role w jednym panelu”.
- Nowa granatowa sekcja #dla-placowek zaraz po „Trzech krokach”: opis, dostępne funkcje, podgląd panelu placówki, przyciski „Zapytaj o pilotaż” i „Zobacz, co obejmuje”.
- Kontakt: placówka jako pierwsza, wyróżniona karta.
- Podgląd panelu placówki jest wspólnym komponentem (components/home/PlacowkaPreview.tsx) dla Home i /dla-placowki.

## Jeden styl w całej aplikacji
- Nagłówek aplikacji (components/Header.tsx): logo i menu jak na Home, przyciski-pigułki. Logika placówek, konta i admina bez zmian.
- Stopka: wszędzie ta sama jasna stopka co na Home (components/Footer.tsx używa MarketingFooter).
- AppPageHeader (Panel CPD, Aktywności, Baza szkoleń, Raporty, Profil): płaski nagłówek bez karty, gradientu i wersalików.
- app/app-v15.css: globalna warstwa stylu dla starszych ekranów – spokojniejsze wagi fontu, etykiety zdaniem zamiast wersalików, przyciski-pigułki, płaskie tła, jedna skala zaokrągleń.
- crpe-visual: klasy blue-600/700/800 i slate-950 zmapowane na kolory marki.
- Narzędzia, Bezpieczeństwo i Kontakt: pełny układ v15 (components/home/MarketingPage.tsx).
- Panel CPD na telefonie: zakładki w jednym rzędzie (3 kolumny), pasek zakładek pod wyższym nagłówkiem.

## Sprawdzenie
- check:release 24/24 (nowy test check-v6-30-app-style.mjs).
- TypeScript bez błędów, ESLint 0 błędów.
- Zrzuty 1440 px i 390 px: Home, strony publiczne, Panel CPD, Aktywności, Baza szkoleń, Raporty i Profil (ekrany aplikacji z podstawioną sesją i pustymi danymi – bez logowania do produkcyjnej bazy). Brak przewijania w bok.
- Build lokalnie z zastępczym fontem (brak dostępu do Google Fonts w środowisku testowym); w repo jest właściwy Plus Jakarta Sans.

## Poza zakresem tej wersji
Wnętrze ekranów aplikacji (karty Panelu CPD, lista aktywności, karty szkoleń) dostało tylko globalną warstwę stylu, bez przepisywania. Pomoc, Regulamin, Polityka prywatności i Logowanie – tak samo, bo testy wymagają tam konkretnych klas.
