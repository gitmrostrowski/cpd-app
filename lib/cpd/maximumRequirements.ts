export type MaximumRequirement = {
  id: string;
  activity_type_code: string | null;
  scope: "period" | "year" | "item";
  points: number;
};

export type MaximumRuleActivity = {
  id: string;
  activity_type_code?: string | null;
  points: number | string;
  year: number | string;
  activity_date?: string | null;
  created_at?: string | null;
  rule_order?: number;
};

export type AppliedMaximumActivity<T extends MaximumRuleActivity> = T & {
  raw_points: number;
  applied_points: number;
  over_points: number;
};

function safePoints(value: number | string) {
  const points = Number(value);
  return Number.isFinite(points) && points > 0 ? points : 0;
}

function stableActivityOrder<T extends MaximumRuleActivity>(activities: T[]) {
  return [...activities].sort((a, b) => {
    const orderA = Number(a.rule_order) || 0;
    const orderB = Number(b.rule_order) || 0;
    if (orderA !== orderB) return orderA - orderB;

    const yearA = Number(a.year) || 0;
    const yearB = Number(b.year) || 0;
    if (yearA !== yearB) return yearA - yearB;

    const dateA = String(a.activity_date ?? "");
    const dateB = String(b.activity_date ?? "");
    if (dateA !== dateB) return dateA.localeCompare(dateB);

    const createdA = String(a.created_at ?? "");
    const createdB = String(b.created_at ?? "");
    if (createdA !== createdB) return createdA.localeCompare(createdB);

    return a.id.localeCompare(b.id);
  });
}

/**
 * Nakłada wyłącznie zweryfikowane ograniczenia typu „maximum”. Kolejność ma
 * znaczenie dla limitów okresowych i rocznych, dlatego wpisy są liczone
 * deterministycznie od najstarszego. Funkcja nie interpretuje sposobów
 * naliczania punktów (np. „1 pkt za godzinę”) — te wymagają osobnych danych.
 */
export function applyMaximumRequirements<T extends MaximumRuleActivity>(
  activities: T[],
  requirements: MaximumRequirement[],
): AppliedMaximumActivity<T>[] {
  const activeRequirements = requirements.filter(
    (rule) =>
      Boolean(rule.activity_type_code) &&
      Number.isFinite(Number(rule.points)) &&
      Number(rule.points) >= 0,
  );
  const usedInPeriod = new Map<string, number>();
  const usedInYear = new Map<string, number>();

  return stableActivityOrder(activities).map((activity) => {
    const raw = safePoints(activity.points);
    const code = activity.activity_type_code ?? null;
    const matching = activeRequirements.filter(
      (rule) => rule.activity_type_code === code,
    );
    let applied = raw;

    for (const rule of matching.filter((item) => item.scope === "item")) {
      applied = Math.min(applied, Number(rule.points));
    }

    const yearlyRules = matching.filter((item) => item.scope === "year");
    for (const rule of yearlyRules) {
      const key = `${rule.id}:${Number(activity.year) || 0}`;
      const used = usedInYear.get(key) ?? 0;
      const remaining = Math.max(0, Number(rule.points) - used);
      applied = Math.min(applied, remaining);
    }

    const periodRules = matching.filter((item) => item.scope === "period");
    for (const rule of periodRules) {
      const used = usedInPeriod.get(rule.id) ?? 0;
      const remaining = Math.max(0, Number(rule.points) - used);
      applied = Math.min(applied, remaining);
    }

    for (const rule of yearlyRules) {
      const key = `${rule.id}:${Number(activity.year) || 0}`;
      usedInYear.set(key, (usedInYear.get(key) ?? 0) + applied);
    }
    for (const rule of periodRules) {
      usedInPeriod.set(rule.id, (usedInPeriod.get(rule.id) ?? 0) + applied);
    }

    return {
      ...activity,
      raw_points: raw,
      applied_points: applied,
      over_points: Math.max(0, raw - applied),
    };
  });
}
