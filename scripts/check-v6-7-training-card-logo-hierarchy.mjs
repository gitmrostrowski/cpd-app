import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const organizerMetadataStart = client.indexOf(
  "{t.organizer ? (",
  client.indexOf("displayedItems.map"),
);
const organizerMetadataEnd = client.indexOf(
  "{showRange && range ? (",
  organizerMetadataStart,
);
const organizerMetadata = client.slice(
  organizerMetadataStart,
  organizerMetadataEnd,
);

const actionColumnStart = client.indexOf(
  'className="col-span-2 mt-0.5 grid grid-cols-2',
);
const actionColumnEnd = client.indexOf("{t.url ? (", actionColumnStart);
const actionHeader = client.slice(actionColumnStart, actionColumnEnd);

const checks = [
  [
    "Logo nie konkuruje z tekstową nazwą organizatora",
    organizerMetadataStart >= 0 &&
      organizerMetadata.includes("{t.organizer}") &&
      !organizerMetadata.includes("OrganizerLogo"),
  ],
  [
    "Logo i punkty tworzą jeden zwarty wiersz nad akcjami",
    actionColumnStart >= 0 &&
      actionHeader.includes("OrganizerLogo") &&
      actionHeader.includes("GraduationCap") &&
      actionHeader.indexOf("OrganizerLogo") < actionHeader.indexOf("GraduationCap") &&
      actionHeader.includes("col-span-2 flex h-8") &&
      actionHeader.includes("ml-auto"),
  ],
  [
    "Logo karty ma czytelny obszar bez dodatkowej ramki",
    client.includes('? "h-8 w-[76px]"') &&
      client.includes('? "justify-start"') &&
      client.includes('card ? "max-h-8 max-w-full object-contain"') &&
      !actionHeader.includes("border-slate-200"),
  ],
  [
    "Brak logo nie tworzy placeholdera, a punkty pozostają po prawej",
    actionHeader.includes("{t.organizer_logo_url ? (") &&
      actionHeader.includes(") : null}") &&
      actionHeader.includes("ml-auto inline-flex shrink-0"),
  ],
  [
    "Jeden wiersz logo i punktów działa na telefonie i desktopie",
    actionHeader.includes("col-span-2") &&
      !actionHeader.includes("sm:hidden") &&
      !actionHeader.includes("hidden h-7"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
