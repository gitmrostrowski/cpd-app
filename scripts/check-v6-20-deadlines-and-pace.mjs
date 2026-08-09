import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  formatCountdown,
  requiredPace,
  resolvePeriodDeadline,
  upcomingEntries,
} from "../lib/cpd/deadlines.ts";

const root = new URL("../", import.meta.url);
const panel = await readFile(new URL("app/kalkulator/CalculatorClient.tsx", root), "utf8");
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

const today = new Date(2026, 7, 9);

// --- Koniec okresu liczony od PWZ, nie od końca roku kalendarzowego ---
const withPwz = resolvePeriodDeadline({
  periodEnd: 2029,
  pwzIssueDate: "2025-11-06",
  ruleMonths: 48,
  today,
});
assert.equal(withPwz?.date, "2029-11-05", "48 miesięcy od 06.11.2025 kończy się 05.11.2029");
assert.equal(withPwz?.daysAway, 1184, "Odległość do końca okresu liczona w pełnych dniach");
assert.equal(withPwz?.source, "pwz_rule", "Dokładny termin musi wskazywać źródło w regule PWZ");

const withoutPwz = resolvePeriodDeadline({
  periodEnd: 2029,
  pwzIssueDate: null,
  ruleMonths: null,
  today,
});
assert.equal(withoutPwz?.date, "2029-12-31", "Bez daty PWZ wracamy do końca roku kalendarzowego");
assert.equal(withoutPwz?.source, "period_year");

const monthEnd = resolvePeriodDeadline({
  periodEnd: 2026,
  pwzIssueDate: "2024-02-29",
  ruleMonths: 12,
  today,
});
assert.equal(monthEnd?.date, "2025-02-27", "Dodawanie miesięcy musi zachować koniec krótszego miesiąca");

const invalidPwz = resolvePeriodDeadline({
  periodEnd: 2029,
  pwzIssueDate: "2025-02-30",
  ruleMonths: 48,
  today,
});
assert.equal(invalidPwz?.date, "2029-12-31", "Nieprawidłowa data PWZ nie może zostać znormalizowana po cichu");
assert.equal(invalidPwz?.source, "period_year");

const beforeDst = new Date(2026, 2, 28, 23, 30);
assert.equal(
  upcomingEntries({
    today: beforeDst,
    activities: [
      { id: "dst", type: "Kurs", organizer: null, points: 2, status: "planned", planned_start_date: "2026-03-30" },
    ],
  })[0]?.daysAway,
  2,
  "Zmiana czasu nie może skracać ani wydłużać odliczania kalendarzowego",
);

// --- Wymagane tempo ---
const pace = requiredPace({ missingPoints: 162, deadline: withPwz });
assert.equal(pace?.pointsPerYear, 50, "162 pkt przez 3,24 roku to 50 pkt rocznie");
assert.equal(pace?.achieved, false);

assert.equal(
  requiredPace({ missingPoints: 0, deadline: withPwz })?.achieved,
  true,
  "Osiągnięty cel nie generuje wymaganego tempa",
);
assert.equal(
  requiredPace({
    missingPoints: 40,
    deadline: { date: "2026-08-20", daysAway: 11, yearsLeft: 11 / 365.25 },
  }),
  null,
  "Poniżej dwóch miesięcy roczne tempo przestaje cokolwiek znaczyć",
);
assert.equal(
  requiredPace({
    missingPoints: 40,
    deadline: { date: "2026-08-01", daysAway: -8, yearsLeft: 0 },
  }),
  null,
  "Po terminie nie liczymy tempa",
);

