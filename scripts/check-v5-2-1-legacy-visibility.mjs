import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const hub = read("app/baza-szkolen/TrainingHubClient.tsx");
const migration = read(
  "supabase/migrations/20260801_crpe_v5_2_1_legacy_training_visibility.sql",
);

const checks = [
  [
    "Publiczna lista zachowuje wszystkie zatwierdzone szkolenia",
    hub.includes('.filter((row) => row.approval_status === "approved")') &&
      !hub.includes('row.audience_scope !== "unknown"'),
  ],
  [
    "Nieokreśleni adresaci mają ostrzeżenie",
    hub.includes("Adresaci nieokreśleni — sprawdź opis szkolenia"),
  ],
  [
    "Historyczne punkty są widoczne jako dane do weryfikacji",
    hub.includes("wartość historyczna, do weryfikacji") &&
      hub.includes('training.credit_status === "unknown"'),
  ],
  [
    "Filtr zawodu nie ukrywa rekordów historycznych",
    hub.includes('row.audience_scope === "unknown" ||'),
  ],
  [
    "Puste dane nie są przypisywane do wszystkich zawodów",
    migration.includes("Puste historyczne dane nie są oznaczone jako dla wszystkich") &&
      !migration.includes("set audience_scope = 'all'"),
  ],
  [
    "Jednoznaczny opis mapuje lekarza i dentystę",
    migration.includes("p.code in ('doctor', 'dentist')") &&
      migration.includes("szkolenie dla lekarzy i lekarzy dentystów"),
  ],
  [
    "Blokada nowych niepełnych zatwierdzeń pozostaje aktywna",
    migration.includes("trainings_enforce_classification_v5_2"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (!ok) failed += 1;
  console.log(`${ok ? "OK" : "BŁĄD"} — ${label}`);
}

if (failed) {
  console.error(`\nNieudane kontrole: ${failed}/${checks.length}`);
  process.exit(1);
}

console.log(`\nCRPE v5.2.1: ${checks.length}/${checks.length} kontroli OK.`);
