import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const page = fs.readFileSync(path.join(root, "app/page.tsx"), "utf8");

const checks = [
  ["role selector uses a single calm rail", page.includes("bg-slate-100/75") && page.includes("rounded-[17px]")],
  ["role buttons keep neutral text hierarchy", page.includes("text-[13px]") && page.includes("text-crpe-ink")],
  ["each role gets a concise supporting descriptor", page.includes('medyk: "Własna ewidencja"') && page.includes('placowka: "Zespół i dostęp"') && page.includes('organizator: "Publikacja szkoleń"')],
  ["icons stay softly role-colored instead of becoming dark solid blocks", page.includes("${theme.accentSoft} ${theme.accentText} ${theme.accentBorder}") && !page.includes("theme.accentStrong} text-white ring-transparent")],
  ["selected role is shown by a restrained role-color underline", page.includes("absolute inset-x-5 bottom-0 h-[2px]") && page.includes("${theme.accentStrong}")],
  ["inactive roles remain calm and gain contrast only on interaction", page.includes("hover:bg-white/55") && page.includes("opacity-80 group-hover:opacity-100")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} - ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
