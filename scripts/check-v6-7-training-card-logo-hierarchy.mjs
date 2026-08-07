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
  'className="relative col-span-2 mt-0.5 border-t',
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
    "Logo i punkty pozostają w zwartej strefie marki nad akcjami",
    actionColumnStart >= 0 &&
      client.includes("OrganizerLogo") &&
      actionHeader.includes("sm:min-h-[66px]") &&
      actionHeader.includes("sm:h-9"),
  ],
  [
    "Logo karty jest widocznym znakiem bez dodatkowej ramki",
    client.includes('? "h-[72px] w-[210px]"') &&
      client.includes("opacity-[0.52]") &&
      client.includes('watermark ? "max-h-[64px] max-w-[196px] object-contain object-right') &&
      actionHeader.includes("<OrganizerLogo"),
  ],
  [
    "Brak logo nie tworzy ramki, a oba przyciski tworzą równą parę",
    client.includes("{t.organizer_logo_url ? (") &&
      actionHeader.includes(") : t.organizer ? (") &&
      actionHeader.includes("grid grid-cols-2 gap-2.5"),
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
