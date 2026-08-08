import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/kalkulator/CalculatorClient.tsx", root), "utf8");

// Trwałe zasady v6.17: jedna definicja kompletności i uczciwy opis wyniku.
assert.match(panel, /const incompleteEntries = useMemo/, "Panel musi mieć jedną definicję niekompletnego wpisu");
assert.match(panel, /getRowMissing\(a\)\.length > 0/, "Kompletność musi obejmować wszystkie wymagane pola wpisu");
assert.match(panel, /aria-label="Poziomy statusu wyniku"/, "Trzy poziomy wiarygodności muszą pozostać dostępne");
assert.match(panel, /2\. Według reguł CRPE/, "Panel musi odróżniać obliczenia według reguł CRPE");
assert.match(panel, /3\. Status formalny/, "Panel musi pokazywać odrębny status formalny");
assert.doesNotMatch(panel, /nie trafi do raportu/, "Panel nie może obiecywać filtrowania, którego raport nie wykonuje");
assert.doesNotMatch(panel, /Blokują \{incompletePoints\} pkt/, "Panel nie może twierdzić, że niekompletne punkty są blokowane");
assert.match(panel, /const hasLimits = limitsUsage\.length > 0/, "Sekcja limitów musi być warunkowa");
assert.match(panel, /function pluralPl/, "Polska odmiana liczebników musi pozostać wspólna");

console.log("v6.17 durable CPD panel checks passed");
