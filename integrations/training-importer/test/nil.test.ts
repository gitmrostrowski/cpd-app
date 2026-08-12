import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  enrichNilTraining,
  parseNilFeed,
  toWarsawDate,
} from "../src/sources/nil.js";

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
  assert.deepEqual(doctorTraining.profession_codes, ["doctor", "dentist"]);
  assert.equal(doctorTraining.delivery_format, "in_person");
  assert.equal(doctorTraining.start_time, "09:00");
  assert.equal(doctorTraining.end_time, "15:00");
  assert.deepEqual(doctorTraining.speakers, ["Natalia Zwierzchowska"]);
  assert.equal(
    doctorTraining.voivodeship,
    "Centrum Szkoleniowo-Konferencyjne Naczelnej Izby Lekarskiej, ul. Sobieskiego 110, Warszawa",
  );
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
  assert.equal(dentistTraining.end_time, "20:00");
  assert.deepEqual(dentistTraining.speakers, ["dr n. med. Agnieszka Pacyk"]);

  const woundTraining = result.payloads.find(
    (item) => item.source_external_id === "1806",
  );
  assert.ok(woundTraining);
  assert.deepEqual(woundTraining.profession_codes, ["doctor", "dentist"]);
  assert.equal(woundTraining.start_time, "18:00");
  assert.equal(woundTraining.end_time, "20:00");
  assert.deepEqual(woundTraining.speakers, ["dr n. med. Magdalena Antoszewska"]);

  const painTraining = result.payloads.find(
    (item) => item.source_external_id === "1763",
  );
  assert.ok(painTraining);
  assert.deepEqual(painTraining.speakers, ["dr hab. n. med. Renata Zajączkowska, prof. UR"]);

  const magnesiumTraining = result.payloads.find(
    (item) => item.source_external_id === "1767",
  );
  assert.ok(magnesiumTraining);
  assert.deepEqual(magnesiumTraining.speakers, ["dr n. med. Dagmara PokornaKałwak"]);
});

test("strona szczegółowa uzupełnia tytuł, adresatów i status zapisów", async () => {
  const xml = await readFile(fixturePath, "utf8");
  const parsed = parseNilFeed(xml, {
    fetchedAt: "2026-08-11T21:25:03.000Z",
    asOfDate: "2026-08-11",
  });
  const source = parsed.payloads.find((item) => item.source_external_id === "1806");
  assert.ok(source);

  const html = `<!doctype html><html><body>
    <h2>Najnowsze szkolenia</h2>
    <ul>
      <li>Punkty: 2</li>
      <li>szkolenie Dla lekarzy i lekarzy dentystów</li>
      <li>e-learning</li>
      <li>Bezpłatny</li>
    </ul>
    <h3>Diagnostyka i leczenie ran przewlekłych, w tym ran atypowych</h3>
    <h5>Wykładowca:</h5>
    <ul><li><h5>dr n. med. Magdalena Antoszewska - Lekarka w trakcie specjalizacji.</h5></li></ul>
    <h6>Prowadzący: dr n. med. Magdalena Antoszewska</h6>
    <h6>Szkolenie on-line</h6>
    <h6>godz. 18:00-20:00</h6>
    <p>ZAPIS OTWARTY</p>
  </body></html>`;
  const enriched = enrichNilTraining(source, html);

  assert.equal(
    enriched.title,
    "Diagnostyka i leczenie ran przewlekłych, w tym ran atypowych",
  );
  assert.deepEqual(enriched.profession_codes, ["doctor", "dentist"]);
  assert.equal(enriched.enrollment_status, "open");
  assert.equal(enriched.delivery_format, "online");
  assert.equal(enriched.end_time, "20:00");
  assert.deepEqual(enriched.speakers, ["dr n. med. Magdalena Antoszewska"]);
  assert.doesNotMatch(enriched.source_warnings.join(" "), /prowadzących/i);
});

test("strona szczegółowa rozdziela wielu prowadzących i pobiera lokalizację", async () => {
  const xml = await readFile(fixturePath, "utf8");
  const parsed = parseNilFeed(xml, {
    fetchedAt: "2026-08-11T21:25:03.000Z",
    asOfDate: "2026-08-11",
  });
  const source = parsed.payloads.find((item) => item.source_external_id === "1804");
  assert.ok(source);

  const html = `<!doctype html><html><body>
    <ul><li>Punkty: 6</li><li>szkolenie Dla lekarzy i lekarzy dentystów</li><li>stacjonarne</li></ul>
    <h3>SZKOLENIE STACJONARNE: Rola pracowników ochrony zdrowia w procedurze Niebieskie Karty – nawiązanie kontaktu i interwencja w sytuacjach przemocy</h3>
    <h5>Wykładowcy:</h5>
    <ul>
      <li><h5>Maja Kuźmicz – kierowniczka Niebieskiej Linii IPZ.</h5></li>
      <li><h5>Malwina Bobrzyk – adwokat przy warszawskiej Izbie Adwokackiej.</h5></li>
    </ul>
    <h6>Wykładowcy: Malwina Bobrzyk Maja Kuźmicz</h6>
    <h6>Miejsce wydarzenia: Centrum Szkoleniowo-Konferencyjne Naczelnej Izby Lekarskiej, ul. Sobieskiego 110, Warszawa</h6>
    <h6>godz. 09:00-15:00</h6>
    <p>ZAPIS OTWARTY - LISTA REZERWOWA</p>
  </body></html>`;
  const enriched = enrichNilTraining(source, html);

  assert.deepEqual(enriched.speakers, ["Maja Kuźmicz", "Malwina Bobrzyk"]);
  assert.equal(enriched.enrollment_status, "waiting_list");
  assert.equal(enriched.start_time, "09:00");
  assert.equal(enriched.end_time, "15:00");
  assert.equal(
    enriched.voivodeship,
    "Centrum Szkoleniowo-Konferencyjne Naczelnej Izby Lekarskiej, ul. Sobieskiego 110, Warszawa",
  );
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
