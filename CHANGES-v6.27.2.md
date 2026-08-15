# CHANGES v6.27.2 — wspólna rodzina pigmentów dla ról

Data: 2026-08-15

Baza: **CRPE v6.27.1**

Test: `npm run check:v6.27.2`

## Cel

v6.27.1 ograniczyła zasięg kolorów zależnych od roli, ale sama paleta nadal była zbyt szeroka: cyan / blue / indigo. v6.27.2 zachowuje zasadę jednego produktu i jednego niebieskiego CTA, a role buduje z jednej chłodnej rodziny kolorystycznej o zbliżonym walorze.

## 1. Rekomendowana paleta ról

Kolory 600 — tylko aktywny tab i kafelki ikon:

- **Medyk / petrol:** `#16656B`
- **Placówka / stalowy błękit:** `#23528F`
- **Organizator / granatowy grafit:** `#4A5170`

Odcienie miękkie 50 i tekst 800:

- Medyk: `#E7F0F0` / `#0E4448`
- Placówka: `#E9EEF7` / `#14355E`
- Organizator: `#EDEEF3` / `#2E3247`

Miękkie odcienie są używane wyłącznie w kontrolowanych plakietkach / obwódkach roli. Statusy nadal mają znaczenie semantyczne, a nie tożsamościowe.

## 2. Jeden kolor marki

Pełna chroma marki pozostaje skupiona na głównym CTA i akcencie H1:

- **Primary / CTA:** `#1D4ED8`
- hover CTA: `#173FAF`

Fraza „w jednym miejscu.” i główny przycisk korzystają z tego samego niebieskiego niezależnie od wybranej roli.

## 3. Wspólne chłodne neutrale

W kluczowych elementach strony głównej zastosowano wspólną rodzinę neutralną:

- tło: `#F7F8FA`
- linie / obramowania: `#E4E6EC`
- tekst drugorzędny: `#5C6270`
- tekst główny: `#171A21`

Hero i sekcja „Dla kogo” pozostają neutralne. Role nie zmieniają już hue całych sekcji ani obramowań kart.

## 4. Ograniczenie szumu wizualnego

- aktywna karta roli ma neutralną ramkę;
- kolor roli pozostaje na tabie, ikonach oraz miękkiej plakietce „Wybrana rola”;
- secondary CTA w kartach Placówki i Organizatora są neutralne;
- checklisty i elementy strukturalne nie konkurują pełnym niebieskim z głównym CTA;
- rozświetlenia hero są bardzo subtelne i nie zmieniają się wraz z rolą.

## 5. Wykresy Panelu CPD

**Bez zmian względem v6.27 / v6.27.1.** Zachowano schodkowy przebieg, marker „dziś”, pionową lukę do tempa, delikatny gradient, grubszy pasek Przeglądu i zielony wskaźnik punktów z kompletnych wpisów.

## 6. Pozostałe moduły i kompletność paczki

Bez zmian w logice i danych:

- Admin → Szkolenia;
- importer NIL i workflow GitHub Actions;
- Supabase / SQL / RLS / RPC;
- Brevo / SMTP / sekrety / ustawienia Vercela.

Poprzedni ZIP v6.27.1 nie zawierał ukrytych plików `.github/` i `.gitignore`. W v6.27.2 przywrócono je z potwierdzonej bazy v6.26.4. Workflow `import-nil-trainings.yml` jest bajt w bajt identyczny z wersją bazową; nie zmieniono harmonogramu ani logiki importera.

## 7. Walidacja

- `check:v6.27.2` — OK;
- `check:v6.27.1` — OK po uogólnieniu testu z konkretnych dawnych heksów do zasady spójnej marki;
- `check:v6.27` — OK po uogólnieniu akcentu kart;
- `check:v6.26.4`, `v6.26.3`, `v6.26.2` — OK;
- parser TypeScript: `app/page.tsx` i `app/panel-cpd/CalculatorClient.tsx` — 0 błędów składni.

Pełny zestaw lokalnych `check:*`: **46/53 OK**. Siedem nieuruchamiających się / historycznych testów jest dokładnie tym samym zestawem co na nietkniętej bazie v6.27.1 (`v6.1`, `v6.19`, `v6.23`, `v6.25`, `v6.25.1`, `v6.25.2`, `v6.26.1`), więc v6.27.2 nie dodaje nowej regresji w tej kontroli.

Pełny `next build`, lint i type-check zależności należy potwierdzić na Vercel Preview / środowisku po `npm ci`.
