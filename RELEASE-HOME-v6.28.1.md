# CRPE Home v6.28.1 — instrukcja aktualizacji

Przygotowano 16.09.2026 na podstawie dostarczonego `cpd-app-main.zip` z GitHuba (zawiera v6.27.11) oraz `CRPE_v6_28_zmiany.zip`.

## Co zawiera wydanie

- Nowy wygląd Home: zdjęcia, pierścienie, granatowe sekcje, typografia i spójne CTA.
- Na telefonie główne CTA jest przed zdjęciem i dodatkowym podglądem.
- Przełącznik ról ma minimum 48 px wysokości; powiększono podpisy mobilnego podglądu.
- Poprawiono kontrast numerów kroków i podpisu „Podgląd CRPE”.
- Zmiany wspólne: Header, Footer, BottomCTA, globalne tokeny kolorów i font nagłówków h1–h3. Obejmują również inne strony.
- Zachowano kod logiki nagłówka. Różnice względem bazowego Header dotyczą wyłącznie wyglądu.
- Brak zmian w API, logice punktów, importerze NIL, uprawnieniach, migracjach Supabase, certyfikatach i raportach. Zależności oraz package-lock.json pozostają bez zmian.

To jest wydanie **Home**, nie Pilot Foundation. Repo bazowe nie zawiera panelu administracyjnego udostępnień profili ani migracji tego modułu. Aktualizacja go nie dodaje i nie potwierdza jego wcześniejszego wdrożenia.

## Wdrożenie

1. Zachowaj bieżący commit jako punkt powrotu.
2. Rozpakuj ZIP i wgraj **zawartość folderu cpd-app-main do katalogu głównego repozytorium**. Nie twórz dodatkowego zagnieżdżenia cpd-app-main/cpd-app-main.
3. Nie zmieniaj produkcyjnych zmiennych środowiskowych ani konfiguracji Supabase. Ta aktualizacja nie wymaga uruchamiania SQL.
4. Zainstaluj zależności przez `npm ci`, następnie uruchom `npm run check:release`, `npm run lint` i `npm run build`.
5. Najpierw sprawdź wdrożenie Preview. Zachowaj dotychczasowe ustawienia projektu na hostingu.
6. Na Preview sprawdź logowanie/wylogowanie, panel CPD, dodanie aktywności i dokumentu, raport PDF/CSV, zaproszenie i przełączenie placówki oraz formularz kontaktowy. Sprawdź także wygląd po zalogowaniu i powiększenie tekstu.
7. Po pozytywnym sprawdzeniu opublikuj. W razie problemu cofnij commit/wdrożenie do poprzedniej wersji; aktualizacja nie zmienia schematu bazy.

## Wykonane sprawdzenia

- Instalacja dokładnych zależności z package-lock.json: poprawna.
- Produkcyjny build Next.js i kontrola TypeScript: poprawne.
- Build wykonano z testowymi wartościami zmiennych Supabase, bez dostępu do produkcyjnych danych. Ostrzeżenie pobrania danych szkoleń przy generowaniu strony nie jest testem działającego backendu. Testowe wartości nie znajdują się w paczce ani w plikach konfiguracji.
- Pełny ESLint: 0 błędów, 88 ostrzeżeń. Nowe i zmodyfikowane kontrole oraz Home/UI sprawdzone dodatkowo po porządkowaniu.
- `npm run check:release`: 25/25 skryptów poprawnych, m.in. Placówki, zaproszenia, NIL, raporty, terminy, limity i aktualny Home. Są to kontrole źródeł i wybrane testy logiki, nie pełne testy integracji z bazą.
- Test przeglądarkowy wersji produkcyjnej: 320, 375, 390, 768, 1024 i 1440 px × 3 role; bez poziomego przepełnienia, brakujących obrazów i błędów JavaScript.
- Sprawdzone FAQ, otwieranie/zamykanie mobilnego menu oraz publiczne strony: dla medyka, placówki i organizatora, rejestracja, logowanie, bezpieczeństwo, pomoc i kontakt. Nie wysyłano formularzy ani nie logowano na rzeczywiste konto.
- Obejrzano zrzuty Home dla desktopu i telefonu.

## Starsze kontrole — jawne ograniczenie

Szerszy audyt uruchomił również historyczne testy. Poniższe osiem nie przechodzi **także w oryginalnym repo z GitHuba**, przed zmianami:

- check-v5-2-1-legacy-visibility.mjs
- check-v5-2-training-audience.mjs
- check-v6-15-2-audience-homepage.mjs
- check-v6-19-2-status-actions-typography.mjs
- check-v6-19-status-steps-accrual.mjs
- check-v6-25-training-imports.mjs
- check-v6-26-1-panel-visual-coherence.mjs
- check-v6-26-2-panel-readability.mjs

Pozostają w repo; nie zmieniano ich w celu ukrycia błędów. Zestaw `check:release` jest ukierunkowany na bieżącą aktualizację i nie zastępuje audytu historycznych rozbieżności. Dawne testy palet v6.27–v6.27.4 opisują wcześniejsze, wzajemnie zastępowane projekty i nie służą do akceptacji obecnego wyglądu.

Wersja jest przygotowana do wgrania i sprawdzenia Preview. Testy operacji na rzeczywistych kontach i bazie pozostają końcowym krokiem przed produkcją.
