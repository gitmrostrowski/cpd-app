// app/activities/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  Award,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  FilePlus2,
  FileText,
  FolderCheck,
  FolderOpen,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
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

type StatusKind = "complete" | "missing";
type ActivityTab = "todo" | "planned" | "ready" | "all";

const ACTIVITY_TABS: {
  key: ActivityTab;
  label: string;
  short: string;
  description: string;
}[] = [
  {
    key: "todo",
    label: "Do uzupełnienia",
    short: "Braki",
    description: "Brakujące dane, certyfikaty lub dokumenty.",
  },
  {
    key: "planned",
    label: "Zaplanowane",
    short: "Plan",
    description: "Szkolenia w planie. Jeszcze nie liczą się do punktów.",
  },
  {
    key: "ready",
    label: "Gotowe do raportu",
    short: "Gotowe",
    description: "Kompletne aktywności gotowe do rozliczenia.",
  },
  {
    key: "all",
    label: "Wszystkie",
    short: "Historia",
    description: "Pełna historia aktywności.",
  },
];

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
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    12,
    0,
    0,
  );

  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

function splitDocs(docsForActivity: ActivityDocRow[]) {
  const certDocs = docsForActivity.filter(
    (d) => String(d.kind).toLowerCase() === "certificate",
  );
  const otherDocs = docsForActivity.filter(
    (d) => String(d.kind).toLowerCase() !== "certificate",
  );
  return { certDocs, otherDocs };
}

