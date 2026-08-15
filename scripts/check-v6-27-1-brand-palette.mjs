import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const homePath = path.join(root, "app/page.tsx");
const chartPath = path.join(root, "app/panel-cpd/CalculatorClient.tsx");
const home = fs.readFileSync(homePath, "utf8");
const chart = fs.readFileSync(chartPath, "utf8");

const requiredHome = [
  'accentStrong: "bg-cyan-700"',
  'accentStrong: "bg-blue-700"',
  'accentStrong: "bg-indigo-600"',
  'className="block text-blue-700">w jednym miejscu.</span>',
  'rounded-xl bg-blue-600 px-5 py-2.5 text-[14px] font-extrabold text-white',
  'bg-[linear-gradient(180deg,#fbfcff_0%,#f7f9fc_58%,#ffffff_100%)]',
  'statusTone: "bg-emerald-50 text-emerald-700 ring-emerald-100"',
  'statusTone: "bg-slate-50 text-slate-600 ring-slate-200"',
  'style={{ "--card-accent": "#2563eb" } as React.CSSProperties}',
  'bg-[#f7f9fc]',
  'bg-[#fafbfc]',
];
for (const token of requiredHome) {
  if (!home.includes(token)) {
    throw new Error(`v6.27.1: brak elementu uporządkowanej palety: ${token}`);
  }
}

const roleStrongUses = home.match(/\$\{theme\.accentStrong\}/g)?.length ?? 0;
if (roleStrongUses !== 3) {
  throw new Error(`v6.27.1: kolor roli powinien występować tylko w 3 kontrolowanych miejscach (tab/ikony), jest: ${roleStrongUses}`);
}

for (const forbidden of [
  'bg-teal-600',
  'bg-violet-600',
  'text-violet-700',
  'bg-teal-50/65',
  'bg-[radial-gradient(circle_at_86%_10%',
]) {
  if (home.includes(forbidden)) {
    throw new Error(`v6.27.1: pozostał zbyt silny motyw zależny od roli: ${forbidden}`);
  }
}

if (!chart.includes('linearGradient id="crpe-accrual-fill"') ||
    !chart.includes('stroke="#d97706"') ||
    !chart.includes('bg-emerald-500')) {
  throw new Error("v6.27.1: poprawione wykresy v6.27 muszą pozostać bez regresji.");
}

console.log("OK v6.27.1 — jeden niebieski kolor marki, zawężone akcenty ról i semantyczne statusy; wykresy v6.27 zachowane.");
