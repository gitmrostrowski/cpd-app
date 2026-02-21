// app/profil/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type Profession = "Lekarz" | "Lekarz dentysta" | "Inne";

type ProfileRow = {
  user_id: string;
  profession: Profession;
  period_start: number;
  period_end: number;
  required_points: number;
  pwz_number?: string | null;
  pwz_issue_date?: string | null; // YYYY-MM-DD
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

function isProfession(v: any): v is Profession {
  return v === "Lekarz" || v === "Lekarz dentysta" || v === "Inne";
}

function isDoctorLike(p: Profession) {
  return p === "Lekarz" || p === "Lekarz dentysta";
}

function normalizePwz(input: string) {
  return String(input || "").trim().replace(/\s+/g, "");
}

function isValidISODate(d: string | null | undefined) {
  if (!d) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function parseISODateParts(iso: string) {
  const [ys, ms, ds] = String(iso).split("-");
  const y = safeInt(ys, NaN);
  const m = safeInt(ms, NaN);
  const d = safeInt(ds, NaN);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  return { y, m, d };
}

function addMonthsUTC(isoDate: string, months: number) {
  const parts = parseISODateParts(isoDate);
  if (!parts) return new Date(Date.UTC(2023, 0, 1));
  const { y, m, d } = parts;

  const dt = new Date(Date.UTC(y, m - 1, d));
  const targetMonth = dt.getUTCMonth() + months;
  dt.setUTCMonth(targetMonth);

  // korekta dla miesięcy o mniejszej liczbie dni
  const expectedMonth = ((m - 1 + months) % 12 + 12) % 12;
  if (dt.getUTCMonth() !== expectedMonth) {
    dt.setUTCDate(0);
  }
  return dt;
}

function formatPLDateUTC(dt: Date) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${d}.${m}.${y}`;
}

function toISOFromUTCDate(dt: Date) {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const PREDEFINED = ["2023–2026", "2022–2025", "2021–2024"] as const;

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

  // PWZ (CRPE PRO)
  const [pwzNumber, setPwzNumber] = useState<string>("");
  const [pwzIssueDate, setPwzIssueDate] = useState<string>(""); // YYYY-MM-DD

  const [profileLoading, setProfileLoading] = useState(false);

  function clearMessages() {
    setInfo(null);
    setErr(null);
  }

  // Wyliczenie okresu "48 miesięcy od PWZ"
  const pwzPeriod = useMemo(() => {
    if (!isDoctorLike(profession)) return null;
    if (!isValidISODate(pwzIssueDate)) return null;

    const startISO = pwzIssueDate;
    const parts = parseISODateParts(startISO);
    if (!parts) return null;

    const startDt = new Date(Date.UTC(parts.y, parts.m - 1, parts.d));

    // +48 miesięcy, minus 1 dzień
    const endPlus = addMonthsUTC(startISO, 48);
    const endDt = new Date(endPlus.getTime());
    endDt.setUTCDate(endDt.getUTCDate() - 1);

    const startYear = startDt.getUTCFullYear();
    const endYear = endDt.getUTCFullYear();

    return {
      startISO,
      endISO: toISOFromUTCDate(endDt),
      startDt,
      endDt,
      startYear,
      endYear,
      labelYears: makePeriodLabel(startYear, endYear),
      labelPretty: `${formatPLDateUTC(startDt)} – ${formatPLDateUTC(endDt)} (48 mies.)`,
    };
  }, [profession, pwzIssueDate]);

  // 1) LOAD profilu z DB (z fallback do localStorage)
  useEffect(() => {
    let alive = true;

    async function loadProfile() {
      if (!user) return;

      setProfileLoading(true);
      clearMessages();

      const loadFromLocal = () => {
        try {
          const raw = localStorage.getItem("crpe_profile_prefs_v1");
          if (!raw) return;

          const p = JSON.parse(raw);
          if (!alive) return;

          if (isProfession(p?.profession)) setProfession(p.profession);
          if (typeof p?.requiredPoints === "number") setRequiredPoints(Math.max(0, p.requiredPoints));
          if (typeof p?.periodLabel === "string") {
            setPeriodLabel(p.periodLabel);
            const { start, end } = parsePeriodLabel(p.periodLabel);
            setCustomStart(start);
            setCustomEnd(end);
          }

          if (typeof p?.pwzNumber === "string") setPwzNumber(p.pwzNumber);
          if (typeof p?.pwzIssueDate === "string") setPwzIssueDate(p.pwzIssueDate);
        } catch {}
      };

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, profession, period_start, period_end, required_points, pwz_number, pwz_issue_date")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!alive) return;

        if (error) {
          setErr(`Profil (DB): ${error.message}`);
          loadFromLocal();
          return;
        }

        if (!data) {
          const defaults: ProfileRow = {
            user_id: user.id,
            profession: "Lekarz",
            period_start: 2023,
            period_end: 2026,
            required_points: 200,
            pwz_number: null,
            pwz_issue_date: null,
          };

          const { error: upErr } = await supabase.from("profiles").upsert(defaults, { onConflict: "user_id" });

          if (!alive) return;

          if (upErr) {
            setErr(`Profil (DB): ${upErr.message}`);
            loadFromLocal();
            return;
          }

          setProfession(defaults.profession);
          setRequiredPoints(defaults.required_points);
          setPeriodLabel(makePeriodLabel(defaults.period_start, defaults.period_end));
          setCustomStart(defaults.period_start);
          setCustomEnd(defaults.period_end);
          setPwzNumber("");
          setPwzIssueDate("");

          try {
            localStorage.setItem(
              "crpe_profile_prefs_v1",
              JSON.stringify({
                profession: defaults.profession,
                requiredPoints: defaults.required_points,
                periodLabel: makePeriodLabel(defaults.period_start, defaults.period_end),
                pwzNumber: "",
                pwzIssueDate: "",
              }),
            );
          } catch {}

          return;
        }

        const row = data as any;

        const prof: Profession = isProfession(row.profession) ? row.profession : "Lekarz";
        const ps = safeInt(row.period_start, 2023);
        const pe = safeInt(row.period_end, 2026);
        const rp = safeInt(row.required_points, 200);

        const dbPwzNumber = typeof row.pwz_number === "string" ? row.pwz_number : "";
        const dbPwzIssueDate = typeof row.pwz_issue_date === "string" ? row.pwz_issue_date : "";

        setProfession(prof);
        setRequiredPoints(Math.max(0, rp));
        setPeriodLabel(makePeriodLabel(ps, pe));
        setCustomStart(ps);
        setCustomEnd(pe);
        setPwzNumber(dbPwzNumber || "");
        setPwzIssueDate(dbPwzIssueDate || "");

        try {
          localStorage.setItem(
            "crpe_profile_prefs_v1",
            JSON.stringify({
              profession: prof,
              requiredPoints: Math.max(0, rp),
              periodLabel: makePeriodLabel(ps, pe),
              pwzNumber: dbPwzNumber || "",
              pwzIssueDate: dbPwzIssueDate || "",
            }),
          );
        } catch {}
      } catch (e: any) {
        if (!alive) return;
        setErr(`Profil (DB): ${e?.message || "Nie udało się pobrać profilu."}`);
        try {
          const raw = localStorage.getItem("crpe_profile_prefs_v1");
          if (!raw) return;
          const p = JSON.parse(raw);
          if (!alive) return;

          if (isProfession(p?.profession)) setProfession(p.profession);
          if (typeof p?.requiredPoints === "number") setRequiredPoints(Math.max(0, p.requiredPoints));
          if (typeof p?.periodLabel === "string") {
            setPeriodLabel(p.periodLabel);
            const { start, end } = parsePeriodLabel(p.periodLabel);
            setCustomStart(start);
            setCustomEnd(end);
          }

          if (typeof p?.pwzNumber === "string") setPwzNumber(p.pwzNumber);
          if (typeof p?.pwzIssueDate === "string") setPwzIssueDate(p.pwzIssueDate);
        } catch {}
      } finally {
        if (!alive) return;
        setProfileLoading(false);
      }
    }

    loadProfile();
    return () => {
      alive = false;
    };
  }, [user, supabase]);

  useEffect(() => {
    if ((PREDEFINED as readonly string[]).includes(periodLabel)) {
      const { start, end } = parsePeriodLabel(periodLabel);
      setCustomStart(start);
      setCustomEnd(end);
    }
  }, [periodLabel]);

  useEffect(() => {
    if (!isDoctorLike(profession)) {
      setPwzNumber("");
      setPwzIssueDate("");
    }
  }, [profession]);

  async function saveProfile() {
    if (!user) return;
    if (busy) return;

    clearMessages();
    setBusy(true);

    try {
      const normalizedPwz = isDoctorLike(profession) ? normalizePwz(pwzNumber) : "";
      const isoPwz = isDoctorLike(profession) && isValidISODate(pwzIssueDate) ? pwzIssueDate : "";

      let start: number;
      let end: number;

      if (pwzPeriod) {
        start = pwzPeriod.startYear;
        end = pwzPeriod.endYear;
      } else {
        const startEnd =
          periodLabel === "Inny"
            ? {
                start: safeInt(customStart, 2023),
                end: safeInt(customEnd, safeInt(customStart, 2023) + 3),
              }
            : parsePeriodLabel(periodLabel);

        start = Math.max(1900, Math.min(2100, startEnd.start));
        end = Math.max(start, Math.min(2100, startEnd.end));
      }

      const payload: ProfileRow = {
        user_id: user.id,
        profession,
        period_start: start,
        period_end: end,
        required_points: Math.max(0, safeInt(requiredPoints, 200)),
        pwz_number: isDoctorLike(profession) ? (normalizedPwz || null) : null,
        pwz_issue_date: isDoctorLike(profession) ? (isoPwz || null) : null,
      };

      const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" });
      if (error) {
        setErr(error.message);
        return;
      }

      const label =
        pwzPeriod ? pwzPeriod.labelYears : periodLabel === "Inny" ? makePeriodLabel(start, end) : periodLabel;

      setPeriodLabel(label);
      setCustomStart(start);
      setCustomEnd(end);

      try {
        localStorage.setItem(
          "crpe_profile_prefs_v1",
          JSON.stringify({
            profession,
            requiredPoints: payload.required_points,
            periodLabel: label,
            pwzNumber: isDoctorLike(profession) ? normalizedPwz : "",
            pwzIssueDate: isDoctorLike(profession) ? isoPwz : "",
          }),
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

  const previewYearsLabel = pwzPeriod
    ? pwzPeriod.labelYears
    : (PREDEFINED as readonly string[]).includes(periodLabel)
      ? periodLabel
      : makePeriodLabel(customStart, customEnd);

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
              Zapis do Supabase (tabela <span className="font-mono">profiles</span>).
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
              onChange={(e) => setProfession(e.target.value as Profession)}
              disabled={busy}
            >
              <option>Lekarz</option>
              <option>Lekarz dentysta</option>
              <option>Inne</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700">Okres domyślny</label>
              {pwzPeriod ? (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  liczone od PWZ
                </span>
              ) : null}
            </div>

            <select
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 disabled:bg-slate-50 disabled:text-slate-500"
              value={(PREDEFINED as readonly string[]).includes(periodLabel) ? periodLabel : "Inny"}
              onChange={(e) => setPeriodLabel(e.target.value)}
              disabled={busy || !!pwzPeriod}
              title={pwzPeriod ? "Okres jest liczony automatycznie od daty PWZ (48 miesięcy)." : ""}
            >
              <option>2023–2026</option>
              <option>2022–2025</option>
              <option>2021–2024</option>
              <option>Inny</option>
            </select>

            {pwzPeriod ? (
              <p className="mt-1 text-xs text-slate-500">
                Okres CPD liczony automatycznie: <span className="font-semibold">{pwzPeriod.labelPretty}</span>
              </p>
            ) : null}

            {periodLabel === "Inny" && !pwzPeriod && (
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

        {/* PWZ PRO */}
        {isDoctorLike(profession) && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-slate-900">PWZ (wymagane dla lekarzy)</div>
                <div className="mt-1 text-sm text-slate-600">
                  Na tej podstawie możemy liczyć pierwszy okres rozliczeniowy (48 miesięcy).
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                CRPE PRO
              </span>
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="text-sm font-medium text-slate-700">Numer PWZ</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  value={pwzNumber}
                  onChange={(e) => setPwzNumber(e.target.value)}
                  disabled={busy}
                  placeholder="Np. 1234567"
                />
                <p className="mt-1 text-xs text-slate-500">Wpisz bez spacji (zostaną automatycznie usunięte).</p>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Data uzyskania PWZ</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
                  value={pwzIssueDate}
                  onChange={(e) => setPwzIssueDate(e.target.value)}
                  disabled={busy}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Jeśli podasz datę, okres CPD zostanie policzony automatycznie jako 48 miesięcy od PWZ.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <div className="font-semibold text-slate-900">Podgląd (co zobaczy Portfolio)</div>

          <div className="mt-1">
            {profession} • Okres (lata): <span className="font-semibold">{previewYearsLabel}</span> • Cel:{" "}
            <span className="font-semibold">{requiredPoints}</span> pkt
          </div>

          {pwzPeriod ? (
            <div className="mt-2 text-sm">
              Okres liczony od PWZ: <span className="font-semibold">{pwzPeriod.labelPretty}</span>
            </div>
          ) : null}

          {isDoctorLike(profession) && pwzNumber.trim() ? (
            <div className="mt-2 text-sm">
              PWZ: <span className="font-semibold">{normalizePwz(pwzNumber)}</span>
            </div>
          ) : null}
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
          <li>Dodamy pola do profilu: imię/nazwisko, specjalizacja (opcjonalnie).</li>
          <li>Raporty: eksport PDF/CSV + historia raportów.</li>
          <li>Powiadomienia: przypomnienia o brakujących punktach i terminach.</li>
          <li>Tryb „audyt” danych: brak organizatora, brak certyfikatu, duplikaty.</li>
        </ul>
      </div>
    </div>
  );
}
