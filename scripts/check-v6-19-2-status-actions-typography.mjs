import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/kalkulator/CalculatorClient.tsx", root), "utf8");
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

// Prawa kolumna ma zawsze trzy odnośniki, również gdy nie ma braków albo cel jest osiągnięty.
assert.match(panel, /title: `Uzupełnij \$\{incompleteCount\}/, "Pierwszy krok musi prowadzić do uzupełniania wpisów");
assert.match(panel, /title: "Dodaj aktywność"/, "Stan bez braków nadal potrzebuje pierwszego odnośnika");
assert.match(panel, /\? "Ustaw cel punktowy"[\s\S]{0,120}\? "Dobierz inną aktywność"[\s\S]{0,80}: "Zaplanuj szkolenie"/, "Drugi krok musi odpowiadać stanowi celu");
assert.match(panel, /title: "Sprawdź raport"/, "Trzeci krok musi prowadzić do raportu");
assert.match(panel, /description: `Podsumowanie okresu \$\{periodStart\}–\$\{periodEnd\}`/, "Raport powinien wskazywać właściwy okres");
assert.match(panel, /return steps;/, "Lista nie może ucinać kroków zależnie od stanu");

// Trzy rzędy dzielą wysokość kolumny. Stary `li.h-full` rozciągał każdy rząd
// do wysokości całego panelu, przez co widoczny był tylko pierwszy żółty krok.
assert.match(panel, /<ol className="grid grid-rows-3 divide-y/, "Odnośniki muszą tworzyć trzy równe rzędy");
assert.doesNotMatch(panel, /<li key=\{step\.title\} className="h-full">/, "Pojedynczy krok nie może mieć wysokości całej listy");
assert.match(panel, /min-h-\[72px\]/, "Każdy odnośnik musi zachować wygodny obszar kliknięcia");

// Hierarchia typografii pod wykresem i w odnośnikach nie może wrócić do 11 px.
assert.match(panel, /pl-9 text-\[12px\] font-medium leading-5/, "Legenda wykresu musi pozostać czytelna");
assert.match(panel, /px-2 text-\[12px\] leading-\[18px\]/, "Objaśnienie wykresu musi mieć czytelną interlinię");
assert.match(panel, /text-base font-bold leading-5/, "Tytuły trzech działań wymagają właściwej hierarchii");
assert.match(panel, /text-sm leading-5/, "Opisy działań nie mogą być drobnym tekstem pomocniczym");
assert.doesNotMatch(panel, /1\. Punkty zadeklarowane|2\. Według reguł CRPE|3\. Status formalny/, "Stopka nie może wrócić do zbyt długich etykiet");
assert.match(panel, />Reguły CRPE:<\//, "Skrócona stopka nadal musi pokazywać wynik CRPE");
assert.match(panel, /px-5 py-3 text-\[12px\] leading-\[18px\]/, "Stopka statusu musi pozostać proporcjonalna do wykresu");

assert.equal(
  packageJson.scripts?.["check:v6.19.2"],
  "node scripts/check-v6-19-2-status-actions-typography.mjs",
);

console.log("v6.19.2 three status actions and typography checks passed");
