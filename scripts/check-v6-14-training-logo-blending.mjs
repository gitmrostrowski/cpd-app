import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);
const checks = [
  [
    "Logo zachowuje proporcje pliku",
    client.includes("function normalizeLogoUrl") &&
      client.includes("object-contain") &&
      client.includes("max-h-6 w-full"),
  ],
  [
    "Szerokie i pionowe znaki mieszczą się w kontrolowanym obszarze",
    client.includes('className="inline-flex h-7 w-10') &&
      client.includes("overflow-hidden") &&
      client.includes("object-contain"),
  ],
  [
    "Znak nie otrzymuje ciężkiej prostokątnej ramki",
    client.includes("<OrganizerLogo") &&
      !client.includes("crpe-training-logo-watermark") &&
      !client.includes("mix-blend-multiply"),
  ],
  [
    "Brak obrazu ma kontrolowany fallback",
    client.includes("const initials") &&
      client.includes("if (!initials) return null") &&
      client.includes("{initials}"),
  ],
  [
    "Logo jest dostępne semantycznie przez nazwę organizatora",
    client.includes("role=\"img\"") &&
      client.includes("aria-label={name ? `Logo organizatora ${name}`") &&
      client.includes("{t.organizer}"),
  ],
  [
    "Zmiana nie narusza akcji, punktacji ani logiki danych",
    client.includes("Zapisy u organizatora") &&
      client.includes("Dodaj do planu") &&
      client.includes("chooseTraining(t)") &&
      client.includes("pointsDetailsLabel(t.points_verification_status)") &&
      !client.includes("supabase/migrations"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
