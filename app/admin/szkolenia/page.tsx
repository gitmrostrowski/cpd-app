// app/admin/szkolenia/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import {
  fetchProfessionCatalog,
  fetchTrainings,
  type TrainingProfessionCredit,
  type TrainingProfessionRef,
  toNormalizedTraining,
} from "@/lib/data/crpe";
import {
  FALLBACK_PROFESSION_OPTIONS,
  type ProfessionOption,
} from "@/lib/cpd/professions";

type TrainingStatus = "pending" | "approved" | "rejected";
type AudienceScope = "all" | "selected" | "unknown";
type CreditStatus = "unknown" | "none" | "awarded";

type TrainingRow = {
  id: string;
  title: string;
  organizer: string | null;
  points: number | null;
  audience_scope: AudienceScope;
  target_professions: TrainingProfessionRef[];
  credit_status: CreditStatus;
  profession_credits: TrainingProfessionCredit[];
  start_date: string | null;
  end_date: string | null;
  url: string | null;
  external_url?: string | null;
  description: string | null;
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

function normOrganizer(v: string | null) {
  const t = (v ?? "").trim();
  if (!t) return null;
  if (t.toLowerCase() === "nil") return null;
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

function classificationIssue(
  audienceScope: AudienceScope,
  targetProfessionIds: string[],
  creditStatus: CreditStatus,
  credits: Array<{ profession_id: string; points: number }>,
) {
  if (audienceScope === "unknown") return "Ustal adresatów szkolenia.";
  if (audienceScope === "selected" && !targetProfessionIds.length)
    return "Wybierz co najmniej jeden zawód.";
  if (creditStatus === "unknown") return "Ustal status punktów edukacyjnych.";
  if (creditStatus === "awarded" && !credits.length)
    return "Dodaj punktację dla co najmniej jednego zawodu.";
  if (credits.some((credit) => !Number.isFinite(credit.points) || credit.points <= 0))
    return "Każda liczba punktów musi być większa od zera.";
  if (
    audienceScope === "selected" &&
    credits.some((credit) => !targetProfessionIds.includes(credit.profession_id))
  ) return "Punkty można przypisać tylko adresatom szkolenia.";
  return null;
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
  const [professionOptions, setProfessionOptions] = useState<ProfessionOption[]>([
    ...FALLBACK_PROFESSION_OPTIONS,
  ]);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<TrainingRow | null>(null);
  const [editTargetProfessionIds, setEditTargetProfessionIds] = useState<string[]>([]);
  const [editCreditProfessionIds, setEditCreditProfessionIds] = useState<string[]>([]);
  const [editCreditPoints, setEditCreditPoints] = useState<Record<string, string>>({});
  const [editCreditDetails, setEditCreditDetails] = useState<Record<string, {
    awarding_body: string;
    basis_reference: string;
    source_url: string;
    verification_status: "organizer_declared" | "operator_verified";
  }>>({});
  const [saving, setSaving] = useState(false);

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
            row.submitted_email,
          ].some((value) =>
            String(value ?? "").toLocaleLowerCase("pl-PL").includes(phrase),
          ),
        );
      }
      data.sort((a, b) => b.created_at.localeCompare(a.created_at));
      setRows(data);
    } catch (e: any) {
      setErr(e?.message || "Błąd pobierania danych");
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
    void fetchProfessionCatalog(sb).then(setProfessionOptions).catch(() => undefined);
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
    const normalized: Record<string, unknown> = toNormalizedTraining(next);
    // Relacje zawodów i ich punktacja są zapisywane atomowo przez dedykowane
    // RPC. Zwykła edycja pól nie może wyczyścić wyliczonej klasyfikacji.
    delete normalized.target_profession_text;
    delete normalized.audience_scope;
    delete normalized.credit_status;
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

    const { error } = await sb
      .from("trainings")
      .update(normalized)
      .eq("id", id);

    if (error) throw error;

    const updated = next;
    setRows((prev) => prev.map((x) => (x.id === id ? updated : x)));
    return updated;
  }

  function openEdit(row: TrainingRow, focus?: "url" | "description") {
    const base: TrainingRow = {
      ...row,
      approval_status: getStatus(row),
      url: normalizeUrl(row.url ?? row.external_url ?? null),
    };

    if (focus === "url" && !base.url) base.url = "";
    if (focus === "description" && !base.description) base.description = "";

    setEdit(base);
    setEditTargetProfessionIds(
      (base.target_professions ?? []).map((item) => item.profession_id),
    );
    setEditCreditProfessionIds(
      (base.profession_credits ?? []).map((item) => item.profession_id),
    );
    setEditCreditPoints(
      Object.fromEntries(
        (base.profession_credits ?? []).map((item) => [item.profession_id, String(item.points)]),
      ),
    );
    setEditCreditDetails(
      Object.fromEntries(
        (base.profession_credits ?? []).map((item) => [
          item.profession_id,
          {
            awarding_body: item.awarding_body ?? "",
            basis_reference: item.basis_reference ?? "",
            source_url: item.source_url ?? "",
            verification_status: item.verification_status,
          },
        ]),
      ),
    );
    setEditOpen(true);

    setTimeout(() => {
      const el =
        focus === "url"
          ? (document.getElementById("admin-training-url") as HTMLInputElement | null)
          : focus === "description"
          ? (document.getElementById("admin-training-description") as HTMLTextAreaElement | null)
          : null;

      el?.focus();
    }, 50);
  }

  function closeEdit() {
    setEditOpen(false);
    setEdit(null);
    setEditTargetProfessionIds([]);
    setEditCreditProfessionIds([]);
    setEditCreditPoints({});
    setEditCreditDetails({});
  }

  async function saveEdit() {
    if (!edit) return;

    setSaving(true);
    setErr(null);

    try {
      const url = normalizeUrl(edit.url);
      const credits = edit.credit_status === "awarded"
        ? editCreditProfessionIds.map((professionId) => ({
            profession_id: professionId,
            points: Number(String(editCreditPoints[professionId] ?? "").replace(",", ".")),
            awarding_body: editCreditDetails[professionId]?.awarding_body || null,
            basis_reference: editCreditDetails[professionId]?.basis_reference || null,
            source_url: normalizeUrl(editCreditDetails[professionId]?.source_url),
            // Zapis wykonany świadomie w panelu operatora kończy weryfikację
            // klasyfikacji. Wpis organizatora nie może pozostać bez końca jako
            // organizer_declared po zaakceptowaniu go przez operatora.
            verification_status: "operator_verified" as const,
          }))
        : [];
      const issue = classificationIssue(
        edit.audience_scope,
        editTargetProfessionIds,
        edit.credit_status,
        credits,
      );
      if (getStatus(edit) === "approved" && issue) throw new Error(issue);

      const { error: classificationError } = await sb.rpc(
        "admin_set_training_classification_v5_2",
        {
          p_training_id: edit.id,
          p_audience_scope: edit.audience_scope,
          p_profession_ids:
            edit.audience_scope === "selected" ? editTargetProfessionIds : [],
          p_credit_status: edit.credit_status,
          p_credits: credits,
        },
      );
      if (classificationError) throw classificationError;
      const derivedPoints =
        edit.credit_status === "none"
          ? 0
          : edit.credit_status === "awarded"
            ? Math.max(...credits.map((credit) => credit.points))
            : null;

      const cleaned: Partial<TrainingRow> = {
        title: edit.title?.trim() || edit.title,
        organizer: normOrganizer(edit.organizer) ?? null,
        points: derivedPoints,
        start_date: edit.start_date || null,
        end_date: edit.end_date || null,
        url,
        external_url: url,
        description: (edit.description || "").trim() ? (edit.description || "").trim() : null,
        approval_status: getStatus(edit),
        reject_reason: (edit.reject_reason || "").trim()
          ? (edit.reject_reason || "").trim()
          : null,
      };

      await patch(edit.id, cleaned);
      closeEdit();
      await load();
    } catch (e: any) {
      setErr(e?.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  }

  async function approve(row: TrainingRow) {
    setErr(null);

    try {
      const issue = classificationIssue(
        row.audience_scope,
        (row.target_professions ?? []).map((item) => item.profession_id),
        row.credit_status,
        (row.profession_credits ?? []).map((item) => ({
          profession_id: item.profession_id,
          points: item.points,
        })),
      );
      if (issue) {
        setErr(`${issue} Otwórz „Edytuj”, uzupełnij dane i dopiero wtedy zaakceptuj.`);
        openEdit(row);
        return;
      }
      const updated = await patch(row.id, {
        approval_status: "approved",
        reject_reason: null,
      });

      if (status !== "all" && getStatus(updated) !== status) load();
    } catch (e: any) {
      setErr(e?.message || "Błąd akceptacji");
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
    } catch (e: any) {
      setErr(e?.message || "Błąd odrzucenia");
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
    } catch (e: any) {
      setErr(e?.message || "Błąd zmiany statusu");
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
              onChange={(e) => setStatus(e.target.value as any)}
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
                <th className="px-4 py-3">Adresaci / punkty</th>
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
                  <td className="px-4 py-4 text-slate-500" colSpan={9}>
                    Ładuję…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={9}>
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
                      </td>

                      <td className="px-4 py-4">
                        {org || <span className="text-slate-400">—</span>}
                      </td>

                      <td className="px-4 py-4 text-xs text-slate-700">
                        <div className="whitespace-nowrap">{fmtDate(r.start_date)}</div>
                        <div className="whitespace-nowrap text-slate-500">{fmtDate(r.end_date)}</div>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        <div className={cls(
                          "font-semibold",
                          r.audience_scope === "unknown" ? "text-amber-700" : "text-slate-800",
                        )}>
                          {r.audience_scope === "all"
                            ? "Wszystkie zawody"
                            : r.audience_scope === "unknown"
                              ? "Niezweryfikowani"
                              : (r.target_professions ?? []).map((item) => item.name_pl).join(", ") || "Brak wyboru"}
                        </div>
                        <div className={cls(
                          "mt-1",
                          r.credit_status === "unknown" ? "text-amber-700" : "text-slate-500",
                        )}>
                          {r.credit_status === "unknown"
                            ? "Punkty: brak informacji"
                            : r.credit_status === "none"
                              ? "Bez punktów"
                              : `Punktacja dla ${(r.profession_credits ?? []).length} zaw.`}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {r.points ?? <span className="text-slate-400">—</span>}
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
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl">
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
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Tytuł</label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.title}
                  onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Organizator</label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.organizer || ""}
                  onChange={(e) => setEdit({ ...edit, organizer: e.target.value || null })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Punkty (wyliczane z tabeli poniżej)</label>
                <input
                  type="number"
                  readOnly
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500"
                  value={edit.points ?? ""}
                />
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
                <label className="text-xs font-semibold text-slate-600">Opis</label>
                <textarea
                  id="admin-training-description"
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.description || ""}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value || null })}
                  placeholder="Krótki opis szkolenia..."
                />
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">Adresaci szkolenia</div>
                <div className="mt-2 flex flex-wrap gap-4">
                  {[
                    { value: "unknown", label: "Niezweryfikowani" },
                    { value: "all", label: "Wszystkie zawody medyczne" },
                    { value: "selected", label: "Wybrane zawody" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="admin-training-audience"
                        checked={edit.audience_scope === option.value}
                        onChange={() => {
                          const scope = option.value as AudienceScope;
                          setEdit({ ...edit, audience_scope: scope });
                          if (scope !== "selected") setEditTargetProfessionIds([]);
                        }}
                        className="h-4 w-4 border-slate-300 text-blue-600"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {edit.audience_scope === "selected" ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {professionOptions.filter((option) => option.id).map((option) => {
                      const id = String(option.id);
                      const checked = editTargetProfessionIds.includes(id);
                      return (
                        <label key={id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              setEditTargetProfessionIds((current) =>
                                checked ? current.filter((item) => item !== id) : [...current, id],
                              );
                              if (checked) setEditCreditProfessionIds((current) => current.filter((item) => item !== id));
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-blue-600"
                          />
                          {option.name_pl}
                        </label>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <div className="sm:col-span-2 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <div className="text-sm font-semibold text-slate-900">Punktacja według zawodu</div>
                <div className="mt-2 flex flex-wrap gap-4">
                  {[
                    { value: "unknown", label: "Brak informacji" },
                    { value: "none", label: "Bez punktów" },
                    { value: "awarded", label: "Przyznaje punkty" },
                  ].map((option) => (
                    <label key={option.value} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="admin-training-credit-status"
                        checked={edit.credit_status === option.value}
                        onChange={() => {
                          const creditStatus = option.value as CreditStatus;
                          setEdit({ ...edit, credit_status: creditStatus });
                          if (creditStatus !== "awarded") setEditCreditProfessionIds([]);
                        }}
                        className="h-4 w-4 border-slate-300 text-blue-600"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>

                {edit.credit_status === "awarded" ? (
                  <div className="mt-4 space-y-3">
                    {professionOptions
                      .filter((option) => option.id)
                      .filter((option) => edit.audience_scope !== "selected" || editTargetProfessionIds.includes(String(option.id)))
                      .map((option) => {
                        const id = String(option.id);
                        const checked = editCreditProfessionIds.includes(id);
                        const details = editCreditDetails[id] ?? {
                          awarding_body: "",
                          basis_reference: "",
                          source_url: "",
                          verification_status: "operator_verified" as const,
                        };
                        return (
                          <div key={id} className="rounded-xl border border-blue-100 bg-white p-3">
                            <div className="flex items-center gap-3">
                              <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-slate-800">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => setEditCreditProfessionIds((current) =>
                                    checked ? current.filter((item) => item !== id) : [...current, id]
                                  )}
                                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                />
                                {option.name_pl}
                              </label>
                              {checked ? (
                                <input
                                  value={editCreditPoints[id] ?? ""}
                                  onChange={(event) => setEditCreditPoints((current) => ({ ...current, [id]: event.target.value }))}
                                  className="h-9 w-24 rounded-lg border border-slate-300 px-2 text-sm"
                                  inputMode="decimal"
                                  placeholder="pkt"
                                  aria-label={`Punkty dla: ${option.name_pl}`}
                                />
                              ) : null}
                            </div>
                            {checked ? (
                              <div className="mt-3 grid gap-2 md:grid-cols-3">
                                <input
                                  value={details.awarding_body}
                                  onChange={(event) => setEditCreditDetails((current) => ({ ...current, [id]: { ...details, awarding_body: event.target.value } }))}
                                  className="h-9 rounded-lg border border-slate-300 px-2 text-xs"
                                  placeholder="Podmiot przyznający"
                                />
                                <input
                                  value={details.basis_reference}
                                  onChange={(event) => setEditCreditDetails((current) => ({ ...current, [id]: { ...details, basis_reference: event.target.value } }))}
                                  className="h-9 rounded-lg border border-slate-300 px-2 text-xs"
                                  placeholder="Numer decyzji / podstawa"
                                />
                                <input
                                  value={details.source_url}
                                  onChange={(event) => setEditCreditDetails((current) => ({ ...current, [id]: { ...details, source_url: event.target.value } }))}
                                  className="h-9 rounded-lg border border-slate-300 px-2 text-xs"
                                  placeholder="Link źródłowy"
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                  </div>
                ) : null}
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
