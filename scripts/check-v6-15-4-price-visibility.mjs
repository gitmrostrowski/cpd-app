import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const client = await readFile(
  new URL("app/baza-szkolen/TrainingHubClient.tsx", root),
  "utf8",
);
const detail = await readFile(
  new URL("app/baza-szkolen/[slug]/page.tsx", root),
  "utf8",
);
const admin = await readFile(
  new URL("app/admin/szkolenia/page.tsx", root),
  "utf8",
);

assert.match(client, /function priceBadge\(pricePln: number \| null\)/);
assert.match(client, /toLocaleString\("pl-PL"/);
assert.match(client, /border-crpe-success bg-crpe-success text-white/);
assert.match(client, /details\.priceMissing \? "Cena niepodana" : null/);
assert.doesNotMatch(client, /<Check[^>]*>[\s\S]*?\{price\.label\}/);

const cardStart = client.indexOf("{displayedItems.map((t, index) => {");
const cardEnd = client.indexOf(
  "{visibleCount < visibleItems.length",
  cardStart,
);
const card = client.slice(cardStart, cardEnd);
assert.ok(cardStart >= 0 && cardEnd > cardStart, "Nie znaleziono kodu karty szkolenia");
assert.ok(
  card.indexOf("{price.label}") < card.indexOf("<h3"),
  "Cena powinna być widoczna nad tytułem",
);
assert.match(card, /const urgencyLabel = soon[\s\S]*?"Dziś"/);
assert.match(card, /aria-label=\{urgencyLabel \? `\$\{date\.weekday\}, \$\{urgencyLabel\}`/);
assert.doesNotMatch(
  card,
  /border-crpe-warning-border bg-crpe-warning-soft text-crpe-warning/,
  "Pilność nie może tworzyć trzeciej plakietki",
);

assert.match(client, /type PriceDeclaration = "unconfirmed" \| "free" \| "paid"/);
assert.match(client, /<option value="unconfirmed">Cena do potwierdzenia<\/option>/);
assert.match(client, /<option value="free">Bezpłatne<\/option>/);
assert.match(client, /<option value="paid">Płatne<\/option>/);
assert.match(client, /priceNum <= 0/);

assert.match(admin, /price_pln: number \| null/);
assert.match(admin, /id="admin-training-price-declaration"/);
assert.match(admin, /id="admin-training-price"/);
assert.match(admin, /editPriceDeclaration === "free"[\s\S]*?\? 0/);
assert.match(admin, /Dla płatnego szkolenia podaj kwotę większą od 0 zł/);

assert.match(detail, /highlight: training\.price_pln === 0/);
assert.match(detail, /border-crpe-success-border bg-crpe-success-soft/);
assert.doesNotMatch(
  detail,
  /label === "Cena"/,
  "Wyróżnienie ceny nie powinno zależeć od tekstu etykiety",
);

for (const [name, source] of [
  ["katalog", client],
  ["szczegóły", detail],
  ["administracja", admin],
]) {
  assert.doesNotMatch(
    source,
    /[\u0400-\u04FF]/,
    `${name}: znaleziono znak cyrylicki`,
  );
}

console.log("v6.15.4 price visibility checks passed");
