import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");

const checks = [];
function check(name, passed, details = "") {
  checks.push({ name, passed, details });
}

const migrationPath =
  "supabase/migrations/20260729_crpe_v4_professions_and_cpd_rules.sql";
const migration = read(migrationPath);
const dataLayer = read("lib/data/crpe.ts");
const professions = read("lib/cpd/professions.ts");
const calculator = read("app/kalkulator/CalculatorClient.tsx");

check(
  "Migracja tworzy trzy tabele reguł",
  [
    "public.cpd_rule_sets",
    "public.cpd_rule_sources",
    "public.cpd_rule_requirements",
  ].every((name) => migration.includes(name)),
);
check(
  "Migracja przypina wersję reguły do cyklu",
  migration.includes("add column if not exists rule_set_id") &&
    migration.includes("add column if not exists target_mode"),
);
check(
  "Migracja zachowuje wcześniejsze cykle jako custom",
  migration.includes("Wszystkie rekordy sprzed v4 pozostają świadomie celami własnymi"),
);
check(
  "Reguła lekarz/lekarz dentysta ma 200 pkt i 48 miesięcy",
  migration.includes("date '2022-03-01'") &&
    /\n\s*48,\n\s*200,/.test(migration),
);
check(
  "Zweryfikowana reguła ma oficjalne źródło ELI",
  migration.includes("https://eli.gov.pl/eli/DU/2022/464/ogl"),
);
check(
  "Kod nie zawiera starego słownika celów punktowych",
  ![dataLayer, professions, calculator].some((text) =>
    text.includes("DEFAULT_REQUIRED_POINTS_BY_PROFESSION"),
  ),
);
check(
  "Kod nie zawiera starej mapy reguł per zawód",
  ![dataLayer, professions, calculator].some((text) =>
    text.includes("RULES_BY_PROFESSION"),
  ),
);
check(
  "Zapis profilu rozwiązuje zawód z bazy",
  dataLayer.includes('.from("professions")') &&
    dataLayer.includes('.eq("name_pl", input.profession)') &&
    !dataLayer.includes("function professionCode("),
);
check(
  "Kalkulator pokazuje trzy poziomy wyniku",
  [
    'Reguła CRPE" : "Własny cel',
    "Reguły CRPE:",
    "Status formalny:",
  ].every((label) => calculator.includes(label)),
);
check(
  "SQL zwraca 10 testów kontrolnych",
  (migration.match(/\(\n\s*\d+,\n\s*'/g) ?? []).length >= 10,
);

for (const item of checks) {
  console.log(`${item.passed ? "OK" : "BŁĄD"} | ${item.name}${item.details ? ` | ${item.details}` : ""}`);
}

const failures = checks.filter((item) => !item.passed);
if (failures.length) {
  console.error(`\nNiepowodzenie: ${failures.length} z ${checks.length} testów.`);
  process.exit(1);
}

console.log(`\nCRPE v4: ${checks.length}/${checks.length} testów OK.`);
