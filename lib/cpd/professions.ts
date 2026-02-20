// lib/cpd/professions.ts
// Centralne miejsce na: lista zawodów, domyślne punkty, helpery oraz limity cząstkowe (MVP).
// DB trzyma profession jako TEXT (string), więc to jest MVP "source of truth" w kodzie.

import type { CpdRules } from "@/lib/cpd/calc";

export type Profession =
  | "Lekarz"
  | "Lekarz dentysta"
  | "Pielęgniarka"
  | "Położna"
  | "Fizjoterapeuta"
  | "Ratownik medyczny"
  | "Farmaceuta"
  | "Diagnosta laboratoryjny"
  | "Inne";

export const PROFESSION_OPTIONS: readonly Profession[] = [
  "Lekarz",
  "Lekarz dentysta",
  "Pielęgniarka",
  "Położna",
  "Fizjoterapeuta",
  "Ratownik medyczny",
  "Farmaceuta",
  "Diagnosta laboratoryjny",
  "Inne",
] as const;

// MVP domyślne wymagane punkty per zawód (do podmiany jak będziesz mieć źródło / tabelę w DB)
export const DEFAULT_REQUIRED_POINTS_BY_PROFESSION: Record<Profession, number> = {
  Lekarz: 200,
  "Lekarz dentysta": 200,
  Pielęgniarka: 120,
  Położna: 120,
  Fizjoterapeuta: 100,
  "Ratownik medyczny": 100,
  Farmaceuta: 100,
  "Diagnosta laboratoryjny": 100,
  Inne: 0,
};

export function isProfession(v: unknown): v is Profession {
  return typeof v === "string" && (PROFESSION_OPTIONS as readonly string[]).includes(v);
}

export function defaultRequiredPointsFor(profession: Profession): number {
  return DEFAULT_REQUIRED_POINTS_BY_PROFESSION[profession] ?? 0;
}

/**
 * Limity cząstkowe (MVP) – per zawód, per typ aktywności.
 * Klucze MUSZĄ być identyczne jak `activity.type` w DB/UI.
 *
 * Na teraz: przykład z rozmowy – Samokształcenie max 20 pkt / rok (dla Lekarza).
 * Dopisuj kolejne wiersze, jak będziesz miał pewne reguły prawne/źródło.
 */
export const CPD_RULES_BY_PROFESSION: Record<Profession, CpdRules> = {
  Lekarz: {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  "Lekarz dentysta": {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  Pielęgniarka: {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  Położna: {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  Fizjoterapeuta: {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  "Ratownik medyczny": {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  Farmaceuta: {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  "Diagnosta laboratoryjny": {
    yearlyMaxByType: {
      "Samokształcenie": 20,
    },
  },

  Inne: {
    yearlyMaxByType: {},
  },
};

export function rulesForProfession(profession: Profession): CpdRules {
  return CPD_RULES_BY_PROFESSION[profession] ?? { yearlyMaxByType: {} };
}
