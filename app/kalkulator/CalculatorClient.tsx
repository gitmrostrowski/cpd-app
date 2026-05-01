// app/kalkulator/CalculatorClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

import {
  type Profession,
  PROFESSION_OPTIONS,
  DEFAULT_REQUIRED_POINTS_BY_PROFESSION,
  displayProfession,
  isOtherProfession,
  normalizeOtherProfession,
} from "@/lib/cpd/professions";

type ActivityStatus = "planned" | "done" | null;

type ActivityRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;
  status?: ActivityStatus;
  planned_start_date?: string | null;
  training_id?: string | null;
  certificate_path?: string | null;
  certificate_name?: string | null;
  certificate_mime?: string | null;
  certificate_size?: number | null;
  certificate_uploaded_at?: string | null;
};

type ProfileRow = {
  user_id: string;
  profession: Profession;
  profession_other?: string | null;
  pwz_number?: string | null;
  pwz_issue_date?: string | null;
  period_start: number;
  period_end: number;
  required_points: number;
};

type ProfileUpsert = ProfileRow;

type RuleLimit = {
  key: string;
  label: string;
  mode: "per_period" | "per_year" | "per_item";
  maxPoints: number;
  note?: string;
};

type ProfessionRules = {
  periodMonths: number;
  requiredPoints: number;
  limits: RuleLimit[];
};

const RULES_BY_PROFESSION: Partial<Record<Profession, ProfessionRules>> = {
  Lekarz: {
    periodMonths: 48,
    requiredPoints: 200,
    limits: [
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_item", maxPoints: 6, note: "1 pkt/h, maks. 6 pkt za jedno szkolenie" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_period", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt w okresie" },
      { key: "SCIENTIFIC_SOCIETY", label: "Towarzystwo/Kolegium", mode: "per_period", maxPoints: 20, note: "5 pkt, maks. 20 pkt w okresie" },
    ],
  },
  "Lekarz dentysta": {
    periodMonths: 48,
    requiredPoints: 200,
    limits: [
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_item", maxPoints: 6, note: "1 pkt/h, maks. 6 pkt za jedno szkolenie" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_period", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt w okresie" },
      { key: "SCIENTIFIC_SOCIETY", label: "Towarzystwo/Kolegium", mode: "per_period", maxPoints: 20, note: "5 pkt, maks. 20 pkt w okresie" },
    ],
  },
  Pielęgniarka: {
    periodMonths: 60,
    requiredPoints: 100,
    limits: [
      { key: "WEBINAR", label: "Webinary", mode: "per_period", maxPoints: 50, note: "5 pkt/wydarzenie, maks. 50 pkt" },
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_period", maxPoints: 50, note: "2/5 pkt, maks. 50 pkt" },
      { key: "COMMITTEES", label: "Komisje/Zespoły", mode: "per_period", maxPoints: 30, note: "3 pkt/posiedzenie, maks. 30 pkt" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_year", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt/rok" },
    ],
  },
  Położna: {
    periodMonths: 60,
    requiredPoints: 100,
    limits: [
      { key: "WEBINAR", label: "Webinary", mode: "per_period", maxPoints: 50, note: "5 pkt/wydarzenie, maks. 50 pkt" },
      { key: "INTERNAL_TRAINING", label: "Szkolenie wewnętrzne", mode: "per_period", maxPoints: 50, note: "2/5 pkt, maks. 50 pkt" },
      { key: "COMMITTEES", label: "Komisje/Zespoły", mode: "per_period", maxPoints: 30, note: "3 pkt/posiedzenie, maks. 30 pkt" },
      { key: "JOURNAL_SUBSCRIPTION", label: "Prenumerata czasopisma", mode: "per_year", maxPoints: 10, note: "5 pkt/tytuł, maks. 10 pkt/rok" },
    ],
  },
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function mapTypeToRuleKey(type: string): string | null {
  const t = (type || "").toLowerCase();
  if (t.includes("webinar")) return "WEBINAR";
  if (t.includes("kurs online")) return "WEBINAR";
  if (t.includes("szkolenie wewn")) return "INTERNAL_TRAINING";
  if (t.includes("prenumer")) return "JOURNAL_SUBSCRIPTION";
  if (t.includes("towarzyst") || t.includes("kolegium")) return "SCIENTIFIC_SOCIETY";
  if (t.includes("komisj") || t.includes("zesp")) return "COMMITTEES";
  return null;
}

function daysUntilEndOfYear(yearEnd: number) {
  const end = new Date(yearEnd, 11, 31, 23, 59, 59);
  const diff = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function normalizeStatus(s: ActivityStatus | undefined): "planned" | "done" {
  return s === "planned" ? "planned" : "done";
}

function formatYMD(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}.${m}.${y}`;
}

function getPeriodFromPwzIssueDate(prof: Profession, pwzIssueDate: string | null | undefined) {
  if (!pwzIssueDate) return null;
  const y = Number(String(pwzIssueDate).slice(0, 4));
  if (!y || Number.isNaN(y)) return null;
  const months = RULES_BY_PROFESSION[prof]?.periodMonths ?? 48;
  const years = Math.max(1, Math.round(months / 12));
  return { start: y, end: y + years - 1 };
}

function getRowMissing(a: ActivityRow) {
  const missing: string[] = [];
  if (!Boolean(a.organizer && String(a.organizer).trim())) missing.push("Brak organizatora");
  const prog = normalizeStatus(a.status);
  if (prog === "planned") {
    if (!a.planned_start_date) missing.push("Brak daty");
  } else {
    if (!a.certificate_path) missing.push("Brak certyfikatu");
  }
  return missing;
}

function suggestPlannedPoints(rule: { mode: "per_period" | "per_year" | "per_item"; remaining: number }) {
  const rem = Math.max(0, Number(rule.remaining) || 0);
  if (rem <= 0) return 0;
  const step = rule.mode === "per_item" ? 2 : 5;
  return Math.max(1, Math.min(rem, step));
}

function buildNextSteps(missingPoints: number, missingEvidenceCount: number, limitWarning: string | null) {
  const steps = [];
  if (missingEvidenceCount > 0) {
    steps.push({ icon: "doc", tone: "red", title: "Uzupełnij dokumenty", description: `Masz ${missingEvidenceCount} brakujących dokumentów.`, ctaHref: "/aktywnosci", primary: true });
  }
  if (missingPoints > 0) {
    steps.push({ icon: "shield", tone: "blue", title: limitWarning ? "Dobierz inną aktywność" : "Zaplanuj szkolenie", description: limitWarning || "Wybierz szkolenia i zdobądź punkty.", ctaHref: "/aktywnosci?new=1", primary: missingEvidenceCount === 0 });
  }
  steps.push({ icon: "chart", tone: "green", title: "Sprawdź raport", description: missingPoints <= 0 ? "Masz komplet punktów. Wygeneruj PDF." : "Zobacz szczegóły swojego postępu.", ctaHref: "/portfolio", primary: false });
  return steps.slice(0, 3);
}

function IconBubble({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "green" | "amber" | "red" | "slate" }) {
  const tones = {
    blue: "border-blue-100 bg-blue-50 text-blue-600",
    green: "border-emerald-100 bg-emerald-50 text-emerald-600",
    amber: "border-amber-100 bg-amber-50 text-amber-600",
    red: "border-red-100 bg-red-50 text-red-600",
    slate: "border-slate-100 bg-slate-50 text-slate-600",
  };
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border ${tones[tone]}`}>
      {children}
    </div>
  );
}

