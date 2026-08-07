import type { LegacyTraining, PointVerificationStatus } from "@/lib/data/crpe";

export function trainingSlug(title: string, id: string) {
  const safeTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pl-PL")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeTitle || "szkolenie"}--${id}`;
}

export function trainingPath(training: Pick<LegacyTraining, "id" | "title">) {
  return `/baza-szkolen/${trainingSlug(training.title, String(training.id ?? ""))}`;
}

export function trainingIdFromSlug(slug: string) {
  const separator = slug.lastIndexOf("--");
  if (separator < 0) return null;
  const id = slug.slice(separator + 2).trim();
  return id || null;
}

export function publicTrainingPoints(training: LegacyTraining) {
  const values = [
    ...(training.profession_rules ?? []).map((rule) => rule.points),
    training.points,
  ].filter((value): value is number => typeof value === "number");
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

export function publicTrainingPointsLabel(training: LegacyTraining) {
  const values = publicTrainingPoints(training);
  if (!values.length) return "Punkty do potwierdzenia";
  if (values.length === 1) return `${values[0]} pkt edukacyjnych`;
  return `${values[0]}–${values[values.length - 1]} pkt zależnie od zawodu`;
}

export function pointVerificationLabel(status: PointVerificationStatus | undefined) {
  if (status === "verified") return "Punkty potwierdzone przez CRPE";
  if (status === "organizer_declared") return "Punkty podane przez organizatora";
  return "Punkty wymagają sprawdzenia dla wybranego zawodu";
}
