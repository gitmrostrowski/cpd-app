import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { buildCsv, escapeCsvField, safeFileName } from "../lib/export/csv.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

// --- Ucieczka pól ---
assert.equal(escapeCsvField("zwykły tekst"), "zwykły tekst");
assert.equal(escapeCsvField('Kurs "Niebieskie Karty"'), '"Kurs ""Niebieskie Karty"""');
assert.equal(escapeCsvField("a;b"), '"a;b"', "Średnik musi wymusić cudzysłowy — to nasz separator");
assert.equal(escapeCsvField("wiersz\nz nową linią"), '"wiersz\nz nową linią"');
assert.equal(escapeCsvField(null), "");
assert.equal(escapeCsvField(undefined), "");
assert.equal(escapeCsvField(0), "0", "Zero to wartość, nie brak");
assert.equal(escapeCsvField("=1+1"), "'=1+1", "Tekst nie może uruchamiać formuły arkusza");
assert.equal(escapeCsvField("-2+3"), "'-2+3", "Tekst zaczynający się minusem także może być formułą");
assert.equal(escapeCsvField(-2), "-2", "Prawdziwe liczby pozostają liczbami");

// --- Budowa pliku ---
const csv = buildCsv(["Data", "Punkty"], [["11.08.2026", 4], ["", 0]]);
assert.ok(csv.startsWith("sep=;\r\n"), "Polski Excel bez deklaracji separatora wrzuca wiersz do jednej komórki");
assert.ok(csv.includes("Data;Punkty\r\n"), "Separatorem jest średnik");
assert.ok(csv.endsWith("\r\n"), "Plik kończy się pełnym wierszem");

// --- Nazwy plików ---
assert.equal(safeFileName("CRPE raport 2025-01-01 2029-12-31", "csv"), "crpe-raport-2025-01-01-2029-12-31.csv");
assert.equal(safeFileName("Wpływ szkoleń", "csv"), "wplyw-szkolen.csv", "„ł” nie rozkłada się przez NFD i wymaga podmiany");
assert.equal(safeFileName("   ", "csv"), "raport.csv", "Pusta nazwa musi mieć sensowny domyślnik");

// --- Ekran raportu: żadnych zaślepek developerskich ---
const report = await read("app/raporty/uzytkownik/RaportUserClient.tsx");
assert.doesNotMatch(report, /Kolejny krok: \/api\/reports/, "Notatka ze ścieżką API nie jest komunikatem dla użytkownika");
assert.doesNotMatch(report, /alert\(/, "Eksport nie może kończyć się oknem alert()");
assert.match(report, /function onDownloadCsv\(\)/, "Eksport CSV musi istnieć");
assert.match(report, /window\.print\(\)/, "PDF powstaje przez okno wydruku przeglądarki");
assert.match(report, /disabled=\{included\.length === 0\}/, "Pusty raport nie może dawać pustego pliku");
assert.match(report, /downloadCsv\(/, "Ekran musi korzystać ze wspólnego helpera");

// --- Wydruk jest dokumentem, nie zrzutem interfejsu ---
const css = await read("app/globals.css");
assert.match(css, /@media print/, "Brak arkusza wydruku");
assert.match(css, /\[data-print="hide"\][\s\S]*display: none/, "Sterowanie musi znikać z wydruku");
assert.match(css, /thead\s*\{\s*display: table-header-group/, "Nagłówek tabeli musi się powtarzać na kolejnych stronach");
assert.match(css, /page-break-inside: avoid/, "Wiersz nie może się łamać między stronami");

for (const file of ["components/Header.tsx", "components/Footer.tsx"]) {
  assert.match(await read(file), /data-crpe-chrome="true"/, `${file} musi być oznaczony jako element interfejsu`);
}
assert.match(report, /data-print="hide"/, "Filtry i przyciski nie należą do dokumentu");
assert.match(report, /data-print="table"/, "Tabela musi mieć osobne reguły wydruku A4");
assert.match(report, /crpe-print-only/, "Wydruk musi zawierać zawód, okres i cel");
assert.match(css, /min-width: 0 !important/, "Tabela 980 px nie może zostać ucięta na kartce A4");

for (const file of ["app/page.tsx", "app/narzedzia/page.tsx", "app/pomoc/page.tsx", "app/raporty/RaportsClient.tsx"]) {
  const source = await read(file);
  assert.doesNotMatch(source, /Eksport PDF i ZIP|Pobierz ZIP|PDF i ZIP|Zestaw dokumentów/, `${file} nie może obiecywać nieistniejącego archiwum ZIP`);
}

const packageJson = JSON.parse(await read("package.json"));
assert.equal(
  packageJson.scripts?.["check:v6.22"],
  "node --experimental-strip-types scripts/check-v6-22-report-export.mjs",
  "package.json musi udostępniać test v6.22",
);

console.log("v6.22 report export and print checks passed");
