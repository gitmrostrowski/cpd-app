import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

const [panel, header, appHeader, admin, nil, migration, supabaseTypes, packageJson] =
  await Promise.all([
    readFile(new URL("app/panel-cpd/CalculatorClient.tsx", root), "utf8"),
    readFile(new URL("components/Header.tsx", root), "utf8"),
    readFile(new URL("components/AppPageHeader.tsx", root), "utf8"),
    readFile(new URL("app/admin/szkolenia/page.tsx", root), "utf8"),
    readFile(
      new URL("integrations/training-importer/src/sources/nil.ts", root),
      "utf8",
    ),
    readFile(
      new URL(
        "supabase/migrations/20260813_crpe_v6_26_operational_import_fields.sql",
        root,
      ),
      "utf8",
    ),
    readFile(new URL("types/supabase.ts", root), "utf8"),
    readFile(new URL("package.json", root), "utf8").then(JSON.parse),
  ]);

// --- Ikony: kafel 44 px, ikona 28 px (62 %), grubsza kreska przy większej skali.
assert.match(panel, /h-11 w-11 shrink-0 items-center justify-center rounded-2xl border \[&_svg\]:h-7 \[&_svg\]:w-7 \[&_svg\]:stroke-\[1\.75\]/);
assert.match(appHeader, /\[&_svg\]:h-7 \[&_svg\]:w-7 \[&_svg\]:stroke-\[1\.75\]/);
assert.doesNotMatch(panel, /flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border/);

// --- Limity: niebieski niesie zaznaczenie, zielony niesie postęp.
assert.match(panel, /border-crpe-brand-border bg-white ring-1 ring-crpe-brand-border/);
assert.match(panel, /active \? "bg-crpe-brand" : "bg-transparent group-hover:bg-slate-300"/);
assert.match(panel, /rounded-\[1\.35rem\] border border-crpe-brand-border/);
assert.match(panel, /from-crpe-brand via-crpe-brand-border to-transparent/);
assert.doesNotMatch(panel, /border-emerald-300 bg-white shadow-/);
assert.doesNotMatch(panel, /from-emerald-500 via-emerald-300/);

// Oba paski postępu limitu (kafel kategorii i karta szczegółu) są zielone.
assert.match(panel, /status === "warning"[\s\S]*?"bg-crpe-warning-border"[\s\S]*?"bg-crpe-success"/);
assert.match(panel, /SegmentedCapacityBar/);
assert.doesNotMatch(panel, /\? "bg-amber-400"\s*\n\s*: "bg-blue-600"/);

// --- Nawigacja: bez „Moje CRPE” w pasku, przełącznik placówki o stałej szerokości.
assert.doesNotMatch(header, /<UserRound className="h-3\.5 w-3\.5" \/>\s*\n\s*Moje CRPE/);
assert.match(header, /Placówka · \{organizationCount\}/);
assert.match(header, /organizationCount === 1/);
assert.doesNotMatch(header, /min-h-8 max-w-56 items-center/);
assert.match(header, /Wróć do widoku osobistego/);
assert.doesNotMatch(
  header,
  /<UserRound className="h-4 w-4" \/> Moje CRPE/,
  "mobilne menu nie powinno dublować pozycji Panel CPD",
);

