import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const filterHeading = client.indexOf("Znajdź szkolenie");
const filterGrid = client.indexOf('className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12"');
const moreFilters = client.indexOf("Więcej filtrów", filterHeading);
const clearFilters = client.indexOf('aria-label="Wyczyść filtry"', filterHeading);

const checks = [
  [
    "Sterowanie filtrami tworzy jeden górny pasek",
    filterHeading >= 0 &&
      clearFilters > filterHeading &&
      moreFilters > clearFilters &&
      filterGrid > moreFilters,
  ],
  [
    "Hierarchia działań rozróżnia opcję, reset i główne CTA",
    client.includes("hover:bg-crpe-brand-soft hover:text-crpe-brand") &&
      client.includes("hover:bg-slate-50 hover:text-slate-800") &&
      client.includes("rounded-xl bg-crpe-brand"),
  ],
  [
    "Układ działań jest responsywny",
    client.includes("grid grid-cols-[40px_minmax(0,1fr)]") &&
      client.includes('className="sm:hidden">Filtry</span>') &&
      client.includes("lg:grid-cols-12"),
  ],
  [
    "Punkty mają wyraźny moduł z ikoną edukacji",
    client.includes("text-[27px] font-black") &&
      client.includes("text-[13px] font-bold") &&
      client.includes("text-crpe-brand"),
  ],
  [
    "Lista nie eksponuje technicznego komunikatu o braku weryfikacji",
    !client.includes('return "niezweryfikowane"') &&
      client.includes("Punkty wymagają sprawdzenia dla Twojego zawodu"),
  ],
  [
    "Status punktacji pozostaje dostępny w szczegółach i dla czytników",
    client.includes("pointsDetailsLabel(t.points_verification_status)") &&
      client.includes('className="sr-only"') &&
      client.includes("title={pointsDetailsLabel(t.points_verification_status)}"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
