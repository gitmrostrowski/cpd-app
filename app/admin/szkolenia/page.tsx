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
  description: string | null;
  status: TrainingStatus;
  reject_reason: string | null;
  created_at: string;
  updated_at: string;
};

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function badge(status: TrainingStatus) {
  if (status === "approved") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "rejected") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
}

export default function AdminTrainingsPage() {
  const router = useRouter();
  const sb = supabaseClient(); // ✅ u Ciebie to funkcja

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [status, setStatus] = useState<"all" | TrainingStatus>("pending");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TrainingRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState<TrainingRow | null>(null);
  const [saving, setSaving] = useState(false);

  // 1) Guard admin (CLIENT)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: auth } = await sb.auth.getUser();
      const user = auth?.user;

      if (!user) {
        if (!cancelled) router.replace("/login"); // dopasuj jeśli masz inną ścieżkę
        return;
      }

      const { data: profile, error } = await sb
        .from("profiles")
        .select("role")
        .eq("user_id", user.id) // ✅ u Ciebie profiles.user_id
        .maybeSingle();

      if (cancelled) return;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      let query = sb.from("trainings").select("*").order("created_at", { ascending: false });

      if (status !== "all") query = query.eq("status", status);

      if (q.trim()) {
        query = query.or(`title.ilike.%${q.trim()}%,organizer.ilike.%${q.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      setRows((data as any) ?? []);
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
      const a = (r.title || "").toLowerCase();
      const b = (r.organizer || "").toLowerCase();
      return a.includes(qq) || b.includes(qq);
    });
  }, [rows, q]);

  async function patch(id: string, patch: Partial<TrainingRow>) {
    const { data, error } = await sb.from("trainings").update(patch as any).eq("id", id).select("*").maybeSingle();
    if (error) throw error;

    const updated = data as any as TrainingRow;
    setRows((prev) => prev.map((x) => (x.id === id ? updated : x)));
    return updated;
  }

  function openEdit(row: TrainingRow) {
    setEdit({ ...row });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!edit) return;
    setSaving(true);
    setErr(null);
    try {
      const updated = await patch(edit.id, {
        title: edit.title,
        organizer: edit.organizer,
        points: edit.points,
        start_date: edit.start_date,
        end_date: edit.end_date,
        url: edit.url,
        description: edit.description,
        status: edit.status,
        reject_reason: edit.reject_reason,
      });

      setEditOpen(false);
      setEdit(null);

      if (status !== "all" && updated.status !== status) load();
    } catch (e: any) {
      setErr(e?.message || "Błąd zapisu");
    } finally {
      setSaving(false);
    }
  }

  async function approve(row: TrainingRow) {
    setErr(null);
    try {
      const updated = await patch(row.id, { status: "approved", reject_reason: null });
      if (status !== "all" && updated.status !== status) load();
    } catch (e: any) {
      setErr(e?.message || "Błąd");
    }
  }

  async function reject(row: TrainingRow) {
    const reason = window.prompt("Powód odrzucenia (opcjonalnie):", row.reject_reason || "");
    if (reason === null) return;

    setErr(null);
    try {
      const updated = await patch(row.id, { status: "rejected", reject_reason: reason.trim() || "Odrzucone" });
      if (status !== "all" && updated.status !== status) load();
    } catch (e: any) {
      setErr(e?.message || "Błąd");
    }
  }

  async function backToPending(row: TrainingRow) {
    setErr(null);
    try {
      const updated = await patch(row.id, { status: "pending", reject_reason: null });
      if (status !== "all" && updated.status !== status) load();
    } catch (e: any) {
      setErr(e?.message || "Błąd");
    }
  }

  if (isAdmin === null) {
    return <div className="mx-auto w-full max-w-6xl px-4 py-10 text-sm text-slate-500">Sprawdzam uprawnienia…</div>;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-sm text-slate-500">
            <Link href="/profil" className="hover:underline">
              Profil
            </Link>
            <span className="px-2">/</span>
            <span className="text-slate-700">Admin</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Akceptacja i edycja szkoleń</h1>
          <p className="mt-1 text-sm text-slate-600">Wszystkie szkolenia + akceptacja/odrzucenie + uzupełnianie danych.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Status</label>
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="pending">Do weryfikacji</option>
              <option value="approved">Zaakceptowane</option>
              <option value="rejected">Odrzucone</option>
              <option value="all">Wszystkie</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Szukaj</label>
            <input
              className="h-10 w-full min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tytuł lub organizator..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") load();
              }}
            />
            <button className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-blue-700" onClick={load}>
              Szukaj
            </button>
          </div>
        </div>
      </div>

      {err && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{err}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="text-sm font-semibold text-slate-800">Rekordy: {filtered.length}</div>
          <div className="text-xs text-slate-500">„Edytuj” → uzupełnij punkty/link/opis.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-left">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
              <tr>
                <th className="px-4 py-3">Szkolenie</th>
                <th className="px-4 py-3">Organizator</th>
                <th className="px-4 py-3">Daty</th>
                <th className="px-4 py-3">Pkt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Akcje</th>
              </tr>
            </thead>

            <tbody className="text-sm text-slate-800">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    Ładuję…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    Brak danych.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{r.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {r.url ? (
                          <a className="hover:underline" href={r.url} target="_blank" rel="noreferrer">
                            link
                          </a>
                        ) : (
                          <span className="text-slate-400">brak linku</span>
                        )}
                        {r.description ? (
                          <span className="line-clamp-1 max-w-[420px]">{r.description}</span>
                        ) : (
                          <span className="text-slate-400">brak opisu</span>
                        )}
                      </div>
                      {r.status === "rejected" && r.reject_reason ? (
                        <div className="mt-2 text-xs text-rose-700">Powód: {r.reject_reason}</div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">{r.organizer || <span className="text-slate-400">—</span>}</td>

                    <td className="px-4 py-3 text-xs text-slate-600">
                      <div>{r.start_date || "—"}</div>
                      <div>{r.end_date || "—"}</div>
                    </td>

                    <td className="px-4 py-3">{r.points ?? <span className="text-slate-400">—</span>}</td>

                    <td className="px-4 py-3">
                      <span className={cls("inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold", badge(r.status))}>
                        {r.status === "pending" ? "do weryfikacji" : r.status === "approved" ? "zaakceptowane" : "odrzucone"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          onClick={() => openEdit(r)}
                        >
                          Edytuj
                        </button>

                        {r.status !== "approved" && (
                          <button
                            className="h-9 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                            onClick={() => approve(r)}
                          >
                            Akceptuj
                          </button>
                        )}

                        {r.status !== "rejected" && (
                          <button
                            className="h-9 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
                            onClick={() => reject(r)}
                          >
                            Odrzuć
                          </button>
                        )}

                        {r.status !== "pending" && (
                          <button
                            className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                            onClick={() => backToPending(r)}
                          >
                            Cofnij
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal edycji (zostaje jak wcześniej) */}
      {editOpen && edit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="text-sm font-semibold text-slate-900">Edycja szkolenia</div>
              <button
                className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
                onClick={() => {
                  setEditOpen(false);
                  setEdit(null);
                }}
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
                <label className="text-xs font-semibold text-slate-600">Punkty</label>
                <input
                  type="number"
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.points ?? ""}
                  onChange={(e) => setEdit({ ...edit, points: e.target.value === "" ? null : Number(e.target.value) })}
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
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.url || ""}
                  onChange={(e) => setEdit({ ...edit, url: e.target.value || null })}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Opis</label>
                <textarea
                  className="mt-1 min-h-[90px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.description || ""}
                  onChange={(e) => setEdit({ ...edit, description: e.target.value || null })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Status</label>
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.status}
                  onChange={(e) => setEdit({ ...edit, status: e.target.value as TrainingStatus })}
                >
                  <option value="pending">do weryfikacji</option>
                  <option value="approved">zaakceptowane</option>
                  <option value="rejected">odrzucone</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Powód odrzucenia</label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  value={edit.reject_reason || ""}
                  onChange={(e) => setEdit({ ...edit, reject_reason: e.target.value || null })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditOpen(false);
                  setEdit(null);
                }}
                disabled={saving}
              >
                Anuluj
              </button>
              <button
                className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                onClick={saveEdit}
                disabled={saving}
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
