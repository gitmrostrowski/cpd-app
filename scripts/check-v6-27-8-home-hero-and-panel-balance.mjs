import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const panel = read("app/panel-cpd/CalculatorClient.tsx");

import "./check-v6-28-punkty-visual-system.mjs";

const checks = [
  ["status card gives chart the dominant column", panel.includes("lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.78fr)]") || panel.includes("lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.9fr)]")],
  ["next steps align to top rather than vertical center", panel.includes("self-start") || panel.includes("justify-start")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} - ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
