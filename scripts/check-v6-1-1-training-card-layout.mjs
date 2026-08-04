import fs from "node:fs";

const client = fs.readFileSync("app/baza-szkolen/TrainingHubClient.tsx", "utf8");

const checks = [
  [
    "Kafelek oddziela datę od głównej hierarchii treści",
    client.includes("grid-cols-[52px_minmax(0,1fr)]") &&
      client.includes("sm:grid-cols-[52px_minmax(0,1fr)_170px]") &&
      client.includes("Punkty CPD"),
  ],
  [
    "Logo pozostaje opcjonalne i nie tworzy pustej ramki",
    client.includes("if (!logoUrl) return null") &&
      client.includes("src={t.organizer_logo_url}"),
  ],
  [
    "Logo jest kompaktowe, powiązane z organizatorem i nie jest przycinane",
    client.includes('"h-7 w-7 rounded-lg"') &&
      client.includes("<OrganizerLogo name={t.organizer}") &&
      client.includes('card ? "p-1" : "p-1.5"') &&
      client.includes("object-contain"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
