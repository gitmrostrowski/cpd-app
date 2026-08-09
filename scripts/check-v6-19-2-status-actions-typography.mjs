import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/panel-cpd/CalculatorClient.tsx", root), "utf8");
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

// Prawa kolumna ma zawsze trzy odnośniki, również gdy nie ma braków albo cel jest osiągnięty.
assert.match(panel, /title: `Uzupełnij \$\{incompleteCount\}/, "Pierwszy krok musi prowadzić do uzupełniania wpisów");
assert.match(panel, /title: "Dodaj aktywność"/, "Stan bez braków nadal potrzebuje pierwszego odnośnika");
assert.match(panel, /\? "Ustaw cel punktowy"[\s\S]{0,120}\? "Dobierz inną aktywność"[\s\S]{0,80}: "Zaplanuj szkolenie"/, "Drugi krok musi odpowiadać stanowi celu");
// v6.24: „Sprawdź raport” nie nazywało żadnej czynności i nie niosło danych.
assert.match(panel, /title: "Pobierz zestawienie"/, "Trzeci krok musi nazywać realną akcję");
assert.match(panel, /ctaHref: "\/raporty\/uzytkownik"/, "Trzeci krok nadal prowadzi do raportu");
// v6.24: przy pustym okresie nadal wskazujemy zakres, ale gdy są pozycje,
// opis podaje ich liczbę i dostępne formaty — etykieta okresu nic nie wnosiła.
assert.match(panel, /`Podsumowanie okresu \$\{periodStart\}–\$\{periodEnd\}`/, "Pusty okres nadal wskazuje zakres");
assert.match(panel, /pozycja", "pozycje", "pozycji"/, "Niepusty raport podaje liczbę pozycji");
assert.match(panel, /return steps;/, "Lista nie może ucinać kroków zależnie od stanu");

// v6.24: trzy równe rzędy rozciągały się do wysokości wykresu (~83 px na dwie
// linijki tekstu) i wyglądały jak wypełniacz. Teraz kolumna jest wyśrodkowana,
// a hierarchię niesie wyróżniona pierwsza akcja, nie równy podział wysokości.
assert.doesNotMatch(panel, /grid grid-rows-3 divide-y/, "Rzędy nie mogą rozciągać się do wysokości wykresu");
assert.match(panel, /flex flex-col justify-center gap-2/, "Kolumna akcji układa się pionowo i centruje");
assert.match(panel, /py-3\b/, "Akcja główna zachowuje wygodny obszar kliknięcia");
assert.match(panel, /py-2\.5/, "Odnośniki drugorzędne są zwarte, ale nadal klikalne");

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
