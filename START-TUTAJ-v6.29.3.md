# CRPE v6.29.3 – strony ról w systemie Home v15
Strony /dla-medyka, /dla-placowki i /dla-organizatora mają teraz ten sam wygląd co strona główna: tę samą nawigację i stopkę, typografię, kolory i rytm sekcji. Zamiast ikon w kartach każda strona pokazuje w hero podgląd interfejsu z danymi przykładowymi.

Układ każdej strony: hero z podglądem, „Co możesz zrobić już teraz” (dostępne teraz / w przygotowaniu), kroki, pytania i zamknięcie.

Treść dopasowana do tego, co działa w aplikacji:
- Medyk: raport jako wydruk lub PDF oraz CSV, bez wzmianki o eksporcie dokumentów. Lista wszystkich 8 zawodów.
- Placówka: panel pilotażowy, dostęp przez zaproszenie. Przyciski „Zapytaj o pilotaż” i „Mam zaproszenie” (/placowka). Status zespołu, weryfikacja, alerty i raporty zbiorcze oznaczone jako w przygotowaniu.
- Organizator: zgłoszenie szkolenia w bazie (po zalogowaniu, z logo i linkiem do zapisów, z weryfikacją przed publikacją). Obsługa uczestników, dokumenty i konto organizatora oznaczone jako w przygotowaniu. Usunięto „zakres indywidualny” i obietnice funkcji, których nie ma.

Technicznie:
- Nowy components/home/MarketingChrome.tsx: wspólna nawigacja i stopka Home i stron ról. Na stronach ról linki menu prowadzą do sekcji strony głównej (/#narzedzia itd.).
- HomeChrome i PageContent ukrywają nagłówek aplikacji i nie tworzą drugiego <main> na stronach marketingowych (lista MARKETING_PATHS).
- Nowy app/role-v15.css (tylko selektory .crpe-home-v15).
- home-v15.css: reguły dla nagłówków i linków nie działają wewnątrz okna kontaktowego, więc formularz RoleContactModal wygląda jak dotąd.
- Test: scripts/check-v6-29-3-role-pages.mjs oraz renderowanie stron ról w check-home-rendering.cjs. check:release ma 23/23.

Rozpakuj ZIP i skopiuj zawartość cpd-app-main do lokalnego repo, zastępując pliki. Zachowaj .git i .env. Commit i push. SQL nie jest potrzebny.
