import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const filterHeading = client.indexOf("Znajdź szkolenie");
const filterGrid = client.indexOf('className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12"');
const moreFilters = client.indexOf("Więcej filtrów", filterHeading);
const clearFilters = client.indexOf("Wyczyść", filterHeading);
const showResults = client.indexOf("Pokaż wyniki", filterHeading);

const checks = [
  [
    "Trzy działania filtrów tworzą jeden górny pasek",
    filterHeading >= 0 &&
      moreFilters > filterHeading &&
      clearFilters > moreFilters &&
      showResults > clearFilters &&
      filterGrid > showResults,
  ],
  [
    "Hierarchia działań rozróżnia opcję, reset i główne CTA",
    client.includes("border-blue-200 bg-blue-50/70") &&
      client.includes("hover:bg-slate-100 hover:text-slate-800") &&
      client.includes("rounded-xl bg-blue-600"),
  ],
  [
    "Układ działań jest responsywny",
    client.includes("grid w-full grid-cols-2 gap-2") &&
      client.includes("col-span-2 inline-flex") &&
      client.includes("sm:col-span-1 sm:min-w-[168px]"),
  ],
  [
    "Punkty mają wyraźny moduł z ikoną edukacji",
    client.includes("GraduationCap") &&
      client.includes("punkty edukacyjne") &&
      client.includes("text-[22px] font-black") &&
      client.includes("border border-blue-100 bg-blue-50/70"),
  ],
  [
    "Lista nie eksponuje technicznego komunikatu o braku weryfikacji",
    !client.includes('return "niezweryfikowane"') &&
      client.includes("Punkty wymagają sprawdzenia dla Twojego zawodu"),
  ],
  [
    "Status punktacji pozostaje dostępny w szczegółach i dla czytników",
    client.includes("pointsDetailsLabel(t.points_verification_status)") &&
      client.includes("pointsDetailsLabel(detailsTraining.points_verification_status)") &&
      client.includes('aria-label="Punkty potwierdzone"') &&
      client.includes('aria-label="Informacja o punktach w szczegółach"'),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);

