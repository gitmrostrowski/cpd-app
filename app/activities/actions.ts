"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

const BUCKET = "certificates";
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function sanitizeFileName(name: string) {
  return name.trim().replace(/\s+/g, "_").replace(/[^a-zA-Z0-9._-]/g, "");
}

export async function uploadCertificate(activityId: string, formData: FormData) {
  const supabase = await supabaseServer();
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authErr || !user) return { ok: false as const, error: "Brak zalogowanego użytkownika." };

  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "Nie wybrano pliku." };
  if (!ALLOWED_MIME.has(file.type)) return { ok: false as const, error: "Dozwolone: PDF/JPG/PNG/WEBP." };
  if (file.size > MAX_BYTES) return { ok: false as const, error: "Plik jest za duży (max 10 MB)." };

  const { data: activity, error: actErr } = await supabase
    .from("activities")
    .select("id,user_id,certificate_path")
    .eq("id", activityId)
    .maybeSingle();

  if (actErr) return { ok: false as const, error: actErr.message };
  if (!activity) return { ok: false as const, error: "Nie znaleziono aktywności." };
  if (activity.user_id !== user.id) return { ok: false as const, error: "Brak dostępu." };

  // usuń stary plik (jeśli był)
  if (activity.certificate_path) {
    await supabase.storage.from(BUCKET).remove([activity.certificate_path]);
  }

  const safeName = sanitizeFileName(file.name || "certyfikat.pdf");
  const objectPath = `${user.id}/activities/${activityId}/${Date.now()}_${safeName}`;

  const up = await supabase.storage.from(BUCKET).upload(objectPath, file, {
    upsert: true,
    contentType: file.type,
  });
  if (up.error) return { ok: false as const, error: up.error.message };

  const { error: updErr } = await supabase
    .from("activities")
    .update({
      certificate_path: objectPath,
      certificate_name: file.name,
      certificate_mime: file.type,
      certificate_size: file.size,
      certificate_uploaded_at: new Date().toISOString(),
    })
    .eq("id", activityId);

  if (updErr) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { ok: false as const, error: updErr.message };
  }

  revalidatePath("/activities");
  revalidatePath(`/activities/${activityId}`);
  return { ok: true as const };
}

export async function deleteCertificate(activityId: string) {
  const supabase = await supabaseServer();
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authErr || !user) return { ok: false as const, error: "Brak zalogowanego użytkownika." };

  const { data: activity, error: actErr } = await supabase
    .from("activities")
    .select("id,user_id,certificate_path")
    .eq("id", activityId)
    .maybeSingle();

  if (actErr) return { ok: false as const, error: actErr.message };
  if (!activity) return { ok: false as const, error: "Nie znaleziono aktywności." };
  if (activity.user_id !== user.id) return { ok: false as const, error: "Brak dostępu." };

  if (activity.certificate_path) {
    const rm = await supabase.storage.from(BUCKET).remove([activity.certificate_path]);
    if (rm.error) return { ok: false as const, error: rm.error.message };
  }

  const { error: updErr } = await supabase
    .from("activities")
    .update({
      certificate_path: null,
      certificate_name: null,
      certificate_mime: null,
      certificate_size: null,
      certificate_uploaded_at: null,
    })
    .eq("id", activityId);

  if (updErr) return { ok: false as const, error: updErr.message };

  revalidatePath("/activities");
  revalidatePath(`/activities/${activityId}`);
  return { ok: true as const };
}

