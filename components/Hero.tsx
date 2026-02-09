"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

type ProfileRow = {
  user_id: string;
  period_start: number | null;
  period_end: number | null;
  required_points: number | null;
};

type ActivityRow = {
  points: number;
  year: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Hero() {
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const [periodLabel, setPeriodLabel] = useState<string>("—");
  const [requiredPoints, setRequiredPoints] = useState<number | null>(null);
  const [pointsInPeriod, setPointsInPeriod] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function run() {
      setLoading(true);

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (!alive) return;

      if (authErr || !auth?.user) {
        setLoggedIn(false);
        setPeriodLabel("—");
        setRequiredPoints(null);
        setPointsInPeriod(null);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      const userId = auth.user.id;

      // profil: okres + cel
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, period_start, period_end, required_points")
        .eq("user_id", userId)
        .maybeSingle();

      if (!alive) return;

      const p = (profile as ProfileRow | null) ?? null;

      const start = Number(p?.period_start ?? 2023);
      const end = Number(p?.period_end ?? 2026);
      const req = Number(p?.required_points ?? 200);

      setPeriodLabel(`${start}–${end}`);
      setRequiredPoints(req);

      // aktywności w okresie
      const { data: acts } = await supabase
        .from("activities")
        .select("points, year")
        .eq("user_id", userId)
        .gte("year", start)
        .lte("year", end);

      if (!alive) return;

      const list = (acts ?? []) as ActivityRow[];
      const sum = list.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
      setPointsInPeriod(sum);

      setLoading(false);
    }

    run();

    return () => {
      alive = false;
    };
  }, [supabase]);

  const pct = useMemo(() => {
    if (pointsInPeriod == null || requiredPoints == null || requiredPoints <= 0) return 0;
    return clamp((pointsInPeriod / requiredPoints) * 100, 0, 100);
  }, [pointsInPeriod, requiredPoints]);

  const missing = useMemo(() => {
    if (pointsInPeriod == null || requiredPoints == null) return null;
    return Math.max(0, requiredPoints - pointsInPeriod);
  }, [pointsInPeriod, requiredPoints]);

  return (
    <section className="relative overflow-hidden">
      {/* jasna tinata */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white" />
      <div className="pointer-events-none absolute -left-24 top-[-120px] h-[420px] w-[420px] rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-[40px] h-[380px] w-[380px] rounded-full bg-indigo-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-10 md:pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* LEWA */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/80 px-3 py-1 text-xs text-slate-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              CRPE — dziennik aktywności i certyfikatów
            </div>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 md:text-6xl">
              Porządek w punktach edukacyjnych.
              <br />
              <span className="text-blue-700">Bez chaosu w certyfikatach.</span>
            </h1>

            <p className="mt-5 max-w-prose text-lg leading-relaxed text-slate-600">
              Dodajesz aktywność, podpinasz dowód i widzisz status w okresie rozliczeniowym. Prosto,
              czytelnie i “do obrony” w razie audytu.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                Załóż konto / Zaloguj się
              </Link>

              <Link
                href="/kalkulator"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
              >
                Sprawdź kalkulator
              </Link>

              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50"
              >
                Podgląd portfolio
              </Link>
            </div>

            {/* moduły jak były */}
            <div className="mt-9 grid gap-4 sm:grid-cols-3">
              {[
                { k: "Moduł 01", t: "Dziennik", d: "Aktywność, organizator, rok — w jednym miejscu." },
                { k: "Moduł 02", t: "Dowody", d: "PDF/zdjęcia certyfikatów przypięte do wpisów." },
                { k: "Moduł 03", t: "Raporty", d: "Wkrótce: eksport PDF/CSV i historia raportów." },
              ].map((x) => (
                <div
                  key={x.t}
                  className="h-full rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm"
                >
                  <div className="text-xs text-slate-500">{x.k}</div>
                  <div className="mt-1 text-base font-semibold text-slate-900">{x.t}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-600">{x.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* PRAWA */}
          <div className="lg:col-span-5">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-5">
              <div>
                <div className="text-sm font-semibold text-slate-900">Wizualny skrót</div>
                <div className="mt-1 text-xs text-slate-500">Wpis → dowód → status w okresie. To wszystko.</div>
              </div>

              {/* ✅ kafelek z punktami NAD zdjęciem */}
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs text-slate-500">
                  Okres: <span className="font-semibold text-slate-800">{loading ? "…" : periodLabel}</span>{" "}
                  {requiredPoints != null ? (
                    <>
                      • Cel: <span className="font-semibold text-slate-800">{requiredPoints} pkt</span>
                    </>
                  ) : null}
                </div>

                <div className="mt-3 h-2 w-full rounded-full bg-white">
                  <div className="h-2 rounded-full bg-blue-600" style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Masz:{" "}
                    <span className="font-semibold text-slate-900">
                      {loading ? "…" : pointsInPeriod ?? "—"} pkt
                    </span>
                  </span>
                  <span>
                    Brakuje:{" "}
                    <span className="font-semibold text-slate-900">
                      {loading ? "…" : missing == null ? "—" : `${missing} pkt`}
                    </span>
                  </span>
                </div>

                {!loggedIn && !loading ? (
                  <div className="mt-2 text-xs text-slate-500">
                    Zaloguj się, aby zobaczyć swój realny status.
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-white">
                  <Image
                    src="/illustration.svg"
                    alt="Ilustracja CRPE"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-xs text-slate-500">Wkrótce</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Webinary / baza szkoleń</div>
                <div className="mt-1 text-sm text-slate-600">
                  Możliwość dodania modułu z ofertami i zapisami.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* dolne 3 kafle jak było */}
        <div className="mt-10 rounded-[32px] border border-slate-200 bg-white p-5 md:p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { t: "Twoje dane", d: "Wpisy i pliki są powiązane z Twoim kontem. RLS pilnuje dostępu." },
              { t: "Prosty workflow", d: "Dodajesz aktywność → (opcjonalnie) certyfikat → status." },
              { t: "Raporty", d: "Kolejny etap: PDF/CSV + kontrola jakości danych." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm font-semibold text-slate-900">{x.t}</div>
                <div className="mt-1 text-sm leading-relaxed text-slate-600">{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 h-px w-full bg-slate-200/70" />
      </div>
    </section>
  );
}
