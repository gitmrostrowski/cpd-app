// app/portfolio/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

import {
  applyRules,
  sumPointsWithRules,
  summarizeLimits,
  type ActivityLike,
} from "@/lib/cpd/calc";

import {
  displayProfession,
  rulesForProfession,
  type Profession,
} from "@/lib/cpd/professions";

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;

  certificate_path?: string | null;
  certificate_name?: string | null;
};

type ProfileRow = {
  profession: Profession;
  profession_other?: string | null;
  period_start: number;
  period_end: number;
  required_points: number;
};

export default function PortfolioPage() {
  const { user } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      setLoading(true);

      const { data: p } = await supabase
        .from("profiles")
        .select("profession, profession_other, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: a } = await supabase
        .from("activities")
        .select("id, user_id, type, points, year, organizer, created_at, certificate_path, certificate_name")
        .eq("user_id", user.id);

      if (p) setProfile(p as ProfileRow);
      if (a) setActivities(a as ActivityRow[]);

      setLoading(false);
    }

    load();
  }, [user?.id, supabase]);

  const period = useMemo(() => {
    if (!profile) return null;
    return { start: profile.period_start, end: profile.period_end };
  }, [profile]);

  const rules = useMemo(() => {
    if (!profile) return undefined;
    return rulesForProfession(profile.profession);
  }, [profile]);

  const applied = useMemo(() => {
    if (!period) return [];
    return applyRules(activities as ActivityLike[], { period, rules });
  }, [activities, period, rules]);

  const totalPoints = useMemo(() => {
    if (!period) return 0;
    return sumPointsWithRules(activities as ActivityLike[], { period, rules });
  }, [activities, period, rules]);

  const limitsSummary = useMemo(() => {
    if (!period) return null;
    return summarizeLimits(activities as ActivityLike[], { period, rules });
  }, [activities, period, rules]);

  if (loading) return <div className="p-6">Wczytuję raport…</div>;
  if (!profile) return <div className="p-6">Brak profilu.</div>;

  const missing = Math.max(0, profile.required_points - totalPoints);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold">Raport CPD</h1>
        <div className="text-sm text-slate-600 mt-1">
          Okres {profile.period_start}-{profile.period_end}
        </div>
        <div className="text-sm text-slate-600">
          Zawód: {displayProfession(profile.profession, profile.profession_other)}
        </div>
      </div>

      {/* PODSUMOWANIE */}
      <div className="rounded-2xl border p-5 bg-white shadow-sm">
        <div className="text-lg font-bold">
          {totalPoints} / {profile.required_points} pkt
        </div>
        {missing > 0 ? (
          <div className="text-rose-600 font-semibold">
            Brakuje {missing} pkt
          </div>
        ) : (
          <div className="text-emerald-600 font-semibold">
            Wymagania spełnione ✅
          </div>
        )}
      </div>

      {/* AKTYWNOŚCI */}
      <div className="space-y-3">
        <h2 className="font-bold text-lg">Aktywności w okresie</h2>

        {applied
          .filter((a) => a.in_period)
          .map((a) => (
            <div key={a.id} className="border rounded-xl p-4 bg-white">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{a.type}</div>
                  <div className="text-xs text-slate-600">
                    Rok: {a.year}
                    {a.organizer ? ` • ${a.organizer}` : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {a.applied_points} pkt
                  </div>
                  {a.over_points ? (
                    <div className="text-xs text-amber-600">
                      Nadwyżka {a.over_points} pkt
                    </div>
                  ) : null}
                </div>
              </div>

              {a.warning ? (
                <div className="mt-2 text-xs text-amber-700">
                  {a.warning}
                </div>
              ) : null}
            </div>
          ))}
      </div>

      {/* LIMITY */}
      {limitsSummary && (
        <div className="space-y-3">
          <h2 className="font-bold text-lg">Limity cząstkowe</h2>

          {limitsSummary.perType.map((l) => (
            <div key={l.type} className="border rounded-xl p-4 bg-white">
              <div className="flex justify-between">
                <div className="font-semibold">{l.type}</div>
                <div>
                  {l.applied} pkt
                  {l.capInPeriod ? ` / ${l.capInPeriod} pkt` : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-6">
        <Link
          href="/kalkulator"
          className="inline-flex items-center rounded-2xl bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
        >
          ← Wróć do kalkulatora
        </Link>
      </div>
    </div>
  );
}
