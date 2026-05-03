// app/admin/szkolenia/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";

type TrainingStatus = "pending" | "approved" | "rejected";

type TrainingRow = {
  id: string;
  title: string;
  organizer: string | null;
  points: number | null;
  start_date: string | null;
  end_date: string | null;
  url: string | null;
  external_url?: string | null;
  description: string | null;

  approval_status: TrainingStatus | null;
  reject_reason: string | null;

  submitted_by: string | null;
  user_id: string | null;

  created_at: string;
  updated_at: string | null;
};

type ProfileRoleRow = { role: string | null };

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
  if (s === "approved")
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (s === "rejected")
    return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
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

export default function AdminTrainingsPage() {
  const router = useRouter();
  const sb = useMemo(() => supabaseClient(), []);

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [status, setStatus] = useState<"all" | TrainingStatus>("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<TrainingRow | null>(null);
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
        .from("profiles" as any)
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const profile = (data as ProfileRoleRow | null) ?? null;

      if (error || !profile || profile.role !== "admin") {
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
      let query = sb
        .from("trainings")
        .select("*")
        .order("created_at", { ascending: false });

      if (status !== "all") {
        query = query.eq("approval_status", status);
      }

      if (q.trim()) {
        const qq = q.trim();
        query = query.or(
          `title.ilike.%${qq}%,organizer.ilike.%${qq}%,description.ilike.%${qq}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      setRows(((data as any[]) ?? []) as TrainingRow[]);
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

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return rows;

    return rows.filter((r) => {
      const title = (r.title || "").toLowerCase();
      const org = (normOrganizer(r.organizer) || "").toLowerCase();
      const desc = (r.description || "").toLowerCase();
      const submitted = (r.submitted_by || "").toLowerCase();
      const userId = (r.user_id || "").toLowerCase();

      return (
        title.includes(qq) ||
        org.includes(qq) ||
        desc.includes(qq) ||
        submitted.includes(qq) ||
        userId.includes(qq)
      );
    });
  }, [rows, q]);

  async function patch(id: string, patchData: Partial<TrainingRow>) {
    const { data, error } = await sb
      .from("trainings")
      .update(patchData as any)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    const updated = data as any as TrainingRow;
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
    setEditOpen(true);

    setTimeout(() => {
      const el =
        focus === "url"
          ? (document.getElementById(
              "admin-training-url"
            ) as HTMLInputElement | null)
          : focus === "description"
          ? (document.getElementById(
              "admin-training-description"
            ) as HTMLTextAreaElement | null)
          : null;

      el?.focus();
    }, 50);
  }

  function closeEdit() {
    setEditOpen(false);
    setEdit(null);
  }

  async function saveEdit() {
    if (!edit) return;

    setSaving(true);
    setErr(null);

    try {
      const url = normalizeUrl(edit.url);

      const cleaned: Partial<TrainingRow> = {
        title: edit.title?.trim() || edit.title,
        organizer: normOrganizer(edit.organizer) ?? null,
        points: edit.points,
        start_date: edit.start_date || null,
        end_date: edit.end_date || null,

        url,
        external_url: url,

        description: (edit.description || "").trim()
          ? (edit.description || "").trim()
          : null,

        approval_status: getStatus(edit),

        reject_reason: (edit.reject_reason || "").trim()
          ? (edit.reject_reason || "").trim()
          : null,
      };

      const updated = await patch(edit.id, cleaned);
      closeEdit();

      if (status !== "all" && getStatus(updated) !== status) load();
    } catch (e: any) {
      setErr(e?.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  }

  async function approve(row: TrainingRow) {
    setErr(null);

    try {
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
    const reason = window.prompt(
      "Powód odrzucenia (opcjonalnie):",
      row.reject_reason || ""
    );

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

  if (isAdmin === null) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-slate-500">
        Sprawdzam uprawnienia…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
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
            Wszystkie szkolenia, status akceptacji, informacja kto i kiedy dodał
            rekord.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Status
            </label>

            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="all">Wszystkie</option>
              <option value="pending">Do weryfikacji</option>
              <option value="approved">Zaakceptowane</option>
              <option value="rejected">Odrzucone</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">
              Szukaj
            </label>

            <input
              className="h-10 w-full min-w-[260px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tytuł, organizator, opis, user id..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />

            <button
              className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              onClick={load}
              type="button"
            >
              Szukaj
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
                <th className="px-4 py-3">Daty</th>
                <th className="px-4 py-3">Pkt</th>
                <th className="px-4 py-3">Dodane przez</th>
                <th className="px-4 py-3">Dodano</th>
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
                  const addedBy = r.submitted_by || r.user_id || null;
                  const link = normalizeUrl(r.url ?? r.external_url ?? null);

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-slate-100 align-top"
                    >
                      <td className="px-4 py-3">
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

                      <td className="px-4 py-3">
                        {org || <span className="text-slate-400">—</span>}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-700">
                        <div className="whitespace-nowrap">
                          {fmtDate(r.start_date)}
                        </div>
                        <div className="whitespace-nowrap text-slate-500">
                          {fmtDate(r.end_date)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {r.points ?? <span className="text-slate-400">—</span>}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-semibold text-slate-700">
                          {shortId(addedBy)}
                        </div>
                        {r.submitted_by && r.user_id && r.submitted_by !== r.user_id ? (
                          <div className="mt-1 text-slate-400">
                            user_id: {shortId(r.user_id)}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div className="whitespace-nowrap">
                          {fmtDateTime(r.created_at)}
                        </div>
                        {r.updated_at ? (
                          <div className="mt-1 whitespace-nowrap text-slate-400">
                            akt.: {fmtDateTime(r.updated_at)}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={cls(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold",
                            statusBadgeCls(currentStatus)
                          )}
                        >
                          {statusLabel(currentStatus)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
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
                              title="Przywróć do weryfikacji"
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
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Edycja szkolenia
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Dodane: {fmtDateTime(edit.created_at)} · Dodał:{" "}
                  {shortId(edit.submitted_by || edit.user_id)}
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
                <label className="text-xs font-semibold text-slate-600">
                  Tytuł
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.title}
                  onChange={(e) =>
                    setEdit({ ...edit, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Organizator
                </label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.organizer || ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      organizer: e.target.value || null,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Punkty
                </label>
                <input
                  type="number"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.points ?? ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      points:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Start
                </label>
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.start_date || ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      start_date: e.target.value || null,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Koniec
                </label>
                <input
                  type="date"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.end_date || ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      end_date: e.target.value || null,
                    })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">
                  Link
                </label>
                <input
                  id="admin-training-url"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.url || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, url: e.target.value || null })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">
                  Opis
                </label>
                <textarea
                  id="admin-training-description"
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.description || ""}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      description: e.target.value || null,
                    })
                  }
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
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      reject_reason: e.target.value || null,
                    })
                  }
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
