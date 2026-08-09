import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const helperPath = path.join(root, "lib/cpd/maximumRequirements.ts");
const panelPath = path.join(root, "app/panel-cpd/CalculatorClient.tsx");
const dataPath = path.join(root, "lib/data/crpe.ts");
const activitiesPath = path.join(root, "app/aktywnosci/page.tsx");
const reportPath = path.join(
  root,
  "app/raporty/uzytkownik/RaportUserClient.tsx",
);
const migrationPath = path.join(
  root,
  "supabase/migrations/20260809_crpe_v6_23_doctor_activity_limits.sql",
);

const { applyMaximumRequirements } = await import(pathToFileURL(helperPath));

const requirements = [
  {
    id: "internal",
    activity_type_code: "internal_training",
    scope: "item",
    points: 6,
  },
  {
    id: "subscription",
    activity_type_code: "journal_subscription",
    scope: "period",
    points: 10,
  },
];

const applied = applyMaximumRequirements(
  [
    { id: "i1", activity_type_code: "internal_training", points: 10, year: 2026 },
    { id: "i2", activity_type_code: "internal_training", points: 4, year: 2026 },
    { id: "s2", activity_type_code: "journal_subscription", points: 7, year: 2026, activity_date: "2026-02-01" },
    { id: "s1", activity_type_code: "journal_subscription", points: 7, year: 2025, activity_date: "2025-02-01" },
    { id: "other", activity_type_code: "course", points: 12, year: 2026 },
  ],
  requirements,
);

const byId = new Map(applied.map((activity) => [activity.id, activity]));
assert.equal(byId.get("i1")?.applied_points, 6, "limit 6 pkt musi działać na pojedynczy wpis");
assert.equal(byId.get("i1")?.over_points, 4);
assert.equal(byId.get("i2")?.applied_points, 4, "kolejne szkolenie wewnętrzne ma osobny limit");
assert.equal(byId.get("s1")?.applied_points, 7);
assert.equal(byId.get("s2")?.applied_points, 3, "prenumerata ma łącznie 10 pkt w okresie");
assert.equal(byId.get("other")?.applied_points, 12, "typ bez limitu pozostaje bez zmian");

const panel = fs.readFileSync(panelPath, "utf8");
const data = fs.readFileSync(dataPath, "utf8");
const activities = fs.readFileSync(activitiesPath, "utf8");
const report = fs.readFileSync(reportPath, "utf8");
const migration = fs.readFileSync(migrationPath, "utf8");

for (const phrase of [
  "Oś aktywności",
  "Reguła zawodu · okres własny",
  "adjusted_points",
  "wpisano {counted.raw} pkt",
]) {
  assert.ok(
    phrase === "adjusted_points"
      ? panel.includes("applied_points")
      : panel.includes(phrase),
    `panel powinien zawierać: ${phrase}`,
  );
}

for (const code of [
  "internal_training",
  "journal_subscription",
  "scientific_society_membership",
  "medical_education_platform",
]) {
  assert.ok(data.includes(code), `adapter powinien mapować ${code}`);
  assert.ok(migration.includes(code), `migracja powinna zapisać ${code}`);
}

for (const label of [
  "Szkolenie wewnętrzne",
  "Prenumerata czasopisma",
  "Towarzystwo/Kolegium",
  "Platforma edukacyjna",
]) {
  assert.ok(activities.includes(label), `formularz powinien zawierać: ${label}`);
}

assert.match(migration, /'internal_training'[\s\S]*?'item'[\s\S]*?6::numeric/);
assert.match(migration, /'journal_subscription'[\s\S]*?'period'[\s\S]*?10::numeric/);
assert.match(migration, /'scientific_society_membership'[\s\S]*?'period'[\s\S]*?20::numeric/);
assert.match(migration, /'medical_education_platform'[\s\S]*?'period'[\s\S]*?10::numeric/);
assert.ok(report.includes("includedAfterLimits"), "raport powinien stosować te same limity");
assert.ok(report.includes("Suma po limitach"), "raport powinien jasno opisywać sumę");

console.log("OK v6.23 — limity zawodu, naliczanie punktów i oś aktywności");
