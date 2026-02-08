"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const supabase = supabaseClient();

  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // opcjonalnie: mały “profil” lokalny (na start bez tabeli w Supabase)
  const [profession, setProfession] = useState<"Lekarz" | "Lekarz dentysta" | "Inne">("Lekarz");
  const [requiredPoints, setRequiredPoints] = useState<number>(200);
  const [periodLabel, setPeriodLabel] = useState<string>("2023–2026");

  // zapis preferencji lokalnie (MVP)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("crpe_profile_prefs_v1");
      if (!raw) return;
      const p = JSON.parse(raw);
      if (p?.profession) setProfession(p.profession);
      if (typeof p?.requiredPoints === "number") setRequiredPoints(p.requiredPoints);
      if (typeof p?.periodLabel === "string") setPeriodLabel(p.periodLabel);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        "crpe_profile_prefs_v1",
        JSON.stringify({ profession, requiredPoints, periodLabel })
      );
    } catch {}
  }, [profession, requiredPoints, periodLabel]);

  async function handleSignOut() {
    setBusy(true);
    setInfo(null);
    try {
      await signOut();
      setInfo("Wylogowano.");
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    if (!user?.email) return;
    setBusy(true);
    setInfo(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });

      if (error) {
        setInfo(error.message);
        return;
      }

      setInfo("Wysłaliśmy e-mail do ustawienia nowego hasła.");
    } catch (e: any) {
      setInfo(e?.message || "Nie udało się wysłać e-maila.");
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
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/portfolio"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Portfolio
            </Link>
            <Link
              href="/raporty"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Raporty
            </Link>
            <Link
              href="/kalkulator"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kalkulator
            </Link>
          </div>
        </div>

        {info && <div className="mt-4 rounded-xl border p-3 text-sm text-slate-700">{info}</div>}
      </div>

      {/* Preferencje CPD */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Preferencje CPD</h2>
        <p className="mt-1 text-sm text-slate-600">
          Na razie zapisujemy to lokalnie (MVP). Później przeniesiemy do Supabase w tabeli profilu.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Zawód</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              value={profession}
              onChange={(e) => setProfession(e.target.value as any)}
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
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
            >
              <option>2023–2026</option>
              <option>2022–2025</option>
              <option>2021–2024</option>
              <option>Inny</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Cel punktowy</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
              value={requiredPoints}
              onChange={(e) => setRequiredPoints(Math.max(0, Number(e.target.value || 0)))}
            />
          </div>
        </div>
      </div>

      {/* Bezpieczeństwo */}
      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Bezpieczeństwo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Zarządzaj dostępem do konta.
        </p>

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
          <li>Uzupełnienie danych: imię/nazwisko, nr PWZ, specjalizacja (opcjonalnie).</li>
          <li>Automatyczne przypomnienia: ile punktów brakuje i do kiedy trzeba rozliczyć okres.</li>
          <li>Upload certyfikatów + przypięcie do aktywności.</li>
          <li>Eksport PDF/CSV, historia raportów.</li>
        </ul>
      </div>
    </div>
  );
}

