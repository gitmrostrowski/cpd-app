import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/panel-cpd/CalculatorClient.tsx", root), "utf8");
const header = await readFile(new URL("components/Header.tsx", root), "utf8");
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

// Główne menu desktopowe ma być czytelniejsze niż podmenu Panelu CPD.
assert.match(header, /inline-flex items-center gap-2 text-sm font-bold transition/);
assert.match(header, /h-10 items-center gap-2 rounded-xl border px-3 text-\[13px\] font-extrabold/);
assert.match(header, /block text-\[13px\] font-extrabold text-slate-800/);
assert.match(header, /truncate text-\[11px\] font-semibold text-slate-500/);

// Główna liczba pozostaje mocna, ale nie dominuje całej karty.
assert.match(panel, /text-\[46px\][^\n]*sm:text-\[52px\]/);

// Wynik rozróżnia wszystkie ukończone punkty od wpisów kompletnych dokumentacyjnie.
assert.match(panel, /const completeEntries = useMemo/);
assert.match(panel, /const completePoints = useMemo/);
assert.match(panel, /Kompletne wpisy: \{completePoints\} pkt/);
assert.match(panel, /Do uzupełnienia: \{incompletePoints\} pkt/);
assert.match(panel, /Planowane wpisy nie zwiększają wyniku\./);
assert.match(panel, /completePoints=\{completePoints\}/);
assert.match(panel, /pkt z kompletnych wpisów/);

// Przełącznik Przebieg / Przegląd ma znajdować się w lewej kolumnie nad wykresem.
const chartGrid = panel.indexOf('lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]');
const viewSwitch = panel.indexOf('aria-label="Widok wykresu"');
const progressBarCall = panel.indexOf('<PointsProgressBar');
assert.ok(chartGrid >= 0, "Nie znaleziono siatki statusu");
assert.ok(viewSwitch > chartGrid, "Przełącznik widoku powinien być wewnątrz lewej kolumny statusu");
assert.ok(progressBarCall > viewSwitch, "Przełącznik powinien być nad wykresem/paskiem postępu");
assert.match(panel, /rounded-\[7px\] px-3 py-1\.5 text-\[12px\] font-bold transition/);

assert.equal(pkg.scripts?.["check:v6.26.2"], "node scripts/check-v6-26-2-panel-readability.mjs");
console.log("v6.26.2 panel readability checks passed");
