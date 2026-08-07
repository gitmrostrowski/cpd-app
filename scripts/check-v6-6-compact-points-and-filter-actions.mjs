import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const pointsColumnStart = client.indexOf(
  'className="col-span-2 mt-0.5 grid grid-cols-2',
);
const pointsColumnEnd = client.indexOf("{t.url ? (", pointsColumnStart);
const desktopPoints = client.slice(pointsColumnStart, pointsColumnEnd);

const checks = [
  [
    "Punkty są zwartym wskaźnikiem bez kafla i podpisu",
    pointsColumnStart >= 0 &&
      desktopPoints.includes("GraduationCap") &&
      desktopPoints.includes('text-[20px] font-black') &&
      desktopPoints.includes(">pkt</span>") &&
      !desktopPoints.includes("punkty edukacyjne") &&
      !desktopPoints.includes("border-blue-100") &&
      !desktopPoints.includes("bg-blue-50"),
  ],
  [
    "Kolumna akcji nie wymusza minimalnej wysokości karty",
    !desktopPoints.includes("min-h-") &&
      desktopPoints.includes("sm:gap-1") &&
      desktopPoints.includes('className="col-span-2 flex h-8'),
  ],
  [
    "Reset filtrów jest dostępnym przyciskiem ikonowym",
    client.includes('aria-label="Wyczyść filtry"') &&
      client.includes('title="Wyczyść filtry"') &&
      client.includes("h-10 w-10 shrink-0") &&
      !client.includes("<RotateCcw className=\"h-4 w-4\" strokeWidth={2} />\n                Wyczyść"),
  ],
  [
    "Działania filtrów mają wspólną wysokość i spokojną hierarchię",
    client.includes("grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)]") &&
      client.includes("border border-slate-300 bg-white") &&
      client.includes("rounded-xl bg-blue-600") &&
      client.includes('className="sm:hidden">Filtry</span>'),
  ],
  [
    "Status punktów pozostaje dostępny bez eksponowania go na liście",
    desktopPoints.includes("pointsDetailsLabel(t.points_verification_status)") &&
      desktopPoints.includes("aria-label=") &&
      client.includes("pointsDetailsLabel(detailsTraining.points_verification_status)"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
