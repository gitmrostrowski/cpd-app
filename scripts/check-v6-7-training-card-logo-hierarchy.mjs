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
  'className="relative col-span-2 mt-0.5 flex flex-col gap-2.5',
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
    "Logo i punkty pozostają w zwartym pasie między akcjami",
    actionColumnStart >= 0 &&
      client.includes("OrganizerLogo") &&
      actionHeader.includes("min-h-[38px]") &&
      actionHeader.includes("sm:h-9"),
  ],
  [
    "Logo karty jest widocznym znakiem bez dodatkowej ramki",
    client.includes('? "h-[38px] w-[160px]"') &&
      client.includes("opacity-[0.64]") &&
      client.includes('watermark ? "max-h-[34px] max-w-[148px] object-contain object-left"') &&
      actionHeader.includes("<OrganizerLogo"),
  ],
  [
    "Brak logo nie tworzy ramki, a oba przyciski wykorzystują pełną szerokość",
    client.includes("{t.organizer_logo_url ? (") &&
      actionHeader.includes('<span aria-hidden="true" />') &&
      (actionHeader.match(/h-10 w-full/g) ?? []).length >= 3,
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
