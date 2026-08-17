import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const page = read("app/page.tsx");
const css = read("app/globals.css");
const panel = read("app/panel-cpd/CalculatorClient.tsx");

const checks = [
  ["hero keeps a clear CRPE audience eyebrow", page.includes("CRPE dla medyka, placówki i organizatora")],
  ["desktop role UI stays one framed composition", page.includes('rounded-[24px] border border-crpe-line') && page.includes("<RolePicker selected={selected} onSelect={onSelect} embedded />") && page.includes("<HeroDashboard selected={selected} embedded />")],
  ["role labels stay neutral while role identity lives in icons", page.includes('text-[11px] font-extrabold text-crpe-ink') && page.includes("theme.accentStrong") && page.includes("theme.accentSoft")],
  ["preview header does not duplicate a large role icon", page.includes('h-2 w-2 shrink-0 rounded-full ${theme.accentStrong}') && !page.includes('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white ${theme.accentStrong}')],
  ["medic petrol remains softened", css.includes("--color-crpe-medyk-soft: #EAF6F7;") && css.includes("--color-crpe-medyk-border: #CBE3E5;") && css.includes("--color-crpe-medyk-text: #0F6B73;")],
  ["status card gives chart the dominant column", panel.includes("lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.78fr)]") || panel.includes("lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.9fr)]")],
  ["next steps align to top rather than vertical center", panel.includes("self-start") || panel.includes("justify-start")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} - ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
