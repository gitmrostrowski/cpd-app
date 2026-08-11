import fs from "node:fs";

const client = fs.readFileSync("app/baza-szkolen/TrainingHubClient.tsx", "utf8");

const checks = [
  [
    "Kafelek oddziela datę od głównej hierarchii treści",
    // Aktualny, bardziej zwarty wariant v6.15 używa szerszej kolumny daty
    // i osobnego obszaru akcji, ale zachowuje tę samą hierarchię informacji.
    client.includes("grid-cols-[64px_minmax(0,1fr)]") &&
      client.includes("sm:grid-cols-[64px_minmax(0,1fr)_216px]") &&
      client.includes('dateUndetermined ? "?" : date.day') &&
      client.includes("date.month.toLocaleLowerCase"),
  ],
  [
    "Logo pozostaje opcjonalne i nie tworzy pustej ramki",
    client.includes("if (!logoUrl)") &&
      client.includes("if (!initials) return null") &&
      client.includes("src={t.organizer_logo_url}"),
  ],
  [
    "Logo jest czytelne i powiązane z kartą w wierszu organizatora",
    client.includes('className="max-h-6 w-full object-contain"') &&
      client.includes("<OrganizerLogo") &&
      client.includes("aria-label={name ? `Logo organizatora ${name}`") &&
      client.includes("object-contain"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
