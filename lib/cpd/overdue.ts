export type OverdueCandidate = {
  id: string;
  type?: string | null;
  organizer?: string | null;
  points: number;
  status?: "planned" | "done" | null;
  planned_start_date?: string | null;
};

export type OverdueEntry = {
  id: string;
  title: string;
  detail: string | null;
  points: number;
  date: string;
  daysOverdue: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function calendarDayNumber(value: Date) {
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / MS_PER_DAY;
}

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

/** Jedna definicja zaległości dla Panelu CPD, listy i prognozy. */
export function isOverduePlanned(
  activity: Pick<OverdueCandidate, "status" | "planned_start_date">,
  today: Date,
  graceDays = 1,
) {
  if (activity.status !== "planned" || !activity.planned_start_date) return false;
  const planned = parseIsoDate(String(activity.planned_start_date));
  if (!planned || !Number.isFinite(today.getTime())) return false;

  return calendarDayNumber(today) - calendarDayNumber(planned) > graceDays;
}

/**
 * Wpisy zaplanowane, których termin już minął.
 *
 * Taki wpis jest niejednoznaczny: albo szkolenie się odbyło i punkty czekają
 * niepoliczone, albo nie doszło do skutku i wpis jest śmieciem. Dopóki wisi
 * jako „zaplanowane”, zawyża prognozę na wykresie i nie pojawia się w agendzie,
 * bo ta pokazuje wyłącznie przyszłość — użytkownik nie ma go gdzie zobaczyć.
 */
export function overdueEntries({
  activities,
  today,
  graceDays = 1,
}: {
  activities: OverdueCandidate[];
  today: Date;
  /** Dzień zapasu, żeby wpis nie stawał się zaległy w dniu wydarzenia. */
  graceDays?: number;
}): OverdueEntry[] {
  return activities
    .filter((activity) => activity.status === "planned" && activity.planned_start_date)
    .map((activity) => {
      const date = String(activity.planned_start_date);
      const parsed = parseIsoDate(date);
      if (!parsed || !isOverduePlanned(activity, today, graceDays)) return null;

      const daysOverdue = calendarDayNumber(today) - calendarDayNumber(parsed);

      const detail = [activity.organizer, activity.points > 0 ? `${activity.points} pkt` : null]
        .filter(Boolean)
        .join(" · ");

      return {
        id: activity.id,
        title: activity.type || "Zaplanowana aktywność",
        detail: detail || null,
        points: activity.points,
        date,
        daysOverdue,
      };
    })
    .filter((entry): entry is OverdueEntry => entry !== null)
    .sort((a, b) => b.daysOverdue - a.daysOverdue);
}

/** „od 12 dni”, „od 3 mies.”, „od ponad roku” — skala dobrana do zaległości. */
export function formatOverdue(daysOverdue: number) {
  // Dopełniacz: „od 1 dnia”, ale „od 2 dni”, „od 5 dni” — różni się tylko jedynka.
  if (daysOverdue < 60) return `od ${daysOverdue} ${daysOverdue === 1 ? "dnia" : "dni"}`;
  const months = Math.round(daysOverdue / 30.44);
  if (months < 18) return `od ${months} mies.`;
  const years = Math.floor(daysOverdue / 365.25);
  return years === 1 ? "od ponad roku" : `od ponad ${years} lat`;
}
