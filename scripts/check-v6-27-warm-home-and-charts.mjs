import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const homePath = path.join(root, "app/page.tsx");
const chartPath = path.join(root, "app/panel-cpd/CalculatorClient.tsx");
const cssPath = path.join(root, "app/globals.css");

const home = fs.readFileSync(homePath, "utf8");
const chart = fs.readFileSync(chartPath, "utf8");
const css = fs.readFileSync(cssPath, "utf8");

const homeRequired = [
  'import Image from "next/image"',
  'const roleThemes: Record<AudienceKey, RoleTheme>',
  'image: "/home/role-medyk.webp"',
  'image: "/home/role-placowka.webp"',
  'image: "/home/role-organizator.webp"',
  'Trzy role, jeden spokojniejszy sposób pracy.',
  'dopasowanym do Twojej roli.',
  'roleThemes[selected]',
];

for (const token of homeRequired) {
  if (!home.includes(token)) {
    throw new Error(`v6.27: brak elementu ocieplonej strony głównej: ${token}`);
  }
}

for (const asset of [
  "public/home/role-medyk.webp",
  "public/home/role-placowka.webp",
  "public/home/role-organizator.webp",
]) {
  const assetPath = path.join(root, asset);
  if (!fs.existsSync(assetPath) || fs.statSync(assetPath).size < 1000) {
    throw new Error(`v6.27: brak poprawnego assetu roli: ${asset}`);
  }
}

const chartRequired = [
  'const stepPoints = (points: { x: number; value: number }[]) =>',
  'linearGradient id="crpe-accrual-fill"',
  'stroke="#d97706"',
  '−{behind} pkt',
  'const completePct = clamp((completePoints / target) * 100, 0, donePct);',
  'bg-emerald-500',
  'kompletne {Math.round(completePoints)} pkt',
  'Przebieg punktów',
  'Równe tempo na dziś:',
  'Niebieski pokazuje zdobyte punkty, zielona krawędź',
  'bg-[#fafbfc]',
];

for (const token of chartRequired) {
  if (!chart.includes(token)) {
    throw new Error(`v6.27: brak elementu poprawionych wykresów Panelu CPD: ${token}`);
  }
}

if (!css.includes('var(--card-accent,')) {
  throw new Error("v6.27: interaktywne karty nie mają kontrolowanego akcentu.");
}

const forbiddenHome = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide',
];
for (const token of forbiddenHome) {
  if (home.includes(token)) {
    throw new Error(`v6.27: nie wolno kopiować zależności CDN z makiety: ${token}`);
  }
}

console.log("OK v6.27 — ocieplona strona główna, ilustracje ról i poprawione wykresy Panelu CPD są obecne bez zewnętrznej biblioteki wykresowej.");
