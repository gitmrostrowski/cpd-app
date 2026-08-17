import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const home = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const bottom = fs.readFileSync(path.join(root, "components/BottomCTA.tsx"), "utf8");
const chart = fs.readFileSync(path.join(root, "app/panel-cpd/CalculatorClient.tsx"), "utf8");

const requiredTheme = [
  "--color-crpe-brand: #1D4ED8;",
  "--color-crpe-brand-hover: #0F3CAB;",
  "--color-crpe-brand-soft: #EFF4FE;",
  "--color-crpe-brand-border: #CFDDFB;",
  "--color-crpe-ink: #171A21;",
  "--color-crpe-muted: #5C6270;",
  "--color-crpe-surface: #F7F8FA;",
  "--color-crpe-line: #E4E6EC;",
  "--color-crpe-medyk-soft: #E2F6F6;",
  "--color-crpe-medyk-border: #C6E6E6;",
  "--color-crpe-medyk-text: #00595D;",
  "--color-crpe-placowka-soft: #EFF4FE;",
  "--color-crpe-placowka-border: #CFDDFB;",
  "--color-crpe-placowka-text: #1D4ED8;",
  "--color-crpe-organizator-soft: #FBEEF9;",
  "--color-crpe-organizator-border: #EEDAEA;",
  "--color-crpe-organizator-text: #6D3967;",
];
for (const token of requiredTheme) {
  if (!css.includes(token)) throw new Error(`v6.27.4: brak tokenu @theme: ${token}`);
}

for (const token of [
  'ctaStrong: "bg-crpe-brand"',
  'ctaHover: "hover:bg-crpe-brand-hover"',
  'bg-crpe-brand/85',
  'bg-crpe-medyk-soft text-crpe-medyk-text',
  'bg-crpe-organizator-soft text-crpe-organizator-text',
  'bg-crpe-brand-soft text-crpe-brand',
  'crpe-step-card relative rounded-[18px]',
  'group-open:bg-crpe-brand-soft group-open:text-crpe-brand',
]) {
  if (!home.includes(token)) throw new Error(`v6.27.4: brak elementu architektury brand-led: ${token}`);
}

const ctaStrongCount = home.match(/ctaStrong: "bg-crpe-brand"/g)?.length ?? 0;
if (ctaStrongCount !== 3) throw new Error(`v6.27.4: CTA wszystkich 3 ról musi używać marki; znaleziono ${ctaStrongCount}.`);

if (/#[0-9A-Fa-f]{6}/.test(home)) {
  throw new Error("v6.27.4: app/page.tsx nadal zawiera zahardkodowane hexy zamiast tokenów @theme.");
}
if (/#[0-9A-Fa-f]{6}/.test(bottom)) {
  throw new Error("v6.27.4: BottomCTA nadal zawiera zahardkodowane hexy zamiast tokenów marki.");
}
for (const forbidden of ["cyan-", "indigo-", "emerald-", "green-", "violet-", "fuchsia-"]) {
  if (bottom.includes(forbidden)) throw new Error(`v6.27.4: BottomCTA zawiera dodatkową rodzinę barw: ${forbidden}`);
}

// Amber ma oznaczać tylko roadmap / rozwijanie, nie zwykłe braki w danych użytkownika.
if (home.includes('tone="amber"') || home.includes('label="Braki" value="2 aktywności" tone=')) {
  throw new Error("v6.27.4: zwykły brak danych nadal używa semantyki amber.");
}
if (!home.includes("Kolejny etap") || !home.includes("— rozwijamy")) {
  throw new Error("v6.27.4: amber roadmap musi pozostać jawnie opisany tekstem.");
}

// Drugorzędne kroki i FAQ nie powinny konkurować chromą z CTA.
if (home.includes('rounded-full border-4 border-white bg-crpe-brand text-sm font-black text-white')) {
  throw new Error("v6.27.4: numery kroków nadal używają pełnej chromy CTA.");
}
if (!home.includes('bg-crpe-surface text-crpe-muted ring-1 ring-crpe-line transition duration-200 group-open:rotate-45')) {
  throw new Error("v6.27.4: kontrolka FAQ nie została zneutralizowana.");
}

if (!bottom.includes("bg-crpe-brand") || !bottom.includes("bg-white/10") || !bottom.includes("text-white/80")) {
  throw new Error("v6.27.4: BottomCTA nie jest jednokolorowym brandowym CTA.");
}

// Wykresy Panelu CPD z v6.27 pozostają poza zakresem tej korekty.
for (const token of ['linearGradient id="crpe-accrual-fill"', 'stroke="#9A4600"', 'bg-crpe-success']) {
  if (!chart.includes(token)) throw new Error(`v6.27.4: regresja wykresów Panelu CPD: ${token}`);
}

console.log("OK v6.27.4 — brand-led landing: jeden primary blue, role jako lokalne tinty, amber tylko roadmap, spokojniejsze kroki/FAQ, wykresy bez regresji.");
