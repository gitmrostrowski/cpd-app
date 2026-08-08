export type AccrualActivity = {
  points: number;
  year: number;
  status?: "planned" | "done" | null;
  planned_start_date?: string | null;
};

export type AccrualPoint = {
  x: number;
  value: number;
};

export type AccrualSeries = {
  /** Punkty zdobyte narastająco do dziś. */
  done: AccrualPoint[];
  /** Ciąg dalszy krzywej po dziś, uwzględniający wpisy zaplanowane. */
  planned: AccrualPoint[];
  todayX: number;
  doneTotal: number;
  plannedTotal: number;
  target: number;
  targetToday: number;
  max: number;
  usesApproximateDoneDates: boolean;
};

type BuildAccrualSeriesInput = {
  activities: AccrualActivity[];
  doneActivities: AccrualActivity[];
  periodStart: number;
  periodEnd: number;
  periodTimeProgress: number;
  requiredPoints: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizedPoints(value: number) {
  return Math.max(0, Number(value) || 0);
}

function datePosition(date: string, periodStartMs: number, range: number) {
  const timestamp = new Date(`${date}T12:00:00`).getTime();
  if (!Number.isFinite(timestamp)) return null;
  return clamp((timestamp - periodStartMs) / range, 0, 1);
}

/**
 * Buduje serię narastania bez zależności od Reacta. Ukończony wpis z dokładną
 * datą zachowuje ją na wykresie. Dla starszych wpisów zawierających tylko rok
 * używany jest środek roku. Każdy ukończony wpis jest jednak najpóźniej w
 * punkcie „dziś”, dzięki czemu suma wykresu zawsze zgadza się z nagłówkiem.
 */
export function buildAccrualSeries({
  activities,
  doneActivities,
  periodStart,
  periodEnd,
  periodTimeProgress,
  requiredPoints,
}: BuildAccrualSeriesInput): AccrualSeries | null {
  const target = Math.max(0, Number(requiredPoints) || 0);
  const todayX = clamp(periodTimeProgress / 100, 0, 1);
  const periodStartMs = new Date(periodStart, 0, 1).getTime();
  const range = Math.max(
    1,
    new Date(periodEnd, 11, 31, 23, 59, 59).getTime() - periodStartMs,
  );

  let usesApproximateDoneDates = false;
  const doneRows = doneActivities
    .map((activity) => {
      const exactDate = activity.planned_start_date?.trim() || null;
      const fallbackDate = `${Math.round(Number(activity.year))}-07-01`;
      const exactX = exactDate
        ? datePosition(exactDate, periodStartMs, range)
        : null;
      const fallbackX = datePosition(fallbackDate, periodStartMs, range) ?? 0;

      if (exactX === null) usesApproximateDoneDates = true;

      return {
        x: Math.min(todayX, exactX ?? fallbackX),
        points: normalizedPoints(activity.points),
      };
    })
    .filter((row) => row.points > 0)
    .sort((a, b) => a.x - b.x);

  const done: AccrualPoint[] = [{ x: 0, value: 0 }];
  let running = 0;
  for (const row of doneRows) {
    running += row.points;
    const previous = done.at(-1);
    if (previous && previous.x === row.x) {
      previous.value = running;
    } else {
      done.push({ x: row.x, value: running });
    }
  }
  if ((done.at(-1)?.x ?? 0) < todayX) {
    done.push({ x: todayX, value: running });
  }

  const planned: AccrualPoint[] = [{ x: todayX, value: running }];
  let plannedRunning = running;
  const plannedRows = activities
    .filter(
      (activity) =>
        activity.status === "planned" && Boolean(activity.planned_start_date),
    )
    .map((activity) => ({
      date: String(activity.planned_start_date),
      points: normalizedPoints(activity.points),
    }))
    .filter((activity) => {
      const year = Number(activity.date.slice(0, 4));
      return (
        activity.points > 0 &&
        year >= periodStart &&
        year <= periodEnd
      );
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  for (const row of plannedRows) {
    const x = datePosition(row.date, periodStartMs, range);
    if (x === null) continue;
    plannedRunning += row.points;
    const plannedX = Math.max(todayX, x);
    const previous = planned.at(-1);
    if (previous && previous.x === plannedX) {
      previous.value = plannedRunning;
    } else {
      planned.push({ x: plannedX, value: plannedRunning });
    }
  }

  if (target <= 0 && plannedRunning <= 0) return null;

  return {
    done,
    planned,
    todayX,
    doneTotal: running,
    plannedTotal: plannedRunning,
    target,
    targetToday: target * todayX,
    max: Math.max(target, plannedRunning, running, 1),
    usesApproximateDoneDates,
  };
}
