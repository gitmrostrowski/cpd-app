# CHANGES v6.27.1 — uporządkowanie palety marki po przeglądzie v6.27

Data: 2026-08-15

Baza: **CRPE v6.27**

Test: `npm run check:v6.27.1`

## Cel

v6.27 ociepliła stronę główną i poprawiła wykresy Panelu CPD, ale akcent roli był używany zbyt szeroko. Przy przełączaniu Medyk / Placówka / Organizator jednocześnie zmieniały się CTA, część nagłówka, tła, obramowania i wiele elementów kart. W efekcie role zaczynały wyglądać jak trzy osobne produkty.

v6.27.1 zachowuje cieplejszy charakter i ilustracje, ale przywraca jedną, stałą tożsamość marki CRPE.

## 1. Jeden kolor marki

Główne akcje i elementy nawigujące pozostają w niebieskim CRPE (`blue-600` / `#2563EB`, hover `blue-700`).

Stałe niezależnie od roli są m.in.:

- główny CTA w hero;
- fraza „w jednym miejscu.”;
- linki i akcje „Dowiedz się więcej”;
- postęp i elementy informacyjne w podglądach;
- akcent hover kart w sekcji „Dla kogo”.

## 2. Kolor roli tylko jako identyfikator

Kolory ról są celowo zbliżone jasnością i nasyceniem:

- **Medyk:** `cyan-700` = `#0E7490`;
- **Placówka:** `blue-700` = `#1D4ED8`;
- **Organizator:** `indigo-600` = `#4F46E5`.

Kolor roli występuje tylko w kontrolowanych miejscach:

1. aktywny tab w przełączniku roli;
2. ikona aktywnego podglądu;
3. ikona karty roli w sekcji „Dla kogo”.

Nie steruje już CTA, H1, tłem całego hero, gradientami ani paskami postępu.

## 3. Neutralne tła

- hero ma jedno stałe tło niezależnie od roli;
- rozświetlenia są stałe i bardzo subtelne;
- karty ról mają ten sam neutralny podkład pod ilustracje;
- sekcje strony używają wspólnej skali slate / jasnego niebieskoszarego tła;
- usunięto zielonkawe i fioletowe zabarwienie całych sekcji.

## 4. Kolory semantyczne

Kolory statusu nie są kolorami tożsamości roli:

- **zielony** — rzeczywiście dostępne / kompletne;
- **bursztynowy** — rozwijamy / wymaga uwagi;
- **czerwony** — błąd / po terminie;
- **szary** — neutralny zakres lub informacja drugorzędna.

W widocznych równocześnie kartach „Dla kogo” tylko status Medyka pozostaje zielonym statusem „Dostępne teraz”. Statusy Placówki i Organizatora są wizualnie neutralne, a informacja o rozwijanym zakresie pozostaje bursztynowa tam, gdzie ma znaczenie.

## 5. Wykresy Panelu CPD

**Bez zmian względem v6.27.** Zachowano:

- schodkowy wykres punktów;
- delikatny gradient pod linią;
- marker „dziś” i pionową lukę do tempa;
- grubszy pasek „Przeglądu”;
- zieloną informację o punktach z kompletnych wpisów;
- semantykę: niebieski = zdobyte, zielony = kompletne, bursztynowy = luka/uwaga, czerwony = po terminie.

## 6. Bez zmian w pozostałych modułach

Bajt w bajt pozostają bez zmian względem v6.27:

- `app/panel-cpd/CalculatorClient.tsx`;
- `app/admin/szkolenia/page.tsx`;
- `integrations/training-importer/src/sources/nil.ts`;
- `.github/workflows/import-nil-trainings.yml`.

Nie ma nowego SQL, zmian Supabase, RLS, RPC, sekretów, Brevo ani konfiguracji Vercela.

## 7. Walidacja

- `npm run check:v6.27.1` — OK;
- `npm run check:v6.27` — OK (test v6.27 uogólniono, aby nie wymuszał starej, celowo zmienionej palety);
- `check:v6.26.4`, `v6.26.3`, `v6.26.2` — OK;
- wszystkie dostępne historyczne `check:*`: **47/52 OK**.

Znane wyjątki środowiskowe / historyczne:

- `v6.19` — lokalnie brak pakietu `typescript`;
- `v6.23` — stary skrypt uruchamia `.ts` bez loadera;
- `v6.25`, `v6.25.1` — lokalnie brak `zod`;
- `v6.26.1` — stary test wizualny oczekuje wcześniejszej wysokości paska `h-4`, celowo zmienionej w późniejszych wersjach.

Składnia `app/page.tsx` i `app/panel-cpd/CalculatorClient.tsx` została sprawdzona parserem TypeScript — 0 błędów składni.

Pełny `next build` / ESLint należy potwierdzić na Vercel Preview lub po `npm ci`.
