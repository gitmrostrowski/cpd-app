import { readFile } from "node:fs/promises";

const [nilSource, nilTests, migration, readme, packageJson] = await Promise.all([
  readFile("integrations/training-importer/src/sources/nil.ts", "utf8"),
  readFile("integrations/training-importer/test/nil.test.ts", "utf8"),
  readFile("supabase/migrations/20260818_crpe_v6_27_11_nil_descriptions.sql", "utf8"),
  readFile("integrations/training-importer/README.md", "utf8"),
  readFile("package.json", "utf8"),
]);

const checks = [
  [nilSource.includes("function extractDescriptionSection"), "parser ma extractor zwięzłego opisu"],
  [nilSource.includes("const conciseDescription = extractDescriptionSection"), "RSS używa sekcji opisu jako bezpiecznego fallbacku"],
  [nilSource.includes("const detailDescription = extractDescriptionSection(pageText)"), "strona szczegółowa NIL uzupełnia opis"],
  [nilSource.includes("description: detailDescription ?? payload.description"), "brak opisu na stronie nie kasuje wartości payloadu"],
  [nilTests.includes("zwięzły opis sekcji Cel szkolenia jest importowany"), "jest test regresji opisu"],
  [migration.includes("v_source_snapshot := v_source_snapshot - 'description'"), "SQL pomija description=null przy istniejącym opisie"],
  [migration.includes("array_remove(change.changed_fields, 'description')"), "SQL czyści description=null z mieszanych oczekujących zmian"],
  [migration.includes("change.changed_fields = array['description']::text[]"), "SQL zamyka oczekujące zmiany składające się wyłącznie z fałszywego braku opisu"],
  [readme.includes("Zwięzły opis wydzielony"), "README opisuje nową politykę opisu"],
  [packageJson.includes('"check:v6.27.11"'), "package.json ma check:v6.27.11"],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? "OK" : "FAIL"} — ${label}`);
if (failed.length) process.exit(1);
