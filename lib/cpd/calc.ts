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

  /**
   * Opcjonalnie (jeśli masz w danych):
   * - created_at pozwoli na stabilne, deterministyczne stosowanie limitów
   *   przy wielu wpisach w tym samym roku/typie
   */
  created_at?: string | null;
};

export type AppliedActivity<T extends ActivityLike = ActivityLike> = T & {
  in_period: boolean;

  // ile realnie liczymy do sumy (po okresie i limitach)
  applied_points: number;

  // dodatkowe pola do UI (nieobowiązkowe, ale ułatwiają raportowanie)
  raw_points?: number; // ile było "na wejściu" (po sanityzacji)
  over_points?: number; // ile "spadło" przez limit roczny
  yearly_cap?: number | null; // jeśli typ ma limit: wartość limitu / rok

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
 * Wewnętrzne: stabilne sortowanie do deterministycznego nakładania limitów.
 * Dzięki temu limit roczny nie zależy od „kolejności z bazy/UI”.
 */
function stableSortForRules<T extends ActivityLike>(activities: T[]): T[] {
  // Kopia, nie mutujemy wejścia
  const arr = [...activities];

  // Sort:
  // 1) rok rosnąco
  // 2) typ alfabetycznie
  // 3) created_at rosnąco (jeśli jest)
  // 4) punkty rosnąco (ostateczny tie-breaker)
  arr.sort((a, b) => {
    const ya = Number(a.year);
    const yb = Number(b.year);
    if (Number.isFinite(ya) && Number.isFinite(yb) && ya !== yb) return ya - yb;

    const ta = String(a.type ?? "");
    const tb = String(b.type ?? "");
    if (ta !== tb) return ta.localeCompare(tb, "pl");

    const ca = a.created_at ? Date.parse(a.created_at) : NaN;
    const cb = b.created_at ? Date.parse(b.created_at) : NaN;
    if (Number.isFinite(ca) && Number.isFinite(cb) && ca !== cb) return ca - cb;
    if (Number.isFinite(ca) && !Number.isFinite(cb)) return -1;
    if (!Number.isFinite(ca) && Number.isFinite(cb)) return 1;

    const pa = Number(a.points);
    const pb = Number(b.points);
    if (Number.isFinite(pa) && Number.isFinite(pb) && pa !== pb) return pa - pb;

    return 0;
  });

  return arr;
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

  // Stabilna kolejność = stabilne limitowanie
  const ordered = stableSortForRules(activities);

  // użyte punkty per (type, year) do limitu rocznego
  const usedByTypeYear = new Map<string, number>();

  return ordered.map((a) => {
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
        raw_points: ptsSafe,
        over_points: 0,
        yearly_cap: null,
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
        raw_points: ptsSafe,
        over_points: 0,
        yearly_cap: null,
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

      const over = Math.max(0, ptsSafe - applied);
      const warning =
        over > 0
          ? `Limit roczny dla „${type}”: ${yearlyMax} pkt. Ta pozycja zaliczy ${applied} pkt (nadwyżka ${over} pkt nie zwiększy sumy).`
          : null;

      return {
        ...a,
        in_period,
        applied_points: applied,
        raw_points: ptsSafe,
        over_points: over,
        yearly_cap: yearlyMax,
        warning,
      };
    }

    // brak limitu
    return {
      ...a,
      in_period,
      applied_points: ptsSafe,
      raw_points: ptsSafe,
      over_points: 0,
      yearly_cap: null,
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

/**
 * NOWE: gotowe dane do sekcji „Limity cząstkowe” i „Punkty wg kategorii”.
 *
 * Zwraca:
 * - perType: suma raw/applied/over w kategorii
 * - perTypeCapInPeriod: ile maksymalnie może się zaliczyć w okresie (jeśli jest limit roczny)
 * - perTypeYear: szczegóły roczne (dla tooltipów / rozwijania)
 */
export type LimitSummary = {
  period?: Period | null;
  yearsInPeriod: number;

  perType: Array<{
    type: string;
    raw: number; // suma punktów wpisanych (w okresie)
    applied: number; // suma zaliczona (po limitach)
    over: number; // suma nadwyżki (raw - applied)
    yearlyCap: number | null; // limit / rok dla typu
    capInPeriod: number | null; // limit w całym okresie (yearlyCap * yearsInPeriod)
    usedPct: number | null; // applied / capInPeriod
  }>;

  perTypeYear: Array<{
    type: string;
    year: number;
    raw: number;
    applied: number;
    over: number;
    yearlyCap: number | null;
    usedPct: number | null; // applied / yearlyCap
  }>;
};

export function summarizeLimits(
  activities: ActivityLike[],
  opts?: { period?: Period; rules?: CpdRules },
): LimitSummary {
  const p = opts?.period ? normalizePeriod(opts.period) : null;
  const rules = opts?.rules;
  const yearlyMaxByType = rules?.yearlyMaxByType ?? {};

  const applied = applyRules(activities, { period: p ?? undefined, rules });

  const yearsInPeriod =
    p && Number.isFinite(p.start) && Number.isFinite(p.end)
      ? Math.max(1, p.end - p.start + 1)
      : 1;

  // per (type, year)
  const mapTY = new Map<string, { type: string; year: number; raw: number; applied: number; over: number }>();

  for (const a of applied) {
    if (!a.in_period) continue;

    const type = String(a.type ?? "");
    const year = Number(a.year);
    if (!Number.isFinite(year)) continue;

    const raw = Number(a.raw_points ?? 0) || 0;
    const ap = Number(a.applied_points ?? 0) || 0;
    const over = Math.max(0, Number(a.over_points ?? Math.max(0, raw - ap)) || 0);

    const key = `${type}__${year}`;
    const cur = mapTY.get(key);
    if (!cur) {
      mapTY.set(key, { type, year, raw, applied: ap, over });
    } else {
      cur.raw += raw;
      cur.applied += ap;
      cur.over += over;
    }
  }

  const perTypeYear = Array.from(mapTY.values())
    .sort((a, b) => (a.type === b.type ? a.year - b.year : a.type.localeCompare(b.type, "pl")))
    .map((r) => {
      const cap = Number(yearlyMaxByType[r.type]);
      const yearlyCap = Number.isFinite(cap) && cap > 0 ? cap : null;
      const usedPct = yearlyCap ? Math.max(0, Math.min(100, (r.applied / yearlyCap) * 100)) : null;
      return { ...r, yearlyCap, usedPct };
    });

  // per type aggregate
  const mapT = new Map<string, { type: string; raw: number; applied: number; over: number }>();
  for (const r of perTypeYear) {
    const cur = mapT.get(r.type);
    if (!cur) mapT.set(r.type, { type: r.type, raw: r.raw, applied: r.applied, over: r.over });
    else {
      cur.raw += r.raw;
      cur.applied += r.applied;
      cur.over += r.over;
    }
  }

  const perType = Array.from(mapT.values())
    .map((r) => {
      const cap = Number(yearlyMaxByType[r.type]);
      const yearlyCap = Number.isFinite(cap) && cap > 0 ? cap : null;
      const capInPeriod = yearlyCap ? yearlyCap * yearsInPeriod : null;
      const usedPct = capInPeriod ? Math.max(0, Math.min(100, (r.applied / capInPeriod) * 100)) : null;

      return { ...r, yearlyCap, capInPeriod, usedPct };
    })
    .sort((a, b) => {
      // najpierw kategorie z limitami i najbardziej „zapełnione”
      const al = a.capInPeriod ? 1 : 0;
      const bl = b.capInPeriod ? 1 : 0;
      if (al !== bl) return bl - al;

      const ap = a.usedPct ?? -1;
      const bp = b.usedPct ?? -1;
      if (ap !== bp) return bp - ap;

      return b.applied - a.applied;
    });

  return {
    period: p,
    yearsInPeriod,
    perType,
    perTypeYear,
  };
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