// --- Admin: wagi zmian, kolejki, filtry dat, kolumna zapisów.
assert.match(admin, /const OPERATIONAL_IMPORT_FIELDS: readonly string\[\] = \[\s*\n\s*"enrollment_status",\s*\n\s*"capacity",\s*\n\];/);
assert.match(admin, /function importFieldWeight\(field: string\): ImportFieldWeight/);
assert.match(admin, /function isOperationalChange\(change: ImportChange\)/);
assert.match(admin, /const QUEUE_TABS: \{ value: ReviewQueue; label: string \}\[\]/);
assert.match(admin, /queueCounts\[tab\.value\]/);
assert.match(admin, /async function applyOperationalChange\(change: ImportChange\)/);
assert.match(admin, /review_training_operational_import_change/);
assert.doesNotMatch(
  admin,
  /review_training_import_change", \{\s*\n\s*p_change_id: change\.id,\s*\n\s*p_decision: "apply"/,
);
assert.match(admin, /Zmiana operacyjna nie potwierdziła zachowania statusu publikacji/);
assert.match(admin, /Przyjmij zapisy/);
assert.match(admin, /border-blue-200 bg-blue-50[^"]*text-blue-700/);
assert.match(admin, /const cleared: TrainingLoadFilters = \{/);
assert.match(admin, /if \(status === "all"\) void load\(cleared\);/);
assert.doesNotMatch(admin, /setTimeout\(load, 50\)/);
assert.match(admin, /Zaznacz tylko operacyjne/);
assert.match(admin, /aria-label="Termin szkolenia od"/);
assert.match(admin, /aria-label="Data dodania od"/);
assert.match(admin, /const \[eventFrom, setEventFrom\] = useState\(""\)/);
assert.match(admin, /(?:<th className="px-4 py-3">Zapisy<\/th>|>Zapisy<\/div>)/);
assert.match(admin, /enrollmentBadgeCls\(r\.enrollment_status\)/);
assert.match(admin, /shortImportValue\(sourceChange\.current\[field\]\)/);
assert.doesNotMatch(admin, /NIL zgłosił zmianę \(\{sourceChange/);
assert.doesNotMatch(admin, />\s*Porównaj NIL\s*</);
assert.doesNotMatch(admin, /colSpan=\{8\}/);

// --- Scraper: lista rezerwowa ma pierwszeństwo, brak rozpoznania daje ostrzeżenie.
assert.match(nil, /if \(\/LISTA\\s\+REZERWOWA\/i\.test\(pageText\)\) return "waiting_list";/);
assert.match(nil, /REKRUTACJA\\s\+ZAKOŃCZONA/);
assert.match(nil, /BRAK\\s\+\(\?:WOLNYCH\\s\+\)\?MIEJSC/);
assert.match(nil, /Nie rozpoznano stanu zapisów na stronie NIL/);
assert.match(nil, /enrollment_status: detailEnrollment \?\? payload\.enrollment_status/);

// --- Migracja: pola operacyjne nie cofają publikacji, null nie kasuje danych.
assert.match(migration, /v_operational_fields constant text\[\] := array\['enrollment_status', 'capacity'\];/);
assert.match(migration, /approval_status = case when v_operational_only then approval_status else 'pending' end/);
assert.match(migration, /v_source_snapshot := v_source_snapshot - 'enrollment_status';/);
assert.match(migration, /v_source_snapshot := v_source_snapshot - 'capacity';/);
assert.match(migration, /v_remaining_fields text\[\]/);
assert.match(migration, /changed_fields = v_remaining_fields/);
assert.match(
  migration,
  /when cardinality\(v_remaining_fields\) = 0 then v_change\.payload_hash/,
);
assert.match(
  migration,
  /create or replace function public\.review_training_operational_import_change/,
);
assert.match(
  migration,
  /raise exception 'Zmiana nie jest czysto operacyjna\.'/,
);
assert.match(
  migration,
  /grant execute on function public\.import_training_from_source\(text, jsonb, text, boolean\) to authenticated;/,
);
assert.match(
  migration,
  /grant execute on function public\.review_training_operational_import_change\(uuid\) to authenticated;/,
);
assert.match(
  supabaseTypes,
  /review_training_operational_import_change:\s*\{\s*Args:\s*\{\s*p_change_id: string;/,
);

assert.equal(
  packageJson.scripts?.["check:v6.26"],
  "node scripts/check-v6-26-import-review-and-panel-color.mjs",
  "package.json musi udostępniać test v6.26",
);

console.log("v6.26 import review and panel color checks passed");
