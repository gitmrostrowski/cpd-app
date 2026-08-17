import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const page = read("app/page.tsx");
const css = read("app/globals.css");
const panel = read("app/panel-cpd/CalculatorClient.tsx");

const checks = [
  ["eyebrow centered over hero", page.includes('mb-5 text-center text-[10px]') && page.includes("CRPE dla medyka, placówki i organizatora")],
  ["desktop role UI is one framed composition", page.includes('rounded-[24px] border border-crpe-line bg-white/90 p-2') && page.includes("<RolePicker selected={selected} onSelect={onSelect} embedded />") && page.includes("<HeroDashboard selected={selected} embedded />")],
  ["role labels stay neutral and only selected icon is tinted", page.includes('text-[11px] font-extrabold text-crpe-ink') && page.includes('? `${theme.accentSoft} ${theme.accentText} ${theme.accentRing} shadow-sm`') && page.includes(': "bg-white text-crpe-muted ring-crpe-line"')],
  ["preview header does not duplicate role icon", page.includes('h-2 w-2 shrink-0 rounded-full ${theme.accentStrong}') && !page.includes('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${theme.accentStrong}')],
  ["medic petrol is softened", css.includes("--color-crpe-medyk-soft: #EAF6F7;") && css.includes("--color-crpe-medyk-border: #CBE3E5;") && css.includes("--color-crpe-medyk-text: #0F6B73;")],
  ["status card gives chart more width", panel.includes("lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.9fr)]")],
  ["next steps align to top instead of vertically centering", panel.includes("flex flex-col justify-start gap-2") && panel.includes("bg-crpe-surface/70")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} - ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
