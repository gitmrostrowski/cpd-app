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
  'className="col-span-2 mt-0.5 grid grid-cols-[minmax(168px,1fr)_76px]',
);
const actionColumnEnd = client.indexOf("</article>", actionColumnStart);
const actionHeader = client.slice(actionColumnStart, actionColumnEnd);

const checks = [
  [
    "Logo nie konkuruje z tekstową nazwą organizatora",
    organizerMetadataStart >= 0 &&
      organizerMetadata.includes("{t.organizer}") &&
      !organizerMetadata.includes("OrganizerLogo"),
  ],
  [
    "Logo i punkty pozostają w zwartej kolumnie akcji",
    actionColumnStart >= 0 &&
      actionHeader.includes("OrganizerLogo") &&
      actionHeader.includes("grid-cols-[minmax(168px,1fr)_76px]") &&
      actionHeader.includes("sm:h-9"),
  ],
  [
    "Logo karty ma czytelny obszar bez dodatkowej ramki",
    client.includes('? "h-8 w-[76px]"') &&
      client.includes('? "justify-end"') &&
      client.includes('card ? "max-h-8 max-w-full object-contain"') &&
      !actionHeader.includes("border-slate-200"),
  ],
  [
    "Brak logo nie tworzy placeholdera, a zapis wykorzystuje miejsce",
    actionHeader.includes("{t.organizer_logo_url ? (") &&
      actionHeader.includes(") : null}") &&
      actionHeader.includes('t.organizer_logo_url ? "" : "col-span-2"'),
  ],
  [
    "Kolumna logo i akcji działa na telefonie i desktopie",
    actionHeader.includes("col-span-2") &&
      actionHeader.includes("sm:h-9") &&
      !actionHeader.includes("hidden h-7"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
