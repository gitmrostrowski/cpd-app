"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

// sekcje strony głównej (CPDme-style)
import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import BottomCTA from "@/components/BottomCTA";

type ActivityRow = {
  points: number;
  created_at: string;
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
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error(authError);
        return;
      }

      const user = auth?.user ?? null;
      setUserEmail(user?.email ?? null);
      if (!user) return;

      const { data: rows, error } = await supabase
        .from("activities")
        .select("points, created_at")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      const list = (rows ?? []) as ActivityRow[];

      const sum = list.reduce((acc, r) => acc + (Number(r.points) || 0), 0);
      setPoints(sum);

      if (!list.length) {
        setPeriodStart(null);
        setPeriodEnd(null);
        return;
      }

      // okres jako min/max created_at
      const dates = list
        .map((r) => (r.created_at ? new Date(r.created_at) : null))
        .filter((d): d is Date => !!d && !isNaN(d.getTime()));

      if (!dates.length) {
        setPeriodStart(null);
        setPeriodEnd(null);
        return;
      }

      const minD = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxD = new Date(Math.max(...dates.map((d) => d.getTime())));

      const fmt = (d: Date) =>
        d.toLocaleDateString("pl-PL", { year: "numeric", month: "2-digit", day: "2-digit" });

      setPeriodStart(fmt(minD));
      setPeriodEnd(fmt(maxD));
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
      <Hero />
      <FeatureGrid />

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
              {periodStart ?? "—"} {periodStart && periodEnd && "–"} {periodEnd ?? ""}
            </div>
          </div>
        </div>

        {!userEmail && (
          <p className="mt-6 text-sm text-slate-600">
            Zaloguj się, aby zobaczyć swoje punkty.
          </p>
        )}
      </section>

      <BottomCTA />
    </>
  );
}
