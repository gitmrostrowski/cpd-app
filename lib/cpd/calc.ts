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

export function normalizePeriod(period: Period): Period {
  const start = Math.min(period.start, period.end);
  const end = Math.max(period.start, period.end);
  return { start, end };
}

export function inPeriod(year: number, period: Period): boolean {
  const p = normalizePeriod(period);
  return year >= p.start && year <= p.end;
}

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
  combos.push(`${mix}× konferencja (20 pkt) + ${restWebinars}× webinar (10 pkt) ≈ ${mix * 20 + restWebinars * 10} pkt`);

  return Array.from(new Set(combos)).slice(0, 3);
}

