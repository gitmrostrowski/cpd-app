import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const client = await readFile(
  new URL("../app/baza-szkolen/TrainingHubClient.tsx", import.meta.url),
  "utf8",
);

const cardStart = client.indexOf("{displayedItems.map((t, index) => {");
const cardEnd = client.indexOf("{visibleCount < visibleItems.length", cardStart);

assert.ok(cardStart >= 0 && cardEnd > cardStart, "Nie znaleziono listy kart szkoleń");

const card = client.slice(cardStart, cardEnd);

assert.match(card, /border-l-\[3px\]/, "Format szkolenia powinien mieć widoczny pasek 3 px");
assert.match(card, /style=\{\{ borderLeftColor: tone\.rail \}\}/, "Pasek musi używać semantycznego koloru formatu");
assert.match(card, /sm:grid-cols-\[64px_minmax\(0,1fr\)_216px\]/, "Szyna daty powinna mieścić godziny, a szyna akcji zachować 216 px");
assert.doesNotMatch(card, /grid-cols-2 gap-2\.5/, "CTA nie mogą ponownie dzielić zbyt wąskiego wiersza");
assert.doesNotMatch(card, /radial-gradient|linear-gradient/, "Karta nie może zawierać gradientu po dawnym watermarku");
assert.match(card, /\{date\.weekday\}/, "Kafelek daty powinien pokazywać dzień tygodnia");
assert.match(card, /\{date\.year\}/, "Kafelek daty powinien pokazywać rok");
assert.match(card, /Dziś[\s\S]*Jutro[\s\S]*Za \$\{dd\} dni/, "Pilność powinna podawać konkretną liczbę dni");
assert.doesNotMatch(card, /statusTone|Zapisy otwarte<\/span>/, "Status zapisów powinien być metadanym, nie konkurencyjną plakietką");
assert.match(card, /trainingMetaLine/, "Metadane powinny tworzyć jedną stabilną linię");
assert.doesNotMatch(card, />\s*Szczegóły\s*</, "Karta nie powinna dublować linku do szczegółów");
assert.match(card, /items-baseline gap-1\.5 text-blue-700/, "Punkty i ich jednostka powinny tworzyć jeden blok");
assert.match(card, /shortVerificationLabel/, "Status weryfikacji powinien pozostać bezpośrednio przy punktach");
assert.match(card, /Zapisy u organizatora[\s\S]*mt-1\.5 flex h-9 w-full/, "CTA powinny być ustawione pionowo");
assert.match(client, /className="max-h-6 w-full object-contain"/, "Logo inline nie może być pomniejszone ciężką ramką i paddingiem");
assert.match(client, /const initials = String\(name \?\? ""\)/, "Brak logo powinien mieć fallback z inicjałami organizatora");

console.log("v6.15.1 training card layout checks passed");
