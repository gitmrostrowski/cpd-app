import { XMLParser } from "fast-xml-parser";
import type {
  AdapterResult,
  DeliveryFormat,
  SourceAdapter,
  TrainingCategory,
  TrainingImportPayload,
} from "../types.js";

type NilItem = Record<string, unknown>;

const FORMAT_MAP: Record<string, DeliveryFormat> = {
  "35": "in_person",
  "36": "online",
};

const PROFESSION_MAP: Record<string, string[]> = {
  "33": ["dentist"],
  "34": ["doctor"],
};

const CATEGORY_MAP: Record<string, TrainingCategory> = {
  "30": "szkolenie",
  "31": "warsztaty",
};

const BROKEN_ENTITY_MAP: Array<[RegExp, string]> = [
  [/oacute/g, "ó"],
  [/aacute/g, "á"],
  [/eacute/g, "é"],
  [/sacute/g, "ś"],
  [/zacute/g, "ź"],
  [/cacute/g, "ć"],
  [/nacute/g, "ń"],
  [/lstrok/g, "ł"],
  [/Lstrok/g, "Ł"],
  [/zdot/g, "ż"],
  [/Zdot/g, "Ż"],
  [/eogon/g, "ę"],
  [/aogon/g, "ą"],
  [/ndash/g, "–"],
  [/mdash/g, "—"],
  [/ldquo|rdquo/g, "”"],
  [/bdquo/g, "„"],
  [/rsquo|lsquo/g, "'"],
  [/hellip/g, "…"],
];

function value(field: unknown): string {
  if (field && typeof field === "object" && "__cdata" in field) {
    return String((field as { __cdata?: unknown }).__cdata ?? "");
  }
  return String(field ?? "");
}

export function fixBrokenEntities(text: string) {
  return BROKEN_ENTITY_MAP.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );
}