function MiniIcon({ name }: { name: "calendar" | "shield" | "chart" | "doc" | "user" | "bell" }) {
  const common = "h-4 w-4";
  if (name === "calendar") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 2v4M16 2v4M3 10h18" /><path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>;
  if (name === "shield") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></svg>;
  if (name === "chart") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5M4 19h16" /><path d="M8 16v-5M12 16V8M16 16v-8" /></svg>;
  if (name === "doc") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>;
  if (name === "user") return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>;
  return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 6 3 8H3c0-2 3-1 3-8" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
}

function CircularProgress({ value, label = "realizacji", size = "normal", tone = "blue" }: {
  value: number; label?: string; size?: "normal" | "small"; tone?: "blue" | "slate" | "amber";
}) {
  const isSmall = size === "small";
  const svgSize = isSmall ? 80 : 112;
  const center = svgSize / 2;
  const radius = isSmall ? 30 : 40;
  const stroke = isSmall ? 7 : 9;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const offset = circumference - (clamp(value, 0, 100) / 100) * circumference;
  const strokeTone = tone === "amber" ? "text-amber-500" : tone === "slate" ? "text-slate-500" : "text-blue-500";

  return (
    <div className={`relative shrink-0 ${isSmall ? "h-20 w-20" : "h-28 w-28"}`}>
      <svg className="-rotate-90" height={svgSize} width={svgSize}>
        <circle stroke="currentColor" className="text-slate-200" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={center} cy={center} />
        <circle
          stroke="currentColor"
          className={`${strokeTone} transition-all duration-700`}
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx={center}
          cy={center}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`${isSmall ? "text-lg" : "text-2xl"} font-semibold tracking-tight text-slate-900`}>{Math.round(value)}%</div>
        <div className="mt-0.5 text-center text-[10px] font-medium leading-tight text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function CalculatorClient() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [profession, setProfession] = useState<Profession>("Lekarz");
  const [professionOther, setProfessionOther] = useState("");
  const [periodStart, setPeriodStart] = useState(2023);
  const [periodEnd, setPeriodEnd] = useState(2026);
  const [requiredPoints, setRequiredPoints] = useState(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200);
  const [periodMode, setPeriodMode] = useState<"preset" | "custom">("preset");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [planInfo, setPlanInfo] = useState<string | null>(null);
  const [planErr, setPlanErr] = useState<string | null>(null);
  const [planningKey, setPlanningKey] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<"all" | "planned" | "missing" | "complete">("all");
  const [activeNav, setActiveNav] = useState<"ustawienia" | "status" | "kroki" | "limity" | "aktywnosci" | "powiadomienia">("ustawienia");

  const supabase = useMemo(() => supabaseClient(), []);

  async function reloadActivities() {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from("activities")
      .select("id, user_id, type, points, year, organizer, created_at, status, planned_start_date, training_id, certificate_path, certificate_name, certificate_mime, certificate_size, certificate_uploaded_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setActivities(!error && data ? (data as ActivityRow[]) : []);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user?.id) {
        if (!cancelled) { setProfile(null); setActivities([]); setLoading(false); }
        return;
      }
      setLoading(true);
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("user_id, profession, profession_other, pwz_number, pwz_issue_date, period_start, period_end, required_points")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cancelled) {
        if (!pErr && p) {
          const prof = ((p as any).profession ?? "Lekarz") as Profession;
          const po = normalizeOtherProfession((p as any).profession_other);
          const pwzIssue = (p as any).pwz_issue_date as string | null;
          const derived = getPeriodFromPwzIssueDate(prof, pwzIssue);
          const start = derived?.start ?? ((p as any).period_start ?? 2023);
          const end = derived?.end ?? ((p as any).period_end ?? 2026);
          const rp = ((p as any).required_points ?? undefined) ?? DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? RULES_BY_PROFESSION[prof]?.requiredPoints ?? 200;
          setProfession(prof);
          setProfessionOther(po);
          setPeriodStart(start);
          setPeriodEnd(end);
          setRequiredPoints(rp);
          setPeriodMode(derived ? "custom" : ["2019-2022", "2023-2026", "2027-2030"].includes(`${start}-${end}`) ? "preset" : "custom");
          setProfile({ user_id: user.id, profession: prof, profession_other: isOtherProfession(prof) ? po || null : null, pwz_number: (p as any).pwz_number ?? null, pwz_issue_date: pwzIssue, period_start: start, period_end: end, required_points: rp });
        } else {
          setProfession("Lekarz"); setProfessionOther(""); setPeriodStart(2023); setPeriodEnd(2026);
          setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.Lekarz ?? 200);
          setPeriodMode("preset"); setProfile(null);
        }
        setDirty(false);
      }
      await reloadActivities();
      if (!cancelled) setLoading(false);
    }
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, supabase]);

  const periodLabel = `${periodStart}-${periodEnd}`;

  const inPeriodDone = useMemo(
    () => activities.filter((x) => normalizeStatus(x.status) === "done" && x.year >= periodStart && x.year <= periodEnd),
    [activities, periodStart, periodEnd]
  );

  const inPeriodPlanned = useMemo(
    () => activities.filter((x) => {
      const st = x.status ?? null;
      const isPlanned = st === "planned" || (!!x.planned_start_date && st !== "done");
      const y = x.planned_start_date ? Number(String(x.planned_start_date).slice(0, 4)) : x.year;
      return isPlanned && y >= periodStart && y <= periodEnd;
    }),
    [activities, periodStart, periodEnd]
  );

  const donePoints = useMemo(() => inPeriodDone.reduce((sum, a) => sum + (Number(a.points) || 0), 0), [inPeriodDone]);
  const missingPoints = useMemo(() => Math.max(0, (Number(requiredPoints) || 0) - donePoints), [requiredPoints, donePoints]);
  const progress = useMemo(() => {
    const req = Number(requiredPoints) || 0;
    return req <= 0 ? 0 : clamp((donePoints / req) * 100, 0, 100);
  }, [requiredPoints, donePoints]);

  const missingEvidenceCount = useMemo(() => inPeriodDone.filter((a) => !a.certificate_path).length, [inPeriodDone]);
  const evidencePct = useMemo(() => {
    if (inPeriodDone.length <= 0) return 0;
    return clamp(((inPeriodDone.length - missingEvidenceCount) / inPeriodDone.length) * 100, 0, 100);
  }, [inPeriodDone.length, missingEvidenceCount]);

  const daysLeft = useMemo(() => daysUntilEndOfYear(periodEnd), [periodEnd]);

  const periodTimeProgress = useMemo(() => {
    const start = new Date(periodStart, 0, 1).getTime();
    const end = new Date(periodEnd, 11, 31, 23, 59, 59).getTime();
    const now = Date.now();
    if (end <= start) return 0;
    return clamp(((now - start) / (end - start)) * 100, 0, 100);
  }, [periodStart, periodEnd]);

  const limitsUsage = useMemo(() => {
    const limits = RULES_BY_PROFESSION[profession]?.limits ?? [];
    const usage = new Map<string, number>();
    for (const a of inPeriodDone) {
      const key = mapTypeToRuleKey(a.type);
      if (!key) continue;
      usage.set(key, (usage.get(key) || 0) + (Number(a.points) || 0));
    }
    const yearsInPeriod = Math.max(1, periodEnd - periodStart + 1);
    return limits.map((l) => {
      const used = usage.get(l.key) || 0;
      const cap = l.mode === "per_year" ? l.maxPoints * yearsInPeriod : l.maxPoints;
      const remaining = Math.max(0, cap - used);
      const usedPct = cap > 0 ? clamp((used / cap) * 100, 0, 100) : 0;
      return { ...l, used, cap, remaining, usedPct, yearsInPeriod };
    });
  }, [profession, inPeriodDone, periodStart, periodEnd]);

  const limitWarning = useMemo(() => {
    const hit = limitsUsage.find((x) => (x.usedPct ?? 0) >= 100);
    return hit ? `Limit "${hit.label}" jest osiagniety.` : null;
  }, [limitsUsage]);

  const nextSteps = useMemo(() => buildNextSteps(missingPoints, missingEvidenceCount, limitWarning), [missingPoints, missingEvidenceCount, limitWarning]);

  const recentRows = useMemo(() => {
    const rank = (a: ActivityRow) => {
      const prog = normalizeStatus(a.status);
      const missing = getRowMissing(a);
      if (prog !== "planned" && missing.length > 0) return 0;
      if (prog === "planned") return 1;
      return 2;
    };
    return activities
      .filter((a) => {
        const prog = normalizeStatus(a.status);
        const y = prog === "planned" && a.planned_start_date ? Number(String(a.planned_start_date).slice(0, 4)) : a.year;
        const inPeriod = y >= periodStart && y <= periodEnd;
        if (!inPeriod) return false;
        const missing = getRowMissing(a);
        const hasMissing = prog !== "planned" && missing.length > 0;
        if (activityFilter === "planned") return prog === "planned";
        if (activityFilter === "missing") return hasMissing;
        if (activityFilter === "complete") return prog !== "planned" && !hasMissing;
        return true;
      })
      .sort((a, b) => {
        const byRank = rank(a) - rank(b);
        if (byRank !== 0) return byRank;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [activities, periodStart, periodEnd, activityFilter]);

  const isBusy = authLoading || loading;
  const pwzIssueDate = profile?.pwz_issue_date ?? null;
  const otherRequired = isOtherProfession(profession);
  const otherValid = !otherRequired || normalizeOtherProfession(professionOther).length >= 2;
  const trybLabel = pwzIssueDate ? "Tryb okresu — zgodny z PWZ" : "Tryb okresu";
  const okresLabel = pwzIssueDate ? `Okres liczony z PWZ (${formatYMD(pwzIssueDate)})` : periodMode === "preset" ? "Okres rozliczeniowy" : "Okres indywidualny";

  async function saveProfilePatch(patch: Partial<ProfileRow> & { profession_other?: string | null }) {
    if (!user?.id) return;
    setSavingProfile(true);
    const nextProfession = (patch.profession ?? profession) as Profession;
    const rawOther = patch.profession_other !== undefined ? patch.profession_other : professionOther;
    const nextOther = isOtherProfession(nextProfession) ? normalizeOtherProfession(rawOther) || null : null;
    const ps = Number(patch.period_start !== undefined ? patch.period_start : periodStart) || 2023;
    const pe = Math.max(Number(patch.period_end !== undefined ? patch.period_end : periodEnd) || ps, ps);
    const rp = Math.max(0, Number(patch.required_points !== undefined ? patch.required_points : requiredPoints) || 0);
    const payload: ProfileUpsert = { user_id: user.id, profession: nextProfession, profession_other: nextOther, pwz_number: profile?.pwz_number ?? null, pwz_issue_date: profile?.pwz_issue_date ?? null, period_start: ps, period_end: pe, required_points: rp };
    const { error } = await supabase.from("profiles").upsert(payload);
    setSavingProfile(false);
    if (!error) { setSavedAt(Date.now()); setDirty(false); }
  }

  async function saveAllSettings() {
    if (!user?.id || !otherValid) return;
    const ps = Number(periodStart) || 0;
    const pe = Math.max(Number(periodEnd) || 0, ps);
    setPeriodEnd(pe);
    await saveProfilePatch({ profession, profession_other: isOtherProfession(profession) ? normalizeOtherProfession(professionOther) || null : null, period_start: ps, period_end: pe, required_points: requiredPoints });
  }

  async function planForRule(r: (typeof limitsUsage)[number]) {
    if (!user?.id || (Number(r.remaining) || 0) <= 0) return;
    setPlanInfo(null); setPlanErr(null); setPlanningKey(r.key);
    try {
      const nowY = new Date().getFullYear();
      const y = clamp(nowY, periodStart, periodEnd);
      const pts = suggestPlannedPoints({ mode: r.mode, remaining: r.remaining });
      const { error } = await supabase.from("activities").insert({ user_id: user.id, type: r.label, points: pts, year: y, organizer: null, status: "planned" as const, planned_start_date: null as string | null });
      if (error) { setPlanErr(error.message); return; }
      setPlanInfo(`Dodano do planu: ${r.label} (+${pts} pkt)`);
      await reloadActivities();
    } catch (e: any) {
      setPlanErr(e?.message || "Nie udalo sie dodac planu.");
    } finally {
      setPlanningKey(null);
    }
  }

  const inputCls = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400";

  // card base — consistent across all sections
  const cardCls = "scroll-mt-44 relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md";

  function scrollToSection(id: "ustawienia" | "status" | "kroki" | "limity" | "aktywnosci" | "powiadomienia") {
    const el = document.getElementById(id);
    if (!el) return;
    setActiveNav(id);
    const offset = 140;
    const targetTop = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(targetTop, 80), behavior: "smooth" });
  }

  function filterActivities(next: "all" | "planned" | "missing" | "complete") {
    setActivityFilter(next);
    setActiveNav("aktywnosci");
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => scrollToSection("aktywnosci")));
  }

  // ── nav styles — podbity kontrast, shadow-md ──────────────────────────────
  const navBase = "shrink-0 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none";
  const navActive = "shrink-0 border-b-2 border-blue-600 px-3 py-2.5 text-sm font-semibold text-blue-700 focus:outline-none";

  const emptyStateHref = activityFilter === "planned"
    ? "/aktywnosci?new=1"
    : activityFilter === "missing"
    ? "/aktywnosci"
    : "/aktywnosci?new=1";

  const emptyStateMsg = activityFilter === "planned"
    ? "Nie masz zaplanowanych aktywnosci."
    : activityFilter === "missing"
    ? "Brak wpisow z brakujaca dokumentacja."
    : activityFilter === "complete"
    ? "Brak kompletnych wpisow w tym okresie."
    : "Nie masz jeszcze zadnych aktywnosci w tym okresie.";

  const emptyStateCta = activityFilter === "missing" ? "Uzupelnij dokumenty" : "Dodaj pierwsza aktywnosc";

  return (
    <div className="relative left-1/2 min-h-screen w-screen -translate-x-1/2 bg-slate-100 px-4 pb-10 pt-1 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-5">

        {/* ── SZYBKIE MENU — shadow-md, lepszy kontrast aktywnego ──────── */}
        <nav className="sticky top-[76px] z-30 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-md">
          <div className="flex min-w-max">
            {(["ustawienia", "status", "kroki", "limity", "aktywnosci", "powiadomienia"] as const).map((id) => {
              const labels: Record<string, string> = {
                ustawienia: "Ustawienia",
                status: "Realizacja celu",
                kroki: "Co dalej?",
                limity: "Limity",
                aktywnosci: "Ostatnie aktywnosci",
                powiadomienia: "Powiadomienia",
              };
              return (
                <button key={id} type="button" onClick={() => scrollToSection(id)} className={activeNav === id ? navActive : navBase}>
                  {labels[id]}
                </button>
              );
            })}
          </div>
        </nav>

        {/* ── USTAWIENIA ───────────────────────────────────────────────── */}
        <section id="ustawienia" className={cardCls}>
          <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />
          <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <IconBubble tone="blue"><MiniIcon name="calendar" /></IconBubble>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Ustawienia okresu i zawodu</h2>
                <p className="text-xs text-slate-500">
                  Zmien preferencje w dowolnym momencie.
                  {savedAt && !dirty && !savingProfile ? <span className="ml-1 font-medium text-blue-600">Zapisano</span> : null}
                  {!otherValid ? <span className="ml-1 font-medium text-red-500">Uzupelnij zawod</span> : null}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => { const prof: Profession = "Lekarz"; const derived = getPeriodFromPwzIssueDate(prof, pwzIssueDate); setProfession(prof); setProfessionOther(""); setPeriodStart(derived?.start ?? 2023); setPeriodEnd(derived?.end ?? 2026); setRequiredPoints(DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[prof] ?? 200); setPeriodMode(derived ? "custom" : "preset"); setDirty(true); }} className="w-28 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95">
                Domyslne
              </button>
              <button type="button" onClick={saveAllSettings} disabled={isBusy || savingProfile || !dirty || !otherValid} className="w-28 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                {savingProfile ? "Zapisuje..." : "Zapisz"}
              </button>
              <Link href="/profil" className="inline-flex w-28 justify-center rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-95">
                Profil →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Zawod</label>
              <select value={profession} onChange={(e) => { const v = e.target.value as Profession; setProfession(v); if (!isOtherProfession(v)) setProfessionOther(""); setRequiredPoints(RULES_BY_PROFESSION[v]?.requiredPoints ?? DEFAULT_REQUIRED_POINTS_BY_PROFESSION?.[v] ?? 200); if (pwzIssueDate) { const d = getPeriodFromPwzIssueDate(v, pwzIssueDate); if (d) { setPeriodMode("custom"); setPeriodStart(d.start); setPeriodEnd(d.end); } } setDirty(true); }} className={`mt-1.5 ${inputCls}`}>
                {PROFESSION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{trybLabel}</label>
              <select value={periodMode} onChange={(e) => { const v = e.target.value as "preset" | "custom"; setPeriodMode(v); if (v === "custom" && pwzIssueDate) { const d = getPeriodFromPwzIssueDate(profession, pwzIssueDate); if (d) { setPeriodStart(d.start); setPeriodEnd(d.end); } } setDirty(true); }} className={`mt-1.5 ${inputCls}`}>
                <option value="preset">Preset najczestszy</option>
                <option value="custom">Indywidualny</option>
              </select>
            </div>
            {periodMode === "preset" && !pwzIssueDate ? (
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{okresLabel}</label>
                <select value={periodLabel} onChange={(e) => { const [a, b] = e.target.value.split("-").map(Number); setPeriodStart(a); setPeriodEnd(b); setDirty(true); }} className={`mt-1.5 ${inputCls}`}>
                  <option value="2019-2022">2019–2022</option>
                  <option value="2023-2026">2023–2026</option>
                  <option value="2027-2030">2027–2030</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{okresLabel}</label>
                <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <input value={periodStart} onChange={(e) => { setPeriodStart(Number(e.target.value || 0)); setDirty(true); }} type="number" disabled={Boolean(pwzIssueDate)} className={inputCls} />
                  <span className="text-slate-400">–</span>
                  <input value={periodEnd} onChange={(e) => { setPeriodEnd(Number(e.target.value || 0)); setDirty(true); }} type="number" disabled={Boolean(pwzIssueDate)} className={inputCls} />
                </div>
              </div>
            )}
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Wymagane punkty</label>
              <input value={requiredPoints} onChange={(e) => { setRequiredPoints(Number(e.target.value || 0)); setDirty(true); }} type="number" min={0} className={`mt-1.5 ${inputCls}`} />
            </div>
            {otherRequired ? (
              <div className="md:col-span-2 xl:col-span-4">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Jaki zawod?</label>
                <input value={professionOther} onChange={(e) => { setProfessionOther(e.target.value); setDirty(true); }} placeholder="np. Psycholog, Logopeda..." className={`mt-1.5 ${inputCls} ${!otherValid ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`} />
              </div>
            ) : null}
          </div>
        </section>

        {isBusy ? (
          <div className={`${cardCls} p-8 text-center text-sm font-medium text-slate-500`}>Wczytuję dane...</div>
        ) : (
          <>
            {/* ── REALIZACJA CELU ──────────────────────────────────────── */}
            <section id="status" className={cardCls}>
              <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />

              {/* header */}
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-4 sm:flex-nowrap sm:justify-between">
                <div className="flex items-center gap-3">
                  <IconBubble tone="blue"><MiniIcon name="chart" /></IconBubble>
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Realizacja celu</h2>
                    <p className="text-xs text-slate-500">Aktualny stan punktow, czasu i dokumentow</p>
                  </div>
                </div>

                {/* KPI — bez ramki, tylko typografia */}
                <div className="sm:text-right">
                  {missingPoints > 0 ? (
                    <>
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Do celu brakuje</div>
                      <div className="text-3xl font-bold leading-none tracking-tight text-red-500">{missingPoints} pkt</div>
                    </>
                  ) : (
                    <>
                      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Status</div>
                      <div className="text-2xl font-bold leading-none text-emerald-600">Cel zrealizowany</div>
                    </>
                  )}
                </div>

                {missingEvidenceCount > 0 ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-100">
                    {missingEvidenceCount} dokumentow do uzupelnienia
                  </span>
                ) : null}
              </div>

              {/* body — zwarty layout */}
              <div className="grid gap-6 px-6 py-5 lg:grid-cols-[auto_1fr] lg:items-start">
                {/* circular charts — oba równe, obok siebie */}
                <div className="flex flex-row items-center gap-4 lg:flex-col lg:gap-3">
                  <CircularProgress value={progress} label="pkt" />
                  <CircularProgress value={periodTimeProgress} label="czas" tone="amber" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm text-slate-600">
                    Masz <strong className="text-slate-900">{donePoints} / {requiredPoints} pkt</strong> w okresie {periodStart}–{periodEnd}. Do konca zostalo <strong className="text-slate-900">{daysLeft} dni</strong>.
                  </p>

                  {/* progress punktow */}
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                      <span>Postep punktow</span>
                      <span>{donePoints} / {requiredPoints} pkt</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${Math.max(progress, 2)}%` }} />
                    </div>
                  </div>

                  {/* progress czasu — ocieplony kolor, dashed marker */}
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs font-medium text-slate-500">
                      <span>Postep czasu</span>
                      <span>{Math.round(periodTimeProgress)}% minelo · {Math.round(100 - periodTimeProgress)}% zostalo</span>
                    </div>
                    <div className="relative h-2.5 overflow-visible rounded-full bg-slate-100">
                      <div
                        className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${periodTimeProgress}%`, background: "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)" }}
                      />
                      <div
                        className="absolute top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-amber-400 bg-white shadow-sm"
                        style={{ left: `${periodTimeProgress}%` }}
                        aria-label="Aktualny moment okresu"
                      >
                        <span className="block h-2 w-2 rounded-full bg-amber-500" />
                      </div>
                    </div>
                    <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
                      <span>{periodStart} start</span>
                      <span>koniec {periodEnd}</span>
                    </div>
                  </div>

                  {/* stats grid */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 sm:grid-cols-4">
                    {[
                      { value: `${daysLeft}`, label: "dni do konca" },
                      { value: `${missingEvidenceCount}`, label: "brak dokumentacji", accent: missingEvidenceCount > 0 },
                      { value: `${requiredPoints}`, label: "pkt wymagane" },
                      { value: displayProfession(profession, professionOther), label: "Twoj zawod", small: true },
                    ].map(({ value, label, accent, small }) => (
                      <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                        <div className={`truncate font-semibold ${small ? "text-sm" : "text-lg"} ${accent ? "text-amber-600" : "text-slate-900"}`}>{value}</div>
                        <div className="mt-0.5 text-[10px] text-slate-500">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── CO DALEJ ─────────────────────────────────────────────── */}
            <section id="kroki" className={cardCls}>
              <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
                <IconBubble tone="blue"><MiniIcon name="chart" /></IconBubble>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Co dalej?</h2>
                  <p className="text-xs text-slate-500">Najwazniejsze dzialania na podstawie brakow</p>
                </div>
              </div>
              <div className="grid gap-3 p-5 md:grid-cols-3">
                {nextSteps.map((step, i) => (
                  <Link
                    key={step.title}
                    href={step.ctaHref}
                    className={`group flex items-center gap-3 rounded-lg border p-3.5 transition active:scale-[0.99] ${
                      step.primary
                        ? "border-blue-300 bg-blue-50 shadow-sm hover:border-blue-400 hover:bg-blue-100"
                        : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${step.primary ? "bg-blue-500" : "bg-slate-300"}`} />
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-semibold ${step.primary ? "text-blue-800" : "text-slate-900"}`}>{step.title}</div>
                      <div className="mt-0.5 text-xs leading-4 text-slate-500">{step.description}</div>
                    </div>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs transition ${
                      step.primary
                        ? "border-blue-300 text-blue-600 group-hover:bg-blue-200"
                        : "border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500"
                    }`}>→</span>
                  </Link>
                ))}
              </div>
            </section>
          </>
        )}

        {/* ── LIMITY ───────────────────────────────────────────────────── */}
        <section id="limity" className={`${cardCls} scroll-mt-44`}>
          <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />
          <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <IconBubble tone="blue"><MiniIcon name="shield" /></IconBubble>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Twoje limity</h2>
                <p className="text-xs text-slate-500">Najbardziej ograniczajace kategorie w tym okresie</p>
              </div>
            </div>
            <div className="pl-12 text-xs text-slate-500 sm:pl-0">
              Zaliczone: <strong className="text-slate-900">{donePoints} pkt</strong>
              <span className="mx-2 text-slate-300">|</span>
              Brakuje: <strong className="text-red-500">{missingPoints} pkt</strong>
            </div>
          </div>

          <div className="p-5">
            {(planInfo || planErr) ? (
              <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs">
                {planInfo ? <p className="font-semibold text-blue-700">{planInfo}</p> : null}
                {planErr ? <p className="font-semibold text-red-600">{planErr}</p> : null}
              </div>
            ) : null}

            <div className="grid gap-2 lg:grid-cols-3">
              {limitsUsage.length === 0 ? (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500 lg:col-span-3">Brak zdefiniowanych limitow dla tego zawodu.</div>
              ) : (
                limitsUsage.map((r) => {
                  const isMax = r.usedPct >= 100 || (Number(r.remaining) || 0) <= 0;
                  return (
                    <div key={r.key} className="group rounded-lg border border-slate-200 bg-white p-3.5 transition hover:border-blue-200 hover:shadow-sm active:scale-[0.99]">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">{r.label}</h3>
                            {isMax ? <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-emerald-100">wykorzystane</span> : null}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {r.mode === "per_item" ? `max ${r.cap} pkt / szkolenie` : r.mode === "per_year" ? `max ${r.maxPoints} pkt / rok` : `max ${r.cap} pkt w okresie`}
                            {" · "}{r.used === 0 ? <span className="italic text-slate-400">Nie rozpoczeto</span> : `${r.used} / ${r.cap} pkt`}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full transition-all duration-500 ${isMax ? "bg-emerald-500" : r.usedPct >= 50 ? "bg-blue-500" : "bg-slate-300"}`} style={{ width: `${r.usedPct}%` }} />
                            </div>
                            <span className="w-8 text-right text-[10px] font-medium text-slate-500">{Math.round(r.usedPct)}%</span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className={`mb-1.5 rounded px-2 py-1.5 text-xs font-semibold ${isMax ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-900"}`}>
                            {Math.round(r.remaining)} pkt<br />
                            <span className="text-[10px] font-normal text-slate-400">zostalo</span>
                          </div>
                          {isMax ? (
                            <Link href="/aktywnosci" className="text-[10px] font-medium text-slate-400 hover:text-blue-600">Zobacz →</Link>
                          ) : (
                            <button type="button" disabled={isBusy || planningKey === r.key} onClick={() => planForRule(r)} className="rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 active:scale-95 disabled:opacity-40">
                              {planningKey === r.key ? "Dodaje..." : "+ Zaplanuj"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              <Link href="/aktywnosci" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Aktywnosci →</Link>
              <Link href="/aktywnosci?new=1" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">+ Dodaj aktywnosc</Link>
              <Link href="/portfolio" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Raport / PDF →</Link>
            </div>
          </div>
        </section>

        {/* ── OSTATNIE AKTYWNOŚCI ──────────────────────────────────────── */}
        <section id="aktywnosci" className={`${cardCls} scroll-mt-44`}>
          <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />
          <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <IconBubble tone="blue"><MiniIcon name="calendar" /></IconBubble>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Ostatnie aktywnosci</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  {(["all", "missing", "planned", "complete"] as const).map((f) => {
                    const labels = { all: "wszystkie", missing: "brakujaca dokumentacja", planned: "zaplanowane", complete: "kompletne" };
                    const dots = { all: "", missing: "bg-amber-400", planned: "bg-slate-400", complete: "bg-emerald-400" };
                    const active = { all: "bg-slate-100 text-slate-800", missing: "bg-amber-50 text-amber-700", planned: "bg-slate-100 text-slate-800", complete: "bg-emerald-50 text-emerald-700" };
                    return (
                      <button key={f} type="button" onClick={() => filterActivities(f)} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 transition ${activityFilter === f ? active[f] : "text-slate-500 hover:bg-slate-50"}`}>
                        {dots[f] ? <span className={`h-2 w-2 rounded-full ${dots[f]}`} /> : null}
                        {labels[f]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <Link href="/aktywnosci" className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700">Przejdz do aktywnosci</Link>
          </div>

          <div className="p-5">
            <div className="space-y-3">
              {recentRows.length === 0 ? (
                /* ── pusty stan — z CTA ── */
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
                  <div className="text-sm font-medium text-slate-700">{emptyStateMsg}</div>
                  <Link href={emptyStateHref} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 active:scale-95">
                    {emptyStateCta}
                  </Link>
                </div>
              ) : (
                recentRows.map((a) => {
                  const prog = normalizeStatus(a.status);
                  const missing = getRowMissing(a);
                  const hasMissing = prog !== "planned" && missing.length > 0;
                  const stripe = prog === "planned" ? "bg-slate-400" : hasMissing ? "bg-amber-500" : "bg-emerald-500";

                  return (
                    <div key={a.id} className="relative overflow-hidden rounded-lg border border-slate-200 bg-white p-4 pl-6 transition hover:border-blue-200 hover:shadow-sm active:scale-[0.99]">
                      <div className={`absolute inset-y-3 left-0 w-1.5 rounded-r-full ${stripe}`} />
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h3 className="text-sm font-semibold text-slate-900">{a.type}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${prog === "planned" ? "bg-slate-100 text-slate-600 ring-slate-200" : "bg-slate-50 text-slate-500 ring-slate-100"}`}>
                              {prog === "planned" ? "Zaplanowane" : "Ukonczone"}
                            </span>
                            {prog !== "planned" ? (
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${hasMissing ? "bg-amber-50 text-amber-700 ring-amber-100" : "bg-emerald-50 text-emerald-700 ring-emerald-100"}`}>
                                {hasMissing ? "Brakujaca dokumentacja" : "Kompletne"}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {a.organizer ? `${a.organizer} · ` : ""}
                            Rok: <span className="font-medium text-slate-700">{a.year}</span>
                            {prog === "planned" && a.planned_start_date ? <> · Termin: <span className="font-medium text-slate-700">{formatYMD(a.planned_start_date)}</span></> : null}
                          </p>
                          {hasMissing ? (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {missing.map((m) => <span key={m} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-100">{m}</span>)}
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <span className="text-sm font-semibold text-slate-900">+{a.points} pkt</span>
                          <Link href="/aktywnosci" className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50">Otworz →</Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ── POWIADOMIENIA ─────────────────────────────────────────────── */}
        <section id="powiadomienia" className={`${cardCls} scroll-mt-44`}>
          <div className="pointer-events-none absolute left-0 top-4 h-14 w-1 rounded-r-full bg-blue-500" />
          <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <IconBubble tone="blue"><MiniIcon name="bell" /></IconBubble>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Badz na biezaco i nie przegap waznych terminow</h2>
                <p className="mt-0.5 text-xs text-slate-500">Wlacz powiadomienia, aby otrzymywac przypomnienia o szkoleniach i terminach.</p>
              </div>
            </div>
            <Link href="/profil" className="shrink-0 rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-blue-700 shadow-sm transition hover:bg-blue-50 active:scale-95">
              Ustawienia powiadomien →
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
