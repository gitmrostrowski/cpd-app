import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const pagePath = path.join(root, "app/admin/szkolenia/page.tsx");
const page = fs.readFileSync(pagePath, "utf8");

const required = [
  'type ReviewQueue = "attention" | "changes" | "new" | "operational" | "all"',
  '{ value: "attention", label: "Do decyzji" }',
  'ZMIANA ISTNIEJĄCEGO WPISU',
  'NOWY WPIS',
  'Co zmieniło się w istniejącym wpisie',
  'Edytuj wszystkie dane',
  'Edytuj wpis ręcznie',
  'edit.format',
  'edit.category',
  'edit.voivodeship',
  'edit.enrollment_status',
  'edit.capacity',
  'edit.has_recording',
  'edit.is_partner',
  'edit.topics',
  'max-w-4xl',
];

for (const token of required) {
  if (!page.includes(token)) {
    throw new Error(`v6.26.4: brak wymaganego elementu: ${token}`);
  }
}

const forbidden = [
  'min-w-[1180px]',
  '<th className="px-4 py-3">Szkolenie</th>',
];
for (const token of forbidden) {
  if (page.includes(token)) {
    throw new Error(`v6.26.4: pozostał stary rozciągnięty widok tabeli: ${token}`);
  }
}

const alwaysEditCount = (page.match(/Edytuj wszystkie dane/g) ?? []).length;
if (alwaysEditCount !== 1) {
  throw new Error(`v6.26.4: oczekiwano jednego centralnego CTA edycji, znaleziono ${alwaysEditCount}`);
}

console.log("OK v6.26.4 — karty admina, rozdzielenie nowych wpisów i zmian oraz pełna edycja są obecne.");
