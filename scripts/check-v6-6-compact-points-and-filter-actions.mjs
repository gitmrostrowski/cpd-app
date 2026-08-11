import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const pointsColumnStart = client.indexOf(
  'className="col-span-2 mt-3 border-t',
);
const pointsColumnEnd = client.indexOf("</article>", pointsColumnStart);
const desktopPoints = client.slice(pointsColumnStart, pointsColumnEnd);

const checks = [
  [
    "Punkty są zwartym wskaźnikiem bez kafla i podpisu",
    pointsColumnStart >= 0 &&
      desktopPoints.includes('text-[27px] font-black') &&
      desktopPoints.includes("pointDisplay.suffix") &&
      !desktopPoints.includes("punkty edukacyjne") &&
      desktopPoints.includes('flex items-baseline gap-1.5') &&
      !desktopPoints.includes("PUNKTY EDUKACYJNE"),
  ],
  [
    "Kolumna akcji ma kontrolowaną wysokość strefy marki",
    desktopPoints.includes('sm:border-l sm:border-t-0 sm:pl-4') &&
      desktopPoints.includes("flex h-10 w-full") &&
      desktopPoints.includes("focus-visible:outline"),
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
    client.includes("grid-cols-[40px_minmax(0,1fr)]") &&
      client.includes("lg:grid-cols-12 lg:gap-3") &&
      client.includes("border border-slate-300 bg-white") &&
      client.includes("hover:bg-blue-50 hover:text-blue-700") &&
      client.includes('className="sm:hidden">Filtry</span>'),
  ],
  [
    "Status punktów pozostaje dostępny bez eksponowania go na liście",
    desktopPoints.includes("pointsDetailsLabel(t.points_verification_status)") &&
      desktopPoints.includes('className="sr-only"') &&
      desktopPoints.includes("title={pointsDetailsLabel(t.points_verification_status)}"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
