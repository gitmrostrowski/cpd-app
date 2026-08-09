export type CsvValue = string | number | null | undefined;

/**
 * Ucieczka pola CSV zgodna z RFC 4180: cudzysłowy podwajamy, a pole owijamy
 * w cudzysłowy, gdy zawiera separator, cudzysłów albo koniec wiersza.
 */
export function escapeCsvField(value: CsvValue) {
  const raw = value === null || value === undefined ? "" : String(value);
  // Tytuły i organizatorzy mogą pochodzić od użytkownika. Excel interpretuje
  // pola zaczynające się od tych znaków jako formuły, więc tekst neutralizujemy
  // apostrofem. Wartości liczbowe pozostają liczbami.
  const text =
    typeof value === "string" && /^[\t\r ]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Buduje CSV dla polskiego Excela.
 *
 * Separatorem jest średnik, bo przy przecinku Excel z polskim ustawieniem
 * regionalnym wrzuca cały wiersz do jednej komórki. Deklaracja `sep=;` na
 * początku pliku daje ten sam efekt niezależnie od ustawień systemu.
 */
export function buildCsv(headers: string[], rows: CsvValue[][]) {
  const lines = [
    headers.map(escapeCsvField).join(";"),
    ...rows.map((row) => row.map(escapeCsvField).join(";")),
  ];
  return `sep=;\r\n${lines.join("\r\n")}\r\n`;
}

/** Nazwa pliku bez znaków, których nie zniosą systemy plików. */
export function safeFileName(base: string, extension: string) {
  const cleaned = base
    // „ł” i „Ł” to osobne znaki Unicode, nie litery z diakrytykiem — NFD ich
    // nie rozłoży, więc bez tej podmiany wypadłyby z nazwy pliku bez śladu.
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${cleaned || "raport"}.${extension}`;
}

/**
 * BOM jest konieczny, żeby Excel rozpoznał UTF-8 — bez niego polskie znaki
 * diakrytyczne rozsypują się na „Å›”, „Å‚” itd.
 */
export function downloadCsv(fileName: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Firefox potrzebuje chwili na rozpoczęcie pobierania po usunięciu linku.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
