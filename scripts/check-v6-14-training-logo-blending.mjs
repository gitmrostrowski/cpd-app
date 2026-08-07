import fs from "node:fs";

const client = fs.readFileSync(
  "app/baza-szkolen/TrainingHubClient.tsx",
  "utf8",
);
const css = fs.readFileSync("app/globals.css", "utf8");

const checks = [
  [
    "Logo rozpoznaje proporcje pliku zamiast skalować wszystkie znaki identycznie",
    client.includes('useState<"wide" | "standard" | "compact" | "tall">') &&
      client.includes("event.currentTarget.naturalWidth") &&
      client.includes('ratio >= 2.15 ? "wide"') &&
      client.includes('ratio <= 0.82 ? "tall"'),
  ],
  [
    "Szerokie logotypy są czytelniejsze, a zwarte i pionowe znaki subtelniejsze",
    client.includes('logoShape === "wide"') &&
      client.includes("opacity-[0.74]") &&
      client.includes('logoShape === "compact"') &&
      client.includes("opacity-[0.38]") &&
      client.includes("opacity-[0.34]"),
  ],
  [
    "Znak łączy się z tintą bez prostokątnej ramki",
    client.includes("crpe-training-logo-watermark") &&
      client.includes("mix-blend-multiply") &&
      css.includes(".crpe-training-logo-watermark") &&
      css.includes("mask-image: radial-gradient") &&
      css.includes("filter: blur(7px)"),
  ],
  [
    "Maska ma osobny wariant dla znaków zwartych i pionowych",
    css.includes('[data-logo-shape="compact"]') &&
      css.includes('[data-logo-shape="tall"]') &&
      css.includes("ellipse 68% 94% at 78% 47%"),
  ],
  [
    "Logo pozostaje dekoracyjne, dostępne semantycznie przez nazwę organizatora",
    client.includes("aria-hidden={watermark ? true : undefined}") &&
      client.includes("pointer-events-none absolute -right-3 -top-1") &&
      client.includes("sm:min-h-[70px]") &&
      client.includes("{t.organizer}"),
  ],
  [
    "Zmiana nie narusza akcji, punktacji ani logiki danych",
    client.includes("Przejdź do zapisów") &&
      client.includes("Dodaj do planu") &&
      client.includes("chooseTraining(t)") &&
      client.includes('<GraduationCap className="h-5 w-5 shrink-0" strokeWidth={2.1}') &&
      !client.includes("supabase/migrations"),
  ],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "BŁĄD"}  ${label}`);
  if (!ok) failed += 1;
}

if (failed) process.exit(1);
