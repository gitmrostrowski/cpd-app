export type DeadlineActivity = {
  id: string;
  type?: string | null;
  organizer?: string | null;
  points: number;
  status?: "planned" | "done" | null;
  planned_start_date?: string | null;
};

export type UpcomingEntry = {
  id: string;
  title: string;
  detail: string | null;
  points: number;
  date: string;
  daysAway: number;
};

export type PeriodDeadline = {
  /** Data końca okresu w formacie ISO. */
  date: string;
  daysAway: number;
  /** Pozostała część roku w zapisie dziesiętnym — używana do wyliczenia tempa. */
  yearsLeft: number;
  /** Czy data wynika z reguły przypiętej do PWZ, czy tylko z końcowego roku okresu. */
  source: "pwz_rule" | "period_year";
};

export type RequiredPace = {
  pointsPerYear: number;
  yearsLeft: number;
  /** Cel jest już osiągnięty albo nie ma czego liczyć. */
  achieved: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseISODate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, timestamp };
}

function toISODate(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate(),
  ).padStart(2, "0")}`;
}

function addCalendarMonths(isoDate: string, months: number) {
  const start = parseISODate(isoDate);
  if (!start || !Number.isInteger(months) || months <= 0) return null;

  const monthIndex = start.year * 12 + (start.month - 1) + months;
  const year = Math.floor(monthIndex / 12);
  const month = monthIndex - year * 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(start.day, lastDay);

  return Date.UTC(year, month, day);
}

export function daysBetween(from: Date, isoDate: string) {
  const target = parseISODate(isoDate);
  if (!target || !Number.isFinite(from.getTime())) return null;

  // Liczymy numery dni kalendarzowych w UTC. Dzięki temu zmiana czasu
  // letniego/zimowego nie tworzy różnic 23- lub 25-godzinnych.
  const fromDay = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((target.timestamp - fromDay) / MS_PER_DAY);
}

/**
 * Koniec okresu rozliczeniowego. Gdy znamy datę wydania PWZ, okres biegnie od
 * niej, więc kończy się dzień przed rocznicą — a nie 31 grudnia. Bez daty PWZ
 * wracamy do końca roku kalendarzowego, bo tylko tyle wiadomo.
 */
export function resolvePeriodDeadline({
  periodEnd,
  pwzIssueDate,
  ruleMonths,
  today,
}: {
  periodEnd: number;
  pwzIssueDate?: string | null;
  ruleMonths?: number | null;
  today: Date;
}): PeriodDeadline | null {
  if (!Number.isInteger(periodEnd) || periodEnd < 1900 || periodEnd > 2100) return null;

  const anniversary = pwzIssueDate && ruleMonths
    ? addCalendarMonths(pwzIssueDate, ruleMonths)
    : null;
  const source = anniversary === null ? "period_year" : "pwz_rule";
  const iso =
    anniversary === null
      ? `${periodEnd}-12-31`
      : toISODate(anniversary - MS_PER_DAY);

  const daysAway = daysBetween(today, iso);
  if (daysAway === null) return null;

  return {
    date: iso,
    daysAway,
    yearsLeft: Math.max(0, daysAway / 365.25),
    source,
  };
}

/**
 * Ile punktów trzeba zdobywać rocznie przez pozostały czas. Panel dotąd mówił
 * tylko, o ile jest się w tyle — ta liczba mówi, co z tym zrobić.
 */
export function requiredPace({
  missingPoints,
  deadline,
}: {
  missingPoints: number;
  deadline: PeriodDeadline | null;
}): RequiredPace | null {
  if (!deadline) return null;
  if (missingPoints <= 0) return { pointsPerYear: 0, yearsLeft: deadline.yearsLeft, achieved: true };
  if (deadline.daysAway <= 0) return null;

  // Poniżej dwóch miesięcy roczne tempo przestaje cokolwiek znaczyć.
  if (deadline.yearsLeft < 1 / 6) return null;

  return {
    pointsPerYear: Math.ceil(missingPoints / deadline.yearsLeft),
    yearsLeft: deadline.yearsLeft,
    achieved: false,
  };
}

export function upcomingEntries({
  activities,
  today,
  limit = 3,
}: {
  activities: DeadlineActivity[];
  today: Date;
  limit?: number;
}): UpcomingEntry[] {
  const safeLimit = Math.max(0, Math.trunc(limit));

  return activities
    .filter((a) => a.status === "planned" && a.planned_start_date)
    .map((a) => {
      const date = String(a.planned_start_date).trim();
      const daysAway = daysBetween(today, date);
      if (daysAway === null) return null;

      const organizer = a.organizer?.trim() || null;
      const points = Number.isFinite(a.points) ? Math.max(0, a.points) : 0;
      const detail = [organizer, points > 0 ? `${points} pkt` : null]
        .filter(Boolean)
        .join(" · ");

      return {
        id: a.id,
        title: a.type || "Zaplanowana aktywność",
        detail: detail || null,
        points,
        date,
        daysAway,
      };
    })
    .filter((entry): entry is UpcomingEntry => entry !== null && entry.daysAway >= 0)
    .sort((a, b) => a.daysAway - b.daysAway)
    .slice(0, safeLimit);
}

/** „za 18 dni”, „za 3 mies.”, „za 3 lata 3 mies.” — skala dobrana do odległości. */
export function formatCountdown(daysAway: number) {
  if (daysAway < 0) return "po terminie";
  if (daysAway === 0) return "dziś";
  if (daysAway === 1) return "jutro";
  // Do dwóch miesięcy podajemy dni. Przy progu 45 termin oddalony o 49 dni
  // zaokrąglał się do „za 2 mies.”, co zawyżało odległość o pół miesiąca.
  if (daysAway < 60) return `za ${daysAway} dni`;

  const months = Math.round(daysAway / 30.44);
  if (months < 18) return `za ${months} mies.`;

  const years = Math.floor(daysAway / 365.25);
  const restMonths = Math.round((daysAway - years * 365.25) / 30.44);

  // Zaokrąglenie potrafi dać 12 miesięcy reszty — wtedy to po prostu kolejny rok.
  const totalYears = restMonths >= 12 ? years + 1 : years;
  const trailingMonths = restMonths >= 12 ? 0 : restMonths;
  const yearLabel = totalYears === 1 ? "rok" : totalYears < 5 ? "lata" : "lat";

  return trailingMonths > 0
    ? `za ${totalYears} ${yearLabel} ${trailingMonths} mies.`
    : `za ${totalYears} ${yearLabel}`;
}
