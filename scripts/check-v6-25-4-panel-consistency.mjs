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

// Pasek: wyraźna skala i bezpieczna etykieta „dziś”.
assert.match(panel, /role="group"\s+aria-label=\{`Pasek postępu/);
assert.match(panel, /left: `clamp\(1rem, \$\{timePct\}%, calc\(100% - 1rem\)\)`/);
assert.match(panel, /relative h-(?:4|9) overflow-hidden rounded-(?:full|xl)/);
assert.match(panel, /<span>0 pkt<\/span>/);
assert.match(panel, /<span>\{series\.target\} pkt<\/span>/);

// Nagłówek i akcja główna korzystają ze spójnego akcentu marki.
assert.match(
  panel,
  /<IconBubble tone="blue">\s*<MiniIcon name="chart" \/>\s*<\/IconBubble>/,
);
assert.match(panel, /bg-crpe-brand[^"\n]*hover:bg-crpe-brand-hover/);
assert.match(panel, /\? "pilne"/);
assert.match(panel, /\? "gotowe"/);
assert.doesNotMatch(panel, /const primaryTone/);

// Limity: licznik i pasek rosną w tym samym kierunku.
assert.match(panel, /\$\{Math\.round\(r\.used\)\}\/\$\{Math\.round\(r\.cap\)\}/);
assert.doesNotMatch(
  panel,
  /\$\{Math\.round\(r\.remaining\)\}\/\$\{Math\.round\(r\.cap\)\}/,
);
assert.match(panel, /zostało \$\{Math\.round\(r\.remaining\)\} pkt/);
assert.match(panel, /maksymalnie na jeden wpis/);
assert.match(panel, />\s*Podsumowanie kategorii\s*</);
assert.match(panel, />Z wolnym miejscem<\/div>/);
assert.match(panel, />Wyczerpane<\/div>/);
assert.match(panel, /z \{limitsUsage\.length\}/);

assert.equal(
  packageJson.scripts?.["check:v6.25.4"],
  "node scripts/check-v6-25-4-panel-consistency.mjs",
  "package.json musi udostępniać test v6.25.4",
);

console.log("v6.25.4 panel consistency checks passed");
