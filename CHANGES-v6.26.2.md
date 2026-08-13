# CHANGES v6.26.2 — czytelność Panelu CPD i punktów kompletnych

Data: 2026-08-13
Zakres: `components/Header.tsx`, `app/panel-cpd/CalculatorClient.tsx` oraz test regresyjny v6.26.2.

## 1. Główne menu

Na desktopie zwiększono rozmiar tekstu głównej nawigacji z 13 px do 14 px. Dzięki temu główne menu nie wygląda lżej od podmenu Panelu CPD. Etykieta placówki również została delikatnie powiększona: pojedyncza placówka do 13 px, a w wariancie wielu placówek linie do 13 px / 11 px.

## 2. Liczba punktów w statusie

Duża liczba wyniku została zmniejszona z 60–64 px do 46–52 px. Nadal jest główną liczbą karty, ale nie dominuje nad wykresem i kolejnymi krokami.

## 3. Punkty z kompletnych wpisów

Panel nadal pokazuje łączną liczbę punktów z aktywności oznaczonych jako ukończone, zgodnie z dotychczasową logiką. Obok dodano jednak osobne rozróżnienie:

- `Kompletne wpisy: X pkt` — wpis ukończony, z uzupełnionym organizatorem i certyfikatem;
- `Do uzupełnienia: Y pkt` — wpis ukończony, który nadal ma brak dokumentacyjny;
- planowane wpisy nie zwiększają wyniku.

To nie jest oznaczenie formalnej weryfikacji certyfikatu — tylko kompletności danych według istniejącej funkcji `getRowMissing`.

W widoku `Przegląd` karta „Zebrane” pokazuje również liczbę punktów pochodzących z kompletnych wpisów.

## 4. Przebieg / Przegląd

Przełącznik widoku przeniesiono z prawego górnego rogu karty bezpośrednio nad wykres/pasek postępu w lewej kolumnie. Jest więc bliżej elementu, który faktycznie zmienia, i nie konkuruje ze statusem tempa.

## 5. Baza i infrastruktura

v6.26.2 nie dodaje nowej migracji SQL i nie zmienia API, Supabase, importera NIL, workflow GitHub Actions, Vercel ani Brevo. Nadal obowiązuje migracja SQL wprowadzona w v6.26, jeżeli nie została jeszcze wykonana na produkcji.

## Test

`npm run check:v6.26.2`
