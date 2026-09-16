import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const panel = read("app/panel-cpd/CalculatorClient.tsx");

import "./check-v6-28-punkty-visual-system.mjs";

const checks = [
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
