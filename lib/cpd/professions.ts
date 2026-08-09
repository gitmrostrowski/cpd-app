// W v4 źródłem prawdy dla zawodów jest public.professions.
// Ta lista jest wyłącznie bezpiecznym fallbackiem na czas ładowania/offline.
// Nie zawiera celów punktowych ani reguł prawnych.

import type { CpdRules } from "@/lib/cpd/calc";

export type Profession = string;

export type ProfessionOption = {
  id: string | null;
  code: string;
  name_pl: string;
  name_pl_plural?: string | null;
  description_pl?: string | null;
  identifier_label?: string | null;
  is_other: boolean;
  sort_order: number;
};

export type CpdRuleSource = {
  id: string;
  source_kind: string;
  title: string;
  url: string;
  published_on: string | null;
  verified_on: string;
  is_primary: boolean;
};

export type CpdRuleRequirement = {
  id: string;
  activity_type_id: string | null;
  activity_type_code: string | null;
  activity_type_name_pl: string | null;
  requirement_kind: "minimum" | "maximum" | "fixed";
  scope: "period" | "year" | "item";
  points: number;
  note_pl: string | null;
  sort_order: number;
};

export type CpdRuleSet = {
  id: string;
  profession_id: string;
  version: string;
  name_pl: string;
  status: "draft" | "verified" | "retired";
  calculation_scope: "target_only" | "full";
  valid_from: string | null;
  valid_to: string | null;
  period_months: number | null;
  required_points: number | null;
  formal_confirmation_authority: string | null;
  summary_pl: string | null;
  disclaimer_pl: string;
  last_verified_on: string | null;
  sources: CpdRuleSource[];
  requirements: CpdRuleRequirement[];
};

export const FALLBACK_PROFESSION_OPTIONS: readonly ProfessionOption[] = [
  { id: null, code: "doctor", name_pl: "Lekarz", is_other: false, sort_order: 10 },
  { id: null, code: "dentist", name_pl: "Lekarz dentysta", is_other: false, sort_order: 20 },
  { id: null, code: "nurse", name_pl: "Pielęgniarka", is_other: false, sort_order: 30 },
  { id: null, code: "midwife", name_pl: "Położna", is_other: false, sort_order: 40 },
  { id: null, code: "physiotherapist", name_pl: "Fizjoterapeuta", is_other: false, sort_order: 50 },
  { id: null, code: "paramedic", name_pl: "Ratownik medyczny", is_other: false, sort_order: 60 },
  { id: null, code: "pharmacist", name_pl: "Farmaceuta", is_other: false, sort_order: 70 },
  {
    id: null,
    code: "laboratory_diagnostician",
    name_pl: "Diagnosta laboratoryjny",
    is_other: false,
    sort_order: 80,
  },
  {
    id: null,
    code: "other_medical_profession",
    name_pl: "Inne",
    is_other: true,
    sort_order: 999,
  },
] as const;

// Kompatybilność dla starszych komponentów. To nadal tylko nazwy, nie reguły.
export const PROFESSION_OPTIONS: readonly Profession[] =
  FALLBACK_PROFESSION_OPTIONS.map((item) => item.name_pl);

export function displayProfession(
  profession: Profession | null | undefined,
  other?: string | null,
) {
  if (!profession) return "—";
  if (profession !== "Inne") return profession;

  const clean = String(other ?? "").trim();
  return clean ? `Inne (${clean})` : "Inne";
}

export function isOtherProfession(profession: Profession | null | undefined) {
  return profession === "Inne";
}

export function normalizeOtherProfession(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized ? normalized.slice(0, 80) : "";
}

export function isProfession(value: unknown): value is Profession {
  return typeof value === "string" && value.trim().length > 0;
}

export function professionOptionByName(
  options: readonly ProfessionOption[],
  name: string | null | undefined,
) {
  return options.find((option) => option.name_pl === name) ?? null;
}

/**
 * Brak zweryfikowanej reguły nie może tworzyć fikcyjnego celu.
 * Cel pochodzi z cpd_rule_sets albo z własnego cyklu użytkownika.
 */
export function defaultRequiredPointsFor(
  _profession: Profession,
  ruleSet?: CpdRuleSet | null,
) {
  return ruleSet?.status === "verified" && ruleSet.required_points != null
    ? ruleSet.required_points
    : 0;
}

/**
 * Adapter zgodności dla starszych ekranów, które obsługują wyłącznie limity
 * roczne. Limity okresowe i na pojedynczy wpis stosuje nowy moduł wymagań.
 */
export function rulesForProfession(
  _profession: Profession,
  ruleSet?: CpdRuleSet | null,
): CpdRules {
  if (!ruleSet || ruleSet.status !== "verified") {
    return { yearlyMaxByType: {} };
  }

  const yearlyMaxByType: Record<string, number> = {};
  for (const requirement of ruleSet.requirements) {
    if (
      requirement.requirement_kind === "maximum" &&
      requirement.scope === "year" &&
      requirement.activity_type_name_pl
    ) {
      yearlyMaxByType[requirement.activity_type_name_pl] = requirement.points;
    }
  }
  return { yearlyMaxByType };
}
