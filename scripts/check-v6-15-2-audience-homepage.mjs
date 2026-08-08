import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const client = await readFile(new URL("app/baza-szkolen/TrainingHubClient.tsx", root), "utf8");
const homepage = await readFile(new URL("app/page.tsx", root), "utf8");

assert.match(client, /type AudienceMatch = "exact" \| "general" \| "unclear"/, "Brakuje jawnego rozróżnienia jakości dopasowania zawodu");
assert.match(client, /row\.audience_scope === "unknown" \|\|/, "Niepotwierdzeni adresaci nie mogą znikać po wyborze zawodu");
assert.match(client, /AUDIENCE_MATCH_ORDER\[a\.audience_match \?\? "exact"\]/, "Pewne dopasowania muszą być sortowane przed niepewnymi");
assert.match(client, /Możliwe dopasowanie — adresaci niepotwierdzeni/, "Lista musi oddzielać niepewne dopasowania");
assert.match(client, /matchedTrainingCountLabel\(matchedCount\)/, "Główny licznik nie może przedstawiać niepewnych rekordów jako pewnych dopasowań");

assert.match(client, /function shortPlace\(location: string \| null\)/, "Brakuje skracania miejsca na karcie");
assert.match(client, /shortPlace\(training\.voivodeship\)/, "Karta nie może pokazywać pełnego adresu w zwartej linii meta");
assert.match(client, /training\.enrollment_status === "open" \? null : details\.enrollment/, "Domyślne „Zapisy otwarte” nie powinny powtarzać się na każdej karcie");
assert.match(client, /t\.points_verification_status === "unverified" \? \(/, "Powtarzalny wizualny status „Do sprawdzenia” powinien być ukryty");
assert.match(client, /<span className="sr-only">/, "Informacja o weryfikacji punktów musi pozostać dostępna dla czytników ekranu");

assert.equal((homepage.match(/<h1\b/g) ?? []).length, 1, "Strona główna powinna mieć dokładnie jeden H1");
assert.match(homepage, /Punkty edukacyjne[\s\S]*i certyfikaty[\s\S]*w jednym miejscu/, "H1 powinien komunikować propozycję wartości CRPE");
assert.ok(homepage.indexOf("<Hero selected=") < homepage.indexOf("<AudienceSection selected="), "Hero musi poprzedzać porównanie ról");

const audienceStart = homepage.indexOf("function AudienceSection");
const audienceEnd = homepage.indexOf("function ProductToolsSection", audienceStart);
const audienceSection = homepage.slice(audienceStart, audienceEnd);
assert.doesNotMatch(audienceSection, /<RolePicker|SelectedRoleSummary|Kim jesteś/, "Porównanie ról nie może powtarzać wyboru z Hero");
assert.doesNotMatch(homepage, /crpe-scroll-reveal|delay=\{index \*/, "Nieaktywny mechanizm scroll reveal powinien zostać usunięty");

for (const path of ["components/Hero.tsx", "components/FeatureGrid.tsx"]) {
  await assert.rejects(access(new URL(path, root)), { code: "ENOENT" }, `${path} nadal istnieje mimo braku użycia`);
}

console.log("v6.15.2 audience and homepage checks passed");
