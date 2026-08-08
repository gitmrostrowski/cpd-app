import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const homepage = await readFile(new URL("app/page.tsx", root), "utf8");

assert.match(homepage, /<ol key=\{selected\}[\s\S]*Krok \{index \+ 1\}/, "Sekcja kroków powinna być numerowaną osią czasu");
assert.doesNotMatch(homepage, /crpe-step-card/, "Kroki nie powinny wracać do układu osobnych kafelków");

assert.match(homepage, /function RoleStateSection/, "Brakuje osobnego zakresu dla ról organizacyjnych");
assert.match(homepage, />Działa dziś</, "Zakres dostępny powinien być nazwany wprost");
assert.match(homepage, />Rozwijamy</, "Zakres rozwijany powinien być nazwany wprost");
assert.match(homepage, /selectedAudience === "medyk"[\s\S]*<PracticeSection \/>[\s\S]*<ProductToolsSection \/>[\s\S]*<RoleStateSection selected=\{selectedAudience\}/, "Sekcje profilu medyka muszą być ukryte dla placówki i organizatora");

for (const phrase of [
  "Struktura placówki i jednostek organizacyjnych",
  "Zaproszenia wysyłane na konkretny adres e-mail",
  "Role, członkostwa i kontrolowany dostęp",
  "Formularz zgłoszenia szkolenia do publicznej bazy",
  "Publiczna, linkowalna strona wydarzenia po publikacji",
  "Bezpośredni link do zapisów u organizatora",
]) {
  assert.ok(homepage.includes(phrase), `Brakuje potwierdzonego zakresu: ${phrase}`);
}

for (const phrase of [
  "Kompletność dokumentacji",
  "Zbiorczy status zespołu</p>",
  "86 uczestników",
  "72 certyfikaty",
  "Sprawdzaj kompletność",
]) {
  assert.ok(!homepage.includes(phrase), `Strona nadal przedstawia funkcję w rozwoju jako gotową: ${phrase}`);
}

console.log("v6.15.3 role paths and honest scope checks passed");
