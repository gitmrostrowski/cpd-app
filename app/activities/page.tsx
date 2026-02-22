// app/activities/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type ActivityStatus = "planned" | "done" | null;

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;

  // NEW (planowanie szkoleń)
  status?: ActivityStatus;
  planned_start_date?: string | null; // YYYY-MM-DD
  training_id?: string | null;

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

function normalizeStatus(s: ActivityStatus | undefined): "planned" | "done" {
  return s === "planned" ? "planned" : "done";
}

function extFromMime(mime: string) {
  if (mime === "application/pdf") return "pdf";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "bin";
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatYMD(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}

function shortFileName(name?: string | null) {
  const n = (name ?? "").trim();
  if (!n) return "";
  if (n.length <= 22) return n;
  const ext = n.includes(".") ? "." + n.split(".").pop() : "";
  const base = ext ? n.slice(0, -(ext.length)) : n;
  const cut = base.slice(0, 16);
  return `${cut}…${ext}`;
}

type StatusKind = "complete" | "missing";

// Dla planned: nie wymagamy certyfikatu (bo szkolenie jeszcze się nie odbyło)
function getRowStatus(a: ActivityRow): { kind: StatusKind; missing: string[] } {
  const missing: string[] = [];
  const orgOk = Boolean(a.organizer && String(a.organizer).trim());

  if (!orgOk) missing.push("Brak organizatora");

  const isPlanned = normalizeStatus(a.status) === "planned";
  if (!isPlanned) {
    const certOk = Boolean(a.certificate_path);
    if (!certOk) missing.push("Brak certyfikatu");
  }

  return {
    kind: missing.length === 0 ? "complete" : "missing",
    missing,
  };
}

function Badge({
  tone,
  children,
}: {
  tone: "blue" | "emerald" | "amber" | "slate";
  children: React.ReactNode;
}) {
  const styles =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs",
        styles,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function ActivitiesPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [items, setItems] = useState<ActivityRow[]>([]);
  const [fetching, setFetching] = useState(false);
  const [busy, setBusy] = useState(false);

  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // form (dodaj)
  const [type, setType] = useState<(typeof TYPES)[number]>(TYPES[1]);
  const [points, setPoints] = useState<number>(10);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [organizer, setOrganizer] = useState<string>("");

  // cert file przy dodawaniu
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // cert file do podpięcia do istniejącego wiersza
  const [attachToId, setAttachToId] = useState<string | null>(null);
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachInputKey, setAttachInputKey] = useState(0);

  // EDIT (inline)
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<(typeof TYPES)[number]>(TYPES[1]);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear());
  const [editOrganizer, setEditOrganizer] = useState<string>("");
  const [editPlannedDate, setEditPlannedDate] = useState<string>(""); // YYYY-MM-DD

  // signed urls (id -> url)
  const [certUrls, setCertUrls] = useState<Record<string, string>>({});

  // filtry
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<string>("Wszystkie");
  const [filterYear, setFilterYear] = useState<string>("Wszystkie");
  const [filterCert, setFilterCert] = useState<"all" | "yes" | "no">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "missing">("all");

  // realizacja (planned/done)
  const [filterProgress, setFilterProgress] = useState<"all" | "planned" | "done">("all");

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

  function resetForm() {
    setOrganizer("");
    setFile(null);
    setFileInputKey((k) => k + 1);
  }

  function validateFile(f: File) {
    if (!ALLOWED_MIME.has(f.type)) return "Dozwolone: PDF, JPG, PNG, WEBP.";
    const sizeMb = f.size / (1024 * 1024);
    if (sizeMb > MAX_MB)
      return `Plik jest za duży (${sizeMb.toFixed(1)} MB). Limit: ${MAX_MB} MB.`;
    return null;
  }

  async function load() {
    if (!user) {
      setItems([]);
      setCertUrls({});
      return;
    }
    setFetching(true);
    setErr(null);

    try {
      const { data, error } = await supabase
        .from("activities")
        .select(
          "id,user_id,type,points,year,organizer,created_at,status,planned_start_date,training_id,certificate_path,certificate_name,certificate_mime,certificate_size,certificate_uploaded_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setErr(error.message);
        setItems([]);
        setCertUrls({});
        return;
      }

      const rows = ((data ?? []) as unknown as ActivityRow[]) ?? [];
      setItems(rows);

      const withCert = rows.filter((r) => r.certificate_path);

      const results = await Promise.all(
        withCert.map(async (r) => {
          const path = r.certificate_path!;
          const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
          return { id: r.id, url: urlData?.signedUrl ?? "" };
        }),
      );

      const nextMap: Record<string, string> = {};
      for (const x of results) {
        if (x.url) nextMap[x.id] = x.url;
      }
      setCertUrls(nextMap);
    } catch (e: any) {
      setErr(e?.message || "Nie udało się pobrać aktywności.");
      setItems([]);
      setCertUrls({});
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setItems([]);
      setCertUrls({});
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function uploadCertificate(activityId: string, f: File) {
    if (!user) throw new Error("Brak użytkownika.");

    const mime = f.type || "application/octet-stream";
    const ext = extFromMime(mime);
    const safeName = (f.name || `cert.${ext}`).slice(0, 180);

    const path = `${user.id}/${activityId}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, f, {
      upsert: true,
      contentType: mime,
    });
    if (upErr) throw new Error(upErr.message);

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
      type,
      points: p,
      year: y,
      organizer: org.length ? org : null,
      status: "done" as const,
    };

    setBusy(true);
    try {
      const { data, error } = await supabase.from("activities").insert(payload).select("id").single();

      if (error) {
        setErr(error.message);
        return;
      }

      const newId = (data?.id as string | undefined) ?? undefined;
      if (!newId) {
        setErr("Nie udało się odczytać ID nowej aktywności.");
        return;
      }

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

  async function markAsDone(activityId: string) {
    if (!user) return;
    if (busy) return;

    clearMessages();
    setBusy(true);
    try {
      const { error } = await supabase
        .from("activities")
        .update({
          status: "done" as const,
        })
        .eq("id", activityId)
        .eq("user_id", user.id);

      if (error) {
        setErr(error.message);
        return;
      }

      setInfo("Oznaczono jako ukończone ✅ (teraz możesz dodać certyfikat)");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zmienić statusu.");
    } finally {
      setBusy(false);
    }
  }

  async function removeActivity(id: string, certPath?: string | null) {
    if (!user) return;
    if (busy) return;

    clearMessages();

    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));

    setBusy(true);
    try {
      if (certPath) {
        const { error: storErr } = await supabase.storage.from(BUCKET).remove([certPath]);
        if (storErr) setInfo("Uwaga: nie udało się usunąć pliku certyfikatu (sprawdź polityki).");
      }

      const { error } = await supabase.from("activities").delete().eq("id", id).eq("user_id", user.id);

      if (error) {
        setErr(error.message);
        setItems(prev);
        return;
      }
      setInfo("Usunięto ✅");
      setCertUrls((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
    } catch (e: any) {
      setErr(e?.message || "Nie udało się usunąć.");
      setItems(prev);
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

  async function attachCertificateToExisting() {
    if (!user) return;
    if (!attachToId) return;
    if (!attachFile) {
      setErr("Wybierz plik certyfikatu.");
      return;
    }
    const fileErr = validateFile(attachFile);
    if (fileErr) {
      setErr(fileErr);
      return;
    }
    if (busy) return;

    clearMessages();
    setBusy(true);
    try {
      await uploadCertificate(attachToId, attachFile);
      setInfo("Podpięto certyfikat ✅");
      setAttachToId(null);
      setAttachFile(null);
      setAttachInputKey((k) => k + 1);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się podpiąć certyfikatu.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(a: ActivityRow) {
    clearMessages();
    setEditId(a.id);
    setEditType((a.type as any) ?? TYPES[1]);
    setEditPoints(Number(a.points ?? 0));
    setEditYear(Number(a.year ?? new Date().getFullYear()));
    setEditOrganizer(a.organizer ?? "");
    setEditPlannedDate(a.planned_start_date ?? "");
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(activityId: string) {
    if (!user) return;
    if (busy) return;

    clearMessages();

    const p = Number(editPoints);
    const y = Number(editYear);
    if (!Number.isFinite(p) || p < 0) {
      setErr("Punkty muszą być liczbą ≥ 0.");
      return;
    }
    if (!Number.isFinite(y) || y < 1900 || y > 2100) {
      setErr("Rok wygląda na nieprawidłowy (podaj np. 2024).");
      return;
    }

    // planned_start_date tylko jeśli wpis jest planned (w DB może być też na done, ale UI tego nie potrzebuje)
    const current = items.find((x) => x.id === activityId);
    const prog = current ? normalizeStatus(current.status) : "done";

    const org = editOrganizer.trim();
    const upd: any = {
      type: editType,
      points: p,
      year: y,
      organizer: org.length ? org : null,
    };

    if (prog === "planned") {
      // dopuszczamy pustą wartość
      upd.planned_start_date = editPlannedDate ? editPlannedDate : null;
    }

    setBusy(true);
    try {
      const { error } = await supabase
        .from("activities")
        .update(upd)
        .eq("id", activityId)
        .eq("user_id", user.id);

      if (error) {
        setErr(error.message);
        return;
      }

      setInfo("Zapisano zmiany ✅");
      setEditId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać zmian.");
    } finally {
      setBusy(false);
    }
  }

  const years = useMemo(() => {
    const ys = Array.from(new Set(items.map((i) => i.year))).sort((a, b) => b - a);
    return ys;
  }, [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((a) => {
      if (filterType !== "Wszystkie" && a.type !== filterType) return false;
      if (filterYear !== "Wszystkie" && String(a.year) !== filterYear) return false;

      const prog = normalizeStatus(a.status);
      if (filterProgress !== "all" && prog !== filterProgress) return false;

      const hasCert = Boolean(a.certificate_path);
      if (filterCert === "yes" && !hasCert) return false;
      if (filterCert === "no" && hasCert) return false;

      const st = getRowStatus(a).kind;
      if (filterStatus !== "all" && st !== filterStatus) return false;

      if (query) {
        const hay = `${a.type} ${a.organizer ?? ""} ${a.year} ${a.points} ${a.status ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [items, q, filterType, filterYear, filterCert, filterStatus, filterProgress]);

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
          <p className="mt-2 text-slate-600">Logbook CPD: dodawaj aktywności, porządkuj dane i podpinaj certyfikaty.</p>
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

      {/* ✅ Optymalny układ: lista (lewa) + formularz (prawa) na desktopie */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        {/* LEFT: LIST */}
        <section className="order-2 rounded-2xl border bg-white p-6 lg:order-1 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Twoje aktywności</h2>
              <p className="mt-1 text-sm text-slate-600">
                Zaplanowane nie liczą się do punktów, dopóki nie oznaczysz ich jako ukończone.
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

          {/* Filters */}
          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-600">Szukaj</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="np. kongres, OIL, 2025…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Typ</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option>Wszystkie</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Rok</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                <option>Wszystkie</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Realizacja</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={filterProgress}
                onChange={(e) => setFilterProgress(e.target.value as any)}
              >
                <option value="all">Wszystkie</option>
                <option value="planned">Zaplanowane</option>
                <option value="done">Ukończone</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Certyfikat</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={filterCert}
                onChange={(e) => setFilterCert(e.target.value as any)}
              >
                <option value="all">Wszystkie</option>
                <option value="yes">Tylko z certyfikatem</option>
                <option value="no">Tylko bez certyfikatu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600">Kompletność</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
              >
                <option value="all">Wszystkie</option>
                <option value="complete">OK</option>
                <option value="missing">Braki</option>
              </select>
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <button
                type="button"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setQ("");
                  setFilterType("Wszystkie");
                  setFilterYear("Wszystkie");
                  setFilterCert("all");
                  setFilterStatus("all");
                  setFilterProgress("all");
                }}
              >
                Wyczyść filtry
              </button>
              <div className="w-full text-right text-xs text-slate-600">
                Wynik: <span className="font-semibold text-slate-900">{filtered.length}</span>
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="mt-4 text-sm text-slate-500">Pobieram…</div>
          ) : filtered.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <div className="text-lg font-semibold text-slate-900">Brak wyników</div>
              <div className="mt-2 text-sm text-slate-600">Zmień filtry albo dodaj nową aktywność po prawej.</div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {filtered.map((a) => {
                const hasCert = Boolean(a.certificate_path);
                const certUrl = hasCert ? certUrls[a.id] : null;

                const prog = normalizeStatus(a.status);
                const st = getRowStatus(a);

                const inEdit = editId === a.id;

                return (
                  <div
                    key={a.id}
                    className={[
                      "rounded-2xl border p-4",
                      prog === "planned" ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      {/* LEFT */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="min-w-0 truncate font-semibold text-slate-900">{a.type}</div>

                          {/* ✅ tylko jeden badge realizacji */}
                          {prog === "planned" ? (
                            <Badge tone="blue">🗓️ Zaplanowane</Badge>
                          ) : (
                            <Badge tone="emerald">✓ Ukończone</Badge>
                          )}

                          {/* ✅ kompletność nie nazywa się "Ukończone" */}
                          {st.kind === "complete" ? <Badge tone="emerald">OK</Badge> : <Badge tone="amber">Braki</Badge>}

                          {hasCert ? <Badge tone="slate">📎 Cert</Badge> : null}
                        </div>

                        <div className="mt-1 text-sm text-slate-600">
                          <span className="break-words">{a.organizer ? a.organizer : "Brak organizatora"}</span> • Rok:{" "}
                          <span className="font-medium text-slate-900">{a.year}</span>
                          {a.created_at ? (
                            <>
                              {" "}
                              • Dodano: <span className="font-medium text-slate-900">{formatDateShort(a.created_at)}</span>
                            </>
                          ) : null}
                        </div>

                        {prog === "planned" ? (
                          <div className="mt-2 text-sm text-slate-700">
                            Termin szkolenia: <span className="font-semibold">{formatYMD(a.planned_start_date)}</span>
                          </div>
                        ) : null}

                        {st.kind === "missing" ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {st.missing.map((m) => (
                              <span
                                key={m}
                                className="inline-flex items-center rounded-xl border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="mt-3 text-sm">
                          {hasCert ? (
                            <div className="flex flex-wrap items-center gap-2">
                              {certUrl ? (
                                <a
                                  href={certUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-blue-700 hover:underline"
                                >
                                  Otwórz certyfikat
                                </a>
                              ) : (
                                <span className="text-slate-500">Generuję link…</span>
                              )}

                              {a.certificate_name ? (
                                <span className="text-xs text-slate-500">{shortFileName(a.certificate_name)}</span>
                              ) : null}

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => removeCertificate(a)}
                                className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 md:ml-auto"
                              >
                                Usuń certyfikat
                              </button>
                            </div>
                          ) : prog === "planned" ? (
                            <div className="text-xs text-slate-600">
                              To szkolenie jest zaplanowane — certyfikat dodasz po ukończeniu.
                            </div>
                          ) : (
                            <div className="text-xs text-slate-500">Brak certyfikatu (możesz podpiąć po prawej).</div>
                          )}
                        </div>

                        {/* ✅ INLINE EDIT */}
                        {inEdit ? (
                          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-semibold text-slate-900">Edycja wpisu</div>

                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="sm:col-span-2">
                                <label className="text-xs font-medium text-slate-600">Rodzaj</label>
                                <select
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                  value={editType}
                                  onChange={(e) => setEditType(e.target.value as any)}
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
                                <label className="text-xs font-medium text-slate-600">Punkty</label>
                                <input
                                  type="number"
                                  min={0}
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                  value={editPoints}
                                  onChange={(e) => setEditPoints(Math.max(0, Number(e.target.value || 0)))}
                                  disabled={busy}
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-slate-600">Rok</label>
                                <input
                                  type="number"
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                  value={editYear}
                                  onChange={(e) => setEditYear(Number(e.target.value || new Date().getFullYear()))}
                                  disabled={busy}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="text-xs font-medium text-slate-600">Organizator</label>
                                <input
                                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                  value={editOrganizer}
                                  onChange={(e) => setEditOrganizer(e.target.value)}
                                  placeholder="np. OIL / towarzystwo"
                                  disabled={busy}
                                />
                              </div>

                              {prog === "planned" ? (
                                <div className="sm:col-span-2">
                                  <label className="text-xs font-medium text-slate-600">Termin szkolenia</label>
                                  <input
                                    type="date"
                                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                    value={editPlannedDate}
                                    onChange={(e) => setEditPlannedDate(e.target.value)}
                                    disabled={busy}
                                  />
                                  <div className="mt-1 text-xs text-slate-500">
                                    Zostaw puste, jeśli nie chcesz podawać daty.
                                  </div>
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => saveEdit(a.id)}
                                disabled={busy}
                                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                              >
                                {busy ? "Zapisuję…" : "Zapisz zmiany"}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                disabled={busy}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                              >
                                Anuluj
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      {/* RIGHT */}
                      <div className="shrink-0">
                        <div className="flex flex-row items-center gap-2 md:flex-col md:items-end">
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                            <span className="text-slate-600">Punkty</span>{" "}
                            <span className="font-semibold text-slate-900">{a.points}</span>
                          </div>

                          <div className="flex flex-wrap justify-end gap-2">
                            {/* ✅ Edycja wraca */}
                            <button
                              onClick={() => (inEdit ? cancelEdit() : startEdit(a))}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                              type="button"
                              disabled={busy}
                            >
                              {inEdit ? "Zamknij" : "Edytuj"}
                            </button>

                            {prog === "planned" ? (
                              <button
                                onClick={() => markAsDone(a.id)}
                                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                                type="button"
                                disabled={busy}
                              >
                                Oznacz jako ukończone
                              </button>
                            ) : null}

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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* RIGHT: FORM */}
        <section className="order-1 rounded-2xl border bg-white p-6 lg:order-2 lg:col-span-4">
          <h2 className="text-lg font-semibold text-slate-900">Dodaj aktywność</h2>
          <p className="mt-1 text-sm text-slate-600">
            Certyfikat zapisuje się do Storage (prywatnie – link signed). Dodana ręcznie aktywność jest domyślnie „ukończona”.
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

            <div className="grid grid-cols-2 gap-3">
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
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Organizator</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="np. OIL / towarzystwo"
                disabled={busy}
              />
              <div className="mt-1 text-xs text-slate-500">To pole jest ważne w raportach.</div>
            </div>

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
                  if (!f) return setFile(null);
                  const ve = validateFile(f);
                  if (ve) {
                    setErr(ve);
                    setFile(null);
                    return;
                  }
                  setFile(f);
                }}
              />
              <div className="mt-1 text-xs text-slate-500">Limit: {MAX_MB} MB. Typy: PDF, JPG, PNG, WEBP.</div>
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

          {/* Attach cert to existing */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Podłącz certyfikat do wpisu</div>
            <div className="mt-1 text-xs text-slate-600">Przydatne, gdy dodałeś aktywność wcześniej bez pliku.</div>

            <div className="mt-3 space-y-2">
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={attachToId ?? ""}
                onChange={(e) => setAttachToId(e.target.value || null)}
                disabled={busy}
              >
                <option value="">Wybierz aktywność…</option>
                {items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {normalizeStatus(a.status) === "planned" ? "🗓️ Zaplanowane" : "✓ Ukończone"} • {a.year} • {a.type} •{" "}
                    {a.organizer ? a.organizer : "brak organizatora"}
                    {a.certificate_path ? " • (ma cert)" : ""} {/* to jest ok */}
                  </option>
                ))}
              </select>

              <input
                key={attachInputKey}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                disabled={busy}
                onChange={(e) => {
                  clearMessages();
                  const f = e.target.files?.[0] || null;
                  if (!f) return setAttachFile(null);
                  const ve = validateFile(f);
                  if (ve) {
                    setErr(ve);
                    setAttachFile(null);
                    return;
                  }
                  setAttachFile(f);
                }}
              />

              <button
                type="button"
                onClick={attachCertificateToExisting}
                disabled={busy || !attachToId || !attachFile}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {busy ? "Podpinam…" : "Podłącz certyfikat"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
