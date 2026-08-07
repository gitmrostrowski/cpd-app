import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = await readFile(new URL("../app/baza-szkolen/TrainingHubClient.tsx", import.meta.url), "utf8");
const data = await readFile(new URL("../lib/data/crpe.ts", import.meta.url), "utf8");
const listPage = await readFile(new URL("../app/baza-szkolen/page.tsx", import.meta.url), "utf8");
const detailPage = await readFile(new URL("../app/baza-szkolen/[slug]/page.tsx", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8");
const robots = await readFile(new URL("../app/robots.ts", import.meta.url), "utf8");

assert.match(client, /row\.price_pln === 0/, "Cena nieznana nie może być uznana za darmową");
assert.match(client, /row\.end_date \?\? row\.start_date/, "Trwające szkolenia muszą używać daty końca");
assert.doesNotMatch(client, /onlyUpcoming|training-upcoming/, "Martwy filtr Nadchodzące powinien być usunięty");
assert.doesNotMatch(client, /alert\(|window\.confirm\(/, "Interakcje nie mogą używać alert/confirm");
assert.doesNotMatch(client, /crpe-training-logo-watermark|watermark/, "Karta nie może używać watermarku logo");
assert.match(client, /text-\[13px\]/, "CTA karty powinny mieć czytelną typografię");
assert.match(client, /aria-live="polite"/, "Licznik wyników musi być ogłaszany");
assert.match(client, /role="dialog"[\s\S]*aria-modal="true"/, "Formularz musi być dostępnym dialogiem");
assert.match(client, /window\.history\.pushState/, "Filtry muszą być zapisane w URL");
assert.match(client, /activeFilterChips/, "Aktywne filtry powinny być widoczne jako chippy");
assert.match(client, /trainingPath\(t\)/, "Karty muszą linkować do publicznych szczegółów");
assert.match(client, /initialTrainings/, "Katalog musi przyjąć dane SSR");
assert.match(data, /fetchPublicTrainingById/, "Warstwa danych musi obsługiwać stronę szkolenia");
assert.match(listPage, /fetchPublicTrainings\(publicSupabaseServer\(\)\)/, "Pierwsze wyniki muszą być pobierane na serwerze");
assert.match(detailPage, /"@type": "Course"/);
assert.match(detailPage, /"@type": "CourseInstance"/);
assert.match(sitemap, /trainingPath\(training\)/, "Sitemap musi zawierać szkolenia z bazy");
assert.match(robots, /sitemap\.xml/, "Robots musi wskazywać mapę strony");

console.log("v6.15 quality, SEO, UX and accessibility checks passed");
