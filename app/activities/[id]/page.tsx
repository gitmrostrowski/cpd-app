import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { deleteCertificate, uploadCertificate } from "../actions";

const BUCKET = "certificates";

export default async function ActivityDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await supabaseServer();

  const { data: activity, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Aktywność</h1>
        <p className="mt-4 text-red-600">Błąd: {error.message}</p>
        <Link className="mt-4 inline-block underline" href="/activities">
          Wróć
        </Link>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Aktywność</h1>
        <p className="mt-4 text-gray-700">Nie znaleziono aktywności.</p>
        <Link className="mt-4 inline-block underline" href="/activities">
          Wróć
        </Link>
      </div>
    );
  }

  let signedUrl: string | null = null;
  if (activity.certificate_path) {
    const { data } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(activity.certificate_path, 60 * 60);
    signedUrl = data?.signedUrl ?? null;
  }

  async function onUpload(formData: FormData) {
    "use server";
    return uploadCertificate(params.id, formData);
  }

  // ✅ FIX: action w <form> musi mieć (formData: FormData) => Promise<void>
  async function onDelete(formData: FormData): Promise<void> {
    "use server";

    const id = String(formData.get("id") || params.id || "").trim();
    if (!id) return;

    await deleteCertificate(id);
    // nic nie zwracamy → Promise<void>
  }

  const hasCert = Boolean(activity.certificate_path);

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Szczegóły aktywności</h1>
          <p className="mt-1 text-sm text-gray-600">Dodaj / podejrzyj certyfikat.</p>
        </div>
        <Link href="/activities" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
          ← Aktywności
        </Link>
      </div>

      <div className="rounded border p-4">
        <div className="font-medium">{activity.type}</div>
        <div className="mt-1 text-sm text-gray-600">
          {activity.year} · {activity.points} pkt · {activity.organizer ?? "—"}
        </div>
      </div>

      <div id="certificate" className="rounded border p-4 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Certyfikat</h2>
          <span
            className={`text-xs rounded-full px-2 py-1 ${
              hasCert ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
            }`}
          >
            {hasCert ? "📎 Dodany" : "Brak"}
          </span>
        </div>

        {hasCert ? (
          <div className="space-y-3">
            <div className="text-sm text-gray-700">
              Plik:{" "}
              <span className="font-medium">
                {activity.certificate_name ?? "certyfikat"}
              </span>
              {activity.certificate_size ? (
                <span className="text-gray-500">
                  {" "}
                  · {(activity.certificate_size / 1024 / 1024).toFixed(2)} MB
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {signedUrl ? (
                <a
                  href={signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Podgląd
                </a>
              ) : (
                <span className="text-sm text-gray-500">
                  Nie udało się wygenerować linku.
                </span>
              )}

              <form action={onDelete}>
                {/* ✅ potrzebne, żeby onDelete miało skąd wziąć id */}
                <input type="hidden" name="id" value={activity.id} />
                <button
                  type="submit"
                  className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Usuń
                </button>
              </form>
            </div>

            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600 mb-2">
                Podmiana pliku: wgraj nowy (stary zostanie usunięty).
              </p>
              <form action={onUpload} className="flex flex-col gap-2">
                <input
                  name="file"
                  type="file"
                  accept="application/pdf,image/*"
                  required
                />
                <button
                  type="submit"
                  className="rounded bg-black text-white px-4 py-2 text-sm hover:opacity-90"
                >
                  Wgraj nowy
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form action={onUpload} className="flex flex-col gap-2">
            <input
              name="file"
              type="file"
              accept="application/pdf,image/*"
              required
            />
            <button
              type="submit"
              className="rounded bg-black text-white px-4 py-2 text-sm hover:opacity-90"
            >
              Dodaj certyfikat
            </button>
            <p className="text-xs text-gray-500">
              Dozwolone: PDF/JPG/PNG/WEBP · max 10 MB
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