function getRowStatus(
  a: ActivityRow,
  docsForActivity: ActivityDocRow[],
): { kind: StatusKind; missing: string[] } {
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

function getActivityTab(
  a: ActivityRow,
  docsForActivity: ActivityDocRow[],
): Exclude<ActivityTab, "all"> {
  const prog = normalizeStatus(a.status);
  const st = getRowStatus(a, docsForActivity);

  if (prog === "planned") return "planned";
  if (st.kind === "missing") return "todo";
  return "ready";
}

function tabTone(tab: ActivityTab) {
  if (tab === "todo") {
    return {
      stripe: "bg-amber-400",
      icon: "bg-amber-50 text-amber-700 ring-amber-100",
      pill: "border-amber-200 bg-white text-amber-700",
      active: "border-slate-300 bg-white shadow-sm ring-1 ring-slate-200",
      number: "text-amber-700",
    };
  }

  if (tab === "planned") {
    return {
      stripe: "bg-blue-500",
      icon: "bg-blue-50 text-blue-700 ring-blue-100",
      pill: "border-blue-200 bg-blue-50 text-blue-700",
      active: "border-blue-200 bg-white shadow-sm ring-1 ring-blue-100",
      number: "text-blue-700",
    };
  }

  if (tab === "ready") {
    return {
      stripe: "bg-emerald-500",
      icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      pill: "border-emerald-200 bg-emerald-50 text-emerald-700",
      active: "border-emerald-200 bg-white shadow-sm ring-1 ring-emerald-100",
      number: "text-emerald-700",
    };
  }

  return {
    stripe: "bg-slate-400",
    icon: "bg-slate-50 text-slate-600 ring-slate-100",
    pill: "border-slate-200 bg-slate-50 text-slate-600",
    active: "border-slate-200 bg-white shadow-sm ring-1 ring-slate-200",
    number: "text-slate-900",
  };
}

function activityVisual(a: ActivityRow, docsForActivity: ActivityDocRow[]) {
  const prog = normalizeStatus(a.status);
  const st = getRowStatus(a, docsForActivity);

  if (prog === "planned") {
    return {
      tab: "planned" as const,
      label: "Zaplanowane",
      stripe: "bg-blue-500",
      card: "border-slate-300/80 bg-white hover:border-blue-200 hover:shadow-[0_1px_0_rgba(37,99,235,0.08),0_7px_14px_rgba(37,99,235,0.12)]",
      badge: "border-blue-200 bg-blue-50 text-blue-700",
      iconBox: "bg-blue-50 text-blue-700 ring-blue-100",
      Icon: CalendarDays,
    };
  }

  if (st.kind === "missing") {
    return {
      tab: "todo" as const,
      label: "Do uzupełnienia",
      stripe: "bg-amber-400",
      card: "border-slate-300/80 bg-white hover:border-amber-200 hover:shadow-[0_1px_0_rgba(245,158,11,0.08),0_7px_14px_rgba(245,158,11,0.12)]",
      badge: "border-amber-200 bg-white text-amber-700",
      iconBox: "bg-amber-50 text-amber-700 ring-amber-100",
      Icon: AlertTriangle,
    };
  }

  return {
    tab: "ready" as const,
    label: "Gotowe do raportu",
    stripe: "bg-emerald-500",
    card: "border-slate-300/80 bg-white hover:border-emerald-200 hover:shadow-[0_1px_0_rgba(16,185,129,0.08),0_7px_14px_rgba(16,185,129,0.12)]",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    iconBox: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Icon: CheckCircle2,
  };
}

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none shadow-sm",
        className,
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

  const [editUploadKind, setEditUploadKind] =
    useState<DocKind>("certificate");
  const [editUploadFile, setEditUploadFile] = useState<File | null>(null);
  const [editUploadKey, setEditUploadKey] = useState(0);

  const [docs, setDocs] = useState<ActivityDocRow[]>([]);
  const docsByActivity = useMemo(() => {
    const map: Record<string, ActivityDocRow[]> = {};
    for (const d of docs) (map[d.activity_id] ||= []).push(d);
    return map;
  }, [docs]);

  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [legacyCertUrls, setLegacyCertUrls] = useState<Record<string, string>>(
    {},
  );

  const [activeTab, setActiveTab] = useState<ActivityTab>("todo");

  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState<string>("Wszystkie");
  const [filterYear, setFilterYear] = useState<string>("Wszystkie");

  const fieldBase =
    "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 shadow-sm shadow-slate-900/5 transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100/80";

  const labelBase =
    "mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500";

  const metaIconBase =
    "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500";

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
    if (sizeMb > MAX_MB) {
      return `Plik jest za duży (${sizeMb.toFixed(1)} MB). Limit: ${MAX_MB} MB.`;
    }
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
          const { data: urlData } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(r.certificate_path!, 60 * 60);
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
            const { data: urlData } = await supabase.storage
              .from(BUCKET)
              .createSignedUrl(d.path, 60 * 60);
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

    if (!Number.isFinite(p) || p < 0) {
      return setErr("Punkty muszą być liczbą ≥ 0.");
    }

    if (!Number.isFinite(y) || y < 1900 || y > 2100) {
      return setErr("Rok wygląda na nieprawidłowy.");
    }

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
      const { data, error } = await supabase
        .from("activities")
        .insert(payload)
        .select("id")
        .single();

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
        await supabase
          .from("activity_documents")
          .delete()
          .eq("activity_id", id)
          .eq("user_id", user.id);
      }

      const { error } = await supabase
        .from("activities")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

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
      const { error: storErr } = await supabase.storage
        .from(BUCKET)
        .remove([doc.path]);

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

    if (!Number.isFinite(p) || p < 0) {
      return setErr("Punkty muszą być liczbą ≥ 0.");
    }

    if (!Number.isFinite(y) || y < 1900 || y > 2100) {
      return setErr("Rok wygląda na nieprawidłowy.");
    }

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
      upd.planned_start_date = editPlannedDate ? editPlannedDate : null;
    }

    setBusy(true);

    try {
      const { error } = await supabase
        .from("activities")
        .update(upd)
        .eq("id", activityId)
        .eq("user_id", user.id);

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

    const plannedPoints = items.reduce((sum, a) => {
      const docsFor = docsByActivity[a.id] ?? [];
      const bucket = getActivityTab(a, docsFor);
      return bucket === "planned" ? sum + Number(a.points || 0) : sum;
    }, 0);

    const missingPoints = items.reduce((sum, a) => {
      const docsFor = docsByActivity[a.id] ?? [];
      const bucket = getActivityTab(a, docsFor);
      return bucket === "todo" ? sum + Number(a.points || 0) : sum;
    }, 0);

    return {
      todo,
      planned,
      ready,
      all: items.length,
      readyPoints,
      plannedPoints,
      missingPoints,
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
      if (filterYear !== "Wszystkie" && String(a.year) !== filterYear) {
        return false;
      }

      if (query) {
        const hay =
          `${a.type} ${a.organizer ?? ""} ${a.year} ${a.points} ${a.status ?? ""}`.toLowerCase();

        if (!hay.includes(query)) return false;
      }

      return true;
    });
  }, [items, activeTab, q, filterType, filterYear, docsByActivity]);

  const activeTabMeta =
    ACTIVITY_TABS.find((t) => t.key === activeTab) ?? ACTIVITY_TABS[0];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#eaf1f8]">
        <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[1.35rem] border border-slate-300/80 bg-white p-5 text-sm text-slate-600 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            Sprawdzam sesję…
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#eaf1f8]">
        <main className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-300/80 bg-white p-6 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
            <div className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-blue-500" />
            <h1 className="text-2xl font-bold text-slate-900">Aktywności</h1>
            <p className="mt-2 text-sm text-slate-600">
              Zaloguj się, aby zapisywać aktywności do portfolio.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/login"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Zaloguj się
              </Link>
              <Link
                href="/kalkulator"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Kalkulator
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#eaf1f8]">
      <main className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-7 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.35rem] border border-slate-300/80 bg-white px-5 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.08)] sm:px-6">
          <div className="absolute bottom-4 left-0 top-4 w-1 rounded-r-full bg-blue-500" />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                <ClipboardList className="h-5 w-5" strokeWidth={2.2} />
              </span>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                  Aktywności
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
                  Porządkuj aktywności CPD, uzupełniaj braki i trzymaj
                  certyfikaty gotowe do raportu.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/portfolio"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                Portfolio
              </Link>

              <Link
                href="/kalkulator"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                Kalkulator
              </Link>

              <button
                onClick={load}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
                disabled={fetching || busy}
                type="button"
              >
                <RefreshCw
                  className={["h-4 w-4", fetching ? "animate-spin" : ""].join(" ")}
                />
                {fetching ? "Odświeżam…" : "Odśwież"}
              </button>
            </div>
          </div>
        </div>

        {(info || err) && (
          <div className="mt-4 rounded-[1.1rem] border border-slate-300/80 bg-white p-3 text-sm shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
            {info ? <div className="font-medium text-emerald-700">{info}</div> : null}
            {err ? <div className="font-medium text-rose-700">{err}</div> : null}
          </div>
        )}

        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-4">
            <div className="rounded-[1.35rem] border border-slate-300/80 bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.075)]">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Widok aktywności
                  </div>
                  <div className="text-xs text-slate-500">
                    Najpierw uzupełnij braki, potem sprawdź wpisy gotowe do
                    raportu.
                  </div>
                </div>

                <div className="text-sm text-slate-500">
                  Wynik:{" "}
                  <span className="font-semibold text-slate-900">
                    {filtered.length}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {ACTIVITY_TABS.map((tab) => {
                  const active = activeTab === tab.key;
                  const tone = tabTone(tab.key);
                  const Icon =
                    tab.key === "todo"
                      ? AlertTriangle
                      : tab.key === "planned"
                        ? CalendarDays
                        : tab.key === "ready"
                          ? FolderCheck
                          : Archive;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={[
                        "relative overflow-hidden rounded-2xl border p-3 text-left transition hover:bg-white hover:shadow-sm",
                        active
                          ? tone.active
                          : "border-slate-200 bg-slate-50/70",
                      ].join(" ")}
                    >
                      <div
                        className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${
                          active ? tone.stripe : "bg-slate-200"
                        }`}
                      />

                      <div className="flex items-center gap-2 pl-1">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ring-1 ${tone.icon}`}
                        >
                          <Icon className="h-4 w-4" strokeWidth={2.2} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="truncate text-sm font-semibold text-slate-950">
                              {tab.label}
                            </div>
                            <div
                              className={`text-lg font-extrabold leading-none ${tone.number}`}
                            >
                              {getTabCount(tab.key)}
                            </div>
                          </div>
                          <div className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <label className={labelBase}>Szukaj</label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      className={`${fieldBase} pl-9`}
                      placeholder="np. kongres, OIL, 2025..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <label className={labelBase}>Typ</label>
                  <select
                    className={fieldBase}
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

                <div className="lg:col-span-2">
                  <label className={labelBase}>Rok</label>
                  <select
                    className={fieldBase}
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

                <div className="flex items-end lg:col-span-2">
                  <button
                    type="button"
                    className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    onClick={() => {
                      setQ("");
                      setFilterType("Wszystkie");
                      setFilterYear("Wszystkie");
                    }}
                  >
                    Wyczyść
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600">
                {activeTab === "todo" ? (
                  <>
                    Masz{" "}
                    <span className="font-semibold text-slate-900">
                      {activityStats.todo}
                    </span>{" "}
                    aktywności do uzupełnienia. Najpierw dodaj certyfikaty i
                    organizatorów — wtedy wpisy automatycznie trafią do{" "}
                    <span className="font-semibold text-slate-900">
                      „Gotowe do raportu”
                    </span>
                    .
                  </>
                ) : activeTab === "planned" ? (
                  <>
                    Zaplanowane aktywności nie liczą się jeszcze do punktów. Po
                    szkoleniu oznacz je jako ukończone i dodaj certyfikat.
                  </>
                ) : activeTab === "ready" ? (
                  <>
                    Te aktywności są kompletne i gotowe do raportu. Łącznie:{" "}
                    <span className="font-semibold text-emerald-700">
                      {activityStats.readyPoints} pkt
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Pełna historia aktywności CPD — zaplanowane, do
                    uzupełnienia i gotowe do raportu.
                  </>
                )}
              </div>
            </div>

            {fetching ? (
              <div className="rounded-[1.35rem] border border-slate-300/80 bg-white p-5 text-sm text-slate-600 shadow-[0_6px_16px_rgba(15,23,42,0.08)]">
                Pobieram aktywności…
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-[1.35rem] border border-slate-300/80 bg-white p-6 text-center shadow-[0_7px_16px_rgba(15,23,42,0.10)]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                  <FolderOpen className="h-6 w-6" />
                </div>
                <div className="mt-3 text-base font-semibold text-slate-900">
                  Brak wyników
                </div>
                <div className="mx-auto mt-1 max-w-md text-sm leading-relaxed text-slate-600">
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
              <div className="space-y-4">
                {filtered.map((a) => {
                  const prog = normalizeStatus(a.status);
                  const docsFor = docsByActivity[a.id] ?? [];
                  const { certDocs, otherDocs } = splitDocs(docsFor);
                  const st = getRowStatus(a, docsFor);
                  const visual = activityVisual(a, docsFor);

                  const legacyCertUrl = a.certificate_path
                    ? legacyCertUrls[a.id]
                    : null;

                  const dleft =
                    prog === "planned" ? daysUntil(a.planned_start_date) : null;

                  const inEdit = editId === a.id;
                  const attachCount = docsFor.length + (a.certificate_path ? 1 : 0);
                  const VisualIcon = visual.Icon;

                  return (
                    <article
                      key={a.id}
                      className={[
                        "group relative overflow-hidden rounded-[1.25rem] border p-3 shadow-[0_1px_0_rgba(15,23,42,0.05),0_4px_10px_rgba(15,23,42,0.085)] transition-all duration-200 hover:-translate-y-[1px]",
                        visual.card,
                      ].join(" ")}
                    >
                      <div
                        className={`absolute bottom-0 left-0 top-0 w-1.5 ${visual.stripe}`}
                      />

                      <div className="flex w-full gap-3 pl-1.5">
                        <div className="hidden shrink-0 sm:block">
                          <div className="flex w-[66px] flex-col items-center rounded-2xl bg-slate-50 px-2 py-2 shadow-inner shadow-slate-900/5 ring-1 ring-slate-300/80">
                            <span
                              className={`mb-1.5 h-1.5 w-8 rounded-full ${visual.stripe}`}
                            />
                            <span className="text-2xl font-extrabold leading-none tracking-[-0.06em] text-slate-950">
                              {a.points}
                            </span>
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                              PKT
                            </span>
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Badge className={visual.badge}>
                                  <span
                                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full ring-1 ${visual.iconBox}`}
                                  >
                                    <VisualIcon
                                      className="h-3.5 w-3.5"
                                      strokeWidth={2.2}
                                    />
                                  </span>
                                  {visual.label}
                                </Badge>

                                {prog === "planned" &&
                                typeof dleft === "number" ? (
                                  dleft > 0 ? (
                                    <Badge
                                      className={
                                        dleft <= 7
                                          ? "border-amber-200 bg-amber-50 text-amber-700"
                                          : "border-blue-200 bg-blue-50 text-blue-700"
                                      }
                                    >
                                      <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                                      {dleft} dni
                                    </Badge>
                                  ) : dleft === 0 ? (
                                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                      <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                                      dzisiaj
                                    </Badge>
                                  ) : (
                                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                                      <Clock3 className="h-3.5 w-3.5" strokeWidth={2} />
                                      po terminie
                                    </Badge>
                                  )
                                ) : null}

                                {attachCount > 0 ? (
                                  <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                                    <Paperclip className="h-3.5 w-3.5" strokeWidth={2} />
                                    {attachCount}
                                  </Badge>
                                ) : null}
                              </div>

                              <h3 className="mt-1.5 line-clamp-2 text-[15px] font-bold leading-snug tracking-[-0.015em] text-slate-950">
                                {a.type}
                              </h3>

                              <div className="mt-2 grid gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                  <span className={metaIconBase}>
                                    <FileText className="h-3 w-3" strokeWidth={2} />
                                  </span>
                                  <span className="truncate font-semibold text-slate-700">
                                    {a.organizer ? a.organizer : "Brak organizatora"}
                                  </span>
                                </span>

                                <span className="inline-flex min-w-0 items-center gap-1.5">
                                  <span className={metaIconBase}>
                                    <CalendarDays className="h-3 w-3" strokeWidth={2} />
                                  </span>
                                  <span className="truncate">
                                    Rok{" "}
                                    <span className="font-semibold text-slate-700">
                                      {a.year}
                                    </span>
                                  </span>
                                </span>

                                {a.created_at ? (
                                  <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <span className={metaIconBase}>
                                      <Clock3 className="h-3 w-3" strokeWidth={2} />
                                    </span>
                                    <span className="truncate">
                                      Dodano {formatDateShort(a.created_at)}
                                    </span>
                                  </span>
                                ) : null}

                                {prog === "planned" ? (
                                  <span className="inline-flex min-w-0 items-center gap-1.5">
                                    <span className={metaIconBase}>
                                      <CalendarDays className="h-3 w-3" strokeWidth={2} />
                                    </span>
                                    <span className="truncate">
                                      Termin{" "}
                                      <span className="font-semibold text-slate-700">
                                        {formatYMD(a.planned_start_date)}
                                      </span>
                                    </span>
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                              <button
                                onClick={() => (inEdit ? cancelEdit() : startEdit(a))}
                                className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:scale-95 disabled:opacity-60"
                                type="button"
                                disabled={busy}
                              >
                                {inEdit
                                  ? "Zamknij"
                                  : st.kind === "missing"
                                    ? "Uzupełnij"
                                    : "Edytuj"}
                              </button>

                              {prog === "planned" ? (
                                <button
                                  onClick={() => markAsDone(a.id)}
                                  className="inline-flex h-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 active:scale-95 disabled:opacity-60"
                                  type="button"
                                  disabled={busy}
                                >
                                  Ukończ
                                </button>
                              ) : null}

                              <button
                                onClick={() =>
                                  removeActivity(a.id, a.certificate_path ?? null)
                                }
                                className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-60"
                                type="button"
                                disabled={busy}
                                title="Usuń aktywność"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {st.kind === "missing" ? (
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                                <AlertTriangle
                                  className="h-3.5 w-3.5 text-amber-500"
                                  strokeWidth={2.2}
                                />
                                Braki
                              </span>

                              {st.missing.map((m) => (
                                <span
                                  key={m}
                                  className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200"
                                >
                                  {m}
                                </span>
                              ))}
                            </div>
                          ) : null}

                          <div className="mt-3 space-y-1.5 text-[13px]">
                            {a.certificate_path ? (
                              <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200">
                                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                                {legacyCertUrl ? (
                                  <a
                                    href={legacyCertUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-700 hover:underline"
                                  >
                                    Otwórz certyfikat
                                  </a>
                                ) : (
                                  <span className="text-slate-500">Generuję link…</span>
                                )}
                                {a.certificate_name ? (
                                  <span className="text-[11px] text-slate-500">
                                    {shortFileName(a.certificate_name)}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}

                            {certDocs.map((d) => (
                              <div
                                key={d.id}
                                className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2 ring-1 ring-slate-200"
                              >
                                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                                {docUrls[d.id] ? (
                                  <a
                                    href={docUrls[d.id]}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-700 hover:underline"
                                  >
                                    Otwórz certyfikat
                                  </a>
                                ) : (
                                  <span className="text-slate-500">Generuję link…</span>
                                )}
                                <span className="text-[11px] text-slate-500">
                                  {shortFileName(d.name)}
                                </span>
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => removeDoc(d)}
                                  className="ml-auto rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                >
                                  Usuń
                                </button>
                              </div>
                            ))}

                            {otherDocs.length ? (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                                  <Paperclip className="h-3.5 w-3.5" />
                                  Dokumenty
                                </div>

                                <div className="mt-1 space-y-1">
                                  {otherDocs.map((d) => (
                                    <div key={d.id} className="flex items-center gap-2">
                                      {docUrls[d.id] ? (
                                        <a
                                          href={docUrls[d.id]}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="text-blue-700 hover:underline"
                                        >
                                          {shortFileName(d.name) || "Otwórz dokument"}
                                        </a>
                                      ) : (
                                        <span className="text-slate-500">
                                          Generuję link…
                                        </span>
                                      )}

                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => removeDoc(d)}
                                        className="ml-auto rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
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
                                <div className="text-[12px] font-semibold text-slate-900">
                                  Edycja aktywności
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveEdit(a.id)}
                                    disabled={busy}
                                    className="inline-flex h-8 items-center justify-center rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
                                  >
                                    {busy ? "Zapisuję…" : "Zapisz"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={busy}
                                    className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    Anuluj
                                  </button>
                                </div>
                              </div>

                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                  <label className={labelBase}>Rodzaj</label>
                                  <select
                                    className={fieldBase}
                                    value={editType}
                                    onChange={(e) =>
                                      setEditType(e.target.value as any)
                                    }
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
                                  <label className={labelBase}>Punkty</label>
                                  <input
                                    type="number"
                                    min={0}
                                    className={fieldBase}
                                    value={editPoints}
                                    onChange={(e) =>
                                      setEditPoints(
                                        Math.max(0, Number(e.target.value || 0)),
                                      )
                                    }
                                    disabled={busy}
                                  />
                                </div>

                                <div>
                                  <label className={labelBase}>Rok</label>
                                  <input
                                    type="number"
                                    className={fieldBase}
                                    value={editYear}
                                    onChange={(e) =>
                                      setEditYear(
                                        Number(
                                          e.target.value || new Date().getFullYear(),
                                        ),
                                      )
                                    }
                                    disabled={busy}
                                  />
                                </div>

                                <div className="sm:col-span-2">
                                  <label className={labelBase}>Organizator</label>
                                  <input
                                    className={fieldBase}
                                    value={editOrganizer}
                                    onChange={(e) =>
                                      setEditOrganizer(e.target.value)
                                    }
                                    placeholder="np. OIL / towarzystwo"
                                    disabled={busy}
                                  />
                                </div>

                                {prog === "planned" ? (
                                  <div className="sm:col-span-2">
                                    <label className={labelBase}>
                                      Termin szkolenia
                                    </label>
                                    <input
                                      type="date"
                                      className={fieldBase}
                                      value={editPlannedDate}
                                      onChange={(e) =>
                                        setEditPlannedDate(e.target.value)
                                      }
                                      disabled={busy}
                                    />
                                  </div>
                                ) : null}
                              </div>

                              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-900">
                                  <UploadCloud className="h-4 w-4 text-blue-600" />
                                  Dodaj załącznik
                                </div>

                                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                  <div>
                                    <label className={labelBase}>Typ</label>
                                    <select
                                      className={fieldBase}
                                      value={editUploadKind}
                                      onChange={(e) =>
                                        setEditUploadKind(
                                          e.target.value as DocKind,
                                        )
                                      }
                                      disabled={busy}
                                    >
                                      <option value="certificate">Certyfikat</option>
                                      <option value="document">Dokument</option>
                                    </select>
                                  </div>

                                  <div className="sm:col-span-2">
                                    <label className={labelBase}>Plik</label>
                                    <input
                                      key={editUploadKey}
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                                      className={fieldBase}
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
                                    className="inline-flex h-8 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                                  >
                                    {busy ? "Dodaję…" : "Dodaj"}
                                  </button>
                                  <div className="text-[11px] text-slate-500">
                                    Limit {MAX_MB} MB. PDF/JPG/PNG/WEBP.
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="rounded-[1.45rem] border border-slate-300/80 bg-white p-4 shadow-[0_7px_16px_rgba(15,23,42,0.10)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-500">
                Porządkowanie
              </p>

              <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-slate-950">
                Podsumowanie CPD
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Najważniejsze statusy z Twojej listy aktywności.
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("todo")}
                  className="flex min-h-[58px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:bg-amber-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <AlertTriangle className="h-4 w-4" strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-base font-bold leading-none tracking-[-0.03em] text-slate-950">
                      {activityStats.todo}
                    </div>
                    <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                      braki
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("planned")}
                  className="flex min-h-[58px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:bg-blue-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <CalendarDays className="h-4 w-4" strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-base font-bold leading-none tracking-[-0.03em] text-slate-950">
                      {activityStats.planned}
                    </div>
                    <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                      plan
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("ready")}
                  className="flex min-h-[58px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left transition hover:bg-emerald-50"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <FolderCheck className="h-4 w-4" strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0">
                    <div className="text-base font-bold leading-none tracking-[-0.03em] text-slate-950">
                      {activityStats.ready}
                    </div>
                    <div className="mt-1 text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                      gotowe
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-950">
                      Gotowe punkty
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Kompletne aktywności
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-extrabold tracking-[-0.05em] text-emerald-700">
                      {activityStats.readyPoints}
                    </div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      pkt
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.45rem] border border-slate-300/80 bg-white p-4 shadow-[0_7px_16px_rgba(15,23,42,0.10)]">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600">
                  <UploadCloud className="h-4 w-4" strokeWidth={2.2} />
                </span>

                <div>
                  <h2 className="text-sm font-semibold text-slate-950">
                    Dodaj plik do wpisu
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Podpinaj certyfikaty i dodatkowe dokumenty do istniejących
                    aktywności.
                  </p>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <select
                  className={fieldBase}
                  value={attachToId ?? ""}
                  onChange={(e) => setAttachToId(e.target.value || null)}
                  disabled={busy}
                >
                  <option value="">Wybierz aktywność…</option>
                  {items.map((a) => (
                    <option key={a.id} value={a.id}>
                      {normalizeStatus(a.status) === "planned"
                        ? "🗓️ Zaplanowane"
                        : "✓ Ukończone"}{" "}
                      • {a.year} • {a.type}
                      {a.organizer ? ` • ${a.organizer}` : ""}
                    </option>
                  ))}
                </select>

                <select
                  className={fieldBase}
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
                  className={fieldBase}
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
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                >
                  <Paperclip className="h-4 w-4" />
                  {busy
                    ? "Dodaję…"
                    : attachKind === "certificate"
                      ? "Dodaj certyfikat"
                      : "Dodaj dokument"}
                </button>
              </div>
            </div>

            <div className="rounded-[1.45rem] border border-slate-300/80 bg-white p-4 shadow-[0_7px_16px_rgba(15,23,42,0.10)]">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
                  <Plus className="h-4 w-4" strokeWidth={2.2} />
                </span>

                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    Dodaj aktywność
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Dodaj aktywność, którą już ukończyłeś. Certyfikat możesz
                    dołączyć teraz albo później.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className={labelBase}>Rodzaj</label>
                  <select
                    className={fieldBase}
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
                    <label className={labelBase}>Punkty</label>
                    <input
                      type="number"
                      min={0}
                      className={fieldBase}
                      value={points}
                      onChange={(e) =>
                        setPoints(Math.max(0, Number(e.target.value || 0)))
                      }
                      disabled={busy}
                    />
                  </div>

                  <div>
                    <label className={labelBase}>Rok</label>
                    <input
                      type="number"
                      className={fieldBase}
                      value={year}
                      onChange={(e) =>
                        setYear(Number(e.target.value || new Date().getFullYear()))
                      }
                      disabled={busy}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Organizator</label>
                  <input
                    className={fieldBase}
                    value={organizer}
                    onChange={(e) => setOrganizer(e.target.value)}
                    placeholder="np. OIL / towarzystwo"
                    disabled={busy}
                  />
                  <div className="mt-1 text-[11px] text-slate-500">
                    Jeśli nie uzupełnisz teraz, wpis trafi do braków.
                  </div>
                </div>

                <div>
                  <label className={labelBase}>Certyfikat opcjonalnie</label>
                  <input
                    key={fileInputKey}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
                    className={fieldBase}
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
                  <div className="mt-1 text-[11px] text-slate-500">
                    Limit: {MAX_MB} MB. PDF/JPG/PNG/WEBP.
                  </div>
                </div>

                <button
                  onClick={addActivity}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-[0_5px_12px_rgba(37,99,235,0.20)] transition hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                  type="button"
                  disabled={busy}
                >
                  <FilePlus2 className="h-4 w-4" />
                  {busy ? "Zapisuję…" : "Zapisz aktywność"}
                </button>
              </div>
            </div>

            <div className="rounded-[1.45rem] border border-blue-100 bg-blue-50/80 p-4 text-xs leading-relaxed text-blue-800 shadow-[0_7px_16px_rgba(37,99,235,0.08)]">
              <div className="flex items-center gap-2 font-semibold">
                <Award className="h-4 w-4" />
                Jak korzystać?
              </div>
              <p className="mt-2">
                Zacznij od widoku{" "}
                <span className="font-semibold">Do uzupełnienia</span>. Gdy
                aktywność ma organizatora i certyfikat, automatycznie przejdzie
                do <span className="font-semibold">Gotowe do raportu</span>.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