export function stripHtml(html: string) {
  return fixBrokenEntities(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;|&#160;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

/** Zachowuje datę kalendarzową NIL w polskiej strefie zamiast obcinać UTC. */
export function toWarsawDate(rssDate: string) {
  const date = new Date(rssDate);
  if (Number.isNaN(date.getTime())) throw new Error(`Nieprawidłowa data: ${rssDate}`);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function currentWarsawDate() {
  return toWarsawDate(new Date().toISOString());
}

function shortTime(raw: string) {
  const match = raw.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  if (!match) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function extractEndTime(description: string) {
  const clean = stripHtml(description);
  const match = clean.match(
    /\bgodz\w*\s*(\d{1,2})\D?(\d{2})\D+(\d{1,2})\D?(\d{2})\b/i,
  );
  if (!match) return null;
  const hour = Number(match[3]);
  const minute = Number(match[4]);
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function extractExternalId(url: string) {
  const match = url.match(/\/(\d+)-/);
  if (!match) throw new Error("brak stabilnego ID w adresie NIL");
  return match[1];
}

function extractSpeakers(shortDescription: string) {
  // Feed NIL często usuwa znaczniki i interpunkcję, łącząc kilka osób w jeden
  // ciąg. Importujemy nazwę tylko przy jednoznacznym, krótkim polu tekstowym.
  const clean = stripHtml(shortDescription);
  const match = clean.match(
    /(?:Wykładowca|Prowadzący):?\s*([^]+?)(?:\s+Szkolenie\b|\s+godz\b|\s+Miejsce\b|\s+Kontakt\b|\s+Program\b|$)/i,
  );
  const candidate = match?.[1]?.trim() ?? "";
  if (!candidate || candidate.length > 120 || /\b(?:oraz|i)\b.*\b(?:dr|lek|prof|mgr)\b/i.test(candidate)) {
    return [];
  }
  return [candidate];
}

function extractVoivodeship(description: string, format: DeliveryFormat) {
  if (format === "online") return null;
  const clean = stripHtml(description);
  if (/Warszaw/i.test(clean)) return "mazowieckie";
  return null;
}

function mapPayment(code: string) {
  if (code === "38") return 0;
  return null;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((entry) => entry.trim()).filter(Boolean)));
}

function hasUndeterminedSchedule(title: string, longDescription: string) {
  const clean = stripHtml(`${title} ${longDescription}`);
  return (
    /lista\s+do\s+zapis[oó]w/i.test(clean) &&
    (/termin[^.]{0,100}(?:zostanie|będzie)[^.]{0,80}(?:ustalon|wypracowan)/i.test(clean) ||
      /(?:zostanie|będzie)[^.]{0,80}(?:ustalon|wypracowan)[^.]{0,80}termin/i.test(clean))
  );
}

function mapItem(
  item: NilItem,
  fetchedAt: string,
  includeFullDescriptions: boolean,
): TrainingImportPayload {
  const url = value(item.registration_link).trim();
  if (!/^https:\/\/nil\.org\.pl\//i.test(url)) {
    throw new Error("nieprawidłowy link rejestracyjny");
  }

  const formatCode = value(item.eventtype).trim();
  const deliveryFormat = FORMAT_MAP[formatCode];
  if (!deliveryFormat) throw new Error(`nieznany eventtype=${formatCode || "brak"}`);

  const professionCode = value(item.forkind).trim();
  const professionCodes = PROFESSION_MAP[professionCode];
  if (!professionCodes) throw new Error(`nieznany forkind=${professionCode || "brak"}`);

  const kindCode = value(item.kind).trim();
  const category = CATEGORY_MAP[kindCode];
  if (!category) throw new Error(`nieznany kind=${kindCode || "brak"}`);

  const rawPoints = Number(value(item.points));
  const points = Number.isFinite(rawPoints) && rawPoints >= 0 ? rawPoints : null;
  const shortDescription = value(item.short_description);
  const longDescription = value(item.long_description);
  const title = fixBrokenEntities(value(item.title)).replace(/\s+/g, " ").trim();
  const scheduleUndetermined = hasUndeterminedSchedule(title, longDescription);
  const startDate = scheduleUndetermined ? null : toWarsawDate(value(item.publish_date));
  const endDateRaw = value(item.publish_date_to).trim();
  const endDate = scheduleUndetermined || !endDateRaw ? null : toWarsawDate(endDateRaw);
  const startTime = scheduleUndetermined ? null : shortTime(value(item.start_time));
  const endTime = startTime ? extractEndTime(shortDescription) : null;
  if (title.length < 3 || title.length > 240) {
    throw new Error(`nieprawidłowa długość tytułu (${title.length})`);
  }

  const speakers = uniqueStrings(extractSpeakers(shortDescription));
  const sourceWarnings: string[] = [];
  if (scheduleUndetermined) sourceWarnings.push("Źródło prowadzi zapisy, ale termin nie został jeszcze ustalony.");
  if (/Wykładow|Prowadząc/i.test(stripHtml(`${shortDescription} ${longDescription}`)) && speakers.length === 0) {
    sourceWarnings.push("Danych o prowadzących nie dało się wiarygodnie rozdzielić — sprawdź stronę NIL.");
  }
  if (!includeFullDescriptions && stripHtml(longDescription)) {
    sourceWarnings.push("Pełny opis NIL pominięto do czasu potwierdzenia zasad dalszej publikacji.");
  }

  return {
    source_external_id: extractExternalId(url),
    source_url: url,
    source_fetched_at: fetchedAt,
    title,
    organizer: "Naczelna Izba Lekarska",
    points,
    delivery_format: deliveryFormat,
    category,
    schedule_status: scheduleUndetermined ? "to_be_determined" : "scheduled",
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
    time_zone: "Europe/Warsaw",
    speakers,
    voivodeship: extractVoivodeship(`${shortDescription} ${longDescription}`, deliveryFormat),
    external_url: url,
    topics: [],
    price_pln: mapPayment(value(item.payment).trim()),
    has_recording: null,
    capacity: null,
    enrollment_status: null,
    description: includeFullDescriptions
      ? stripHtml(longDescription).slice(0, 5000) || null
      : null,
    source_warnings: sourceWarnings,
    audience_scope: "specific",
    profession_codes: professionCodes,
  };
}

export function parseNilFeed(
  xml: string,
  options: {
    fetchedAt?: string;
    asOfDate?: string;
    includeFullDescriptions?: boolean;
  } = {},
): AdapterResult {
  const parser = new XMLParser({ cdataPropName: "__cdata" });
  const parsed = parser.parse(xml) as {
    rss?: { channel?: { item?: NilItem | NilItem[] } };
  };
  const rawItems = parsed.rss?.channel?.item;
  const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];
  if (items.length === 0) throw new Error("RSS NIL nie zawiera żadnych pozycji.");
  if (items.length > 500) throw new Error("RSS NIL przekroczył bezpieczny limit 500 pozycji.");

  const fetchedAt = options.fetchedAt ?? new Date().toISOString();
  const asOfDate = options.asOfDate ?? currentWarsawDate();
  const payloads: TrainingImportPayload[] = [];
  const skipped: AdapterResult["skipped"] = [];
  const seenIds = new Set<string>();

  for (const item of items) {
    const fallbackTitle = fixBrokenEntities(value(item.title)).trim() || "(bez tytułu)";
    try {
      const payload = mapItem(item, fetchedAt, options.includeFullDescriptions === true);
      const lastDate = payload.end_date ?? payload.start_date;
      if (lastDate && lastDate < asOfDate) {
        skipped.push({ title: payload.title, reason: "wydarzenie zakończone" });
        continue;
      }
      if (seenIds.has(payload.source_external_id)) {
        throw new Error(`duplikat ID ${payload.source_external_id} w RSS`);
      }
      seenIds.add(payload.source_external_id);
      payloads.push(payload);
    } catch (error) {
      skipped.push({
        title: fallbackTitle,
        reason: error instanceof Error ? error.message : "błąd mapowania",
      });
    }
  }

  if (payloads.length === 0 && skipped.some((item) => item.reason !== "wydarzenie zakończone")) {
    throw new Error("Żadna pozycja RSS NIL nie przeszła walidacji.");
  }

  return { payloads, skipped, sourceItemCount: items.length };
}

export const nilAdapter: SourceAdapter = {
  code: "nil",
  feedUrl: "https://nil.org.pl/szkolenia-rss",
  parse: parseNilFeed,
};
