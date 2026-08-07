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
  'className="relative col-span-2 mt-0.5 grid grid-cols-[minmax(188px,1fr)_84px]',
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
      client.includes("OrganizerLogo") &&
      actionHeader.includes("grid-cols-[minmax(188px,1fr)_84px]") &&
      actionHeader.includes("sm:h-9"),
  ],
  [
    "Logo karty jest delikatnym znakiem wodnym bez dodatkowej ramki",
    client.includes('? "h-[76px] w-[168px]"') &&
      client.includes("opacity-[0.14]") &&
      client.includes('watermark ? "max-h-[62px] max-w-[154px] object-contain"') &&
      client.includes("absolute right-3 top-1/2 z-0 hidden -translate-y-1/2 sm:block"),
  ],
  [
    "Brak logo nie tworzy placeholdera, a zapis wykorzystuje pełny rząd",
    client.includes("{t.organizer_logo_url ? (") &&
      client.includes(") : null}") &&
      actionHeader.includes("relative z-10 col-span-2"),
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
