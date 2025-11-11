"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

// sekcje strony głównej (CPDme-style)
import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import BottomCTA from "@/components/BottomCTA";

type PointsRow = {
  total_points: number | null;
  period_start: string | null;
  period_end: string | null;
};

export default function Page() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [points, setPoints] = useState<number | null>(null);
  const [periodStart, setPeriodStart] = useState<string | null>(null);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user ?? null;
      setUserEmail(user?.email ?? null);
      if (!user) return;

      const { data } = await supabase
        .from("v_user_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle<PointsRow>();

      if (data) {
        setPoints(Number(data.total_points ?? 0));
        setPeriodStart(data.period_start);
        setPeriodEnd(data.period_end);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      {/* HERO + pas jak na CPDme */}
      <Hero />

      {/* Siatka funkcji */}
      <FeatureGrid />

      {/* Sekcja „Dashboard” – Twoje kafle (widoczne zawsze; przy niezalogowanym z CTA) */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Dashboard</h2>

          {userEmail ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-sm text-slate-600">
                {userEmail}
              </span>
              <button
                onClick={handleSignOut}
                className="rounded-xl border px-4 py-2 hover:bg-black/5"
              >
                Wyloguj
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border px-4 py-2 hover:bg-black/5"
            >
              Zaloguj
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-slate-500">Suma punktów</div>
            <div className="mt-2 text-2xl font-semibold">{points ?? "—"}</div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm text-slate-500">Okres</div>
            <div className="mt-2 text-2xl font-semibold">
              {periodStart ?? "—"} {periodStart && "–"} {periodEnd ?? ""}
            </div>
          </div>
        </div>

        {!userEmail && (
          <p className="mt-6 text-sm text-slate-600">
            Zaloguj się, aby zobaczyć swoje punkty.
          </p>
        )}
      </section>

      {/* Dolny pasek z wezwaniem do działania */}
      <BottomCTA />
    </>
  );
}
