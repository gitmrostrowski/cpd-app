import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseNilFeed, toWarsawDate } from "../src/sources/nil.js";

const fixturePath = fileURLToPath(
  new URL("./fixtures/nil-rss-2026-08-11.xml", import.meta.url),
);

test("data NIL nie przesuwa się o dzień przez konwersję do UTC", () => {
  assert.equal(toWarsawDate("Thu, 13 Aug 2026 00:00:00 +0200"), "2026-08-13");
  assert.equal(toWarsawDate("Mon, 22 Dec 2025 00:00:00 +0100"), "2025-12-22");
});

test("fixture RSS NIL mapuje zawody, cenę i termin bez przesunięcia", async () => {
  const xml = await readFile(fixturePath, "utf8");
  const result = parseNilFeed(xml, {
    fetchedAt: "2026-08-11T21:25:03.000Z",
    asOfDate: "2026-08-11",
  });

  assert.equal(result.sourceItemCount, 9);
  assert.equal(result.payloads.length, 9);
  assert.equal(result.skipped.length, 0);

  const doctorTraining = result.payloads.find(
    (item) => item.source_external_id === "1798",
  );
  assert.ok(doctorTraining);
  assert.equal(doctorTraining.start_date, "2026-08-13");
  assert.deepEqual(doctorTraining.profession_codes, ["doctor"]);
  assert.equal(doctorTraining.delivery_format, "in_person");
  assert.equal(doctorTraining.price_pln, 0);
  assert.equal(doctorTraining.enrollment_status, null);
  assert.equal(doctorTraining.has_recording, null);
  assert.equal(doctorTraining.organizer, "Naczelna Izba Lekarska");
  assert.equal(doctorTraining.schedule_status, "scheduled");
  assert.equal(doctorTraining.description, null);

  const dentistTraining = result.payloads.find(
    (item) => item.source_external_id === "1744",
  );
  assert.ok(dentistTraining);
  assert.equal(dentistTraining.start_date, "2026-08-28");
  assert.deepEqual(dentistTraining.profession_codes, ["dentist"]);
  assert.equal(dentistTraining.delivery_format, "online");
  assert.equal(dentistTraining.voivodeship, null);
});

test("lista zapisów bez terminu nie jest odrzucana jako wydarzenie historyczne", async () => {
  const xml = await readFile(fixturePath, "utf8");
  const result = parseNilFeed(xml, {
    fetchedAt: "2026-08-11T21:25:03.000Z",
    asOfDate: "2026-08-11",
  });

  const undated = result.payloads.find((item) => item.source_external_id === "1300");
  assert.ok(undated);
  assert.equal(undated.schedule_status, "to_be_determined");
  assert.equal(undated.start_date, null);
  assert.equal(undated.end_date, null);
  assert.equal(undated.start_time, null);
  assert.match(undated.source_warnings.join(" "), /termin nie został jeszcze ustalony/i);
});

test("pełny opis jest opt-in, a nie domyślnym kopiowaniem treści NIL", async () => {
  const xml = await readFile(fixturePath, "utf8");
  const withoutDescriptions = parseNilFeed(xml, {
    fetchedAt: "2026-08-11T21:25:03.000Z",
    asOfDate: "2026-08-11",
  });
  const withDescriptions = parseNilFeed(xml, {
    fetchedAt: "2026-08-11T21:25:03.000Z",
    asOfDate: "2026-08-11",
    includeFullDescriptions: true,
  });

  assert.equal(withoutDescriptions.payloads[0]?.description, null);
  assert.ok((withDescriptions.payloads[0]?.description?.length ?? 0) > 100);
});

test("pusty RSS kończy import kontrolowanym błędem", () => {
  assert.throws(
    () => parseNilFeed("<rss><channel></channel></rss>"),
    /nie zawiera żadnych pozycji/,
  );
});
