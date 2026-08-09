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
    .from("educational_activities")
    .select("id,user_id")
    .eq("id", activityId)
    .maybeSingle();

  if (actErr) return { ok: false as const, error: actErr.message };
  if (!activity) return { ok: false as const, error: "Nie znaleziono aktywności." };
  if (activity.user_id !== user.id) return { ok: false as const, error: "Brak dostępu." };

  const { data: oldDocuments, error: documentsError } = await supabase
    .from("activity_documents")
    .select("id,path")
    .eq("activity_id", activityId)
    .eq("user_id", user.id)
    .eq("kind", "certificate");
  if (documentsError)
    return { ok: false as const, error: documentsError.message };

  if (oldDocuments?.length) {
    await supabase.storage
      .from(BUCKET)
      .remove(oldDocuments.map((document) => document.path));
    await supabase
      .from("activity_documents")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", user.id)
      .eq("kind", "certificate");
  }

  const safeName = sanitizeFileName(file.name || "certyfikat.pdf");
  const objectPath = `${user.id}/${activityId}/certificate-${Date.now()}-${safeName}`;

  const up = await supabase.storage.from(BUCKET).upload(objectPath, file, {
    upsert: true,
    contentType: file.type,
  });
  if (up.error) return { ok: false as const, error: up.error.message };

  const { error: updErr } = await supabase
    .from("activity_documents")
    .insert({
      user_id: user.id,
      activity_id: activityId,
      kind: "certificate",
      path: objectPath,
      name: file.name,
      mime: file.type,
      size: file.size,
    });

  if (updErr) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { ok: false as const, error: updErr.message };
  }

  revalidatePath("/aktywnosci");
  revalidatePath(`/aktywnosci/${activityId}`);
  return { ok: true as const };
}

export async function deleteCertificate(activityId: string) {
  const supabase = await supabaseServer();
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authErr || !user) return { ok: false as const, error: "Brak zalogowanego użytkownika." };

  const { data: activity, error: actErr } = await supabase
    .from("educational_activities")
    .select("id,user_id")
    .eq("id", activityId)
    .maybeSingle();

  if (actErr) return { ok: false as const, error: actErr.message };
  if (!activity) return { ok: false as const, error: "Nie znaleziono aktywności." };
  if (activity.user_id !== user.id) return { ok: false as const, error: "Brak dostępu." };

  const { data: documents, error: documentsError } = await supabase
    .from("activity_documents")
    .select("id,path")
    .eq("activity_id", activityId)
    .eq("user_id", user.id)
    .eq("kind", "certificate");
  if (documentsError)
    return { ok: false as const, error: documentsError.message };

  if (documents?.length) {
    const rm = await supabase.storage
      .from(BUCKET)
      .remove(documents.map((document) => document.path));
    if (rm.error) return { ok: false as const, error: rm.error.message };
  }

  const { error: updErr } = await supabase
    .from("activity_documents")
    .delete()
    .eq("activity_id", activityId)
    .eq("user_id", user.id)
    .eq("kind", "certificate");

  if (updErr) return { ok: false as const, error: updErr.message };

  revalidatePath("/aktywnosci");
  revalidatePath(`/aktywnosci/${activityId}`);
  return { ok: true as const };
}
