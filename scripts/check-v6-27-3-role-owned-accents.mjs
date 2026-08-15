import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const home = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const chart = fs.readFileSync(path.join(root, "app/panel-cpd/CalculatorClient.tsx"), "utf8");

const requireToken = (token, label = token) => {
  if (!home.includes(token)) throw new Error(`v6.27.3: brak ${label}`);
};

const roleStart = home.indexOf("const roleThemes");
const roleEnd = home.indexOf("const pageWrap", roleStart);
if (roleStart < 0 || roleEnd < 0) throw new Error("v6.27.3: nie znaleziono roleThemes.");
const roles = home.slice(roleStart, roleEnd);

for (const token of [
  'accentStrong: "bg-[#16656B]"',
  'accentSoft: "bg-[#E7F0F0]"',
  'accentText: "text-[#0E4448]"',
  'ctaStrong: "bg-[#16656B]"',
  'accentStrong: "bg-[#23528F]"',
  'accentSoft: "bg-[#E9EEF7]"',
  'accentText: "text-[#14355E]"',
  'ctaStrong: "bg-[#23528F]"',
  'accentStrong: "bg-[#4A5170]"',
  'accentSoft: "bg-[#EDEEF3]"',
  'accentText: "text-[#2E3247]"',
  'ctaStrong: "bg-[#2E3247]"',
]) {
  if (!roles.includes(token)) throw new Error(`v6.27.3: brak koloru/CTA rodziny roli: ${token}`);
}

requireToken('className="block text-[#14355E]">w jednym miejscu.</span>', "stałego atramentowego H1 #14355E");
if (home.includes('className="block text-[#1D4ED8]">w jednym miejscu.</span>')) {
  throw new Error("v6.27.3: H1 nadal używa pełnej chromy marki #1D4ED8.");
}

requireToken('${roleThemes[selected].ctaStrong}', "CTA hero w kolorze roli");
requireToken('${roleThemes[selected].ctaHover}', "hover CTA hero w kolorze roli");
requireToken('${roleThemes[selected].ctaShadow}', "cień CTA hero dopasowany do roli");

for (const token of [
  'bg-[#F3F8F8] p-4',
  'bg-[#E7F0F0] px-3 py-2',
  'text-sm font-black text-[#16656B]">90 pkt',
  'bg-[#E7F0F0] ring-1 ring-[#CFE1E2]">\n          <div className="crpe-progress-fill h-full w-[55%] rounded-full bg-[#16656B]"',
  'tone="medyk"',
]) {
  requireToken(token, `petrolowego panelu Medyka: ${token}`);
}

for (const token of [
  'bg-[#E9EEF7] px-2.5 py-1 text-[10px] font-extrabold text-[#14355E]',
  'bg-[#E9EEF7] text-[#23528F] ring-1 ring-[#D7E0EF]',
  'bg-[#EDEEF3] px-2.5 py-1 text-[10px] font-extrabold text-[#2E3247]',
  'bg-[#EDEEF3] text-[#4A5170] ring-1 ring-[#DBDDE6]',
]) {
  requireToken(token, `spójnego panelu roli: ${token}`);
}

requireToken('active\n                          ? `border-transparent text-white ${theme.ctaStrong} ${theme.ctaHover} ${theme.ctaShadow}`', "wypełnionego CTA tylko na wybranej karcie roli");
requireToken('statusClass: "bg-[#E7F0F0] text-[#0E4448] ring-[#CFE1E2]"', "petrolowego statusu dostępności Medyka");
requireToken('statusClass: "bg-[#E9EEF7] text-[#14355E] ring-[#D7E0EF]"', "stalowego statusu dostępności Placówki");
requireToken('statusClass: "bg-[#EDEEF3] text-[#2E3247] ring-[#DBDDE6]"', "grafitowego statusu dostępności Organizatora");

if (/emerald|green/i.test(home)) {
  throw new Error("v6.27.3: landing nadal zawiera zielony/emerald; dostępność ma używać tintu roli, a wyjątki bursztynu.");
}
if (!/amber-/.test(home)) {
  throw new Error("v6.27.3: brak bursztynu dla stanów rozwijanych / wymagających uwagi.");
}

if (!chart.includes('linearGradient id="crpe-accrual-fill"') ||
    !chart.includes('stroke="#d97706"') ||
    !chart.includes('bg-emerald-500')) {
  throw new Error("v6.27.3: wykresy Panelu CPD z v6.27 muszą pozostać bez regresji.");
}

console.log("OK v6.27.3 — H1 stały, CTA i panele należą do roli, dostępność używa tintu roli, landing bez zielonego; wykresy bez zmian.");
