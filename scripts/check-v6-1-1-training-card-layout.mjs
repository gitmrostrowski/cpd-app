import fs from "node:fs";

const client = fs.readFileSync("app/baza-szkolen/TrainingHubClient.tsx", "utf8");

const checks = [
  [
    "Kafelek oddziela datę od głównej hierarchii treści",
    client.includes("grid-cols-[52px_minmax(0,1fr)]") &&
      client.includes("sm:grid-cols-[52px_minmax(0,1fr)_292px]") &&
      client.includes(">pkt</span>"),
  ],
  [
    "Logo pozostaje opcjonalne i nie tworzy pustej ramki",
    client.includes("if (!logoUrl) return null") &&
      client.includes("src={t.organizer_logo_url}"),
  ],
  [
    "Logo jest czytelne i powiązane z kartą jako dekoracyjne tło",
    client.includes('"h-[68px] w-[104px]"') &&
      client.includes("<OrganizerLogo") &&
      client.includes('watermark ? "max-h-[68px] max-w-full object-contain"') &&
      client.includes("object-contain"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
