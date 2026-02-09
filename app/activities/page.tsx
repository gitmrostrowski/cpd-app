"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type ActivityRow = {
  id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;
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

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

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
        .select("id,type,points,year,organizer,created_at")
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

    const org = organizer.trim();
    const payload = {
      type,
      points: p,
      year: y,
      organizer: org.length ? org : null,
    };

    setBusy(true);
    try {
      const { error } = await supabase.from("activities").insert(payload);
      if (error) {
        setErr(error.message);
        return;
      }

      setInfo("Dodano aktywność ✅");
      setOrganizer("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się dodać aktywności.");
    } finally {
      setBusy(false);
    }
  }

  async function removeActivity(id: string) {
    if (busy) return;
    clearMessages();

    // optimistic UI
    const prev = items;
    setItems((cur) => cur.filter((x) => x.id !== id));

    setBusy(true);
    try {
      const { error } = await supabase.from("activities").delete().eq("id", id);
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
          <p className="mt-2 text-slate-600">Dodawaj i zarządzaj aktywnościami w portfolio.</p>
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
          <p className="mt-1 text-sm text-slate-600">Zapis trafia do Supabase i od razu pokaże się w Portfolio.</p>

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
              <p className="mt-1 text-sm text-slate-600">Kliknij usuń, aby skasować wpis.</p>
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
              {items.map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">{a.type}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {a.organizer ? a.organizer : "Brak organizatora"} • Rok:{" "}
                        <span className="font-medium text-slate-900">{a.year}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                        <span className="text-slate-600">Punkty</span>{" "}
                        <span className="font-semibold text-slate-900">{a.points}</span>
                      </div>
                      <button
                        onClick={() => removeActivity(a.id)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        type="button"
                        disabled={busy}
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
