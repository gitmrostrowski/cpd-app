import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/kalkulator/CalculatorClient.tsx", root), "utf8");

// 1. Punkty kompletne vs zadeklarowane
assert.match(panel, /const incompleteEntries = useMemo/, "Panel musi mieć jedną definicję niekompletnego wpisu");
assert.match(panel, /getRowMissing\(a\)\.length > 0/, "Kompletność obejmuje wszystkie wymagane pola wpisu");
assert.match(panel, /const completePoints = useMemo/, "Panel musi liczyć punkty z kompletnych wpisów");
assert.match(panel, /const incompletePoints = Math\.max\(0, donePoints - completePoints\)/, "Reszta pochodzi z wpisów do uzupełnienia");
assert.match(panel, /completeValue=\{completeProgress\}/, "Pierścień musi pokazywać obie warstwy");
assert.match(panel, /z kompletnych wpisów/, "Podpis pod pierścieniem musi wyjaśniać pełny kolor");

// 2. Bez powtórzeń tych samych liczb
assert.match(panel, /aria-label="Poziomy statusu wyniku"/, "Trzy poziomy wyniku z fundamentu v4 muszą pozostać w zwartej formie");
assert.match(panel, /2\. Według reguł CRPE/, "Poziom według reguł CRPE musi pozostać widoczny");
assert.match(panel, /3\. Status formalny/, "Poziom statusu formalnego musi pozostać widoczny");
assert.doesNotMatch(panel, /mx-4 mt-4 grid gap-3 md:grid-cols-3/, "Trzy rozbudowane karty statusu powinien zastąpić zwarty pasek");
assert.doesNotMatch(panel, /To już liczy się do celu\./, "Kafelek dublujący pierścień punktów powinien zniknąć");
assert.doesNotMatch(panel, /Zaliczone: <strong/, "Nagłówek limitów nie może powtarzać sumy punktów");
assert.equal(
  panel.split("{Math.round(periodTimeProgress)}%").length - 1,
  1,
  "Procent upływu okresu powinien pojawiać się dokładnie raz poza pierścieniem",
);

// 3. Puste sekcje ukryte, jedna definicja braku, polska odmiana
assert.match(panel, /const hasLimits = limitsUsage\.length > 0/, "Sekcja limitów musi być warunkowa");
assert.match(panel, /\{hasLimits \? \(/, "Pusta sekcja limitów nie powinna się renderować");
assert.doesNotMatch(panel, /id: "powiadomienia", label: "Powiadomienia"/, "Powiadomienia to baner, nie zakładka");
assert.match(panel, /getRowMissing\(a\)\.length > 0/, "Licznik musi używać tej samej reguły co lista aktywności");
assert.doesNotMatch(panel, /missingEvidenceCount/, "Drugi, rozbieżny licznik powinien zniknąć");
assert.match(panel, /function pluralPl/, "Polska odmiana przez liczbę wymaga trzech form");
assert.doesNotMatch(panel, /\? "brak" : "braki"/, "Dwie formy dawały „5 braki”");
assert.doesNotMatch(panel, /nie trafi do raportu/, "Panel nie może obiecywać filtrowania, którego raport jeszcze nie wykonuje");
assert.match(panel, /href=\{missingPoints > 0 \? "\/baza-szkolen" : "\/portfolio"\}/, "Kafelek brakujących punktów nie może prowadzić do ukrytej sekcji");

// 4. Grupowanie znaczników na osi czasu
assert.match(panel, /function ClusterMarker/, "Skupiska aktywności potrzebują własnego znacznika");
assert.match(panel, /const buckets = new Map<string, typeof raw>\(\)/, "Znaczniki grupujemy w kubełki miesięczne");
assert.doesNotMatch(panel, /prev\.left \+ 1\.35/, "Rozsuwanie o 1.35% nie rozwiązywało nachodzenia");
assert.match(panel, /ev\.count > 1 \? \(/, "Pojedyncze zdarzenie zostaje trójkątem, kilka — kółkiem z liczbą");
assert.match(panel, /sum \+ ev\.points/, "Punkty w skupisku sumujemy z danych, nie z tekstu etykiety");

console.log("v6.17 CPD panel checks passed");
