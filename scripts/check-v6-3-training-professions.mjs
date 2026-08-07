import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const migration = read(
  "supabase/migrations/20260807_crpe_v6_3_training_professions_and_points.sql",
);
const data = read("lib/data/crpe.ts");
const directory = read("app/baza-szkolen/TrainingHubClient.tsx");
const submission = read("app/api/trainings/submissions/route.ts");
const admin = read("app/admin/szkolenia/page.tsx");

const checks = [
  [
    "Model zapisuje relację szkolenie-zawód i punktację dla zawodu",
    migration.includes("create table if not exists public.training_profession_rules") &&
      migration.includes("primary key (training_id, profession_id)") &&
      migration.includes("points numeric") &&
      migration.includes("verification_status"),
  ],
  [
    "Migracja zastępuje konfliktujący trigger v5.2 zabezpieczeniem v6.3",
    migration.includes("drop trigger if exists trainings_enforce_classification_v5_2") &&
      migration.includes("enforce_training_approval_classification_v6_3") &&
      migration.includes("training_target_professions") &&
      migration.includes("training_profession_credits"),
  ],
  [
    "Brak adresatów ma jawny stan unknown zamiast dla wszystkich",
    migration.includes("audience_scope text not null default 'unknown'") &&
      directory.includes('row.audience_scope === "unknown"') &&
      directory.includes("Adresaci do weryfikacji"),
  ],
  [
    "Publiczny filtr używa kodów zawodów i reguł relacyjnych",
    directory.includes("value: option.code") &&
      directory.includes("rule.profession_code === activeFilters.professionFilter") &&
      data.includes("training_profession_rules(") &&
      data.includes("training_profession_rules_profession_id_fkey"),
  ],
  [
    "Nowe zgłoszenie waliduje zawody również po stronie serwera",
    submission.includes("profession_codes") &&
      submission.includes("invalid_professions") &&
      submission.includes('.from("training_profession_rules")') &&
      submission.includes('verification_status: "organizer_declared"'),
  ],
  [
    "Administrator nie może oznaczyć punktów jako zweryfikowane bez źródła i daty",
    admin.includes("Zweryfikowane punkty wymagają źródła i daty sprawdzenia") &&
      migration.includes("trainings_verified_points_complete") &&
      migration.includes("training_profession_rules_verified_complete"),
  ],
  [
    "Panel zapisuje relacje przed zatwierdzeniem szkolenia",
    admin.indexOf('sb.rpc(\n      "replace_training_profession_rules"') <
      admin.indexOf('.from("trainings")\n      .update(trainingData)') &&
      admin.includes("...trainingData"),
  ],
  [
    "Historyczne dane nie są automatycznie przypisywane do wszystkich zawodów",
    migration.includes("Rekordy bez danych o adresatach pozostaja swiadomie niezweryfikowane") &&
      migration.includes("audience_scope text not null default 'unknown'") &&
      migration.includes(
        "points_verification_status text not null default 'unverified'",
      ) &&
      !migration.includes("set audience_scope = 'unknown',") &&
      !migration.includes("set audience_scope = 'all_medical'"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
