import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(`v6.27.5: ${message}`);
};

const layout = read("lib/layout.ts");
assert(layout.includes("export const PAGE_MAX_W = 1200;"), "PAGE_MAX_W musi wynosić 1200");
assert(layout.includes("max-w-[${PAGE_MAX_W}px]"), "pageWrap musi korzystać z PAGE_MAX_W");

const home = read("app/page.tsx");
assert(home.includes('import { pageWrap } from "@/lib/layout";'), "Home musi importować wspólny pageWrap");
assert(!home.includes('const pageWrap = "mx-auto w-full max-w-[1180px]'), "Home nie może mieć lokalnego pageWrap 1180px");

const globals = read("app/globals.css");
for (const token of [
  "--color-crpe-success: #006A4E;",
  "--color-crpe-success-soft: #E4F6F0;",
  "--color-crpe-success-border: #C5E3D9;",
  "--color-crpe-warning: #9A4600;",
  "--color-crpe-warning-soft: #FFEEE2;",
  "--color-crpe-warning-border: #FAD6C0;",
  "--color-crpe-danger: #A42F30;",
  "--color-crpe-danger-soft: #FFECE9;",
  "--color-crpe-danger-border: #FFCEC8;",
]) {
  assert(globals.includes(token), `brakuje tokenu semantycznego ${token}`);
}
assert(globals.includes("crpe-brand = jedyny kolor wszystkich CTA"), "brakuje komentarza z zasadą użycia tokenów");

function walk(dir) {
  const abs = path.join(root, dir);
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const widthFiles = [...walk("app"), ...walk("components")];
for (const rel of widthFiles) {
  const src = read(rel);
  assert(!/max-w-\[(1180|1220|1280)px\]/.test(src), `stara szerokość kontenera w ${rel}`);
}

const colorFiles = [...walk("app/panel-cpd"), ...walk("app/baza-szkolen")];
const forbiddenColorClass = /(?:bg|text|border|ring)-(?:blue|amber|emerald|red)-\d+|indigo-\d+/;
for (const rel of colorFiles) {
  const src = read(rel);
  assert(!forbiddenColorClass.test(src), `pozostała surowa klasa blue/amber/emerald/red/indigo w ${rel}`);
}

const panel = read("app/panel-cpd/CalculatorClient.tsx");
for (const required of [
  "bg-crpe-brand",
  "hover:bg-crpe-brand-hover",
  "bg-crpe-warning-soft",
  "text-crpe-warning",
  "bg-crpe-success-soft",
  "text-crpe-success",
  "bg-crpe-danger-soft",
  "text-crpe-danger",
]) {
  assert(panel.includes(required), `Panel CPD nie używa ${required}`);
}
for (const oldHex of ["#2563eb", "#3b82f6", "#60a5fa", "#d97706", "#f59e0b", "#fbbf24", "#fed7aa", "#fff7ed", "#10b981", "#f43f5e"]) {
  assert(!panel.toLowerCase().includes(oldHex), `Panel CPD zawiera stary kolor ${oldHex}`);
}

const training = read("app/baza-szkolen/TrainingHubClient.tsx");
assert(
  training.includes('className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-crpe-brand-border bg-white px-4 text-sm font-bold text-crpe-brand shadow-sm transition hover:bg-crpe-brand-soft active:scale-[0.98] sm:w-auto"'),
  'przycisk "Zgłoś szkolenie" musi być brand outline'
);
assert(training.includes('badge: "border-slate-300 bg-slate-100 text-slate-700"'), "Hybrydowe musi używać neutralnego badge slate");
assert(training.includes('dateTop: "bg-slate-400"'), "Hybrydowe musi używać neutralnego dateTop slate");
assert(!training.toLowerCase().includes("#6366f1"), "Hybrydowe nie może używać starego indigo #6366f1");

console.log("OK v6.27.5 — 1200px layout + wspólne tokeny brand/success/warning/danger w Home, Panelu CPD i Bazie szkoleń.");
