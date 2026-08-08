import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/kalkulator/CalculatorClient.tsx", root), "utf8");
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

// 1. Zwarta forma sekcji statusu bez duplikatów.
assert.doesNotMatch(panel, /Podstawa obliczenia/, "Karta dublująca Ustawienia powinna zniknąć");
assert.doesNotMatch(panel, /Priorytety teraz/, "Skróty dublujące sekcję Co dalej powinny zniknąć");
assert.doesNotMatch(panel, /xl:grid-cols-\[460px_minmax\(0,1fr\)\]/, "Status ma być paskiem KPI");
assert.match(panel, /sm:grid-cols-2 xl:grid-cols-4/, "KPI muszą przechodzić przez układ 1, 2 i 4 kolumn");
assert.equal(
  panel.split("/ {requiredPoints} pkt").length - 1,
  1,
  "Zapis X / Y pkt powinien pojawiać się dokładnie raz",
);

// 2. CTA odpowiadają stanowi danych i są prawdziwymi odnośnikami.
assert.match(panel, /href=\{missingPoints > 0 \? "\/baza-szkolen" : "\/portfolio"\}/, "Kafelek 0 brakujących punktów powinien prowadzić do raportu");
assert.match(panel, /missingPoints > 0 \? "Znajdź szkolenie" : "Sprawdź raport"/, "Tekst CTA musi odpowiadać stanowi celu");
assert.match(panel, /<Link href="\/aktywnosci" className=\{incompleteCardClass\}>/, "Uzupełnianie wpisów musi być prawdziwym linkiem");
assert.match(panel, /Do uzupełnienia: \{incompletePoints\} pkt/, "Opis nie może sugerować odrzucania punktów z raportu");
assert.doesNotMatch(panel, /Blokują \{incompletePoints\} pkt/, "Panel nie może twierdzić, że niekompletne punkty są blokowane");

// 3. Trzy poziomy wiarygodności pozostają jawne w zwartej stopce.
assert.match(panel, /aria-label="Poziomy statusu wyniku"/, "Grupa trzech poziomów musi pozostać dostępna");
assert.match(panel, /1\. Punkty zadeklarowane[\s\S]{0,100}ewidencja użytkownika/, "Pierwszy poziom musi wyjaśniać źródło punktów");
assert.match(panel, /2\. Według reguł CRPE/, "Drugi poziom musi pozostać widoczny");
assert.match(panel, /3\. Status formalny/, "Trzeci poziom musi pozostać widoczny");

// 4. Oś używa daty aktywności, a nie daty wprowadzenia, i bezpiecznie rozsuwa znaczniki.
assert.doesNotMatch(panel, /a\.created_at\s*\n?\s*\? String\(a\.created_at\)/, "created_at nie może wyznaczać pozycji na osi");
assert.match(panel, /a\.planned_start_date \?\? `\$\{a\.year\}-07-01`/, "Dokładna data ma pierwszeństwo, a sam rok trafia na środek roku");
assert.match(panel, /function spaceTimelineMarkers/, "Rozsuwanie znaczników powinno mieć jedną testowalną definicję");
assert.match(panel, /spaced\[spaced\.length - 1\]\.left = maxLeft/, "Algorytm musi korygować kolizje przy prawej krawędzi");
assert.doesNotMatch(panel, /Math\.min\(97, prev\.left \+ MIN_GAP\)/, "Znaczniki nie mogą sklejać się na 97%");
assert.match(panel, /const timelineYearTicks = useMemo/, "Etykiety lat muszą być pozycjonowane na tej samej osi co zdarzenia");
assert.match(panel, /Wpisy bez dokładnej daty[\s\S]{0,100}w połowie wskazanego roku/, "Panel powinien objaśniać przybliżoną pozycję wpisów rocznych");

assert.equal(
  packageJson.scripts?.["check:v6.18"],
  "node scripts/check-v6-18-compact-status-timeline.mjs",
  "package.json musi udostępniać test v6.18",
);

console.log("v6.18 compact CPD status and timeline checks passed");
