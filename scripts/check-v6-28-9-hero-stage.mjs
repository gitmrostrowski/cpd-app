import fs from "node:fs";
import path from "node:path";

const page = fs.readFileSync(path.join(process.cwd(), "app/page.tsx"), "utf8");
const stage = page.slice(page.indexOf("function HeroStage("), page.indexOf("function Hero({"));
const hero = page.slice(page.indexOf("function Hero({"), page.indexOf("function AudienceSection"));
const picker = page.slice(page.indexOf("function RolePicker("), page.indexOf("function HeroStage("));

const checks = [
  ["hero fills the first screen on desktop", hero.includes("lg:min-h-[min(880px,calc(100svh-64px))]")],
  ["role picker sits in the left column, before the CTA", hero.indexOf("<RolePicker") > -1 && hero.indexOf("<RolePicker") < hero.indexOf("href={active.href}")],
  ["role picker shows faces and a visible label", picker.includes("<Image") && picker.includes("Wybierz swoją rolę") && picker.includes('aria-labelledby="hero-role-label"')],
  ["stage has a fixed desktop height, not a width-driven ratio", stage.includes("lg:aspect-auto lg:h-[520px]") && stage.includes("xl:h-[640px]")],
  ["stage shows the selected role photo with alt text", stage.includes("src={active.image}") && stage.includes("alt={active.imageAlt}") && stage.includes("priority")],
  ["stage bleeds up to 120px past the container (no upscaling on wide screens)", hero.includes("lg:mr-[calc(-2rem-min(120px,max(0px,(100vw-1200px)/2)))]")],
  ["sample-data card overlaps only the lower-left corner", hero.includes("xl:absolute xl:-bottom-12 xl:-left-8") && hero.includes("xl:w-[372px]")],
  ["card keeps the sample-data caption", page.includes('font-semibold text-crpe-muted">Dane przykładowe')],
  ["hero lead copy from v6.28.8 is kept", hero.includes("Zbieraj aktywności, punkty i certyfikaty w jednym miejscu. Sprawdzaj postęp i przygotuj dane do rozliczenia.")],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? "OK" : "FAIL"} - ${label}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
