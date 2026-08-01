import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");

const migration = read(
  "supabase/migrations/20260731_crpe_v5_2_training_audience_and_credits.sql",
);
const hub = read("app/baza-szkolen/TrainingHubClient.tsx");
const admin = read("app/admin/szkolenia/page.tsx");
const data = read("lib/data/crpe.ts");
const types = read("types/supabase.ts");

const checks = [
  [
    "Baza rozdziela adresatów i punktację",
    migration.includes("training_target_professions") &&
      migration.includes("training_profession_credits") &&
      migration.includes("audience_scope") &&
      migration.includes("credit_status"),
  ],
  [
    "Puste dane historyczne pozostają niezweryfikowane",
    migration.includes("niejednoznaczne wartości pozostają unknown") &&
      migration.includes("audience_scope = 'unknown'"),
  ],
  [
    "Mapowanie historyczne nie opiera się na fragmencie słowa ogóln",
    !migration.includes("like '%ogóln%'") &&
      migration.includes("'wszystkie zawody medyczne'") &&
      migration.includes("'ogólne / dla wszystkich'"),
  ],
  [
    "Zgłoszenie jest transakcyjne i ma limit wysyłki",
    migration.includes("submit_training_v5_2") &&
      migration.includes("limit 10 zgłoszeń na godzinę"),
  ],
  [
    "Baza blokuje akceptację niepełnej klasyfikacji",
    migration.includes("enforce_training_approval_classification_v5_2") &&
      migration.includes("Przed akceptacją ustal adresatów szkolenia") &&
      migration.includes("Przed akceptacją ustal status punktów"),
  ],
  [
    "Formularz wymaga świadomego wyboru adresatów",
    hub.includes("Adresaci szkolenia *") &&
      hub.includes("Wszystkie zawody medyczne") &&
      hub.includes("Wybrane zawody"),
  ],
  [
    "Formularz rozdziela trzy stany punktacji",
    hub.includes("Brak informacji") &&
      hub.includes("Bez punktów") &&
      hub.includes("Przyznaje punkty") &&
      hub.includes("p_credits: credits"),
  ],
  [
    "Filtr używa identyfikatorów zawodów i zawiera szkolenia ogólne",
    hub.includes('row.audience_scope === "all"') &&
      hub.includes("profession.profession_id === selectedProfessionId") &&
      hub.includes("Dla mojego zawodu"),
  ],
  [
    "Karty pokazują etykiety adresatów i punktację zawodową",
    hub.includes("audienceLabels(t)") &&
      hub.includes("creditLabel(t, userProfessionId)"),
  ],
  [
    "Operator edytuje adresatów i punktację",
    admin.includes("admin_set_training_classification_v5_2") &&
      admin.includes("Adresaci szkolenia") &&
      admin.includes("Punktacja według zawodu"),
  ],
  [
    "Adapter pobiera obie relacje",
    data.includes("training_target_professions(profession_id") &&
      data.includes("training_profession_credits(id,profession_id"),
  ],
  [
    "Typy Supabase obejmują nowe tabele i RPC",
    types.includes("training_target_professions: LooseTable") &&
      types.includes("submit_training_v5_2") &&
      types.includes("admin_set_training_classification_v5_2"),
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

console.log(`\nCRPE v5.2: ${checks.length}/${checks.length} kontroli OK.`);
