import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const data = read("lib/data/crpe.ts");
const submission = read("app/api/trainings/submissions/route.ts");
const hub = read("app/baza-szkolen/TrainingHubClient.tsx");
const admin = read("app/admin/szkolenia/page.tsx");
const detail = read("app/baza-szkolen/[slug]/page.tsx");
const migration = read("supabase/migrations/20260808_crpe_v6_16_training_schedule_and_speakers.sql");

for (const field of ["start_time", "end_time", "time_zone", "speakers"]) {
  assert.match(data, new RegExp(field), `Warstwa danych musi obsługiwać ${field}`);
  assert.match(submission, new RegExp(field), `API zgłoszeń musi walidować ${field}`);
  assert.match(migration, new RegExp(`add column if not exists ${field}`), `Migracja musi dodawać ${field}`);
}

assert.match(hub, /type="time"/, "Formularz powinien przyjmować godziny");
assert.match(hub, /new-training-speakers/, "Formularz powinien przyjmować prowadzących");
assert.match(hub, /timeRangeShort\(t\.start_time, t\.end_time\)/, "Karta powinna pokazywać godziny");
assert.match(hub, /sm:grid-cols-\[64px_minmax\(0,1fr\)_216px\]/, "Szyna daty powinna mieścić zakres godzin");
assert.match(admin, /admin-training-start-time/, "Administrator powinien edytować godzinę rozpoczęcia");
assert.match(admin, /admin-training-speakers/, "Administrator powinien edytować prowadzących");
assert.match(detail, /"@type": "Person"/, "JSON-LD powinien zawierać prowadzących");
assert.match(detail, /schemaDateTime/, "JSON-LD powinien łączyć datę, godzinę i strefę");
assert.match(detail, />Prowadzący</, "Strona szkolenia powinna mieć sekcję prowadzących");
assert.match(migration, /grant select \(start_time, end_time, time_zone, speakers\)/, "Anon musi mieć ograniczony odczyt nowych publicznych pól");
assert.doesNotMatch(migration, /grant all/i, "Migracja nie może nadawać szerokich uprawnień");

console.log("CRPE v6.16 schedule and speakers checks passed.");
