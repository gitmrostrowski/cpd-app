import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const home = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const chart = fs.readFileSync(path.join(root, "app/panel-cpd/CalculatorClient.tsx"), "utf8");

if (css.includes("--color-crpe-organizator-text: #6D3967;")) {
  for (const token of ["--color-crpe-medyk-text: #00595D;", "--color-crpe-placowka-text: #1D4ED8;", "--color-crpe-organizator-text: #6D3967;"]) {
    if (!css.includes(token)) throw new Error(`v6.27.2+: brak kontrolowanego tokenu roli: ${token}`);
  }
  if (!home.includes('ctaStrong: "bg-crpe-brand"')) throw new Error("v6.27.2+: nowsza architektura musi zachować jeden CTA marki.");
  if (!chart.includes('linearGradient id="crpe-accrual-fill"')) throw new Error("v6.27.2+: regresja wykresów v6.27.");
  console.log("OK v6.27.2 — rodzina ról została zastąpiona kontrolowanymi tintami w architekturze brand-led, bez regresji wykresów.");
  process.exit(0);
}

const roleStart = home.indexOf("const roleThemes");
const roleEnd = home.indexOf("const pageWrap", roleStart);
if (roleStart < 0 || roleEnd < 0) throw new Error("v6.27.2: nie znaleziono definicji roleThemes.");
const roles = home.slice(roleStart, roleEnd);

const requiredRoleTokens = [
  'accentStrong: "bg-[#16656B]"',
  'accentSoft: "bg-[#E7F0F0]"',
  'accentText: "text-[#0E4448]"',
  'accentStrong: "bg-[#23528F]"',
  'accentSoft: "bg-[#E9EEF7]"',
  'accentText: "text-[#14355E]"',
  'accentStrong: "bg-[#4A5170]"',
  'accentSoft: "bg-[#EDEEF3]"',
  'accentText: "text-[#2E3247]"',
];
for (const token of requiredRoleTokens) {
  if (!roles.includes(token)) throw new Error(`v6.27.2: brak koloru z rekomendowanej rodziny pigmentów: ${token}`);
}

for (const oldToken of ['bg-cyan-700', 'bg-blue-700', 'bg-indigo-600', '#0E7490', '#4F46E5']) {
  if (roles.includes(oldToken)) throw new Error(`v6.27.2: w roleThemes pozostał stary kolor roli: ${oldToken}`);
}

const requiredBrandAndNeutral = [
  'w jednym miejscu.</span>',
  '#F7F8FA',
  '#E4E6EC',
  '#5C6270',
  '#171A21',
];
for (const token of requiredBrandAndNeutral) {
  if (!home.includes(token)) throw new Error(`v6.27.2: brak elementu spójnej palety marki: ${token}`);
}

const roleStrongUses = home.match(/\$\{theme\.accentStrong\}/g)?.length ?? 0;
if (roleStrongUses !== 3) {
  throw new Error(`v6.27.2: kolor 600 roli ma być ograniczony do aktywnego taba i kafelków ikon; znaleziono użyć: ${roleStrongUses}`);
}

if (!home.includes('`${theme.accentSoft} ${theme.accentText} ${theme.accentRing}`')) {
  throw new Error("v6.27.2: aktywna plakietka roli nie używa kontrolowanego zestawu 50/800.");
}

if (!css.includes('outline-color: #1D4ED8;') || !css.includes('var(--card-accent, #E4E6EC)')) {
  throw new Error("v6.27.2: CSS nie używa rekomendowanego brand focus / neutralnego akcentu kart.");
}

if (!chart.includes('linearGradient id="crpe-accrual-fill"') ||
    !chart.includes('stroke="#d97706"') ||
    !chart.includes('bg-emerald-500')) {
  throw new Error("v6.27.2: wykresy v6.27 muszą pozostać bez regresji.");
}

console.log("OK v6.27.2 — petrol/stal/grafit z jednego pigmentu i wspólne chłodne neutrale; późniejsze wersje mogą przypisać CTA do roli; wykresy bez zmian.");
