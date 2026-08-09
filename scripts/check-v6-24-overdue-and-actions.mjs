import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { formatOverdue, isOverduePlanned, overdueEntries } from "../lib/cpd/overdue.ts";
import { buildAccrualSeries } from "../lib/cpd/accrual.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const today = new Date(2026, 7, 9);

// --- Wykrywanie zaległych terminów ---
const rows = [
  { id: "p1", type: "Kurs stacjonarny", organizer: "NIL", points: 6, status: "planned", planned_start_date: "2026-02-24" },
  { id: "p2", type: "Kurs online", organizer: null, points: 5, status: "planned", planned_start_date: "2026-05-26" },
  { id: "p3", type: "Webinar", organizer: null, points: 16, status: "planned", planned_start_date: "2026-09-27" },
  { id: "d1", type: "Kurs", organizer: null, points: 9, status: "done", planned_start_date: "2026-01-10" },
  { id: "p4", type: "Bez daty", organizer: null, points: 4, status: "planned", planned_start_date: null },
];

const overdue = overdueEntries({ activities: rows, today });
assert.deepEqual(overdue.map((e) => e.id), ["p1", "p2"], "Zaległe to wyłącznie plan z przeszłości");
assert.equal(overdue[0].daysOverdue, 166, "Najstarszy zaległy idzie pierwszy");
assert.equal(overdue[0].detail, "NIL · 6 pkt");

assert.equal(
  overdueEntries({ activities: rows, today: new Date(2026, 1, 25) }).length,
  0,
  "Dzień po terminie mieści się jeszcze w zapasie",
);
assert.equal(
  isOverduePlanned({ status: "planned", planned_start_date: "2026-02-24" }, new Date(2026, 1, 25)),
  false,
  "Panel i lista respektują ten sam dzień zapasu",
);
assert.equal(
  isOverduePlanned({ status: "planned", planned_start_date: "2026-02-24" }, new Date(2026, 1, 26)),
  true,
  "Po dniu zapasu wpis jest zaległy wszędzie",
);
assert.equal(
  isOverduePlanned({ status: "planned", planned_start_date: "2026-02-30" }, today),
  false,
  "Nieistniejąca data nie może utworzyć zaległości",
);

// --- Odmiana ---
assert.equal(formatOverdue(1), "od 1 dnia", "Dopełniacz liczby pojedynczej brzmi „dnia”");
assert.equal(formatOverdue(2), "od 2 dni");
assert.equal(formatOverdue(59), "od 59 dni");
assert.equal(formatOverdue(60), "od 2 mies.");
assert.equal(formatOverdue(548), "od ponad roku");
assert.equal(formatOverdue(800), "od ponad 2 lat");

// --- Prognoza pomija zaległości ---
const done = [
  { id: "1", year: 2025, points: 10, status: "done" },
  { id: "2", year: 2025, points: 10, status: "done" },
  { id: "3", year: 2026, points: 18, status: "done" },
];
const series = buildAccrualSeries({
  activities: [...done, ...rows.filter((r) => r.status === "planned")],
  doneActivities: done,
  periodStart: 2025,
  periodEnd: 2029,
  periodTimeProgress: 32,
  requiredPoints: 200,
  overdueActivityIds: new Set(overdue.map((entry) => entry.id)),
});
assert.equal(series.doneTotal, 38);
assert.equal(
  series.plannedTotal - series.doneTotal,
  16,
  "Prognoza liczy tylko przyszły termin (16 pkt), a nie zaległe 6 i 5 pkt",
);

// --- Panel: zaległości mają gdzie się pokazać ---
const panel = await read("app/panel-cpd/CalculatorClient.tsx");
assert.match(panel, /from "@\/lib\/cpd\/overdue"/, "Panel musi korzystać z modułu zaległości");
assert.match(panel, /Rozstrzygnij \$\{overdueCount\}/, "Zaległy termin musi wyprzedzać pozostałe kroki");
assert.match(panel, /ctaHref: "\/aktywnosci\?filtr=zalegle"/, "Krok musi prowadzić do przefiltrowanej listy");
assert.match(panel, /incompleteCount > 0 \? incompleteStep : planningStep/, "Braki nie mogą znikać po wykryciu zaległości");
assert.match(panel, /\.\.\.overdue\.map/, "Oś nie może dublować zaległych pozycji z agendy");
assert.match(panel, /formatOverdue\(entry\.daysOverdue\)/, "Zaległe wpisy muszą być widoczne w sekcji terminów");

// --- Kolumna akcji: jedna główna, bez numeracji, z ikonami ---
assert.doesNotMatch(panel, /grid grid-rows-3 divide-y/, "Wiersze nie mogą rozciągać się do wysokości wykresu");
assert.match(panel, /const isPrimary = index === 0/, "Pierwsza akcja musi się wyróżniać");
assert.match(panel, /<ChevronRight/, "Strzałka tekstowa ustępuje ikonie");
assert.doesNotMatch(panel, /aria-hidden="true">\s*\n?\s*→\s*\n?\s*<\/span>/, "Znak → nie jest ikoną");
assert.match(panel, /Pobierz zestawienie/, "Trzeci krok musi nazywać realną akcję");
assert.match(panel, /reportEntries > 0/, "Trzeci krok musi podawać dane, nie samą etykietę okresu");

// --- Limity: dwie jednostki dają się odróżnić ---
assert.match(panel, /const isPerItem = r\.mode === "per_item"/, "Tryb limitu steruje formatem liczby");
assert.match(panel, /\$\{Math\.round\(r\.remaining\)\}\/\$\{Math\.round\(r\.cap\)\}/, "Limit okresowy pokazujemy jako ułamek");
assert.match(panel, /"pkt na wpis"/, "Limit na wpis musi nazywać swoją jednostkę");

// --- Oś aktywności nie dubluje agendy ---
assert.match(panel, /const agendaIds = new Set/, "Oś musi odfiltrować pozycje z agendy");

// --- Lista aktywności: osobna zakładka i wejście z adresu ---
const list = await read("app/aktywnosci/page.tsx");
assert.match(list, /type ActivityTab = "overdue"/, "Zaległe potrzebują własnego kubełka");
assert.match(list, /from "@\/lib\/cpd\/overdue"/, "Lista musi używać wspólnej reguły zaległości");
assert.match(list, /key: "overdue"/, "Zakładka musi istnieć w interfejsie");
assert.match(list, /requested === "zalegle"/, "Panel musi móc otworzyć listę na właściwej zakładce");
assert.match(list, /get\("new"\) === "1"/, "Skrót dodawania musi przewijać do formularza");
assert.match(list, /xl:grid-cols-5/, "Pięć zakładek nie może łamać się jak siatka czterokolumnowa");

const packageJson = JSON.parse(await read("package.json"));
assert.equal(
  packageJson.scripts?.["check:v6.24"],
  "node --experimental-strip-types scripts/check-v6-24-overdue-and-actions.mjs",
  "package.json musi udostępniać test v6.24",
);

console.log("v6.24 overdue entries, action column and limit units checks passed");
