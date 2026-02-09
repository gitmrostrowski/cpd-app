"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;

  // ✅ kolumny certyfikatu (wg Twojego schematu)
  certificate_path?: string | null;
  certificate_name?: string | null;
  certificate_mime?: string | null;
  certificate_size?: number | null;
  certificate_uploaded_at?: string | null;
};

const TYPES = [
  "Kurs stacjonarny",
  "Kurs online / webinar",
  "Konferencja / kongres",
  "Warsztaty praktyczne",
  "Publikacja naukowa",
  "Prowadzenie szkolenia",
  "Samokształcenie",
  "Staż / praktyka",
] as const;

const BUCKET = "certificates";
const MAX_MB = 10;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function extFromMime(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

export default function ActivitiesPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [items, setItems] = useState<ActivityRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [busy, setBusy] = useState(false);

  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // form
  const [type, setType] = useState<(typeof TYPES)[number]>(TYPES[1]);
  const [points, setPoints] = useState<number>(10);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [organizer, setOrganizer] = useState<string>("");

  // ✅ cert file
  const [file, setFile] = useState<File | null>(null);

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

  function resetForm() {
    setOrganizer("");
    setFile(null);
    // wyczyść wartość inputa (robimy to przez key)
    setFileInputKey((k) => k + 1);
  }

  const [fileInputKey, setFileInputKey] = useState(0);

  async function load() {
    if (!user) {
      setItems([]);
      return;
    }
    setFetching(true);
    setErr(null);

    try {
      const { data, error } = await supabase
        .from("activities")
        .select(
          "id,user_id,type,points,year,organizer,created_at,certificate_path,certificate_name,certificate_mime,certificate_size,certificate_uploaded_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErr(error.message);
        setItems([]);
        return;
      }

      setItems((data as ActivityRow[]) ?? []);
    } catch (e: any) {
      setErr(e?.message || "Nie udało się pobrać aktywności.");
      setItems([]);
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setItems([]);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function validateFile(f: File) {
    if (!ALLOWED_MIME.has(f.type)) {
      return "Dozwolone: PDF, JPG, PNG, WEBP.";
    }
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > MAX_MB) {
      return `Plik jest za duży (${sizeMb.toFixed(1)} MB). Limit: ${MAX_MB} MB.`;
    }
    return null;
  }

  async function uploadCertificate(activityId: string, f: File) {
    if (!user) throw new Error("Brak użytkownika.");
    const mime = f.type || "application/octet-stream";
    const ext = extFromMime(mime);
    const safeName = f.name?.slice(0, 180) || `cert.${ext}`;

    // ✅ zgodnie z policy: auth.uid() + '/%'
    const path = `${user.id}/${activityId}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, f, {
        upsert: true,
        contentType: mime,
      });

    if (upErr) throw new Error(upErr.message);

    // zapisz metadane do DB
    const { error: updErr } = await supabase
      .from("activities")
      .update({
        certificate_path: path,
        certificate_name: safeName,
        certificate_mime: mime,
        certificate_size: f.size,
        certificate_uploaded_at: new Date().toISOString(),
      })
      .eq("id", activityId)
      .eq("user_id", user.id);

    if (updErr) throw new Error(updErr.message);

    return path;
  }

  function getPublicUrl(path: string) {
    // jeśli bucket jest public → publicUrl zadziała
    // jeśli private → i tak można przejść na signed URL (na razie robimy publicUrl)
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function addActivity() {
    if (!user) return;
    if (busy) return;

    clearMessages();

    const p = Number(points);
    const y = Number(year);

    if (!Number.isFinite(p) || p < 0) {
      setErr("Punkty muszą być liczbą ≥ 0.");
      return;
    }
    if (!Number.isFinite(y) || y < 1900 || y > 2100) {
      setErr("Rok wygląda na nieprawidłowy (podaj np. 2024).");
      return;
    }

    if (file) {
      const fileErr = validateFile(file);
      if (fileErr) {
        setErr(fileErr);
        return;
      }
    }

    const org = organizer.trim();

    const payload = {
      user_id: user.id,
      type: String(type),
      points: p,
      year: y,
      organizer: org.length ? org : null,
    };

    setBusy(true);
    try {
      // ✅ bierzemy ID nowo dodanej aktywności
      const { data, error } = await supabase
        .from("activities")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        setErr(error.message);
        return;
      }

      const newId = data?.id as string | undefined;
      if (!newId) {
        setErr("Nie udało się odczytać ID nowej aktywności.");
        return;
      }

      // ✅ jeśli jest plik → upload + update rekordu
      if (file) {
        await uploadCertificate(newId, file);
        setInfo("Dodano aktywność + certyfikat ✅");
      } else {
        setInfo("Dodano aktywność ✅");
      }

      resetForm();
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się dodać aktywności.");
    } finally {
      setBusy(false);
    }
  }

  async function removeActivity(id: string, certPath?: string | null) {
    if (!user) return;
    if (busy) return;

    clearMessages();

    // optimistic UI
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));

    setBusy(true);
    try {
      // opcjonalnie usuń plik certyfikatu
      if (certPath) {
        const { error: storErr } = await supabase.storage
          .from(BUCKET)
          .remove([certPath]);
        // nie blokujemy kasowania aktywności jeśli storage zwróci błąd
        if (storErr) {
          // pokaż info, ale jedź dalej
          setInfo("Uwaga: nie udało się usunąć pliku certyfikatu (sprawdź polityki).");
        }
      }

      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        setErr(error.message);
        setItems(prev); // rollback
        return;
      }
      setInfo("Usunięto ✅");
    } catch (e: any) {
      setErr(e?.message || "Nie udało się usunąć.");
      setItems(prev); // rollback
    } finally {
      setBusy(false);
    }
  }

  async function removeCertificate(activity: ActivityRow) {
    if (!user) return;
    if (busy) return;

    clearMessages();
    if (!activity.certificate_path) {
      setErr("Ten wpis nie ma certyfikatu.");
      return;
    }

    setBusy(true);
    try {
      const path = activity.certificate_path;

      const { error: storErr } = await supabase.storage.from(BUCKET).remove([path]);
      if (storErr) {
        setErr(storErr.message);
        return;
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
        .eq("id", activity.id)
        .eq("user_id", user.id);

      if (updErr) {
        setErr(updErr.message);
        return;
      }

      setInfo("Usunięto certyfikat ✅");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się usunąć certyfikatu.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6">Ładuję…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-8">
          <h1 className="text-2xl font-bold text-slate-900">Aktywności</h1>
          <p className="mt-2 text-slate-600">Zaloguj się, aby zapisywać aktywności do portfolio.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zaloguj się
            </Link>
            <Link
              href="/kalkulator"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kalkulator (tryb gościa)
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Aktywności</h1>
          <p className="mt-2 text-slate-600">
            Dodawaj i zarządzaj aktywnościami w portfolio. (Opcjonalnie dodaj certyfikat PDF/JPG/PNG/WEBP.)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portfolio"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Portfolio
          </Link>
          <Link
            href="/kalkulator"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Kalkulator
          </Link>
        </div>
      </div>

      {(info || err) && (
        <div className="mt-4 rounded-2xl border bg-white p-4 text-sm">
          {info ? <div className="text-emerald-700">{info}</div> : null}
          {err ? <div className="text-rose-700">{err}</div> : null}
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* FORM */}
        <section className="rounded-2xl border bg-white p-6 lg:col-span-1">
          <h2 className="text-lg font-semibold text-slate-900">Dodaj aktywność</h2>
          <p className="mt-1 text-sm text-slate-600">
            Zapis trafia do Supabase i od razu pokaże się w Portfolio. Certyfikat zapisuje się do Storage.
          </p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Rodzaj</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                disabled={busy}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Punkty</label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={points}
                onChange={(e) => setPoints(Math.max(0, Number(e.target.value || 0)))}
                disabled={busy}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Rok</label>
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={year}
                onChange={(e) => setYear(Number(e.target.value || new Date().getFullYear()))}
                disabled={busy}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Organizator (opcjonalnie)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="np. OIL / towarzystwo"
                disabled={busy}
              />
            </div>

            {/* ✅ CERT */}
            <div>
              <label className="text-sm font-medium text-slate-700">Certyfikat (opcjonalnie)</label>
              <input
                key={fileInputKey}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                disabled={busy}
                onChange={(e) => {
                  clearMessages();
                  const f = e.target.files?.[0] || null;
                  if (!f) {
                    setFile(null);
                    return;
                  }
                  const ve = validateFile(f);
                  if (ve) {
                    setErr(ve);
                    setFile(null);
                    return;
                  }
                  setFile(f);
                }}
              />
              <div className="mt-1 text-xs text-slate-500">
                Limit: {MAX_MB} MB. Typy: PDF, JPG, PNG, WEBP.
              </div>
              {file ? (
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  Wybrano: <span className="font-medium">{file.name}</span> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              ) : null}
            </div>

            <button
              onClick={addActivity}
              className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              type="button"
              disabled={busy}
            >
              {busy ? "Zapisuję…" : "+ Zapisz aktywność"}
            </button>
          </div>
        </section>

        {/* LIST */}
        <section className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Twoje aktywności</h2>
              <p className="mt-1 text-sm text-slate-600">
                Możesz podpiąć certyfikat przy dodawaniu aktywności. Certyfikat jest widoczny w wierszu.
              </p>
            </div>
            <button
              onClick={load}
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={busy || fetching}
            >
              {fetching ? "Odświeżam…" : "Odśwież"}
            </button>
          </div>

          {fetching ? (
            <div className="mt-4 text-sm text-slate-500">Pobieram…</div>
          ) : items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <div className="text-lg font-semibold text-slate-900">Brak zapisanych aktywności</div>
              <div className="mt-2 text-sm text-slate-600">Dodaj pierwszą aktywność po lewej.</div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {items.map((a) => {
                const hasCert = Boolean(a.certificate_path);
                const certUrl = hasCert && a.certificate_path ? getPublicUrl(a.certificate_path) : null;

                return (
                  <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{a.type}</div>
                        <div className="mt-1 text-sm text-slate-600">
                          {a.organizer ? a.organizer : "Brak organizatora"} • Rok:{" "}
                          <span className="font-medium text-slate-900">{a.year}</span>
                        </div>

                        {/* CERT row */}
                        <div className="mt-2 text-sm">
                          {hasCert && certUrl ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
                                📎 Certyfikat
                              </span>
                              <a
                                href={certUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-blue-700 hover:underline"
                              >
                                Otwórz / pobierz
                              </a>
                              {a.certificate_name ? (
                                <span className="text-xs text-slate-500">{a.certificate_name}</span>
                              ) : null}

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => removeCertificate(a)}
                                className="ml-auto rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                              >
                                Usuń certyfikat
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">Brak certyfikatu</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <span className="text-slate-600">Punkty</span>{" "}
                          <span className="font-semibold text-slate-900">{a.points}</span>
                        </div>
                        <button
                          onClick={() => removeActivity(a.id, a.certificate_path ?? null)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          type="button"
                          disabled={busy}
                        >
                          Usuń
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
