"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export async function addActivity(formData: FormData) {
  const supabase = supabaseServer();

  // auth (potrzebne do user_id)
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) throw new Error("Unauthorized");

  const type = String(formData.get("type") || "").trim();
  const points = Number(formData.get("points") || 0);
  const year = Number(formData.get("year") || 0);
  const organizerRaw = String(formData.get("organizer") || "").trim();
  const organizer = organizerRaw.length ? organizerRaw : null;

  // minimalna walidacja
  if (!type) throw new Error("Type is required");
  if (!Number.isFinite(points) || points < 0) throw new Error("Invalid points");
  if (!Number.isFinite(year) || year < 1900 || year > 2100) throw new Error("Invalid year");

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
