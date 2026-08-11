import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);

const organizerMetadataStart = client.indexOf(
  "{t.organizer ? (",
  client.indexOf("displayedItems.map"),
);
const organizerMetadataEnd = client.indexOf("</div>", organizerMetadataStart);
const organizerMetadata = client.slice(
  organizerMetadataStart,
  organizerMetadataEnd,
);

const actionColumnStart = client.indexOf(
  'className="col-span-2 mt-3 border-t',
);
const actionColumnEnd = client.indexOf("</article>", actionColumnStart);
const actionHeader = client.slice(actionColumnStart, actionColumnEnd);

const checks = [
  [
    "Logo jest powiązane z tekstową nazwą organizatora",
    organizerMetadataStart >= 0 &&
      organizerMetadata.includes("{t.organizer}") &&
      organizerMetadata.includes("OrganizerLogo"),
  ],
  [
    "Punkty i akcje pozostają w zwartej kolumnie",
    actionColumnStart >= 0 &&
      client.includes("OrganizerLogo") &&
      actionHeader.includes("text-[27px] font-black") &&
      actionHeader.includes("flex h-10 w-full"),
  ],
  [
    "Logo karty jest widocznym znakiem bez dodatkowej ramki",
    client.includes('className="max-h-6 w-full object-contain"') &&
      client.includes('className="inline-flex h-7 w-10') &&
      organizerMetadata.includes("<OrganizerLogo"),
  ],
  [
    "Brak logo nie tworzy pustej ramki, a akcja zachowuje pełną szerokość",
    client.includes("if (!initials) return null") &&
      actionHeader.includes("w-full") &&
      actionHeader.includes("Dodaj do planu"),
  ],
  [
    "Kolumna logo i akcji działa na telefonie i desktopie",
    actionHeader.includes("col-span-2") &&
      actionHeader.includes("sm:col-span-1") &&
      !actionHeader.includes("hidden h-7"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
