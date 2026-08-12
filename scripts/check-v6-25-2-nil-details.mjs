import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [adapter, runner, workflow, importerPackage, importerReadme] = await Promise.all([
  read("integrations/training-importer/src/sources/nil.ts"),
  read("integrations/training-importer/src/run.ts"),
  read(".github/workflows/import-nil-trainings.yml"),
  read("integrations/training-importer/package.json"),
  read("integrations/training-importer/README.md"),
]);

assert.match(adapter, /"34": \["doctor", "dentist"\]/);
assert.match(adapter, /function extractTimeRange/);
assert.match(adapter, /export function enrichNilTraining/);
assert.match(adapter, /extractEnrollmentStatus/);
assert.match(adapter, /extractDetailAudience/);
assert.match(adapter, /extractDetailSpeakers/);
assert.match(adapter, /extractDetailLocation/);
assert.match(runner, /FALLBACK RSS/);
assert.match(runner, /NIL_IMPORT_DETAILS_ENABLED === "false"/);
assert.match(workflow, /CRPE-TrainingImporter\/1\.2/);
assert.match(workflow, /NIL_IMPORT_DETAILS_ENABLED/);
assert.equal(JSON.parse(importerPackage).version, "1.2.0");
assert.match(importerReadme, /stronę szczegółową każdego/);

console.log("v6.25.2 NIL detail enrichment: OK");
