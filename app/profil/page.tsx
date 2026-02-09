"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type Profession = "Lekarz" | "Lekarz dentysta" | "Inne";

type ProfileRow = {
  user_id: string;
  profession: string;
  period_start: number;
  period_end: number;
  required_points: number;
};

function safeInt(n: any, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function parsePeriodLabel(label: string) {
  const clean = String(label || "").replace("–", "-");
  const [a, b] = clean.split("-").map((x) => safeInt(String(x).trim(), NaN));
  const start = Number.isFinite(a) ? a : 2023;
  const end = Number.isFinite(b) ? b : start + 3;
  return { start, end };
}

function makePeriodLabel(start: number, end: number) {
  return `${start}–${end}`;
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [info, setInfo] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // formularz (UI)
  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [requiredPoints, setRequiredPoints] = useState<number>(200);
  const [periodLabel, setPeriodLabel] = useState<string>("2023–2026");

  // edycja okresu (gdy "Inny")
  const [customStart, setCustomStart] = useState<number>(2023);
  const [customEnd, setCustomEnd] = useState<number>(2026);

  const [profileLoading, setProfileLoading] = useState(false);

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

  // 1) LOAD profilu z DB (z fallback do localStorage)
  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!user) return;

      setProfileLoading(true);
      clearMessages();

      // 1a) DB
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id,profession,period_start,period_end,required_points")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          setErr(`Profil (DB): ${error.message}`);
        } else if (!data) {
          // brak profilu -> utwórz domyślny
          const defaults: ProfileRow = {
            user_id: user.id,
            profession: "Lekarz",
            period_start: 2023,
            period_end: 2026,
            required_points: 200,
          };

          const { error: upErr } = await supabase.from("profiles").upsert(defaults, { onConflict: "user_id" });

          if (!alive) return;

          if (upErr) {
            setErr(`Profil (DB): ${upErr.message}`);
          } else {
            setProfession("Lekarz");
            setRequiredPoints(200);
            setPeriodLabel(makePeriodLabel(2023, 2026));
            setCustomStart(2023);
            setCustomEnd(2026);

            try {
              localStorage.setItem(
                "crpe_profile_prefs_v1",
                JSON.stringify({
                  profession: defaults.profession,
                  requiredPoints: defaults.required_points,
                  periodLabel: makePeriodLabel(defaults.period_start, defaults.period_end),
                })
              );
            } catch {}
          }
        } else {
          const row = data as ProfileRow;

          const prof: Profession =
            row.profession === "Lekarz dentysta" || row.profession === "Inne" ? (row.profession as Profession) : "Lekarz";

          setProfession(prof);
          setRequiredPoints(safeInt(row.required_points, 200));
          setPeriodLabel(makePeriodLabel(safeInt(row.period_start, 2023), safeInt(row.period_end, 2026)));
          setCustomStart(safeInt(row.period_start, 2023));
          setCustomEnd(safeInt(row.period_end, 2026));

          // kompatybilność MVP (Portfolio)
          try {
            localStorage.setItem(
              "crpe_profile_prefs_v1",
              JSON.stringify({
                profession: prof,
                requiredPoints: safeInt(row.required_points, 200),
                periodLabel: makePeriodLabel(safeInt(row.period_start, 2023), safeInt(row.period_end, 2026)),
              })
            );
          } catch {}
        }
      } catch (e: any) {
        if (!alive) return;
        setErr(`Profil (DB): ${e?.message || "Nie udało się pobrać profilu."}`);
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }

      // 1b) localStorage fallback (gdy DB się sypie)
      try {
        const raw = localStorage.getItem("crpe_profile_prefs_v1");
        if (!raw) return;
        const p = JSON.parse(raw);
        if (!alive) return;

        if (p?.profession === "Lekarz" || p?.profession === "Lekarz dentysta" || p?.profession === "Inne") {
          setProfession(p.profession);
        }
        if (typeof p?.requiredPoints === "number") setRequiredPoints(Math.max(0, p.requiredPoints));
        if (typeof p?.periodLabel === "string") {
          setPeriodLabel(p.periodLabel);
          const { start, end } = parsePeriodLabel(p.periodLabel);
          setCustomStart(start);
          setCustomEnd(end);
        }
      } catch {}
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [user, supabase]);

  // UI: gdy zmienisz dropdown na predefiniowany okres, ustaw customStart/End też
  useEffect(() => {
    const predefined = ["2023–2026", "2022–2025", "2021–2024"];
    if (predefined.includes(periodLabel)) {
      const { start, end } = parsePeriodLabel(periodLabel);
      setCustomStart(start);
      setCustomEnd(end);
    }
  }, [periodLabel]);

  async function saveProfile() {
    if (!user) return;
    if (busy) return;

    clearMessages();
    setBusy(true);

    try {
      const startEnd =
        periodLabel === "Inny"
          ? { start: safeInt(customStart, 2023), end: safeInt(customEnd, safeInt(customStart, 2023) + 3) }
          : parsePeriodLabel(periodLabel);

      const start = Math.max(1900, Math.min(2100, startEnd.start));
      const end = Math.max(start, Math.min(2100, startEnd.end));

      const payload: ProfileRow = {
        user_id: user.id,
        profession,
        period_start: start,
        period_end: end,
        required_points: Math.max(0, safeInt(requiredPoints, 200)),
      };

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) {
        setErr(error.message);
        return;
      }

      // Ujednolić label w UI (jeśli Inny -> pokaż faktyczny zakres)
      const label = periodLabel === "Inny" ? makePeriodLabel(start, end) : periodLabel;
      setPeriodLabel(label);

      // MVP kompatybilność
      try {
        localStorage.setItem(
          "crpe_profile_prefs_v1",
          JSON.stringify({ profession, requiredPoints: payload.required_points, periodLabel: label })
        );
      } catch {}

      setInfo("Zapisano profil ✅");
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać profilu.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setBusy(true);
    clearMessages();
    try {
      await signOut();
      setInfo("Wylogowano.");
    } catch (e: any) {
      setErr(e?.message || "Nie udało się wylogować.");
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    if (!user?.email) return;
    setBusy(true);
    clearMessages();

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setErr(error.message);
        return;
      }

      setInfo("Wysłaliśmy e-mail do ustawienia nowego hasła.");
    } catch (e: any) {
      setErr(e?.message || "Nie udało się wysłać e-maila.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="rounded-2xl border bg-white p-5">Ładuję profil…</div>
      </div>
    );
  }

  // NIEZALOGOWANY
  if (!user) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">Profil</h1>
          <p className="mt-2 text-slate-600">
            Status: <span className="font-semibold text-rose-700">❌ Niezalogowany</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/login" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Zaloguj się
            </Link>

            <Link
              href="/kalkulator"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Przejdź do kalkulatora
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ZALOGOWANY
  return (
    <div className="mx-auto w-full max-w-4xl p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profil i ustawienia</h1>
            <p className="mt-2 text-slate-700">
              Status: <span className="font-semibold text-emerald-700">✅ Zalogowany</span>
            </p>
            <p className="mt-1 text-slate-600">
              E-mail: <span className="font-medium text-slate-900">{user.email}</span>
            </p>
            {profileLoading ? <p className="mt-1 text-sm text-slate-500">Ładuję profil z bazy…</p> : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/portfolio" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Portfolio
            </Link>

            <Link href="/raporty" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Raporty
            </Link>

            <Link href="/kalkulator" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Kalkulator
            </Link>
          </div>
        </div>

        {(info || err) && (
          <div className="mt-4 rounded-xl border bg-white p-3 text-sm">
            {info ? <div className="text-emerald-700">{info}</div> : null}
            {err ? <div className="text-rose-700">{err}</div> : null}
          </div>
        )}
      </div>

      {/* Preferencje CPD */}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Preferencje CPD</h2>
            <p className="mt-1 text-sm text-slate-600">
              Teraz zapisujemy to w Supabase (tabela <span className="font-mono">profiles</span>).
            </p>
          </div>

          <button
            onClick={saveProfile}
            disabled={busy}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {busy ? "Zapisuję…" : "Zapisz"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Zawód</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              value={profession}
              onChange={(e) => setProfession(e.target.value as any)}
              disabled={busy}
            >
              <option>Lekarz</option>
              <option>Lekarz dentysta</option>
              <option>Inne</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Okres domyślny</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              value={["2023–2026", "2022–2025", "2021–2024"].includes(periodLabel) ? periodLabel : "Inny"}
              onChange={(e) => setPeriodLabel(e.target.value)}
              disabled={busy}
            >
              <option>2023–2026</option>
              <option>2022–2025</option>
              <option>2021–2024</option>
              <option>Inny</option>
            </select>

            {(["Inny"].includes(periodLabel) || !["2023–2026", "2022–2025", "2021–2024"].includes(periodLabel)) && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-600">Start</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    value={customStart}
                    onChange={(e) => setCustomStart(safeInt(e.target.value, 2023))}
                    disabled={busy}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600">Koniec</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(safeInt(e.target.value, customStart + 3))}
                    disabled={busy}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Cel punktowy</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              value={requiredPoints}
              onChange={(e) => setRequiredPoints(Math.max(0, Number(e.target.value || 0)))}
              disabled={busy}
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Podgląd (co zobaczy Portfolio)</div>
          <div className="mt-1">
            {profession} • Okres:{" "}
            <span className="font-semibold">
              {(["2023–2026", "2022–2025", "2021–2024"].includes(periodLabel) ? periodLabel : makePeriodLabel(customStart, customEnd))}
            </span>{" "}
            • Cel: <span className="font-semibold">{requiredPoints}</span> pkt
          </div>
        </div>
      </div>

      {/* Bezpieczeństwo */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Bezpieczeństwo</h2>
        <p className="mt-1 text-sm text-slate-600">Zarządzaj dostępem do konta.</p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={sendPasswordReset}
            disabled={busy}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Ustaw / zmień hasło (e-mail)
          </button>

          <button
            onClick={handleSignOut}
            disabled={busy}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Wyloguj
          </button>
        </div>
      </div>

      {/* Co dalej */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Co dalej w portalu?</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Dodamy pola do profilu: imię/nazwisko, nr PWZ, specjalizacja (opcjonalnie).</li>
          <li>Raporty: eksport PDF/CSV + historia raportów.</li>
          <li>Powiadomienia: przypomnienia o brakujących punktach i terminach.</li>
          <li>Tryb „audyt” danych: brak organizatora, brak certyfikatu, duplikaty.</li>
        </ul>
      </div>
    </div>
  );
}
