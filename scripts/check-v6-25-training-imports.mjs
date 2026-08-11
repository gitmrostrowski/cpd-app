import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { trainingImportPayloadHash, trainingImportSchema } from "../lib/integrations/trainingImport.ts";
import { PayloadTooLargeError, readJsonWithLimit } from "../lib/http/readJsonWithLimit.ts";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [migration, endpoint, workflow, adapter, admin, dataLayer] = await Promise.all([
  read("supabase/migrations/20260811_crpe_v6_25_1_training_imports.sql"),
  read("app/api/integrations/[source]/trainings/route.ts"),
  read(".github/workflows/import-nil-trainings.yml"),
  read("integrations/training-importer/src/sources/nil.ts"),
  read("app/admin/szkolenia/page.tsx"),
  read("lib/data/crpe.ts"),
]);

assert.match(migration, /trainings_import_identity_unique/);
assert.match(migration, /pg_advisory_xact_lock/);
assert.match(migration, /training_importer_accounts/);
assert.match(migration, /training_import_changes/);
assert.match(migration, /review_training_import_change/);
assert.doesNotMatch(migration, /set title = p_payload ->> 'title',\s*organizer_name/s);
assert.match(endpoint, /auth\.getUser\(accessToken\)/);
assert.match(endpoint, /trainingImportSchema\.safeParse/);
assert.match(endpoint, /readJsonWithLimit\(request, MAX_BODY_BYTES\)/);
assert.match(workflow, /NIL_IMPORT_ENABLED == 'true'/);
assert.match(workflow, /cancel-in-progress: false/);
assert.match(workflow, /permissions:\s+contents: read/s);
assert.match(adapter, /"33": \["dentist"\]/);
assert.match(adapter, /"34": \["doctor"\]/);
assert.doesNotMatch(adapter, /\?\? "online"/);
assert.match(adapter, /if \(format === "online"\) return null/);
assert.match(adapter, /to_be_determined/);
assert.match(admin, /import: \{r\.import_source\}/);
assert.match(admin, /Porównaj NIL/);
assert.match(admin, /review_training_import_change/);
assert.match(dataLayer, /source_external_id/);

const payload = trainingImportSchema.parse({
  source_external_id: "1744",
  source_url: "https://nil.org.pl/szkolenie/1744-test",
  source_fetched_at: "2026-08-11T20:00:00.000Z",
  title: "Testowe szkolenie NIL",
  organizer: "Naczelna Izba Lekarska",
  points: 2,
  delivery_format: "online",
  category: "szkolenie",
  schedule_status: "scheduled",
  start_date: "2026-08-28",
  end_date: "2026-08-28",
  start_time: "18:00",
  end_time: "20:00",
  time_zone: "Europe/Warsaw",
  speakers: [],
  voivodeship: null,
  external_url: "https://nil.org.pl/szkolenie/1744-test",
  topics: [],
  price_pln: 0,
  has_recording: null,
  capacity: null,
  enrollment_status: null,
  description: null,
  source_warnings: [],
  audience_scope: "specific",
  profession_codes: ["dentist"],
});

const laterFetch = { ...payload, source_fetched_at: "2026-08-12T20:00:00.000Z" };
assert.equal(
  trainingImportPayloadHash(payload),
  trainingImportPayloadHash(laterFetch),
  "Czas kolejnego pobrania nie może udawać zmiany szkolenia.",
);

const oversizedRequest = new Request("https://www.crpe.pl/api/test", {
  method: "POST",
  body: new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`{"value":"${"x".repeat(140)}"}`));
      controller.close();
    },
  }),
  duplex: "half",
});
await assert.rejects(
  () => readJsonWithLimit(oversizedRequest, 128),
  PayloadTooLargeError,
  "Limit musi działać również bez nagłówka content-length.",
);

const laterWarning = { ...payload, source_warnings: ["Nowe ostrzeżenie techniczne"] };
assert.equal(
  trainingImportPayloadHash(payload),
  trainingImportPayloadHash(laterWarning),
  "Ostrzeżenie parsera nie może udawać zmiany treści szkolenia.",
);

console.log("v6.25.1 training imports: OK");
