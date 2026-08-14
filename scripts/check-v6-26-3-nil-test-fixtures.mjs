import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const testFile = await readFile(
  new URL("integrations/training-importer/test/nil.test.ts", root),
  "utf8",
);
const sourceFile = await readFile(
  new URL("integrations/training-importer/src/sources/nil.ts", root),
  "utf8",
);
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

// Regresja v6.26.3: testy statusu zapisów mają używać realistycznej strony
// szczegółowej, aby nie wpadały w produkcyjne zabezpieczenie pustego HTML.
assert.match(testFile, /function nilDetailHtml\(message: string\)/);
assert.match(testFile, /nilDetailHtml\("REKRUTACJA ZAKOŃCZONA"\)/);
assert.match(testFile, /nilDetailHtml\("BRAK MIEJSC"\)/);
assert.match(
  testFile,
  /nilDetailHtml\("Informacje organizacyjne bez komunikatu określającego aktualny stan rekrutacji\."\)/,
);
assert.doesNotMatch(
  testFile,
  /<html><body><p>REKRUTACJA ZAKOŃCZONA<\/p><\/body><\/html>/,
);
assert.doesNotMatch(
  testFile,
  /<html><body><p>BRAK MIEJSC<\/p><\/body><\/html>/,
);

// Nie osłabiamy zabezpieczenia kodu produkcyjnego.
assert.match(
  sourceFile,
  /if \(pageText\.length < 100\) throw new Error\("strona szczegółowa NIL jest pusta"\)/,
);

assert.equal(
  pkg.scripts?.["check:v6.26.3"],
  "node scripts/check-v6-26-3-nil-test-fixtures.mjs",
);

console.log("v6.26.3 NIL test fixture checks passed");
