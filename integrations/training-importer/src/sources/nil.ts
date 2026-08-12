import { XMLParser } from "fast-xml-parser";
import { load, type CheerioAPI } from "cheerio";
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
  "34": ["doctor", "dentist"],
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

function extractTimeRange(description: string) {
  const clean = stripHtml(description);
  const compact = clean.match(/\bgodz\w*\s*(\d{7,8})\b/i);
  const separated = clean.match(
    /\bgodz\w*\s*(\d{1,2})\s*[:.]?\s*(\d{2})\s*(?:[-–—]|do|\s)\s*(\d{1,2})\s*[:.]?\s*(\d{2})\b/i,
  );
  if (!compact && !separated) return null;
  const compactDigits = compact?.[1];
  const parts = compactDigits
    ? compactDigits.length === 7
      ? [compactDigits.slice(0, 1), compactDigits.slice(1, 3), compactDigits.slice(3, 5), compactDigits.slice(5, 7)]
      : [compactDigits.slice(0, 2), compactDigits.slice(2, 4), compactDigits.slice(4, 6), compactDigits.slice(6, 8)]
    : separated?.slice(1, 5);
  if (!parts || parts.length !== 4) return null;
  const startHour = Number(parts[0]);
  const startMinute = Number(parts[1]);
  const endHour = Number(parts[2]);
  const endMinute = Number(parts[3]);
  if (startHour > 23 || startMinute > 59 || endHour > 23 || endMinute > 59) return null;
  return {
    start: `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`,
    end: `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`,
  };
}

function extractExternalId(url: string) {
  const match = url.match(/\/(\d+)-/);
  if (!match) throw new Error("brak stabilnego ID w adresie NIL");
  return match[1];
}

