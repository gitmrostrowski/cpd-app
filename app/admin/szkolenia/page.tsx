// app/admin/szkolenia/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import {
  fetchProfessionCatalog,
  fetchTrainings,
  toNormalizedTraining,
  type PointVerificationStatus,
  type TrainingProfessionRule,
} from "@/lib/data/crpe";
import {
  FALLBACK_PROFESSION_OPTIONS,
  type ProfessionOption,
} from "@/lib/cpd/professions";
import TrainingAudienceField, {
  hasTrainingAudience,
  trainingAudienceSelection,
  trainingAudienceSummary,
} from "@/components/TrainingAudienceField";

type TrainingStatus = "pending" | "approved" | "rejected";
type PriceDeclaration = "unconfirmed" | "free" | "paid";

type TrainingRow = {
  id: string;
  title: string;
  organizer: string | null;
  organizer_logo_url: string | null;
  organizer_logo_path: string | null;
  points: number | null;
  price_pln: number | null;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  time_zone: string;
  speakers: string[];
  url: string | null;
  external_url?: string | null;
  description: string | null;
  profession: string | null;
  audience_scope: "unknown" | "specific" | "all_medical";
  profession_rules: TrainingProfessionRule[];
  points_verification_status: PointVerificationStatus;
  points_source_url: string | null;
  points_verified_on: string | null;
  approval_status: TrainingStatus | null;
  reject_reason: string | null;
  submitted_by: string | null;
  submitted_email: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string | null;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function getStatus(row: TrainingRow): TrainingStatus {
  return row.approval_status ?? "pending";
}

function statusLabel(s: TrainingStatus) {
  if (s === "approved") return "zaakceptowane";
  if (s === "rejected") return "odrzucone";
  return "do weryfikacji";
}

function statusBadgeCls(s: TrainingStatus) {
  if (s === "approved") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (s === "rejected") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

function pointsVerificationLabel(status: PointVerificationStatus) {
  if (status === "verified") return "potwierdzone";
  if (status === "organizer_declared") return "deklarowane";
  return "niezweryfikowane";
}

function normOrganizer(v: string | null) {
  const t = (v ?? "").trim();
  if (!t) return null;
  return t;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return iso.slice(0, 10);
}

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pl-PL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtTimeRange(start: string | null, end: string | null) {
  if (!start) return "—";
  return end ? `${start.slice(0, 5)}–${end.slice(0, 5)}` : start.slice(0, 5);
}

const TIME_ZONE_OPTIONS = [
  { value: "Europe/Warsaw", label: "Polska — Europe/Warsaw" },
  { value: "Europe/Berlin", label: "Berlin — Europe/Berlin" },
  { value: "Europe/London", label: "Londyn — Europe/London" },
  { value: "Europe/Paris", label: "Paryż — Europe/Paris" },
  { value: "UTC", label: "UTC" },
] as const;

function shortId(id: string | null) {
  if (!id) return "—";
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function normalizeUrl(raw: string | null | undefined) {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  if (!/^https?:\/\//i.test(v)) return `https://${v}`;
  return v;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function AdminTrainingsPage() {
  const router = useRouter();
  const sb = useMemo(() => supabaseClient(), []);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [status, setStatus] = useState<"all" | TrainingStatus>("all");
  const [q, setQ] = useState("");
  const [addedByQ, setAddedByQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<TrainingRow | null>(null);
  const [editPriceDeclaration, setEditPriceDeclaration] =
    useState<PriceDeclaration>("unconfirmed");
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const [removeEditLogo, setRemoveEditLogo] = useState(false);
  const [professionOptions, setProfessionOptions] = useState<ProfessionOption[]>([
    ...FALLBACK_PROFESSION_OPTIONS,
  ]);

  useEffect(() => {
    if (!editLogoFile) {
      setEditLogoPreview(null);
      return;
    }
    const preview = URL.createObjectURL(editLogoFile);
    setEditLogoPreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [editLogoFile]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: auth } = await sb.auth.getUser();
      const user = auth?.user;

      if (!user) {
        if (!cancelled) router.replace("/login");
        return;
      }

      const { data, error } = await sb
        .from("platform_staff_roles")
        .select("role_code")
        .eq("user_id", user.id)
        .eq("role_code", "platform_admin")
        .is("revoked_at", null)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setIsAdmin(false);
        router.replace("/profil");
        return;
      }

      setIsAdmin(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sb]);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      let data = (await fetchTrainings(sb)) as TrainingRow[];
      if (status !== "all")
        data = data.filter((row) => getStatus(row) === status);
      if (dateFrom)
        data = data.filter((row) => row.created_at.slice(0, 10) >= dateFrom);
      if (dateTo)
        data = data.filter((row) => row.created_at.slice(0, 10) <= dateTo);
      if (addedByQ.trim()) {
        const phrase = addedByQ.trim().toLocaleLowerCase("pl-PL");
        data = data.filter((row) =>
          String(row.submitted_email ?? "")
            .toLocaleLowerCase("pl-PL")
            .includes(phrase),
        );
      }
      if (q.trim()) {
        const phrase = q.trim().toLocaleLowerCase("pl-PL");
        data = data.filter((row) =>
          [
            row.title,
            row.organizer,
            row.description,
            row.profession,
            ...(row.speakers ?? []),
            row.submitted_email,
          ].some((value) =>
            String(value ?? "").toLocaleLowerCase("pl-PL").includes(phrase),
          ),
        );
      }
      data.sort((a, b) => b.created_at.localeCompare(a.created_at));
      setRows(data);
    } catch (error: unknown) {
      setErr(errorMessage(error, "Błąd pobierania danych"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, status]);

  useEffect(() => {
    if (!isAdmin) return;
    void fetchProfessionCatalog(sb)
      .then(setProfessionOptions)
      .catch(() => undefined);
  }, [isAdmin, sb]);

  const filtered = useMemo(() => rows, [rows]);

  async function patch(id: string, patchData: Partial<TrainingRow>) {
    const current = rows.find((row) => row.id === id);
    if (!current) throw new Error("Nie znaleziono szkolenia.");
    const next = {
      ...current,
      ...patchData,
      approval_status: getStatus({ ...current, ...patchData }),
    };
    if (next.approval_status === "approved" && !hasTrainingAudience(next.profession)) {
      throw new Error("Przed akceptacją wybierz adresatów szkolenia.");
    }
    if (
      next.points_verification_status === "verified" &&
      (!next.points_source_url || !next.points_verified_on)
    ) {
      throw new Error(
        "Zweryfikowane punkty wymagają źródła i daty sprawdzenia.",
      );
    }
    const normalized: Record<string, unknown> = toNormalizedTraining(next);
    const audience = trainingAudienceSelection(
      next.profession,
      professionOptions,
    );
    normalized.audience_scope = audience.scope;
    const { data: auth } = await sb.auth.getUser();
    if (next.approval_status === "approved") {
      normalized.approved_by = auth.user?.id ?? null;
      normalized.approved_at = new Date().toISOString();
      normalized.reject_reason = null;
    } else if (next.approval_status === "rejected") {
      normalized.approved_by = auth.user?.id ?? null;
      normalized.approved_at = new Date().toISOString();
    } else {
      normalized.approved_by = null;
      normalized.approved_at = null;
      normalized.reject_reason = null;
    }

    // Najpierw zapisujemy relacje. Dzieki temu przy zmianie statusu na
    // approved trigger bazy widzi juz kompletna klasyfikacje szkolenia.
    const { error: rulesError } = await sb.rpc(
      "replace_training_profession_rules",
      {
        p_training_id: id,
        p_audience_scope: audience.scope,
        p_profession_codes: audience.professionCodes,
        p_points: next.points,
        p_verification_status:
          next.points_verification_status ?? "unverified",
        p_source_url: next.points_source_url ?? null,
        p_verified_on: next.points_verified_on ?? null,
      },
    );
    if (rulesError) throw rulesError;

    // Klasyfikacja zostala zapisana atomowo przez RPC. Nie wysylamy jej drugi
    // raz w zwyklym UPDATE, ktory moglby odtworzyc stan posredni.
    const {
      audience_scope: _audienceScope,
      points_verification_status: _pointsVerificationStatus,
      points_source_url: _pointsSourceUrl,
      points_verified_on: _pointsVerifiedOn,
      ...trainingData
    } = normalized;
    void _audienceScope;
    void _pointsVerificationStatus;
    void _pointsSourceUrl;
    void _pointsVerifiedOn;

    const { error } = await sb
      .from("trainings")
      .update(trainingData)
      .eq("id", id);

    if (error) throw error;

    const updated = {
      ...next,
      audience_scope: audience.scope,
    };
    setRows((prev) => prev.map((x) => (x.id === id ? updated : x)));
    return updated;
  }

  function openEdit(row: TrainingRow, focus?: "url" | "description" | "audience") {
    const base: TrainingRow = {
      ...row,
      approval_status: getStatus(row),
      url: normalizeUrl(row.url ?? row.external_url ?? null),
    };

    if (focus === "url" && !base.url) base.url = "";
    if (focus === "description" && !base.description) base.description = "";

    setEdit(base);
    setEditPriceDeclaration(
      typeof base.price_pln !== "number"
        ? "unconfirmed"
        : base.price_pln === 0
          ? "free"
          : "paid",
    );
    setEditError(null);
    setEditLogoFile(null);
    setRemoveEditLogo(false);
    setEditOpen(true);

    setTimeout(() => {
      const el =
        focus === "url"
          ? (document.getElementById("admin-training-url") as HTMLInputElement | null)
          : focus === "description"
          ? (document.getElementById("admin-training-description") as HTMLTextAreaElement | null)
          : focus === "audience"
          ? (document.getElementById("admin-training-audience") as HTMLDivElement | null)
          : null;

      el?.focus();
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 50);
  }

  function closeEdit() {
    setEditOpen(false);
    setEdit(null);
    setEditPriceDeclaration("unconfirmed");
    setEditError(null);
    setEditLogoFile(null);
    setRemoveEditLogo(false);
  }

  async function saveEdit() {
    if (!edit) return;

    if (
      editPriceDeclaration === "paid" &&
      (typeof edit.price_pln !== "number" ||
        Number.isNaN(edit.price_pln) ||
        edit.price_pln <= 0)
    ) {
      setEditError("Dla płatnego szkolenia podaj kwotę większą od 0 zł.");
      document
        .getElementById("admin-training-price")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    if (edit.end_time && !edit.start_time) {
      setEditError("Godzina zakończenia wymaga podania godziny rozpoczęcia.");
      return;
    }
    if (
      edit.start_time &&
      edit.end_time &&
      (!edit.end_date || edit.end_date === edit.start_date) &&
      edit.end_time <= edit.start_time
    ) {
      setEditError("Godzina zakończenia musi być późniejsza niż rozpoczęcia.");
      return;
    }
    if ((edit.speakers ?? []).length > 20) {
      setEditError("Możesz podać maksymalnie 20 prowadzących.");
      return;
    }
    if ((edit.speakers ?? []).some((speaker) => speaker.trim().length > 180)) {
      setEditError("Imię, nazwisko i tytuł prowadzącego mogą mieć maksymalnie 180 znaków.");
      return;
    }

    if (getStatus(edit) === "approved" && !hasTrainingAudience(edit.profession)) {
      setEditError("Przed akceptacją wybierz adresatów szkolenia.");
      document
        .getElementById("admin-training-audience")
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    if (
      edit.points_verification_status === "verified" &&
      (!edit.points_source_url || !edit.points_verified_on)
    ) {
      setEditError(
        "Zweryfikowane punkty wymagają źródła i daty sprawdzenia.",
      );
      return;
    }

    setSaving(true);
    setErr(null);
    setEditError(null);

    try {
      let organizerLogoUrl = edit.organizer_logo_url;
      let organizerLogoPath = edit.organizer_logo_path;

      if (editLogoFile) {
        const formData = new FormData();
        formData.set("training_id", edit.id);
        formData.set("organizer_logo", editLogoFile);
        const response = await fetch("/api/admin/trainings/logo", {
          method: "POST",
          body: formData,
        });
        const result = (await response.json().catch(() => null)) as {
          organizer_logo_url?: string | null;
          organizer_logo_path?: string | null;
          error?: string;
        } | null;
        if (!response.ok) {
          throw new Error(
            result?.error === "invalid_logo_type"
              ? "Logo musi być plikiem PNG, JPG lub WebP."
              : result?.error === "invalid_logo_size"
                ? "Logo może mieć maksymalnie 2 MB."
                : "Nie udało się zapisać logo organizatora.",
          );
        }
        organizerLogoUrl = result?.organizer_logo_url ?? null;
        organizerLogoPath = result?.organizer_logo_path ?? null;
      } else if (removeEditLogo && edit.organizer_logo_url) {
        const response = await fetch("/api/admin/trainings/logo", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ training_id: edit.id }),
        });
        if (!response.ok) throw new Error("Nie udało się usunąć logo organizatora.");
        organizerLogoUrl = null;
        organizerLogoPath = null;
      }

      const url = normalizeUrl(edit.url);

      const cleaned: Partial<TrainingRow> = {
        title: edit.title?.trim() || edit.title,
        organizer: normOrganizer(edit.organizer) ?? null,
        organizer_logo_url: organizerLogoUrl,
        organizer_logo_path: organizerLogoPath,
        points: edit.points,
        price_pln:
          editPriceDeclaration === "free"
            ? 0
            : editPriceDeclaration === "paid"
              ? edit.price_pln
              : null,
        start_date: edit.start_date || null,
        end_date: edit.end_date || null,
        start_time: edit.start_time || null,
        end_time: edit.end_time || null,
        time_zone: edit.time_zone || "Europe/Warsaw",
        speakers: (edit.speakers ?? [])
          .map((speaker) => speaker.trim())
          .filter(Boolean),
        url,
        external_url: url,
        description: (edit.description || "").trim() ? (edit.description || "").trim() : null,
        profession: edit.profession?.trim() || null,
        audience_scope: edit.audience_scope,
        profession_rules: edit.profession_rules,
        points_verification_status: edit.points_verification_status,
        points_source_url: normalizeUrl(edit.points_source_url),
        points_verified_on: edit.points_verified_on || null,
        approval_status: getStatus(edit),
        reject_reason: (edit.reject_reason || "").trim()
          ? (edit.reject_reason || "").trim()
          : null,
      };

      const updated = await patch(edit.id, cleaned);
      closeEdit();

      if (status !== "all" && getStatus(updated) !== status) load();
    } catch (error: unknown) {
      setEditError(errorMessage(error, "Błąd zapisu"));
    } finally {
      setSaving(false);
    }
  }

  async function approve(row: TrainingRow) {
    setErr(null);

    if (!hasTrainingAudience(row.profession)) {
      openEdit({ ...row, approval_status: "approved" }, "audience");
      setEditError("Przed akceptacją wybierz adresatów szkolenia.");
      return;
    }

    try {
      const updated = await patch(row.id, {
        approval_status: "approved",
        reject_reason: null,
      });

      if (status !== "all" && getStatus(updated) !== status) load();
    } catch (error: unknown) {
      setErr(errorMessage(error, "Błąd akceptacji"));
    }
  }

  async function reject(row: TrainingRow) {
    const reason = window.prompt("Powód odrzucenia:", row.reject_reason || "");

    if (reason === null) return;

    setErr(null);

    try {
      const updated = await patch(row.id, {
        approval_status: "rejected",
        reject_reason: reason.trim() || "Odrzucone",
      });

      if (status !== "all" && getStatus(updated) !== status) load();
    } catch (error: unknown) {
      setErr(errorMessage(error, "Błąd odrzucenia"));
    }
  }

  async function backToPending(row: TrainingRow) {
    setErr(null);

    try {
      const updated = await patch(row.id, {
        approval_status: "pending",
        reject_reason: null,
      });

      if (status !== "all" && getStatus(updated) !== status) load();
    } catch (error: unknown) {
      setErr(errorMessage(error, "Błąd zmiany statusu"));
    }
  }

  function clearFilters() {
    setQ("");
    setAddedByQ("");
    setDateFrom("");
    setDateTo("");
    setStatus("all");
    setTimeout(load, 50);
  }

  if (isAdmin === null) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-slate-500">
        Sprawdzam uprawnienia…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-6">
        <div className="text-sm text-slate-500">
          <Link href="/profil" className="hover:underline">
            Profil
          </Link>
          <span className="px-2">/</span>
          <span className="text-slate-700">Admin</span>
        </div>

        <h1 className="mt-1 text-2xl font-semibold text-slate-900">
          Akceptacja i edycja szkoleń
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Zarządzaj szkoleniami, sprawdzaj kto je dodał i filtruj po statusie, osobie oraz dacie.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Status</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | TrainingStatus)
              }
            >
              <option value="all">Wszystkie</option>
              <option value="pending">Do weryfikacji</option>
              <option value="approved">Zaakceptowane</option>
              <option value="rejected">Odrzucone</option>
            </select>
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-slate-600">Szukaj</label>
            <input
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tytuł, organizator, opis..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
          </div>

          <div className="lg:col-span-3">
            <label className="text-xs font-semibold text-slate-600">
              Dodane przez
            </label>
            <input
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adres e-mail..."
              value={addedByQ}
              onChange={(e) => setAddedByQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Od daty dodania</label>
            <input
              type="date"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Do daty dodania</label>
            <input
              type="date"
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <div className="lg:col-span-12 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              onClick={clearFilters}
              type="button"
            >
              Wyczyść
            </button>

            <button
              className="h-10 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
              onClick={load}
              disabled={loading}
              type="button"
            >
              {loading ? "Szukam…" : "Filtruj"}
            </button>
          </div>
        </div>
      </div>

      {err && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          {err}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-800">
            Rekordy: {filtered.length}
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            {loading ? "Odświeżam…" : "Odśwież"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Szkolenie</th>
                <th className="px-4 py-3">Organizator</th>
                <th className="px-4 py-3">Daty szkolenia</th>
                <th className="px-4 py-3">Pkt</th>
                <th className="px-4 py-3">Dodane przez</th>
                <th className="px-4 py-3">Data dodania</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Akcje</th>
              </tr>
            </thead>

            <tbody className="text-sm text-slate-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={8}>
                    Ładuję…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={8}>
                    Brak danych.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const org = normOrganizer(r.organizer);
                  const currentStatus = getStatus(r);
                  const link = normalizeUrl(r.url ?? r.external_url ?? null);

                  return (
                    <tr key={r.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-4">
                        <div className="max-w-[390px] font-semibold text-slate-900">
                          {r.title}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {link ? (
                            <a
                              className="text-blue-700 hover:underline"
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                            >
                              link
                            </a>
                          ) : (
                            <button
                              type="button"
                              className="text-blue-700 hover:underline"
                              onClick={() => openEdit(r, "url")}
                            >
                              Dodaj link
                            </button>
                          )}

                          {r.description ? (
                            <span className="line-clamp-1 max-w-[360px]">
                              {r.description}
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="text-blue-700 hover:underline"
                              onClick={() => openEdit(r, "description")}
                            >
                              Dodaj opis
                            </button>
                          )}
                        </div>

                        {currentStatus === "rejected" && r.reject_reason ? (
                          <div className="mt-2 text-xs text-rose-700">
                            Powód: {r.reject_reason}
                          </div>
                        ) : null}

                        <div
                          className={cls(
                            "mt-2 text-xs font-medium",
                            hasTrainingAudience(r.profession)
                              ? "text-slate-500"
                              : "text-amber-700",
                          )}
                        >
                          Adresaci: {trainingAudienceSummary(r.profession)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {r.organizer_logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.organizer_logo_url}
                              alt=""
                              className="h-8 w-8 rounded-lg border border-slate-200 bg-white object-contain p-1"
                              referrerPolicy="no-referrer"
                            />
                          ) : null}
                          <span>{org || <span className="text-slate-400">—</span>}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-700">
                        <div className="whitespace-nowrap">{fmtDate(r.start_date)}</div>
                        <div className="whitespace-nowrap text-slate-500">{fmtDate(r.end_date)}</div>
                        <div className="mt-1 whitespace-nowrap font-semibold text-blue-700">{fmtTimeRange(r.start_time, r.end_time)}</div>
                      </td>

                      <td className="px-4 py-4">
                        <div>{r.points ?? <span className="text-slate-400">—</span>}</div>
                        <div className="mt-1 text-[10px] font-semibold text-slate-400">
                          {pointsVerificationLabel(r.points_verification_status)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        {r.submitted_email ? (
                          <div className="font-semibold text-slate-800">
                            {r.submitted_email}
                          </div>
                        ) : (
                          <>
                            <div className="font-semibold text-slate-500">brak e-maila</div>
                            <div className="mt-1 text-slate-400">
                              ID: {shortId(r.submitted_by || r.user_id)}
                            </div>
                          </>
                        )}
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-600">
                        <div className="whitespace-nowrap">{fmtDateTime(r.created_at)}</div>
                        {r.updated_at ? (
                          <div className="mt-1 whitespace-nowrap text-slate-400">
                            akt.: {fmtDateTime(r.updated_at)}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={cls(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                            statusBadgeCls(currentStatus)
                          )}
                        >
                          {statusLabel(currentStatus)}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            className="h-9 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                            onClick={() => openEdit(r)}
                            type="button"
                          >
                            Edytuj
                          </button>

                          {currentStatus !== "approved" ? (
                            <button
                              className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                              onClick={() => approve(r)}
                              type="button"
                            >
                              Akceptuj
                            </button>
                          ) : null}

                          {currentStatus !== "rejected" ? (
                            <button
                              className="h-9 rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-50"
                              onClick={() => reject(r)}
                              type="button"
                            >
                              Odrzuć
                            </button>
                          ) : null}

                          {currentStatus !== "pending" ? (
                            <button
                              className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                              onClick={() => backToPending(r)}
                              type="button"
                            >
                              Do weryfikacji
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editOpen && edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Edycja szkolenia
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Dodane: {fmtDateTime(edit.created_at)} · Dodał:{" "}
                  {edit.submitted_email || shortId(edit.submitted_by || edit.user_id)}
                </div>
              </div>

              <button
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                onClick={closeEdit}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
              {editError && !editError.includes("adresatów") ? (
                <div
                  role="alert"
                  className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800"
                >
                  {editError}
                </div>
              ) : null}

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Tytuł</label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Organizator</label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.organizer || ""}
                  onChange={(e) => setEdit({ ...edit, organizer: e.target.value || null })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">
                  Logo organizatora (opcjonalnie)
                </label>
                <div className="mt-1 flex flex-col gap-3 rounded-xl border border-slate-200 p-3 sm:flex-row sm:items-center">
                  {editLogoPreview || (!removeEditLogo && edit.organizer_logo_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={editLogoPreview || edit.organizer_logo_url || ""}
                      alt="Podgląd logo organizatora"
                      className="h-16 w-20 shrink-0 rounded-xl border border-slate-200 bg-white object-contain p-1.5"
                    />
                  ) : (
                    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                      brak logo
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                      onChange={(event) => {
                        const file = event.currentTarget.files?.[0] ?? null;
                        if (!file) return;
                        if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                          setEditError("Wybierz logo PNG, JPG lub WebP.");
                          event.currentTarget.value = "";
                          return;
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          setEditError("Logo może mieć maksymalnie 2 MB.");
                          event.currentTarget.value = "";
                          return;
                        }
                        setEditError(null);
                        setEditLogoFile(file);
                        setRemoveEditLogo(false);
                      }}
                    />
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>PNG, JPG lub WebP, maks. 2 MB</span>
                      {(edit.organizer_logo_url || editLogoFile) && !removeEditLogo ? (
                        <button
                          type="button"
                          className="font-semibold text-rose-700 hover:underline"
                          onClick={() => {
                            setEditLogoFile(null);
                            setRemoveEditLogo(true);
                          }}
                        >
                          Usuń logo
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div
                id="admin-training-audience"
                tabIndex={-1}
                className="scroll-mt-4 outline-none sm:col-span-2"
              >
                <TrainingAudienceField
                  value={edit.profession}
                  onChange={(profession) => {
                    setEdit({ ...edit, profession });
                    setEditError(null);
                  }}
                  options={professionOptions}
                  disabled={saving}
                  compact
                  error={
                    editError?.includes("adresatów") ? editError : null
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Punkty</label>
                <input
                  type="number"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.points ?? ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      points: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  Dla wybranych zawodów ta wartość zostanie zapisana osobno.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Status punktacji
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.points_verification_status}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      points_verification_status: e.target
                        .value as PointVerificationStatus,
                    })
                  }
                >
                  <option value="unverified">Niezweryfikowane</option>
                  <option value="organizer_declared">Deklarowane przez organizatora</option>
                  <option value="verified">Zweryfikowane przez CRPE</option>
                </select>
              </div>

              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="admin-training-price-declaration" className="text-xs font-semibold text-slate-600">
                    Cena
                  </label>
                  <select
                    id="admin-training-price-declaration"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={editPriceDeclaration}
                    onChange={(event) => {
                      const declaration = event.target.value as PriceDeclaration;
                      setEditPriceDeclaration(declaration);
                      setEdit({
                        ...edit,
                        price_pln:
                          declaration === "free"
                            ? 0
                            : declaration === "unconfirmed"
                              ? null
                              : edit.price_pln === 0
                                ? null
                                : edit.price_pln,
                      });
                      setEditError(null);
                    }}
                  >
                    <option value="unconfirmed">Cena do potwierdzenia</option>
                    <option value="free">Bezpłatne</option>
                    <option value="paid">Płatne</option>
                  </select>
                </div>
                {editPriceDeclaration === "paid" ? (
                  <div>
                    <label htmlFor="admin-training-price" className="text-xs font-semibold text-slate-600">
                      Kwota w PLN
                    </label>
                    <input
                      id="admin-training-price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      value={edit.price_pln ?? ""}
                      onChange={(event) => {
                        setEdit({
                          ...edit,
                          price_pln:
                            event.target.value === ""
                              ? null
                              : Number(event.target.value),
                        });
                        setEditError(null);
                      }}
                      placeholder="np. 199"
                    />
                  </div>
                ) : null}
              </div>

              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Źródło punktacji
                  </label>
                  <input
                    type="url"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                    value={edit.points_source_url || ""}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        points_source_url: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Sprawdzono dnia
                  </label>
                  <input
                    type="date"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={edit.points_verified_on || ""}
                    onChange={(e) =>
                      setEdit({
                        ...edit,
                        points_verified_on: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Start</label>
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.start_date || ""}
                  onChange={(e) => setEdit({ ...edit, start_date: e.target.value || null })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Koniec</label>
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.end_date || ""}
                  onChange={(e) => setEdit({ ...edit, end_date: e.target.value || null })}
                />
              </div>

              <div>
                <label htmlFor="admin-training-start-time" className="text-xs font-semibold text-slate-600">Godzina rozpoczęcia</label>
                <input
                  id="admin-training-start-time"
                  type="time"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.start_time || ""}
                  onChange={(event) => setEdit({ ...edit, start_time: event.target.value || null })}
                />
              </div>

              <div>
                <label htmlFor="admin-training-end-time" className="text-xs font-semibold text-slate-600">Godzina zakończenia</label>
                <input
                  id="admin-training-end-time"
                  type="time"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.end_time || ""}
                  onChange={(event) => setEdit({ ...edit, end_time: event.target.value || null })}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="admin-training-time-zone" className="text-xs font-semibold text-slate-600">Strefa czasowa</label>
                <select
                  id="admin-training-time-zone"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.time_zone || "Europe/Warsaw"}
                  onChange={(event) => setEdit({ ...edit, time_zone: event.target.value })}
                >
                  {!TIME_ZONE_OPTIONS.some((option) => option.value === edit.time_zone) && edit.time_zone ? (
                    <option value={edit.time_zone}>{edit.time_zone}</option>
                  ) : null}
                  {TIME_ZONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Link</label>
                <input
                  id="admin-training-url"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.url || ""}
                  onChange={(e) => setEdit({ ...edit, url: e.target.value || null })}
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="admin-training-speakers" className="text-xs font-semibold text-slate-600">Prowadzący</label>
                <textarea
                  id="admin-training-speakers"
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={(edit.speakers ?? []).join("\n")}
                  onChange={(event) => setEdit({
                    ...edit,
                    speakers: event.target.value.split(/\r?\n/).map((speaker) => speaker.trimStart()),
                  })}
                  placeholder={"Każdy prowadzący w osobnym wierszu\nnp. dr hab. n. med. Anna Kowalska"}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Opis</label>
                <textarea
                  id="admin-training-description"
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.description || ""}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value || null })}
                  placeholder="Krótki opis szkolenia..."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Status akceptacji
                </label>
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={getStatus(edit)}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      approval_status: e.target.value as TrainingStatus,
                    })
                  }
                >
                  <option value="pending">do weryfikacji</option>
                  <option value="approved">zaakceptowane</option>
                  <option value="rejected">odrzucone</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Powód odrzucenia
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.reject_reason || ""}
                  onChange={(e) => setEdit({ ...edit, reject_reason: e.target.value || null })}
                  placeholder="Opcjonalnie…"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={closeEdit}
                disabled={saving}
                type="button"
              >
                Anuluj
              </button>

              <button
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={saveEdit}
                disabled={saving}
                type="button"
              >
                {saving ? "Zapisuję…" : "Zapisz"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
