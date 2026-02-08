"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

const ALLOWED_TYPES = [
  "Kurs stacjonarny",
  "Kurs online / webinar",
  "Konferencja / kongres",
  "Warsztaty praktyczne",
  "Publikacja naukowa",
  "Prowadzenie szkolenia",
  "Samokształcenie",
  "Staż / praktyka",
] as const;

type AllowedType = (typeof ALLOWED_TYPES)[number];

function normalizeType(v: unknown): AllowedType {
  const s = String(v ?? "").trim();
  return (ALLOWED_TYPES.includes(s as AllowedType) ? s : "Kurs online / webinar") as AllowedType;
}

function normalizePoints(v: unknown): number {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function normalizeYear(v: unknown): number {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n)) return new Date().getFullYear();
  const y = Math.round(n);
  if (y < 1900) return 1900;
  if (y > 2100) return 2100;
  return y;
}

function normalizeOrganizer(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

export async function addActivity(formData: FormData) {
  const supabase = await supabaseServer();

  // auth (potrzebne do user_id)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Unauthorized");

  const type = normalizeType(formData.get("type"));
  const points = normalizePoints(formData.get("points"));
  const year = normalizeYear(formData.get("year"));
  const organizer = normalizeOrganizer(formData.get("organizer"));

  const { error } = await supabase.from("activities").insert({
    user_id: authData.user.id,
    type,
    points,
    year,
    organizer,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/portfolio");
}

export async function deleteActivity(formData: FormData) {
  const supabase = supabaseServer();

  // auth (żeby nie dało się usuwać cudzych wpisów)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Unauthorized");

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/portfolio");
}

/**
 * Import aktywności z kalkulatora (localStorage) do Supabase.
 * payload.activities = tablica obiektów {type, points, year, organizer}
 */
export async function importFromCalculator(payload: {
  activities: { type: unknown; points: unknown; year: unknown; organizer?: unknown }[];
}) {
  const supabase = supabaseServer();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Unauthorized");

  const list = Array.isArray(payload?.activities) ? payload.activities : [];
  if (!list.length) return;

  const rows = list
    .map((a) => ({
      user_id: authData.user.id,
      type: normalizeType(a?.type),
      points: normalizePoints(a?.points),
      year: normalizeYear(a?.year),
      organizer: normalizeOrganizer(a?.organizer),
    }))
    // prosta ochrona: nie importuj pustych rekordów
    .filter((r) => r.points > 0 || (r.organizer && r.organizer.length > 0));

  if (!rows.length) return;

  const { error } = await supabase.from("activities").insert(rows);
  if (error) throw new Error(error.message);

  revalidatePath("/portfolio");
}
