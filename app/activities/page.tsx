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

  status?: ActivityStatus;
  planned_start_date?: string | null;
  training_id?: string | null;

  certificate_path?: string | null;
  certificate_name?: string | null;
  certificate_mime?: string | null;
  certificate_size?: number | null;
  certificate_uploaded_at?: string | null;
};

type DocKind = "certificate" | "document";

type ActivityDocRow = {
  id: string;
  user_id: string;
  activity_id: string;
  kind: string;
  path: string;
  name: string | null;
  mime: string | null;
  size: number | null;
  uploaded_at: string;
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
  if (n.length <= 30) return n;
  const ext = n.includes(".") ? "." + n.split(".").pop() : "";
  const base = ext ? n.slice(0, -ext.length) : n;
  const cut = base.slice(0, 18);
  return `${cut}…${ext}`;
}

function daysUntil(ymd: string | null | undefined) {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map((x) => Number(x));
  if (!y || !m || !d) return null;

  const target = new Date(y, m - 1, d, 12, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

type StatusKind = "complete" | "missing";
type ActivityTab = "todo" | "planned" | "ready" | "all";

const ACTIVITY_TABS: {
  key: ActivityTab;
  label: string;
  description: string;
}[] = [
  {
    key: "todo",
    label: "Do uzupełnienia",
    description: "Brakujące dane, certyfikaty lub dokumenty.",
  },
  {
    key: "planned",
    label: "Zaplanowane",
    description: "Szkolenia w planie. Jeszcze nie liczą się do punktów.",
  },
  {
    key: "ready",
    label: "Gotowe do raportu",
    description: "Kompletne aktywności gotowe do rozliczenia.",
  },
  {
    key: "all",
    label: "Wszystkie",
    description: "Pełna historia aktywności.",
  },
];

function splitDocs(docsForActivity: ActivityDocRow[]) {
  const certDocs = docsForActivity.filter((d) => String(d.kind).toLowerCase() === "certificate");
  const otherDocs = docsForActivity.filter((d) => String(d.kind).toLowerCase() !== "certificate");
  return { certDocs, otherDocs };
}

function getRowStatus(a: ActivityRow, docsForActivity: ActivityDocRow[]): { kind: StatusKind; missing: string[] } {
  const missing: string[] = [];
  const orgOk = Boolean(a.organizer && String(a.organizer).trim());

  if (!orgOk) missing.push("Brak organizatora");

  const prog = normalizeStatus(a.status);

  if (prog === "done") {
    const { certDocs } = splitDocs(docsForActivity);
    const hasCert = Boolean(a.certificate_path) || certDocs.length > 0;
    if (!hasCert) missing.push("Brak certyfikatu");
  }

  return { kind: missing.length === 0 ? "complete" : "missing", missing };
}

function getActivityTab(a: ActivityRow, docsForActivity: ActivityDocRow[]): Exclude<ActivityTab, "all"> {
  const prog = normalizeStatus(a.status);
  const st = getRowStatus(a, docsForActivity);

  if (prog === "planned") return "planned";
  if (st.kind === "missing") return "todo";
  return "ready";
}

function Badge({
  tone,
  children,
}: {
  tone: "blue" | "emerald" | "amber" | "slate" | "rose";
  children: React.ReactNode;
}) {
  const styles =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : tone === "rose"
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] leading-4", styles].join(" ")}>
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

  const [type, setType] = useState<(typeof TYPES)[number]>(TYPES[1]);
  const [points, setPoints] = useState<number>(10);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [organizer, setOrganizer] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  const [attachToId, setAttachToId] = useState<string | null>(null);
  const [attachKind, setAttachKind] = useState<DocKind>("certificate");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [attachInputKey, setAttachInputKey] = useState(0);

  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<(typeof TYPES)[number]>(TYPES[1]);
  const [editPoints, setEditPoints] = useState<number>(0);
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear());
  const [editOrganizer, setEditOrganizer] = useState<string>("");
  const [editPlannedDate, setEditPlannedDate] = useState<string>("");

  const [editUploadKind, setEditUploadKind] = useState<DocKind>("certificate");
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null);
  const [editUploadKey, setEditUploadKey] = useState(0);

  const [docs, setDocs] = useState<ActivityDocRow[]>([]);
  const docsByActivity = useMemo(() => {
    const map: Record<string, ActivityDocRow[]> = {};
    for (const d of docs) (map[d.activity_id] ||= []).push(d);
    return map;
  }, [docs]);

  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [legacyCertUrls, setLegacyCertUrls] = useState<Record<string, string>>({});

  const [activeTab, setActiveTab] = useState<ActivityTab>("todo");

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<string>("Wszystkie");
  const [filterYear, setFilterYear] = useState<string>("Wszystkie");

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
    if (sizeMb > MAX_MB) return `Plik jest za duży (${sizeMb.toFixed(1)} MB). Limit: ${MAX_MB} MB.`;
    return null;
  }

  async function load() {
    if (!user) {
      setItems([]);
      setDocs([]);
      setDocUrls({});
      setLegacyCertUrls({});
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
        setDocs([]);
        setDocUrls({});
        setLegacyCertUrls({});
        return;
      }

      const rows = ((data ?? []) as unknown as ActivityRow[]) ?? [];
      setItems(rows);

      const withLegacy = rows.filter((r) => r.certificate_path);
      const legacyResults = await Promise.all(
        withLegacy.map(async (r) => {
          const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(r.certificate_path!, 60 * 60);
          return { activityId: r.id, url: urlData?.signedUrl ?? "" };
        }),
      );

      const legacyMap: Record<string, string> = {};
      for (const x of legacyResults) if (x.url) legacyMap[x.activityId] = x.url;
      setLegacyCertUrls(legacyMap);

      const ids = rows.map((r) => r.id);

      if (!ids.length) {
        setDocs([]);
        setDocUrls({});
        return;
      }

      const { data: docsData, error: docsErr } = await supabase
        .from("activity_documents")
        .select("id,user_id,activity_id,kind,path,name,mime,size,uploaded_at")
        .in("activity_id", ids)
        .eq("user_id", user.id)
        .order("uploaded_at", { ascending: false });

      if (docsErr) {
        setDocs([]);
        setDocUrls({});
      } else {
        const docRows = ((docsData ?? []) as unknown as ActivityDocRow[]) ?? [];
        setDocs(docRows);

        const urlResults = await Promise.all(
          docRows.map(async (d) => {
            const { data: urlData } = await supabase.storage.from(BUCKET).createSignedUrl(d.path, 60 * 60);
            return { docId: d.id, url: urlData?.signedUrl ?? "" };
          }),
        );

        const docMap: Record<string, string> = {};
        for (const x of urlResults) if (x.url) docMap[x.docId] = x.url;
        setDocUrls(docMap);
      }
    } catch (e: any) {
      setErr(e?.message || "Nie udało się pobrać aktywności.");
      setItems([]);
      setDocs([]);
      setDocUrls({});
      setLegacyCertUrls({});
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setItems([]);
      setDocs([]);
      setDocUrls({});
      setLegacyCertUrls({});
      return;
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function uploadDoc(activityId: string, kind: DocKind, f: File) {
    if (!user) throw new Error("Brak użytkownika.");

    const mime = f.type || "application/octet-stream";
    const ext = extFromMime(mime);
    const safeName = (f.name || `file.${ext}`).slice(0, 180);
    const path = `${user.id}/${activityId}/${kind}-${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, f, {
      upsert: true,
      contentType: mime,
    });

    if (upErr) throw new Error(upErr.message);

    const { error: insErr } = await supabase.from("activity_documents").insert({
      user_id: user.id,
      activity_id: activityId,
      kind,
      path,
      name: safeName,
      mime,
      size: f.size,
    });

    if (insErr) throw new Error(insErr.message);
  }

  async function addActivity() {
    if (!user || busy) return;
    clearMessages();

    const p = Number(points);
    const y = Number(year);

    if (!Number.isFinite(p) || p < 0) return setErr("Punkty muszą być liczbą ≥ 0.");
    if (!Number.isFinite(y) || y < 1900 || y > 2100) return setErr("Rok wygląda na nieprawidłowy.");

    if (file) {
      const fe = validateFile(file);
      if (fe) return setErr(fe);
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
      if (error) return setErr(error.message);

      const newId = (data?.id as string | undefined) ?? undefined;
      if (!newId) return setErr("Nie udało się odczytać ID nowej aktywności.");

      if (file) {
        await uploadDoc(newId, "certificate", file);
        setInfo("Dodano aktywność i certyfikat.");
      } else {
        setInfo("Dodano aktywność. Możesz uzupełnić certyfikat później.");
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
    if (!user || busy) return;
    clearMessages();
    setBusy(true);

    try {
      const { error } = await supabase
        .from("activities")
        .update({ status: "done" as const })
        .eq("id", activityId)
        .eq("user_id", user.id);

      if (error) return setErr(error.message);

      setInfo("Oznaczono jako ukończone. Sprawdź, czy aktywność ma kompletne dane.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zmienić statusu.");
    } finally {
      setBusy(false);
    }
  }

  async function removeActivity(id: string, legacyCertPath?: string | null) {
    if (!user || busy) return;

    clearMessages();
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));

    setBusy(true);

    try {
      if (legacyCertPath) await supabase.storage.from(BUCKET).remove([legacyCertPath]);

      const myDocs = docs.filter((d) => d.activity_id === id);

      if (myDocs.length) {
        await supabase.storage.from(BUCKET).remove(myDocs.map((d) => d.path));
        await supabase.from("activity_documents").delete().eq("activity_id", id).eq("user_id", user.id);
      }

      const { error } = await supabase.from("activities").delete().eq("id", id).eq("user_id", user.id);

      if (error) {
        setErr(error.message);
        setItems(prev);
        return;
      }

      setInfo("Usunięto aktywność.");
    } catch (e: any) {
      setErr(e?.message || "Nie udało się usunąć.");
      setItems(prev);
    } finally {
      setBusy(false);
      await load();
    }
  }

  async function removeDoc(doc: ActivityDocRow) {
    if (!user || busy) return;

    clearMessages();
    setBusy(true);

    try {
      const { error: storErr } = await supabase.storage.from(BUCKET).remove([doc.path]);
      if (storErr) return setErr(storErr.message);

      const { error: delErr } = await supabase
        .from("activity_documents")
        .delete()
        .eq("id", doc.id)
        .eq("user_id", user.id);

      if (delErr) return setErr(delErr.message);

      setInfo("Usunięto plik.");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się usunąć pliku.");
    } finally {
      setBusy(false);
    }
  }

  async function attachFileToExisting() {
    if (!user || busy) return;
    if (!attachToId) return;
    if (!attachFile) return setErr("Wybierz plik.");

    const fe = validateFile(attachFile);
    if (fe) return setErr(fe);

    clearMessages();
    setBusy(true);

    try {
      await uploadDoc(attachToId, attachKind, attachFile);
      setInfo(attachKind === "certificate" ? "Dodano certyfikat." : "Dodano dokument.");
      setAttachFile(null);
      setAttachInputKey((k) => k + 1);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się dodać pliku.");
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

    setEditUploadKind("certificate");
    setEditUploadFile(null);
    setEditUploadKey((k) => k + 1);
  }

  function cancelEdit() {
    setEditId(null);
    setEditUploadFile(null);
  }

  async function saveEdit(activityId: string) {
    if (!user || busy) return;

    clearMessages();

    const p = Number(editPoints);
    const y = Number(editYear);

    if (!Number.isFinite(p) || p < 0) return setErr("Punkty muszą być liczbą ≥ 0.");
    if (!Number.isFinite(y) || y < 1900 || y > 2100) return setErr("Rok wygląda na nieprawidłowy.");

    const current = items.find((x) => x.id === activityId);
    const prog = current ? normalizeStatus(current.status) : "done";

    const org = editOrganizer.trim();

    const upd: any = {
      type: editType,
      points: p,
      year: y,
      organizer: org.length ? org : null,
    };

    if (prog === "planned") upd.planned_start_date = editPlannedDate ? editPlannedDate : null;

    setBusy(true);

    try {
      const { error } = await supabase.from("activities").update(upd).eq("id", activityId).eq("user_id", user.id);
      if (error) return setErr(error.message);

      setInfo("Zapisano zmiany.");
      setEditId(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać zmian.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadInsideEdit(activityId: string) {
    if (!user || busy) return;
    if (!editUploadFile) return setErr("Wybierz plik.");

    const fe = validateFile(editUploadFile);
    if (fe) return setErr(fe);

    clearMessages();
    setBusy(true);

    try {
      await uploadDoc(activityId, editUploadKind, editUploadFile);
      setInfo(editUploadKind === "certificate" ? "Dodano certyfikat." : "Dodano dokument.");
      setEditUploadFile(null);
      setEditUploadKey((k) => k + 1);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się dodać pliku.");
    } finally {
      setBusy(false);
    }
  }

  const years = useMemo(() => {
    return Array.from(new Set(items.map((i) => i.year))).sort((a, b) => b - a);
  }, [items]);

  const activityStats = useMemo(() => {
    let todo = 0;
    let planned = 0;
    let ready = 0;

    for (const a of items) {
      const docsFor = docsByActivity[a.id] ?? [];
      const bucket = getActivityTab(a, docsFor);

      if (bucket === "todo") todo += 1;
      if (bucket === "planned") planned += 1;
      if (bucket === "ready") ready += 1;
    }

    const readyPoints = items.reduce((sum, a) => {
      const docsFor = docsByActivity[a.id] ?? [];
      const bucket = getActivityTab(a, docsFor);
      return bucket === "ready" ? sum + Number(a.points || 0) : sum;
    }, 0);

    return {
      todo,
      planned,
      ready,
      all: items.length,
      readyPoints,
    };
  }, [items, docsByActivity]);

  function getTabCount(tab: ActivityTab) {
    if (tab === "todo") return activityStats.todo;
    if (tab === "planned") return activityStats.planned;
    if (tab === "ready") return activityStats.ready;
    return activityStats.all;
  }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return items.filter((a) => {
      const docsForTab = docsByActivity[a.id] ?? [];
      const bucket = getActivityTab(a, docsForTab);

      if (activeTab !== "all" && bucket !== activeTab) return false;

      if (filterType !== "Wszystkie" && a.type !== filterType) return false;
      if (filterYear !== "Wszystkie" && String(a.year) !== filterYear) return false;

      if (query) {
        const hay = `${a.type} ${a.organizer ?? ""} ${a.year} ${a.points} ${a.status ?? ""}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });
  }, [items, activeTab, q, filterType, filterYear, docsByActivity]);

  const activeTabMeta = ACTIVITY_TABS.find((t) => t.key === activeTab) ?? ACTIVITY_TABS[0];

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-4 text-sm">Ładuję…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">Aktywności</h1>
          <p className="mt-2 text-sm text-slate-600">Zaloguj się, aby zapisywać aktywności do portfolio.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Zaloguj się
            </Link>
            <Link
              href="/kalkulator"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kalkulator
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Aktywności</h1>
          <p className="mt-1 text-sm text-slate-600">
            Porządkuj aktywności CPD: uzupełniaj braki, podpinaj certyfikaty i przygotowuj dane do raportu.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/portfolio" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Portfolio
          </Link>
          <Link href="/kalkulator" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Kalkulator
          </Link>
        </div>
      </div>

      {(info || err) && (
        <div className="mt-3 rounded-2xl border bg-white p-3 text-sm">
          {info ? <div className="text-emerald-700">{info}</div> : null}
          {err ? <div className="text-rose-700">{err}</div> : null}
        </div>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <section className="order-2 rounded-2xl border bg-white p-4 lg:order-1 lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Twoje aktywności</h2>
              <p className="mt-1 text-[13px] text-slate-600">
                Uzupełniaj braki, kontroluj zaplanowane szkolenia i trzymaj kompletne aktywności gotowe do raportu.
              </p>
            </div>

            <button
              onClick={load}
              type="button"
              className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={busy || fetching}
            >
              {fetching ? "Odświeżam…" : "Odśwież"}
            </button>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <button
              type="button"
              onClick={() => setActiveTab("todo")}
              className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-left transition hover:bg-amber-100/60"
            >
              <div className="text-[11px] font-medium text-amber-800">Do uzupełnienia</div>
              <div className="mt-1 text-2xl font-extrabold text-amber-900">{activityStats.todo}</div>
              <div className="mt-1 text-[11px] text-amber-800">Wymagają działania</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("planned")}
              className="rounded-2xl border border-blue-200 bg-blue-50 p-3 text-left transition hover:bg-blue-100/60"
            >
              <div className="text-[11px] font-medium text-blue-700">Zaplanowane</div>
              <div className="mt-1 text-2xl font-extrabold text-blue-900">{activityStats.planned}</div>
              <div className="mt-1 text-[11px] text-blue-700">Jeszcze nie liczą się do punktów</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("ready")}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-left transition hover:bg-emerald-100/60"
            >
              <div className="text-[11px] font-medium text-emerald-700">Gotowe do raportu</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-900">{activityStats.ready}</div>
              <div className="mt-1 text-[11px] text-emerald-700">{activityStats.readyPoints} pkt kompletne</div>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:bg-slate-100"
            >
              <div className="text-[11px] font-medium text-slate-600">Wszystkie</div>
              <div className="mt-1 text-2xl font-extrabold text-slate-900">{activityStats.all}</div>
              <div className="mt-1 text-[11px] text-slate-600">Pełna historia</div>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <div className="grid gap-1 sm:grid-cols-4">
              {ACTIVITY_TABS.map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={[
                      "rounded-xl px-3 py-2 text-left transition",
                      active ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white/70",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={["text-sm font-semibold", active ? "text-slate-950" : "text-slate-700"].join(" ")}>
                        {tab.label}
                      </span>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-[11px] font-bold",
                          active ? "bg-blue-600 text-white" : "bg-white text-slate-600",
                        ].join(" ")}
                      >
                        {getTabCount(tab.key)}
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] leading-4 text-slate-500">{tab.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-12">
            <div className="sm:col-span-6">
              <label className="text-[11px] font-medium text-slate-600">Szukaj</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="np. kongres, OIL, 2025…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-[11px] font-medium text-slate-600">Typ</label>
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

            <div className="sm:col-span-3">
              <label className="text-[11px] font-medium text-slate-600">Rok</label>
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

            <div className="sm:col-span-9">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] text-slate-600">
                Widok: <span className="font-semibold text-slate-900">{activeTabMeta.label}</span> — {activeTabMeta.description}
              </div>
            </div>

            <div className="sm:col-span-3 flex items-center gap-2">
              <button
                type="button"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setQ("");
                  setFilterType("Wszystkie");
                  setFilterYear("Wszystkie");
                }}
              >
                Wyczyść
              </button>
              <div className="w-full text-right text-[11px] text-slate-600">
                Wynik: <span className="font-semibold text-slate-900">{filtered.length}</span>
              </div>
            </div>
          </div>

          {fetching ? (
            <div className="mt-3 text-sm text-slate-500">Pobieram…</div>
          ) : filtered.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-6 text-center">
              <div className="text-base font-semibold text-slate-900">Brak wyników</div>
              <div className="mt-1 text-sm text-slate-600">
                {activeTab === "todo"
                  ? "Nie masz aktywności wymagających uzupełnienia. Kompletne wpisy znajdziesz w „Gotowe do raportu”."
                  : activeTab === "planned"
                    ? "Nie masz obecnie zaplanowanych szkoleń. Możesz dodać je z bazy szkoleń."
                    : activeTab === "ready"
                      ? "Nie masz jeszcze aktywności gotowych do raportu. Uzupełnij certyfikaty i organizatorów."
                      : "Dodaj pierwszą aktywność lub zmień filtry."}
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {filtered.map((a) => {
                const prog = normalizeStatus(a.status);
                const docsFor = docsByActivity[a.id] ?? [];
                const { certDocs, otherDocs } = splitDocs(docsFor);
                const st = getRowStatus(a, docsFor);

                const legacyCertUrl = a.certificate_path ? legacyCertUrls[a.id] : null;
                const dleft = prog === "planned" ? daysUntil(a.planned_start_date) : null;
                const inEdit = editId === a.id;
                const attachCount = docsFor.length + (a.certificate_path ? 1 : 0);

                return (
                  <div
                    key={a.id}
                    className={[
                      "rounded-2xl border px-4 py-3",
                      prog === "planned"
                        ? "border-blue-200 bg-blue-50/30"
                        : st.kind === "missing"
                          ? "border-amber-200 bg-amber-50/20"
                          : "border-slate-200 bg-white",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="min-w-0 truncate font-semibold text-slate-900">{a.type}</div>

                          {prog === "planned" ? (
                            <Badge tone="blue">🗓️ Zaplanowane</Badge>
                          ) : st.kind === "missing" ? (
                            <Badge tone="amber">Do uzupełnienia</Badge>
                          ) : (
                            <Badge tone="emerald">Gotowe do raportu</Badge>
                          )}

                          {prog === "planned" && typeof dleft === "number" ? (
                            dleft > 0 ? (
                              <Badge tone={dleft <= 7 ? "amber" : "blue"}>⏳ {dleft} dni</Badge>
                            ) : dleft === 0 ? (
                              <Badge tone="amber">⏳ dzisiaj</Badge>
                            ) : (
                              <Badge tone="amber">⏳ po terminie</Badge>
                            )
                          ) : null}

                          {attachCount > 0 ? <Badge tone="slate">📎 Załączniki: {attachCount}</Badge> : null}
                        </div>

                        <div className="mt-1 text-[13px] text-slate-600">
                          <span className="break-words">{a.organizer ? a.organizer : "Brak organizatora"}</span> •{" "}
                          <span className="font-medium text-slate-900">{a.year}</span>
                          {a.created_at ? (
                            <>
                              {" "}
                              • <span className="text-slate-500">Dodano</span>{" "}
                              <span className="font-medium text-slate-900">{formatDateShort(a.created_at)}</span>
                            </>
                          ) : null}
                          {prog === "planned" ? (
                            <>
                              {" "}
                              • <span className="text-slate-500">Termin</span>{" "}
                              <span className="font-medium text-slate-900">{formatYMD(a.planned_start_date)}</span>
                            </>
                          ) : null}
                        </div>

                        {st.kind === "missing" ? (
                          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2">
                            <div className="text-[12px] font-semibold text-amber-900">
                              Uzupełnij, aby aktywność była gotowa do raportu:
                            </div>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {st.missing.map((m) => (
                                <span
                                  key={m}
                                  className="inline-flex items-center rounded-xl border border-amber-200 bg-white px-2 py-1 text-[11px] text-amber-800"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="shrink-0">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm">
                            <span className="text-slate-600">Pkt</span>{" "}
                            <span className="font-semibold text-slate-900">{a.points}</span>
                          </div>

                          <button
                            onClick={() => (inEdit ? cancelEdit() : startEdit(a))}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            type="button"
                            disabled={busy}
                          >
                            {inEdit ? "Zamknij" : "Edytuj"}
                          </button>

                          {prog === "planned" ? (
                            <button
                              onClick={() => markAsDone(a.id)}
                              className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                              type="button"
                              disabled={busy}
                            >
                              Ukończ
                            </button>
                          ) : null}

                          <button
                            onClick={() => removeActivity(a.id, a.certificate_path ?? null)}
                            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            type="button"
                            disabled={busy}
                          >
                            Usuń
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 space-y-1 text-[13px]">
                      {a.certificate_path ? (
                        <div className="flex flex-wrap items-center gap-2">
                          {legacyCertUrl ? (
                            <a href={legacyCertUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                              Otwórz certyfikat
                            </a>
                          ) : (
                            <span className="text-slate-500">Generuję link…</span>
                          )}
                          {a.certificate_name ? <span className="text-[11px] text-slate-500">{shortFileName(a.certificate_name)}</span> : null}
                        </div>
                      ) : null}

                      {certDocs.map((d) => (
                        <div key={d.id} className="flex flex-wrap items-center gap-2">
                          {docUrls[d.id] ? (
                            <a href={docUrls[d.id]} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:underline">
                              Otwórz certyfikat
                            </a>
                          ) : (
                            <span className="text-slate-500">Generuję link…</span>
                          )}
                          <span className="text-[11px] text-slate-500">{shortFileName(d.name)}</span>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => removeDoc(d)}
                            className="ml-auto rounded-xl border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                          >
                            Usuń
                          </button>
                        </div>
                      ))}

                      {otherDocs.length ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                          <div className="text-[11px] font-semibold text-slate-700">Dokumenty</div>
                          <div className="mt-1 space-y-1">
                            {otherDocs.map((d) => (
                              <div key={d.id} className="flex items-center gap-2">
                                {docUrls[d.id] ? (
                                  <a href={docUrls[d.id]} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                                    {shortFileName(d.name) || "Otwórz dokument"}
                                  </a>
                                ) : (
                                  <span className="text-slate-500">Generuję link…</span>
                                )}
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => removeDoc(d)}
                                  className="ml-auto rounded-xl border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  Usuń
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {inEdit ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[12px] font-semibold text-slate-900">Edycja aktywności</div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveEdit(a.id)}
                              disabled={busy}
                              className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                              {busy ? "Zapisuję…" : "Zapisz"}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={busy}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              Anuluj
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-medium text-slate-600">Rodzaj</label>
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
                            <label className="text-[11px] font-medium text-slate-600">Punkty</label>
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
                            <label className="text-[11px] font-medium text-slate-600">Rok</label>
                            <input
                              type="number"
                              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                              value={editYear}
                              onChange={(e) => setEditYear(Number(e.target.value || new Date().getFullYear()))}
                              disabled={busy}
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-medium text-slate-600">Organizator</label>
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
                              <label className="text-[11px] font-medium text-slate-600">Termin szkolenia</label>
                              <input
                                type="date"
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                value={editPlannedDate}
                                onChange={(e) => setEditPlannedDate(e.target.value)}
                                disabled={busy}
                              />
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="text-[12px] font-semibold text-slate-900">Dodaj załącznik</div>

                          <div className="mt-2 grid gap-2 sm:grid-cols-3">
                            <div className="sm:col-span-1">
                              <label className="text-[11px] font-medium text-slate-600">Typ</label>
                              <select
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                value={editUploadKind}
                                onChange={(e) => setEditUploadKind(e.target.value as DocKind)}
                                disabled={busy}
                              >
                                <option value="certificate">Certyfikat</option>
                                <option value="document">Dokument</option>
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-medium text-slate-600">Plik</label>
                              <input
                                key={editUploadKey}
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                                disabled={busy}
                                onChange={(e) => {
                                  clearMessages();
                                  const f = e.target.files?.[0] || null;
                                  if (!f) return setEditUploadFile(null);
                                  const ve = validateFile(f);
                                  if (ve) {
                                    setErr(ve);
                                    setEditUploadFile(null);
                                    return;
                                  }
                                  setEditUploadFile(f);
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => uploadInsideEdit(a.id)}
                              disabled={busy || !editUploadFile}
                              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                              {busy ? "Dodaję…" : "Dodaj"}
                            </button>
                            <div className="text-[11px] text-slate-500">Limit {MAX_MB} MB. PDF/JPG/PNG/WEBP.</div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="order-1 rounded-2xl border bg-white p-4 lg:order-2 lg:col-span-4">
          <h2 className="text-base font-semibold text-slate-900">Dodaj aktywność</h2>
          <p className="mt-1 text-[13px] text-slate-600">
            Dodaj aktywność, którą już ukończyłeś. Certyfikat możesz dołączyć teraz albo później.
          </p>

          <div className="mt-3 space-y-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600">Rodzaj</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600">Punkty</label>
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={points}
                  onChange={(e) => setPoints(Math.max(0, Number(e.target.value || 0)))}
                  disabled={busy}
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600">Rok</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value || new Date().getFullYear()))}
                  disabled={busy}
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600">Organizator</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="np. OIL / towarzystwo"
                disabled={busy}
              />
              <div className="mt-1 text-[11px] text-slate-500">Ważne w raportach. Jeśli nie uzupełnisz teraz, wpis trafi do braków.</div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600">Certyfikat opcjonalnie</label>
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
              <div className="mt-1 text-[11px] text-slate-500">Limit: {MAX_MB} MB. PDF/JPG/PNG/WEBP.</div>
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

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-semibold text-slate-900">Dodaj plik do istniejącej aktywności</div>
            <div className="mt-1 text-[11px] text-slate-600">
              Użyj, gdy masz już wpis i chcesz tylko podpiąć certyfikat albo dodatkowy dokument.
            </div>

            <div className="mt-2 space-y-2">
              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={attachToId ?? ""}
                onChange={(e) => setAttachToId(e.target.value || null)}
                disabled={busy}
              >
                <option value="">Wybierz aktywność…</option>
                {items.map((a) => (
                  <option key={a.id} value={a.id}>
                    {normalizeStatus(a.status) === "planned" ? "🗓️ Zaplanowane" : "✓ Ukończone"} • {a.year} • {a.type}
                    {a.organizer ? ` • ${a.organizer}` : ""}
                  </option>
                ))}
              </select>

              <select
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                value={attachKind}
                onChange={(e) => setAttachKind(e.target.value as DocKind)}
                disabled={busy}
              >
                <option value="certificate">Certyfikat</option>
                <option value="document">Dokument</option>
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
                onClick={attachFileToExisting}
                disabled={busy || !attachToId || !attachFile}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {busy ? "Dodaję…" : attachKind === "certificate" ? "Dodaj certyfikat" : "Dodaj dokument"}
              </button>
            </div>
          </div>

          <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[12px] text-blue-800">
            <div className="font-semibold">Jak korzystać z tej zakładki?</div>
            <div className="mt-1">
              Najpierw sprawdź „Do uzupełnienia”. Gdy wpis ma organizatora i certyfikat, automatycznie przejdzie do „Gotowe do raportu”.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
