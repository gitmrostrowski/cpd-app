import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const page = read("app/page.tsx");
const panel = read("app/panel-cpd/CalculatorClient.tsx");

const checks = [
  ["desktop audience label moved into the right product frame", page.includes('px-2 pb-2 pt-1 text-center') && page.includes("CRPE dla medyka, placówki i organizatora") && page.includes("lg:hidden")],
  ["role selector has a distinct neutral rail", (page.includes("bg-slate-100/85") && page.includes("border-slate-200/90")) || page.includes("bg-slate-100/75")],
  ["role identity stays visible in the selector", (page.includes("theme.accentStrong} text-white ring-transparent") && page.includes("theme.accentSoft} ${theme.accentText} ${theme.accentRing")) || (page.includes("${theme.accentSoft} ${theme.accentText} ${theme.accentBorder}") && page.includes("absolute inset-x-5 bottom-0 h-[2px]"))],
  ["role text stays neutral", page.includes("font-extrabold text-crpe-ink")],
  ["status chart is vertically reduced", panel.includes("const H = 188;") && panel.includes("const T = 22;") && panel.includes("const B = 32;")],
  ["status toolbar combines view and pace", panel.includes('Tempo na dziś: <strong className="text-slate-800">')],
  ["status legend is compact", panel.includes("mt-1.5 flex flex-wrap gap-x-4 gap-y-1 px-2 text-[11px]")],
  ["status explanation is concise", panel.includes("Schodki pokazują moment zdobycia punktów; linia przerywana — równe tempo.")],
  ["next-steps card is content-height, not a full-height slab", panel.includes("flex self-start flex-col") && panel.includes("rounded-2xl border border-slate-200/90 bg-crpe-surface/75")],
  ["top metric is reduced from oversized 52px", panel.includes("sm:text-[44px]") && !panel.includes("sm:text-[52px]")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} - ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
