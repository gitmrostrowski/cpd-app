// lib/cpd/calc.ts

export type CpdStatusTone = "ok" | "warn" | "risk" | "neutral";

export type CpdStatus = {
  tone: CpdStatusTone;
  title: string;
  desc: string;
};

export type Period = { start: number; end: number };

export type ActivityLike = {
  points: number | string;
  year: number | string;
  type?: string | null;
};

export type AppliedActivity<T extends ActivityLike = ActivityLike> = T & {
  in_period: boolean;
  applied_points: number; // ile realnie liczymy do sumy (po okresie i limitach)
  warning?: string | null;
};

export type CpdRules = {
  /**
   * Limit roczny (max zaliczanych punktów) per typ aktywności.
   * Klucz to dokładna wartość `activity.type`.
   *
   * Przykład:
   * { "Samokształcenie": 20 }
   */
  yearlyMaxByType?: Record<string, number>;
};

export function normalizePeriod(period: Period): Period {
  const start = Math.min(period.start, period.end);
  const end = Math.max(period.start, period.end);
  return { start, end };
}

export function inPeriod(year: number, period: Period): boolean {
  const p = normalizePeriod(period);
  return year >= p.start && year <= p.end;
}

/**
 * Stara funkcja (kompatybilność):
 * - liczy punkty
 * - opcjonalnie filtruje po okresie
 * - NIE stosuje limitów kategorii
 */
export function sumPoints(activities: ActivityLike[], period?: Period): number {
  const p = period ? normalizePeriod(period) : null;

  return activities.reduce((sum, a) => {
    const pts = Number(a.points);
    const yr = Number(a.year);

    if (!Number.isFinite(pts) || pts < 0) return sum;
    if (!Number.isFinite(yr)) return sum;

    if (p && !inPeriod(yr, p)) return sum;

    return sum + pts;
  }, 0);
}

/**
 * Nowe: zastosuj okres + limity i zwróć listę „applied” do UI / raportów.
 * Deterministyczne: te same wejścia => te same wyniki.
 */
export function applyRules<T extends ActivityLike>(
  activities: T[],
  opts?: { period?: Period; rules?: CpdRules },
): AppliedActivity<T>[] {
  const p = opts?.period ? normalizePeriod(opts.period) : null;
  const rules = opts?.rules;
  const yearlyMaxByType = rules?.yearlyMaxByType ?? {};

  // użyte punkty per (type, year) do limitu rocznego
  const usedByTypeYear = new Map<string, number>();

  return activities.map((a) => {
    const pts = Number(a.points);
    const yr = Number(a.year);
    const type = (a.type ?? "") as string;

    const ptsSafe = Number.isFinite(pts) && pts > 0 ? pts : 0;
    const yrSafe = Number.isFinite(yr) ? yr : NaN;

    // brak sensownego roku => nie liczymy
    if (!Number.isFinite(yrSafe)) {
      return {
        ...a,
        in_period: false,
        applied_points: 0,
        warning: "Niepoprawny rok — pozycja nie zostanie policzona.",
      };
    }

    const in_period = p ? inPeriod(yrSafe, p) : true;

    // poza okresem => 0
    if (!in_period) {
      return {
        ...a,
        in_period,
        applied_points: 0,
        warning: p ? `Poza okresem ${p.start}–${p.end} — punkty nie zostaną zaliczone.` : null,
      };
    }

    // limit roczny per typ
    const yearlyMax = Number(yearlyMaxByType[type]);
    if (Number.isFinite(yearlyMax) && yearlyMax > 0) {
      const key = `${type}__${yrSafe}`;
      const used = usedByTypeYear.get(key) ?? 0;
      const remaining = Math.max(0, yearlyMax - used);

      const applied = Math.min(ptsSafe, remaining);
      usedByTypeYear.set(key, used + applied);

      const over = ptsSafe - applied;
      const warning =
        over > 0
          ? `Limit roczny dla „${type}”: ${yearlyMax} pkt. Ta pozycja zaliczy ${applied} pkt (nadwyżka ${over} pkt nie zwiększy sumy).`
          : null;

      return {
        ...a,
        in_period,
        applied_points: applied,
        warning,
      };
    }

    // brak limitu
    return {
      ...a,
      in_period,
      applied_points: ptsSafe,
      warning: null,
    };
  });
}

/**
 * Nowe: suma punktów wg zasad (okres + limity).
 * Używaj tego w kalkulatorze zamiast ręcznego reduce, żeby wszędzie było spójnie.
 */
export function sumPointsWithRules(
  activities: ActivityLike[],
  opts?: { period?: Period; rules?: CpdRules },
): number {
  const applied = applyRules(activities, opts);
  return applied.reduce((sum, a) => sum + (a.applied_points || 0), 0);
}

export function calcMissing(total: number, required: number): number {
  const req = Number(required);
  const tot = Number(total);
  if (!Number.isFinite(req) || req <= 0) return 0;
  if (!Number.isFinite(tot) || tot < 0) return req;
  return Math.max(0, req - tot);
}

export function calcProgress(total: number, required: number): number {
  const req = Number(required);
  const tot = Number(total);
  if (!Number.isFinite(req) || req <= 0) return 0;
  if (!Number.isFinite(tot) || tot <= 0) return 0;
  return Math.max(0, Math.min(100, (tot / req) * 100));
}

export function getStatus(total: number, required: number): CpdStatus {
  const req = Number(required);
  const tot = Number(total);

  if (!Number.isFinite(req) || req <= 0) {
    return {
      tone: "neutral",
      title: "Ustaw wymagane punkty",
      desc: "Podaj liczbę wymaganych punktów dla wybranego okresu.",
    };
  }

  const missing = calcMissing(tot, req);

  if (missing <= 0) {
    return {
      tone: "ok",
      title: "Wygląda dobrze ✅",
      desc: "Masz wystarczającą liczbę punktów na ten okres.",
    };
  }

  if (missing <= 20) {
    return {
      tone: "warn",
      title: "Prawie! 🟡",
      desc: "Brakuje niewiele — warto zaplanować 1–2 aktywności.",
    };
  }

  return {
    tone: "risk",
    title: "Do nadrobienia 🔴",
    desc: "Brakuje sporo punktów — rozważ plan uzupełnień na najbliższe miesiące.",
  };
}

export function getQuickRecommendations(missing: number): string[] {
  const m = Math.max(0, Number(missing) || 0);
  if (m <= 0) return [];

  const combos: string[] = [];

  const nWebinars = Math.ceil(m / 10);
  combos.push(`${nWebinars}× webinar/kurs online (po 10 pkt) ≈ ${nWebinars * 10} pkt`);

  const nConfs = Math.ceil(m / 20);
  combos.push(`${nConfs}× konferencja (po 20 pkt) ≈ ${nConfs * 20} pkt`);

  const mix = Math.max(1, Math.floor(m / 20));
  const rest = Math.max(0, m - mix * 20);
  const restWebinars = Math.ceil(rest / 10);
  combos.push(
    `${mix}× konferencja (20 pkt) + ${restWebinars}× webinar (10 pkt) ≈ ${mix * 20 + restWebinars * 10} pkt`,
  );

  return Array.from(new Set(combos)).slice(0, 3);
}