function normalizeSpeaker(value: string) {
  return value
    .replace(/\bdr\s+hab\.?\s+n\.?\s*med\.?/gi, "dr hab. n. med.")
    .replace(/\bdr\s+n\.?\s*med\.?/gi, "dr n. med.")
    .replace(/\bdr\s+nmed\.?/gi, "dr n. med.")
    .replace(/\br\.?\s*pr\.?/gi, "r.pr.")
    .replace(/\s*,?\s+prof\.?\s+([A-ZĄĆĘŁŃÓŚŹŻ]{2,5})\b/u, ", prof. $1")
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

function extractSpeakers(shortDescription: string) {
  // Feed NIL często usuwa znaczniki i interpunkcję, łącząc kilka osób w jeden
  // ciąg. Importujemy nazwę tylko przy jednoznacznym, krótkim polu tekstowym.
  const clean = stripHtml(shortDescription);
  const match = clean.match(
    /(?:Wykładowc(?:a|y)|Prowadząc(?:y|a)):?\s*([^]+?)(?:\s+Szkolenie\b|\s+godz\b|\s+Miejsce\b|\s+Kontakt\b|\s+Program\b|$)/i,
  );
  const candidate = match?.[1]?.trim() ?? "";
  const capitalizedNameParts = candidate.match(/\b[A-ZĄĆĘŁŃÓŚŹŻ][a-ząćęłńóśźż-]+\b/gu) ?? [];
  if (
    !candidate ||
    candidate.length > 120 ||
    capitalizedNameParts.length >= 4 ||
    /\b(?:oraz|i)\b.*\b(?:dr|lek|prof|mgr)\b/i.test(candidate)
  ) {
    return [];
  }
  return [normalizeSpeaker(candidate)];
}

function extractLocation(description: string, format: DeliveryFormat) {
  if (format === "online") return null;
  const clean = stripHtml(description);
  const match = clean.match(
    /Miejsce\s+wydarzenia:?\s*(.+?)(?=\s+\d{8}\b|\s+godz\w*\b|\s+Kontakt\b|$)/i,
  );
  const location = match?.[1]?.trim() ?? "";
  if (!location) return null;
  if (/Centrum\s+SzkoleniowoKonferencyjne.*Sobieskiego\s+110.*Warszaw/i.test(location)) {
    return "Centrum Szkoleniowo-Konferencyjne Naczelnej Izby Lekarskiej, ul. Sobieskiego 110, Warszawa";
  }
  if (/Naczelna\s+Izba\s+Lekarska.*Sobieskiego\s+110.*Warszaw/i.test(location)) {
    return "Naczelna Izba Lekarska, ul. Sobieskiego 110, Warszawa";
  }
  return location.slice(0, 160);
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
  const timeRange = scheduleUndetermined ? null : extractTimeRange(shortDescription);
  const startTime = scheduleUndetermined
    ? null
    : timeRange?.start ?? shortTime(value(item.start_time));
  const endTime = startTime ? timeRange?.end ?? null : null;
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
    voivodeship: extractLocation(`${shortDescription} ${longDescription}`, deliveryFormat),
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

function cleanPageText(value: string) {
  return value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

function comparisonTokens(value: string) {
  return new Set(
    cleanPageText(value)
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("pl-PL")
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((token) => token.length > 2),
  );
}

function titleSimilarity(left: string, right: string) {
  const a = comparisonTokens(left);
  const b = comparisonTokens(right);
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / Math.max(a.size, b.size);
}

function extractDetailTitle($: CheerioAPI, fallback: string) {
  const best = $("h1, h2, h3")
    .toArray()
    .map((element) => cleanPageText($(element).text()))
    .filter((title) => title.length >= 3 && title.length <= 240 && !/najnowsze szkolenia/i.test(title))
    .map((title) => ({ title, score: titleSimilarity(title, fallback) }))
    .sort((left, right) => right.score - left.score)[0];
  return best && best.score >= 0.55 ? best.title : fallback;
}

function extractDetailAudience(pageText: string) {
  if (/szkolenie\s+(?:dla\s+)?lekarzy\s+i\s+lekarzy\s+dentyst/i.test(pageText)) {
    return ["doctor", "dentist"];
  }
  if (/szkolenie\s+(?:dla\s+)?lekarzy\s+dentyst/i.test(pageText)) return ["dentist"];
  if (/szkolenie\s+(?:dla\s+)?lekarzy\b/i.test(pageText)) return ["doctor"];
  return null;
}

function extractDetailFormat(pageText: string): DeliveryFormat | null {
  if (/\bhybrydow/i.test(pageText)) return "hybrid";
  if (/\be[- ]?learning\b|szkolenie\s+on[- ]?line|szkolenie\s+online/i.test(pageText)) {
    return "online";
  }
  if (/\bstacjonarn/i.test(pageText)) return "in_person";
  return null;
}

/**
 * Kolejność ma znaczenie: „ZAPIS OTWARTY - LISTA REZERWOWA” zawiera w sobie
 * frazę otwarcia, więc lista rezerwowa musi być sprawdzana pierwsza.
 * Zwracany null oznacza „nie rozpoznano”, a nie „brak zapisów” — decyzję,
 * co z tym zrobić, podejmuje warstwa importu.
 */
function extractEnrollmentStatus(pageText: string): TrainingImportPayload["enrollment_status"] {
  if (/LISTA\s+REZERWOWA/i.test(pageText)) return "waiting_list";
  if (
    /ZAPIS(?:Y)?\s+(?:ZAMKNIĘT|ZAKOŃCZON)|REKRUTACJA\s+ZAKOŃCZONA|BRAK\s+(?:WOLNYCH\s+)?MIEJSC/i.test(
      pageText,
    )
  ) {
    return "closed";
  }
  if (/ZAPIS(?:Y)?\s+OTWART/i.test(pageText)) return "open";
  return null;
}

function extractDetailPoints(pageText: string) {
  const match = pageText.match(/\bPunkty:\s*(\d+(?:[.,]\d+)?)\b/i);
  if (!match) return null;
  const points = Number(match[1].replace(",", "."));
  return Number.isFinite(points) && points >= 0 ? points : null;
}

function speakerFromBiography(value: string) {
  const clean = normalizeSpeaker(cleanPageText(value))
    .replace(/\s+[-–—]\s+.*$/u, "")
    .replace(/-(?=\p{Ll})[^,]*$/u, "")
    .replace(/,\s*(?:doktor|lekarka|lekarz|pediatra|specjalista|certyfikowana|kierowniczka|psycholożka|trenerka|adwokat|wpisany|od\s+\d).*$/iu, "")
    .replace(/\s+(?:doktor|lekarka|lekarz|pediatra|specjalista|certyfikowana|kierowniczka|psycholożka|trenerka|adwokat|wpisany|od\s+\d).*$/iu, "")
    .trim();
  return clean.length >= 3 && clean.length <= 180 ? clean : null;
}

function extractDetailSpeakers($: CheerioAPI) {
  const biographySpeakers: string[] = [];
  $("h4, h5").each((_, heading) => {
    const headingText = cleanPageText($(heading).text());
    if (!/^Wykładowc(?:a|y):?$/i.test(headingText)) return;
    const list = $(heading).nextAll("ul").first();
    list.find("li").each((__, item) => {
      const speaker = speakerFromBiography($(item).text());
      if (speaker) biographySpeakers.push(speaker);
    });
  });

  const concise: string[] = [];
  $("h6").each((_, heading) => {
    const text = cleanPageText($(heading).text());
    const match = text.match(/^(?:Wykładowc(?:a|y)|Prowadząc(?:y|a)):?\s*(.+)$/i);
    const candidate = match?.[1]?.trim();
    if (candidate && candidate.length <= 180) concise.push(normalizeSpeaker(candidate));
  });

  if (biographySpeakers.length > 1) return uniqueStrings(biographySpeakers);
  if (concise.length > 0) return uniqueStrings(concise);
  return uniqueStrings(biographySpeakers);
}

function extractDetailLocation($: CheerioAPI, format: DeliveryFormat) {
  if (format === "online") return null;
  let result: string | null = null;
  $("h5, h6").each((_, heading) => {
    if (result) return;
    const text = cleanPageText($(heading).text());
    const match = text.match(/^Miejsce\s+wydarzenia:?\s*(.+)$/i);
    if (match?.[1]) result = match[1].trim().slice(0, 160);
  });
  return result;
}

/** Uzupełnia rekord danymi z oficjalnej strony szczegółowej NIL. */
export function enrichNilTraining(
  payload: TrainingImportPayload,
  html: string,
): TrainingImportPayload {
  const $ = load(html);
  const pageText = cleanPageText($("body").text());
  if (pageText.length < 100) throw new Error("strona szczegółowa NIL jest pusta");

  const detailFormat = extractDetailFormat(pageText) ?? payload.delivery_format;
  const detailTimes = extractTimeRange(pageText);
  const detailSpeakers = extractDetailSpeakers($);
  const detailAudience = extractDetailAudience(pageText);
  const detailPoints = extractDetailPoints(pageText);
  const detailEnrollment = extractEnrollmentStatus(pageText);
  const warnings =
    detailSpeakers.length > 0
      ? payload.source_warnings.filter(
          (warning) =>
            !/Danych o prowadzących nie dało się wiarygodnie rozdzielić/i.test(warning),
        )
      : [...payload.source_warnings];
  if (detailPoints !== null && payload.points !== null && detailPoints !== payload.points) {
    warnings.push(
      `Punkty na stronie szczegółowej (${detailPoints}) różnią się od RSS (${payload.points}); użyto strony szczegółowej.`,
    );
  }
  // Cicha zmiana szablonu NIL nie może wyglądać jak zamknięcie zapisów.
  if (detailEnrollment === null) {
    warnings.push(
      "Nie rozpoznano stanu zapisów na stronie NIL — zachowano dotychczasową wartość.",
    );
  }

  return {
    ...payload,
    title: extractDetailTitle($, payload.title),
    points: detailPoints ?? payload.points,
    delivery_format: detailFormat,
    start_time:
      payload.schedule_status === "scheduled"
        ? detailTimes?.start ?? payload.start_time
        : null,
    end_time:
      payload.schedule_status === "scheduled"
        ? detailTimes?.end ?? payload.end_time
        : null,
    speakers: detailSpeakers.length > 0 ? detailSpeakers : payload.speakers,
    voivodeship:
      extractDetailLocation($, detailFormat) ??
      (detailFormat === "online" ? null : payload.voivodeship),
    enrollment_status: detailEnrollment ?? payload.enrollment_status,
    profession_codes: detailAudience ?? payload.profession_codes,
    source_warnings: uniqueStrings(warnings),
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
  enrich: enrichNilTraining,
};
