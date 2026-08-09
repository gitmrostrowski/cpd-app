import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/panel-cpd/CalculatorClient.tsx", root), "utf8");
const accrualSource = await readFile(new URL("lib/cpd/accrual.ts", root), "utf8");
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

const transpiledAccrual = ts.transpileModule(accrualSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const accrualModule = await import(
  `data:text/javascript;base64,${Buffer.from(transpiledAccrual).toString("base64")}`
);
const { buildAccrualSeries } = accrualModule;

// 1. Status i kolejne kroki tworzą jedną sekcję.
assert.match(panel, /<section id="status"/, "Sekcja statusu musi istnieć");
assert.doesNotMatch(panel, /<section id="kroki"/, "Osobna sekcja kroków nie może wrócić");
assert.doesNotMatch(panel, /id: "kroki"/, "Nawigacja nie może prowadzić do usuniętej sekcji");
assert.match(panel, /Twój status i kolejne kroki/, "Nagłówek musi zapowiadać obie części");
assert.match(panel, /nextSteps\.map\(\(step, index\) => \{/, "Kroki muszą pochodzić ze wspólnej listy");

// 2. Wykres jest widoczny od razu, dostępny i czytelny na wąskim ekranie.
assert.match(panel, /function PointsAccrualChart/, "Wykres narastania musi mieć własny komponent");
assert.match(panel, /buildAccrualSeries\(\{/, "Dane wykresu muszą powstawać poza JSX");
assert.doesNotMatch(panel, /showAccrual/, "Wykres nie może wrócić za przełącznik");
assert.match(
  panel,
  /hasPointTarget && accrualSeries \? \(\s*<>/,
  "Wykres musi renderować się domyślnie po ustawieniu celu",
);
assert.match(panel, /overflow-x-auto/, "Na wąskim ekranie wykres nie może ściskać etykiet");
assert.match(
  panel,
  /lg:grid-cols-\[minmax\(0,1\.25fr\)_minmax\(0,1fr\)\]/,
  "Wykres i lista zadań muszą stać obok siebie na szerokim ekranie",
);
assert.match(panel, /text-\[34px\] font-black/, "Suma punktów musi być główną liczbą sekcji");
assert.match(panel, /const areaPath = donePoints\.length/, "Krzywa musi mieć bezpiecznie zbudowane wypełnienie");
assert.match(panel, /opacity=\{0\.1\}/, "Wypełnienie pod krzywą powinno pozostać subtelne");
assert.match(panel, /strokeWidth=\{3\}/, "Krzywa zdobytych punktów musi pozostać czytelna");
// v6.20: siatka dostała linię pośrednią. Bez niej nie dało się odczytać, gdzie
// leży wynik ani punkt równego tempa — a to są dwie liczby, o które w tym wykresie chodzi.
assert.match(panel, /\{\[0, 0\.5, 1\]\.map/, "Siatka wykresu potrzebuje poziomu pośredniego");
assert.match(panel, /Ustaw cel punktowy, żeby zobaczyć/, "Brak celu wymaga czytelnego stanu pustego");
assert.doesNotMatch(panel, /Kreska pokazuje, gdzie byłbyś/, "Cienki pasek nie może dublować wykresu");

// 3. Uczciwość opisu i trzy poziomy wiarygodności.
assert.match(panel, /służy wyłącznie planowaniu/, "Równomierne tempo musi być opisane jako pomoc");
assert.match(panel, /nie zmienia zasad/, "Wykres nie może tworzyć nowego wymogu prawnego");
assert.doesNotMatch(panel, /izba rozlicza okres/, "Panel nie może przypisywać jednego organu wszystkim zawodom");
assert.doesNotMatch(panel, /Blokują \{incompletePoints\} pkt/, "Panel nie może twierdzić, że punkty są blokowane");
assert.match(panel, /aria-label="Poziomy statusu wyniku"/, "Trzy poziomy wiarygodności muszą pozostać dostępne");
assert.match(panel, /Reguła CRPE" : "Własny cel"/, "Podstawa zadeklarowanych punktów musi pozostać widoczna");
assert.match(panel, />Reguły CRPE:<\//, "Poziom obliczeń CRPE musi pozostać widoczny");
assert.match(panel, />Status formalny:<\//, "Status formalny musi pozostać widoczny");

// 4. Zachowanie serii na danych z analizy: 38 zdobytych, 59 z planami, cel dziś 64.
const sampleDone = [
  { year: 2025, points: 20, status: "done" },
  { year: 2026, points: 18, status: "done", planned_start_date: "2026-02-01" },
];
const sample = buildAccrualSeries({
  activities: [
    ...sampleDone,
    { year: 2026, points: 10, status: "planned", planned_start_date: "2026-05-10" },
    { year: 2026, points: 11, status: "planned", planned_start_date: "2026-09-10" },
  ],
  doneActivities: sampleDone,
  periodStart: 2025,
  periodEnd: 2029,
  periodTimeProgress: 32,
  requiredPoints: 200,
});
assert.ok(sample, "Seria z celem musi istnieć");
assert.equal(sample.doneTotal, 38, "Suma wykresu musi zgadzać się z nagłówkiem");
// v6.24: wpis z 10.05.2026 wypada przed znacznikiem „dziś” (32% okresu 2025–2029),
// więc jest zaległy i nie jest prognozą. Do 38 pkt dolicza się już tylko
// przyszły termin z 10.09.2026 — wcześniej krzywa „z planem” zawyżała wynik.
assert.equal(sample.plannedTotal, 49, "Planowana seria liczy wyłącznie przyszłe wpisy");
assert.equal(sample.targetToday, 64, "Punkt równomiernego tempa powinien wynosić 64 pkt");
assert.equal(sample.done.at(-1)?.value, 38, "Krzywa zdobytych musi kończyć się pełną sumą na dziś");

// 5. Regresje brzegowe: bieżący rok przed lipcem, dokładna data, brak celu i przekroczenie celu.
const earlyYear = buildAccrualSeries({
  activities: [{ year: 2026, points: 12, status: "done" }],
  doneActivities: [{ year: 2026, points: 12, status: "done" }],
  periodStart: 2025,
  periodEnd: 2029,
  periodTimeProgress: 21,
  requiredPoints: 200,
});
assert.equal(earlyYear?.doneTotal, 12, "Wpis ukończony przed połową roku nie może zniknąć z wykresu");
assert.equal(earlyYear?.done.at(-1)?.value, 12, "Końcowy punkt musi zgadzać się z sumą także przed lipcem");

const exactDate = buildAccrualSeries({
  activities: [{ year: 2026, points: 5, status: "done", planned_start_date: "2026-01-10" }],
  doneActivities: [{ year: 2026, points: 5, status: "done", planned_start_date: "2026-01-10" }],
  periodStart: 2025,
  periodEnd: 2029,
  periodTimeProgress: 40,
  requiredPoints: 200,
});
assert.equal(exactDate?.usesApproximateDoneDates, false, "Dokładna data nie może być zastąpiona połową roku");
assert.equal(
  buildAccrualSeries({ activities: [], doneActivities: [], periodStart: 2025, periodEnd: 2029, periodTimeProgress: 0, requiredPoints: 0 }),
  null,
  "Bez celu i danych seria wykresu nie powinna powstawać",
);
const exceeded = buildAccrualSeries({
  activities: [{ year: 2025, points: 240, status: "done" }],
  doneActivities: [{ year: 2025, points: 240, status: "done" }],
  periodStart: 2025,
  periodEnd: 2029,
  periodTimeProgress: 100,
  requiredPoints: 200,
});
assert.equal(exceeded?.max, 240, "Skala Y musi objąć wynik wyższy od celu");

// 6. Bez martwego kodu po starej osi czasu i bez osieroconych obliczeń.
for (const dead of [
  "TriangleMarker",
  "ClusterMarker",
  "TimeNowMarker",
  "PulsingTargetMarker",
  "LegendTriangle",
  "spaceTimelineMarkers",
  "timelineEvents",
  "CircularProgress",
  "completePoints",
]) {
  assert.doesNotMatch(panel, new RegExp(`\\b${dead}\\b`), `${dead} powinien zniknąć`);
}

assert.equal(packageJson.scripts?.["check:v6.17"], "node scripts/check-v6-17-cpd-panel.mjs");
assert.equal(packageJson.scripts?.["check:v6.18"], "node scripts/check-v6-18-compact-status-timeline.mjs");
assert.equal(packageJson.scripts?.["check:v6.19"], "node scripts/check-v6-19-status-steps-accrual.mjs");

console.log("v6.19 status, steps and accrual chart checks passed");
