import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const page = read("app/page.tsx");
const css = read("app/crpe-visual-v6-28-2.css");
const ui = read("components/ui/crpe.tsx");
const layout = read("app/layout.tsx");
const cta = read("components/BottomCTA.tsx");
const footer = read("components/Footer.tsx");

const hero = page.slice(page.indexOf('function Hero({'), page.indexOf('function AudienceSection'));
const checks = [
  ["layout imports the versioned visual stylesheet", layout.includes('import "./crpe-visual-v6-28-2.css";')],
  ["hero aligns columns at top, keeps actions left and preview right", hero.includes("lg:items-start") && hero.indexOf("href={active.href}") < hero.indexOf("data-hero-workspace") && hero.includes('href="/login"') && !hero.includes("<Image")],
  ["role controls expose selected state and remain keyboard buttons", page.includes('aria-pressed={isSelected}') && page.includes('type="button"') && page.includes('group flex min-h-12')],
  ["role destinations remain intact", ['/rejestracja', '/dla-medyka', '/dla-placowki', '/dla-organizatora'].every(p => page.includes(p))],
  ["small step numbers use the accessible dark teal", page.includes('bg-crpe-punkt-text text-[13px] font-extrabold text-white')],
  ["preview caption uses readable text color", page.includes('font-semibold text-crpe-muted">Podgląd CRPE')],
  ["FAQ retains native disclosure controls", page.includes('<details') && page.includes('<summary')],
  ["palette defines navy, punkt and brand tokens", ["--color-crpe-navy:", "--color-crpe-punkt:", "--color-crpe-brand:"].every((t) => css.includes(t))],
  ["brand stays the only CTA color", ui.includes("primary: `${pillBase} bg-crpe-brand")],
  ["display typeface is loaded and wired to headings", layout.includes("Plus_Jakarta_Sans") && !layout.includes("Bricolage_Grotesque") && css.includes("--font-display:") && css.includes("h1, h2, h3, .font-display")],
  ["shared primitives exist", ["export function IconBadge", "export function SectionHeading", "export function DotRing", "export function Eyebrow", "export const pill"].every((t) => ui.includes(t))],
  ["hero retains the separate three-role indicator", page.includes("data-role-ring") && page.includes("strokeDashoffset={-index * 120}")],
  ["role photos are in place", ["medyk", "placowka-v3", "organizator-v3", "dokument"].every((k) => exists(`public/home/photo-${k}.webp`))],
  ["eyebrows are sentence case, not tracked caps", !page.includes("uppercase tracking-[")],
  ["steps are connected by a dotted path", page.includes("crpe-step-path") && css.includes(".crpe-step-path")],
  ["bottom CTA and footer use the navy system", cta.includes("bg-crpe-navy") && footer.includes("bg-crpe-navy")],
  ["motion respects reduced-motion", css.includes(".crpe-ring-progress") && /prefers-reduced-motion[\s\S]*crpe-ring-progress/.test(css)],
  ["hero copy is unchanged", page.includes("Punkty edukacyjne") && page.includes("i certyfikaty") && page.includes("w jednym miejscu<span className=\"crpe-dot\">.</span>")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} - ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);

