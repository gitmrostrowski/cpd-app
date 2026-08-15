import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const home = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const chart = fs.readFileSync(path.join(root, "app/panel-cpd/CalculatorClient.tsx"), "utf8");

// Ten test jest celowo semantyczny: v6.27.1 wprowadziła zasadę jednego
// stałego koloru marki i ograniczonego akcentu roli. Kolejne wersje mogą
// dopracowywać konkretne heksy bez łamania tej zasady.
for (const token of [
  'const roleThemes: Record<AudienceKey, RoleTheme>',
  'className="block text-[#1D4ED8]">w jednym miejscu.</span>',
  'statusTone: "bg-emerald-50 text-emerald-700 ring-emerald-100"',
]) {
  if (!home.includes(token)) throw new Error(`v6.27.1: brak zasady spójnej marki: ${token}`);
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
  if (home.includes(forbidden)) throw new Error(`v6.27.1: pozostał zbyt silny motyw zależny od roli: ${forbidden}`);
}

if (!chart.includes('linearGradient id="crpe-accrual-fill"') ||
    !chart.includes('stroke="#d97706"') ||
    !chart.includes('bg-emerald-500')) {
  throw new Error("v6.27.1: poprawione wykresy v6.27 muszą pozostać bez regresji.");
}

console.log("OK v6.27.1 — jedna marka, kontrolowane akcenty ról i semantyczne statusy; konkretny dobór heksów może być rozwijany.");
