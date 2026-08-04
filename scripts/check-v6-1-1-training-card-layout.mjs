import fs from "node:fs";

const client = fs.readFileSync("app/baza-szkolen/TrainingHubClient.tsx", "utf8");

const checks = [
  [
    "Kafelek używa dwurzędowej siatki dla daty, logo i treści",
    client.includes("grid-cols-[66px_minmax(0,1fr)]") &&
      client.includes("col-start-1 row-start-1") &&
      client.includes("col-start-2 row-start-1") &&
      client.includes("col-start-1 row-start-2") &&
      client.includes("col-start-2 row-start-2"),
  ],
  [
    "Logo pozostaje opcjonalne i nie tworzy pustej ramki",
    client.includes("if (!logoUrl) return null") &&
      client.includes("src={t.organizer_logo_url}"),
  ],
  [
    "Logo na kaflu ma 66 na 60 px, mniejszy margines i nie jest przycinane",
    client.includes('"h-[60px] w-[66px] rounded-2xl"') &&
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
