import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import { safeInternalPath } from "../lib/navigation/safeInternalPath.ts";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const exists = async (path) => {
  try {
    await access(new URL(path, root));
    return true;
  } catch {
    return false;
  }
};

const packageJson = JSON.parse(await read("package.json"));

// --- 1. Jeden nagłówek na wszystkich ekranach aplikacji ---
assert.ok(await exists("components/AppPageHeader.tsx"), "Brak wspólnego nagłówka ekranów aplikacji");

const appScreens = [
  "app/panel-cpd/CalculatorClient.tsx",
  "app/baza-szkolen/TrainingHubClient.tsx",
  "app/aktywnosci/page.tsx",
  "app/profil/page.tsx",
  "app/raporty/RaportsClient.tsx",
];

for (const screen of appScreens) {
  const source = await read(screen);
  assert.match(source, /<AppPageHeader/, `${screen} musi używać wspólnego nagłówka`);
  assert.doesNotMatch(
    source,
    /<h1 className="text-2xl font-bold text-slate-900">/,
    `${screen} nie może wracać do własnego, lżejszego nagłówka`,
  );
}

const header = await read("components/AppPageHeader.tsx");
assert.match(header, /text-\[28px\] font-black[\s\S]*sm:text-\[32px\]/, "Nagłówek musi mieć jeden rozmiar dla wszystkich ekranów");

// --- 2. Trasy: żadnej treści pod dwoma adresami ---
assert.ok(await exists("app/aktywnosci/page.tsx"), "Aktywności żyją pod polskim adresem");
assert.ok(await exists("app/panel-cpd/CalculatorClient.tsx"), "Panel CPD żyje pod /panel-cpd");

const kalkulatorAlias = await read("app/kalkulator/page.tsx");
assert.match(kalkulatorAlias, /permanentRedirect\("\/panel-cpd"\)/, "/kalkulator musi trwale przekierowywać, nie renderować");
assert.doesNotMatch(kalkulatorAlias, /CalculatorClient/, "Alias nie może renderować drugiej kopii panelu");

for (const [file, target] of [
  ["app/activities/page.tsx", "/aktywnosci"],
  ["app/activities/new/page.tsx", "/aktywnosci/new"],
]) {
  const alias = await read(file);
  assert.match(alias, /permanentRedirect\(/, `${file} musi być wyłącznie trwałym przekierowaniem`);
  assert.ok(alias.includes(`"${target}"`), `${file} musi prowadzić do ${target}`);
  assert.doesNotMatch(alias, /ActivitiesPage|createActivity|fetchActivities/, `${file} nie może duplikować treści`);
}
assert.match(
  await read("app/activities/[id]/page.tsx"),
  /permanentRedirect\(`\/aktywnosci\/\$\{encodeURIComponent\(id\)\}`\)/,
  "Stare linki do szczegółów aktywności nie mogą kończyć się 404",
);

for (const file of ["components/Header.tsx", "components/Footer.tsx", "app/narzedzia/page.tsx", "app/pomoc/page.tsx"]) {
  const source = await read(file);
  assert.doesNotMatch(source, /"\/kalkulator"/, `${file} musi linkować do /panel-cpd`);
  assert.doesNotMatch(source, /"\/activities"/, `${file} musi linkować do /aktywnosci`);
}

// --- 3. Mapa witryny: publiczne strony tak, ekrany za logowaniem nie ---
const sitemap = await read("app/sitemap.ts");
for (const path of ["/bezpieczenstwo", "/dla-organizatora", "/regulamin", "/polityka-prywatnosci"]) {
  assert.ok(sitemap.includes(`"${path}"`), `Mapa witryny pomija publiczną stronę ${path}`);
}
for (const path of ["/panel-cpd", "/aktywnosci", "/raporty"]) {
  assert.ok(
    !sitemap.includes(`"${path}",`),
    `Mapa witryny nie powinna zawierać ekranu za logowaniem ${path}`,
  );
}

// --- 4. Strony publiczne: bez wskaźników o stałej wartości ---
const tools = await read("app/narzedzia/page.tsx");
assert.doesNotMatch(tools, /Dostępne<\/span>/, "Plakietka o tej samej wartości na każdej karcie nie niesie informacji");
assert.match(tools, /index === 0\s*\n?\s*\?/, "Jedno wypełnione CTA zamiast czterech identycznych");

const help = await read("app/pomoc/page.tsx");
assert.match(help, /flex h-full flex-col rounded-\[24px\]/, "Karty pomocy muszą wyrównywać się w rzędzie");
assert.doesNotMatch(help, /grid items-start gap-4 md:grid-cols-2/, "items-start dawał poszarpane dolne krawędzie");
assert.match(help, /Zasady i zakres CRPE/, "Dwa zestawy pytań muszą się różnić celem, nie tylko miejscem");
assert.match(help, /xl:grid-cols-12/, "Drugi rząd trzech kart powinien wypełniać szerokość siatki");

// --- 5. Role organizacyjne widzą, jak chronione są dane zespołu ---
const home = await read("app/page.tsx");
assert.match(home, /Jak chronimy dane zespołu/, "Placówka i organizator potrzebują linku o ochronie danych");
assert.match(home, /selected !== "medyk" \? \(/, "Link pokazujemy tylko rolom organizacyjnym");

// --- 6. Nic nie zostało po przenosinach ---
const scripts = await readdir(new URL("scripts/", root));
for (const file of scripts.filter((name) => name.endsWith(".mjs"))) {
  if (file === "check-v6-21-consistency-and-routes.mjs") continue;
  const source = await read(`scripts/${file}`);
  assert.doesNotMatch(source, /app\/kalkulator\/CalculatorClient/, `${file} wskazuje na przeniesiony plik`);
  assert.doesNotMatch(source, /app\/activities\/page/, `${file} wskazuje na przeniesiony plik`);
}

assert.equal(
  packageJson.scripts?.["check:v6.21"],
  "node --experimental-strip-types scripts/check-v6-21-consistency-and-routes.mjs",
  "package.json musi udostępniać test v6.21",
);

// Parametr `next` jest używany po logowaniu. Backslash nie może po
// normalizacji URL zamienić względnej ścieżki w przekierowanie zewnętrzne.
assert.equal(safeInternalPath("/aktywnosci?new=1", "/panel-cpd"), "/aktywnosci?new=1");
assert.equal(safeInternalPath("//evil.example", "/panel-cpd"), "/panel-cpd");
assert.equal(safeInternalPath("/\\\\evil.example", "/panel-cpd"), "/panel-cpd");
assert.equal(safeInternalPath("https://evil.example", "/panel-cpd"), "/panel-cpd");

// --- 7. Żadnego linku w nikąd ---
const routedFiles = [
  "app/aktywnosci/actions.ts",
  "app/aktywnosci/[id]/page.tsx",
  "app/portfolio/page.tsx",
];
for (const file of routedFiles) {
  const source = await read(file);
  // Szablony w backtickach łatwo pominąć przy zmianie nazwy trasy.
  assert.doesNotMatch(source, /\/activities\//, `${file} prowadzi pod nieistniejącą trasę /activities/`);
  assert.doesNotMatch(source, /"\/logowanie"/, `${file} prowadzi pod nieistniejącą trasę /logowanie`);
}

console.log("v6.21 header consistency, routes and public pages checks passed");
