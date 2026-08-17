import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const home = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");
const css = fs.readFileSync(path.join(root, "app/globals.css"), "utf8");
const chart = fs.readFileSync(path.join(root, "app/panel-cpd/CalculatorClient.tsx"), "utf8");
const training = fs.readFileSync(path.join(root, "app/baza-szkolen/TrainingHubClient.tsx"), "utf8");

const requireToken = (token, label = token) => {
  if (!home.includes(token)) throw new Error(`v6.27.7: brak ${label}`);
};

// Hero: marka ma jeden mocny akcent, bez badge-a i bez mieszanego podkreślenia/koloru roli.
requireToken('CRPE dla medyka, placówki i organizatora', "czystego eyebrow hero");
if (home.includes("CRPE dla medyków i organizacji") || home.includes("rounded-full border border-crpe-line bg-white/90 px-3 py-1.5")) {
  throw new Error("v6.27.7: stary badge hero nadal jest obecny.");
}
requireToken('className="block text-crpe-brand">w jednym miejscu.</span>', "brandowego akcentu H1");
if (home.includes('bg-crpe-brand/85" aria-hidden="true"')) {
  throw new Error("v6.27.7: stary dekoracyjny underline H1 nadal jest obecny.");
}

// RolePicker: tekst ma być stały, charakter roli niesie kafelek ikony.
if (!home.includes('font-extrabold text-crpe-ink outline-none transition') && !home.includes('font-extrabold leading-4 text-crpe-ink sm:text-[13px]')) { throw new Error('v6.27.7: brak stałego koloru tekstu przełącznika ról'); }
requireToken('icon: GraduationCap', "bardziej charakterystycznej ikony Organizatora");
if (!(home.includes('? `text-white ${theme.accentStrong} ${theme.iconShadow}`') && home.includes(': `${theme.accentSoft} ${theme.accentText} ring-1 ${theme.accentRing}`')) && !(home.includes('${theme.accentSoft} ${theme.accentText} ${theme.accentBorder}') && home.includes('absolute inset-x-5 bottom-0 h-[2px]'))) { throw new Error('v6.27.7: brak czytelnej tożsamości ról w ikonach/przełączniku'); }
if (home.includes('? `${theme.accentSoft} ${theme.accentText} shadow-')) {
  throw new Error("v6.27.7: cały aktywny tab nadal jest barwiony kolorem roli.");
}

// Karty ról: wspólna neutralna powierzchnia, rola jako akcent, selected jako brand.
requireToken('active ? "border-crpe-brand-border ring-1 ring-crpe-brand-border" : "border-crpe-line"', "brandowego stanu wybranej karty");
requireToken('crpe-role-media relative h-36 overflow-hidden border-b border-crpe-line bg-crpe-surface', "neutralnego tła ilustracji kart ról");
requireToken('active ? "bg-crpe-brand-soft text-crpe-brand ring-crpe-brand-border"', "brandowej plakietki Wybrana rola");

// Brandowe eyebrow i hero jak w estetyce Narzędzi/Pomocy.
requireToken('uppercase tracking-[0.18em] text-crpe-brand', "brandowych eyebrow sekcji");
if (!css.includes("radial-gradient(circle at 78% 5%, rgba(29, 78, 216, 0.075)")) {
  throw new Error("v6.27.7: brak subtelnego brandowego tła hero.");
}

// Trust/FAQ: identyczny pełnoszerokościowy divider, aby sekcje nie wyglądały jak z innych layoutów.
requireToken('id="bezpieczenstwo" className="scroll-mt-24 border-t border-crpe-line bg-white', "pełnoszerokościowego separatora bezpieczeństwa");
requireToken('id="faq" className="scroll-mt-24 border-t border-crpe-line bg-crpe-surface', "pełnoszerokościowego separatora FAQ");

// Dziedziczymy funkcjonalność z v6.27.5/v6.27.6 bez zmian Panelu CPD i Bazy szkoleń.
for (const token of ["bg-crpe-brand", "bg-crpe-warning-soft", "bg-crpe-success-soft", "bg-crpe-danger-soft"]) {
  if (!chart.includes(token)) throw new Error(`v6.27.7: regresja tokenów Panelu CPD: ${token}`);
}
if (!training.includes("border-crpe-brand-border bg-white") || training.includes("border-indigo-200 bg-indigo-50")) {
  throw new Error("v6.27.7: regresja systemu kolorów Bazy szkoleń.");
}

console.log("OK v6.27.7 — Home: czysty eyebrow zamiast badge, brand blue w H1, stały kolor tekstu ról, mocniejsze ikony, spokojny hero i spójne separatory Trust/FAQ.");
