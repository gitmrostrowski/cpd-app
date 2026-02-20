// lib/cpd/professions.ts
// Centralne miejsce na: lista zawodów, domyślne punkty, helpery.
// DB trzyma profession jako TEXT (string), więc to jest MVP "source of truth" w kodzie.

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
