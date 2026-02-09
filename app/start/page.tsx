"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type Profession = "Lekarz" | "Lekarz dentysta" | "Inne";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function StartPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);
  const router = useRouter();

  const currentYear = new Date().getFullYear();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [periodMode, setPeriodMode] = useState<"preset" | "custom">("preset");
  const [preset, setPreset] = useState<"2023–2026" | "2022–2025" | "2021–2024">("2023–2026");
  const [customStart, setCustomStart] = useState<number>(currentYear - 1);
  const [customEnd, setCustomEnd] = useState<number>(currentYear + 2);
  const [requiredPoints, setRequiredPoints] = useState<number>(200);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function clearErr() {
    setErr(null);
  }

  // jeśli niezalogowany → na login
  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, user, router]);

  function parsePreset(label: string) {
    const clean = label.replace("–", "-");
    const [a, b] = clean.split("-").map((x) => Number(String(x).trim()));
    const start = Number.isFinite(a) ? a : 2023;
    const end = Number.isFinite(b) ? b : start + 3;
    return { start, end };
  }

  const computedPeriod = useMemo(() => {
    if (periodMode === "preset") return parsePreset(preset);
    const start = clamp(Number(customStart || 2023), 1900, 2100);
    const end = clamp(Number(customEnd || start + 3), start, 2100);
    return { start, end };
  }, [periodMode, preset, customStart, customEnd]);

  async function ensureAlreadyHasProfileOrContinue() {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("user_id").eq("user_id", user.id).maybeSingle();
    // jeśli profil istnieje, nie trzymamy usera na onboardingu
    if (data?.user_id) {
      router.replace("/portfolio");
    }
  }

  useEffect(() => {
    if (!user) return;
    ensureAlreadyHasProfileOrContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function next() {
    clearErr();
    setStep((s) => (s === 1 ? 2 : s === 2 ? 3 : 3));
  }

  function back() {
    clearErr();
    setStep((s) => (s === 3 ? 2 : s === 2 ? 1 : 1));
  }

  async function save() {
    if (!user) return;
    if (busy) return;

    clearErr();
    setBusy(true);

    try {
      const start = computedPeriod.start;
      const end = computedPeriod.end;
      const req = Math.max(0, Number(requiredPoints) || 0);

      const payload = {
        user_id: user.id,
        profession,
        period_start: start,
        period_end: end,
        required_points: req,
      };

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) {
        setErr(error.message);
        return;
      }

      // lekki fallback lokalny (MVP)
      try {
        localStorage.setItem(
          "crpe_profile_prefs_v1",
          JSON.stringify({
            profession,
            requiredPoints: req,
            periodLabel: `${start}–${end}`,
          })
        );
      } catch {}

      router.replace("/portfolio");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Nie udało się zapisać ustawień.");
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border bg-white p-6">Ładuję…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Start: ustawienia konta</h1>
            <p className="mt-2 text-slate-600">
              Krótka konfiguracja: zawód, okres i cel punktowy. Zmienisz to później w profilu.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Wróć
          </Link>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {err}
          </div>
        ) : null}

        {/* Stepper */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { n: 1, t: "Rola", d: "Wybierz zawód" },
            { n: 2, t: "Okres", d: "Ustaw cykl" },
            { n: 3, t: "Cel", d: "Wymagane punkty" },
          ].map((s) => (
            <div
              key={s.n}
              className={`rounded-2xl border p-4 ${
                step === (s.n as any) ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
              }`}
            >
              <div className="text-xs text-slate-500">Krok {s.n}</div>
              <div className="mt-1 font-semibold text-slate-900">{s.t}</div>
              <div className="mt-1 text-sm text-slate-600">{s.d}</div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          {step === 1 ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Kim jesteś w systemie?</div>
              <div className="text-sm text-slate-600">
                To wpływa na domyślne wartości i późniejsze raporty.
              </div>

              <select
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={profession}
                onChange={(e) => setProfession(e.target.value as Profession)}
                disabled={busy}
              >
                <option>Lekarz</option>
                <option>Lekarz dentysta</option>
                <option>Inne</option>
              </select>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">Jaki okres rozliczeniowy?</div>
                <div className="text-sm text-slate-600">Możesz wybrać gotowy albo ustawić własny.</div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    periodMode === "preset" ? "border-blue-200 bg-white text-slate-900" : "border-slate-300 bg-white text-slate-700"
                  }`}
                  onClick={() => setPeriodMode("preset")}
                  disabled={busy}
                >
                  Gotowe okresy
                </button>
                <button
                  type="button"
                  className={`rounded-xl border px-3 py-2 text-sm font-medium ${
                    periodMode === "custom" ? "border-blue-200 bg-white text-slate-900" : "border-slate-300 bg-white text-slate-700"
                  }`}
                  onClick={() => setPeriodMode("custom")}
                  disabled={busy}
                >
                  Własny zakres
                </button>
              </div>

              {periodMode === "preset" ? (
                <select
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  value={preset}
                  onChange={(e) => setPreset(e.target.value as any)}
                  disabled={busy}
                >
                  <option>2023–2026</option>
                  <option>2022–2025</option>
                  <option>2021–2024</option>
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Start</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                      value={customStart}
                      onChange={(e) => setCustomStart(Number(e.target.value || currentYear))}
                      disabled={busy}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Koniec</label>
                    <input
                      type="number"
                      className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(Number(e.target.value || currentYear + 3))}
                      disabled={busy}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                Wybrany okres: <span className="font-semibold">{computedPeriod.start}–{computedPeriod.end}</span>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <div className="text-sm font-semibold text-slate-900">Jaki jest Twój cel punktowy?</div>
              <div className="text-sm text-slate-600">
                To liczba punktów do uzbierania w okresie <span className="font-semibold">{computedPeriod.start}–{computedPeriod.end}</span>.
              </div>

              <input
                type="number"
                min={0}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                value={requiredPoints}
                onChange={(e) => setRequiredPoints(Math.max(0, Number(e.target.value || 0)))}
                disabled={busy}
              />

              <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                Podsumowanie: <span className="font-semibold">{profession}</span> • Okres{" "}
                <span className="font-semibold">{computedPeriod.start}–{computedPeriod.end}</span> • Cel{" "}
                <span className="font-semibold">{Math.max(0, Number(requiredPoints) || 0)}</span> pkt
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={busy || step === 1}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Wstecz
          </button>

          <div className="flex flex-wrap gap-2">
            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                Dalej
              </button>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? "Zapisuję…" : "Zapisz i przejdź do portfolio"}
              </button>
            )}

            <Link
              href="/profil"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Pomiń (ustawię później)
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