// --- Odliczanie w polskiej odmianie ---
assert.equal(formatCountdown(0), "dziś");
assert.equal(formatCountdown(-1), "po terminie");
assert.equal(formatCountdown(1), "jutro");
assert.equal(formatCountdown(18), "za 18 dni");
assert.equal(formatCountdown(60), "za 2 mies.");
assert.equal(formatCountdown(547), "za 1 rok 6 mies.");
assert.equal(formatCountdown(1184), "za 3 lata 3 mies.");
assert.equal(formatCountdown(1826), "za 5 lat");
assert.equal(formatCountdown(1816), "za 5 lat", "12 miesięcy reszty musi przejść w kolejny rok");
assert.equal(formatCountdown(1810), "za 4 lata 11 mies.", "Reszta poniżej 12 miesięcy zostaje na miejscu");
assert.equal(formatCountdown(730), "za 2 lata");
assert.equal(formatCountdown(365), "za 12 mies.");

// --- Agenda: tylko przyszłe, posortowane, z limitem ---
const entries = upcomingEntries({
  today,
  activities: [
    { id: "a", type: "Kurs online / webinar", organizer: "NIL", points: 16, status: "planned", planned_start_date: "2026-09-27" },
    { id: "b", type: "Konferencja", organizer: "OIL", points: 12, status: "planned", planned_start_date: "2026-11-14" },
    { id: "c", type: "Stary termin", organizer: null, points: 5, status: "planned", planned_start_date: "2026-05-26" },
    { id: "d", type: "Ukończony", organizer: null, points: 9, status: "done", planned_start_date: "2026-09-01" },
    { id: "e", type: "Bez daty", organizer: null, points: 3, status: "planned", planned_start_date: null },
  ],
});
assert.deepEqual(entries.map((e) => e.id), ["a", "b"], "Minione, ukończone i bezterminowe wypadają z agendy");
assert.equal(entries[0].detail, "NIL · 16 pkt", "Wiersz łączy organizatora z punktami");
assert.equal(entries[0].daysAway, 49);

assert.equal(
  upcomingEntries({ today, activities: [], }).length,
  0,
  "Brak zaplanowanych aktywności daje pustą agendę",
);

// --- Panel korzysta z modułu i nie wraca do martwego banera ---
assert.match(panel, /from "@\/lib\/cpd\/deadlines"/, "Panel musi korzystać z modułu terminów");
assert.match(panel, /<section id="terminy"/, "Sekcja terminów musi istnieć");
assert.doesNotMatch(panel, /Bądź na bieżąco i nie przegap/, "Statyczny baner bez danych powinien zniknąć");
assert.match(panel, /Koniec okresu rozliczeniowego/, "Agenda musi zawierać wiersz z końcem okresu");
assert.match(panel, /pkt rocznie/, "Panel musi podawać wymagane tempo");
assert.match(panel, /Uzupełnij datę wydania PWZ/, "Brak daty PWZ wymaga wyjaśnienia przybliżenia");
assert.match(panel, /const canUseRuleDeadline =/, "Dokładny termin z PWZ wymaga trybu reguły i zweryfikowanej reguły");
assert.match(panel, /periodDeadline\?\.source === "period_year"/, "Wyjaśnienie przybliżenia musi korzystać ze źródła terminu");

// --- Odstęp od tempa w jednej jednostce ---
assert.match(panel, /const paceGapPoints/, "Odstęp od tempa liczymy w punktach");
assert.doesNotMatch(panel, /pp\. poniżej tempa/, "Punkty procentowe dublowały „−N pkt” z wykresu");
assert.doesNotMatch(panel, /pp\. zapasu/, "Zapas też podajemy w punktach");

// --- Czytelność wykresu ---
assert.match(panel, /\{\[0, 0\.5, 1\]\.map\(\(ratio\)/, "Oś Y potrzebuje linii pośredniej");
assert.match(panel, /paintOrder="stroke"/, "Etykieta odstępu potrzebuje otoczki, żeby nie zlewać się z krzywą");
assert.match(panel, /const gapTextY =/, "Etykieta odstępu siada w połowie kreski, nie na znaczniku");

assert.equal(
  packageJson.scripts?.["check:v6.20"],
  "node --experimental-strip-types scripts/check-v6-20-deadlines-and-pace.mjs",
  "package.json musi udostępniać test v6.20",
);

console.log("v6.20 deadlines, pace and chart legibility checks passed");
