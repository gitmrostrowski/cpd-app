import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/panel-cpd/CalculatorClient.tsx", root), "utf8");
const accrual = await readFile(new URL("lib/cpd/accrual.ts", root), "utf8");

// Trwałe zasady v6.18: brak duplikatów, prawdziwe CTA i właściwa oś czasu.
assert.doesNotMatch(panel, /Podstawa obliczenia/, "Karta dublująca Ustawienia nie może wrócić");
assert.doesNotMatch(panel, /Priorytety teraz/, "Skróty dublujące kolejne kroki nie mogą wrócić");
const statusStart = panel.indexOf('<section id="status"');
const statusEnd = panel.indexOf("<section id=", statusStart + 10);
const statusSection = panel.slice(statusStart, statusEnd);
assert.equal(
  statusSection.split("z {requiredPoints} pkt").length - 1,
  1,
  "Cel punktowy powinien wystąpić raz przy głównej liczbie",
);
assert.match(panel, /href=\{step\.ctaHref\}/, "Kolejne działania muszą być prawdziwymi odnośnikami");
assert.doesNotMatch(panel, /a\.created_at\s*\n?\s*\? String\(a\.created_at\)/, "created_at nie może wyznaczać pozycji w czasie");
assert.match(accrual, /activity\.planned_start_date\?\.trim\(\) \|\| null/, "Dokładna data ukończonego wpisu ma pierwszeństwo");
assert.match(accrual, /fallbackDate = `\$\{Math\.round\(Number\(activity\.year\)\)\}-07-01`/, "Sam rok musi być przybliżony środkiem roku");
assert.match(panel, /overflow-x-auto/, "Wykres musi pozostać czytelny na wąskim ekranie");

console.log("v6.18 durable compact status and timeline checks passed");
