import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(
  new URL("app/panel-cpd/CalculatorClient.tsx", root),
  "utf8",
);
const packageJson = JSON.parse(
  await readFile(new URL("package.json", root), "utf8"),
);

// Widoki statusu: przebieg pozostaje domyślny, a preferencja jest lokalna.
assert.match(panel, /const STATUS_VIEW_STORAGE_KEY = "crpe\.panel\.statusView"/);
assert.match(panel, /useState<"curve" \| "bar">\("curve"\)/);
assert.match(panel, /localStorage\.getItem\(STATUS_VIEW_STORAGE_KEY\)/);
assert.match(panel, /localStorage\.setItem\(STATUS_VIEW_STORAGE_KEY, view\)/);
assert.match(panel, /\{ id: "curve", label: "Przebieg" \}/);
assert.match(panel, /\{ id: "bar", label: "Przegląd" \}/);
assert.match(panel, /aria-pressed=\{active\}/, "Przełączniki muszą zgłaszać aktywny stan");

// Pasek nie może ukrywać treści kart przed czytnikiem ekranu.
assert.match(panel, /function PointsProgressBar/);
assert.match(
  panel,
  /role="group"\s+aria-label=\{`Pasek postępu/,
  "Pasek powinien być grupą z opisem, a nie obrazem spłaszczającym potomków",
);
assert.doesNotMatch(panel, /role="img"\s+aria-label=\{`Pasek postępu/);
for (const label of ["Zebrane", "Luka do tempa", "Zapas nad tempem", "Pozostaje"]) {
  assert.ok(panel.includes(label), `Widok przeglądu powinien zawierać: ${label}`);
}

// Limity: lista wyboru po lewej i szczegół aktywnej kategorii po prawej.
assert.match(
  panel,
  /lg:grid-cols-\[minmax\(250px,300px\)_minmax\(0,1fr\)\]/,
  "Na szerokim ekranie lista i szczegół powinny tworzyć dwie kolumny",
);
assert.match(panel, />\s*Kategorie\s*</);
assert.match(panel, /selectedLimit\?\.key === r\.key/);
assert.match(panel, /setSelectedLimitKey\(r\.key\)/);
assert.match(panel, />\s*Wybrana kategoria\s*</);
assert.match(panel, /usableLimitsCount/);
assert.match(panel, /blockedLimitsCount/);
assert.match(panel, /Najlepszy ruch/);

assert.equal(
  packageJson.scripts?.["check:v6.25.3"],
  "node scripts/check-v6-25-3-panel-views-and-limits.mjs",
  "package.json musi udostępniać test v6.25.3",
);

console.log("v6.25.3 panel views and limits checks passed");
