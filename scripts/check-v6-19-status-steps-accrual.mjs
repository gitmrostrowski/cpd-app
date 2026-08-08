import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";
import ts from "typescript";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/kalkulator/CalculatorClient.tsx", root), "utf8");
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

// 2. Wykres jest zwijany, dostępny i czytelny na wąskim ekranie.
assert.match(panel, /function PointsAccrualChart/, "Wykres narastania musi mieć własny komponent");
assert.match(panel, /buildAccrualSeries\(\{/, "Dane wykresu muszą powstawać poza JSX");
assert.match(panel, /aria-expanded=\{showAccrual\}/, "Przełącznik wykresu musi ogłaszać stan");
assert.match(panel, /aria-controls="wykres-narastania"/, "Przełącznik musi wskazywać sterowany obszar");
assert.match(panel, /overflow-x-auto/, "Na wąskim ekranie wykres nie może ściskać etykiet");
assert.match(panel, /role="progressbar"/, "Zwarty pasek postępu musi zachować semantykę dostępności");
assert.match(panel, /style=\{\{ width: `\$\{progress\}%` \}\}/, "Zero punktów nie może rysować sztucznego postępu");

// 3. Uczciwość opisu i trzy poziomy wiarygodności.
assert.match(panel, /służy wyłącznie planowaniu/, "Równomierne tempo musi być opisane jako pomoc");
assert.match(panel, /nie zmienia zasad/, "Wykres nie może tworzyć nowego wymogu prawnego");
assert.doesNotMatch(panel, /izba rozlicza okres/, "Panel nie może przypisywać jednego organu wszystkim zawodom");
assert.doesNotMatch(panel, /Blokują \{incompletePoints\} pkt/, "Panel nie może twierdzić, że punkty są blokowane");
assert.match(panel, /aria-label="Poziomy statusu wyniku"/, "Trzy poziomy wiarygodności muszą pozostać dostępne");
assert.match(panel, /1\. Punkty zadeklarowane/, "Pierwszy poziom musi pozostać widoczny");
assert.match(panel, /2\. Według reguł CRPE/, "Drugi poziom musi pozostać widoczny");
assert.match(panel, /3\. Status formalny/, "Trzeci poziom musi pozostać widoczny");

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
assert.equal(sample.plannedTotal, 59, "Planowana seria musi doliczać przyszłe wpisy raz");
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
  "Bez celu i danych przełącznik wykresu nie powinien się renderować",
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
  "incompletePoints",
]) {
  assert.doesNotMatch(panel, new RegExp(`\\b${dead}\\b`), `${dead} powinien zniknąć`);
}

assert.equal(packageJson.scripts?.["check:v6.17"], "node scripts/check-v6-17-cpd-panel.mjs");
assert.equal(packageJson.scripts?.["check:v6.18"], "node scripts/check-v6-18-compact-status-timeline.mjs");
assert.equal(packageJson.scripts?.["check:v6.19"], "node scripts/check-v6-19-status-steps-accrual.mjs");

console.log("v6.19 status, steps and accrual chart checks passed");
