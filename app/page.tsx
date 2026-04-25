"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";
import {
  FolderCheck,
  SquareCheck,
  ShieldCheck,
  Rocket,
  BriefcaseMedical,
  FilePlus2,
  BarChart3,
} from "lucide-react";

import FeatureGrid from "@/components/FeatureGrid";
import BottomCTA from "@/components/BottomCTA";

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

const HERO_FEATURES = [
  {
    Icon: FolderCheck,
    t: "Porządek bez wysiłku",
    d: "Wpisy i certyfikaty masz w jednym miejscu — zawsze pod ręką.",
    iconBox: "bg-teal-50 text-teal-600 ring-teal-100",
  },
  {
    Icon: SquareCheck,
    t: "Jasny status punktów",
    d: "Wiesz, ile masz i czego brakuje w aktualnym okresie.",
    iconBox: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    Icon: ShieldCheck,
    t: "Bezpieczne dane",
    d: "Dostęp masz tylko Ty. Dane są przechowywane w UE.",
    iconBox: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  {
    Icon: Rocket,
    t: "Start za darmo",
    d: "Podstawowe funkcje są bezpłatne. Wkrótce opcje PRO.",
    iconBox: "bg-blue-50 text-blue-600 ring-blue-100",
  },
];

const HOW_IT_WORKS = [
  {
    Icon: BriefcaseMedical,
    n: "1",
    t: "Wybierz zawód",
    d: "System ustawi wymagania i pomoże śledzić postęp.",
  },
  {
    Icon: FilePlus2,
    n: "2",
    t: "Dodaj aktywność",
    d: "Dodaj szkolenie i certyfikat — nawet zdjęcie.",
  },
  {
    Icon: BarChart3,
    n: "3",
    t: "Sprawdzaj postęp",
    d: "Zawsze wiesz, ile punktów masz.",
  },
];

export default function Page() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function run() {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      if (!user) {
        setIsLoggedIn(false);
        setChecking(false);
        return;
      }

      setIsLoggedIn(true);
      router.replace("/kalkulator");
    }

    run();
  }, []);

  if (checking) return null;

  const demoRequired = 200;
  const demoHave = 110;
  const demoPct = clamp((demoHave / demoRequired) * 100, 0, 100);

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-12 grid lg:grid-cols-2 gap-10">

          {/* LEWA */}
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Twój rozwój i kwalifikacje
              <br />
              <span className="text-blue-600">w jednym miejscu.</span>
            </h1>

            <p className="mt-5 text-lg text-slate-600">
              Dodawaj aktywności, przechowuj certyfikaty i sprawdzaj postęp.
            </p>

            {/* 🔵 wyróżnik */}
            <div className="mt-5 flex gap-3 rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <ShieldCheck className="text-blue-600" />
              <p className="text-sm text-slate-700">
                Monitoruj rozwój i spełniaj wymagania zawodowe bez chaosu.
              </p>
            </div>

            {/* CTA */}
            <div className="mt-6 flex gap-3">
              <Link
                href="/login"
                className="bg-blue-600 text-white px-5 py-3 rounded-xl"
              >
                Załóż konto
              </Link>
              <a
                href="#jak"
                className="border border-blue-200 px-5 py-3 rounded-xl text-blue-600"
              >
                Zobacz jak działa
              </a>
            </div>

            {/* FEATURES */}
            <div className="mt-8 grid sm:grid-cols-2 gap-4">
              {HERO_FEATURES.map(({ Icon, iconBox, t, d }) => (
                <div
                  key={t}
                  className="p-4 rounded-2xl border bg-white shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-xl ${iconBox}`}>
                      <Icon />
                    </div>
                    <div>
                      <div className="font-semibold">{t}</div>
                      <div className="text-sm text-slate-600">{d}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* neutral AI */}
            <div className="mt-6 text-sm text-slate-600">
              Wkrótce: Inteligentny asystent AI
            </div>
          </div>

          {/* PRAWA */}
          <div className="bg-white p-6 rounded-3xl shadow border">
            <div className="text-sm font-semibold">Podgląd statusu</div>

            <div className="mt-4 h-2 bg-slate-100 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full"
                style={{ width: `${demoPct}%` }}
              />
            </div>

            <div className="mt-2 text-sm text-slate-600">
              110 / 200 pkt
            </div>

            <div className="mt-4">
              <Image
                src="/crpe_home.jpg"
                alt=""
                width={400}
                height={300}
              />
            </div>

            {/* 🔵 PRO */}
            <div className="mt-4">
              <div className="text-xs text-blue-600 font-semibold">
                Wkrótce (PRO)
              </div>
              <div className="text-sm text-slate-600">
                Raport PDF i przypomnienia
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="jak" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold">Jak to działa</h2>

        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {HOW_IT_WORKS.map(({ Icon, n, t, d }) => (
            <div key={t} className="p-4 border rounded-2xl bg-white shadow-sm">
              <div className="flex gap-3 items-center">
                <Icon className="text-blue-600" />
                <div className="bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-sm">
                  {n}
                </div>
              </div>
              <div className="mt-3 font-semibold">{t}</div>
              <div className="text-sm text-slate-600">{d}</div>
            </div>
          ))}
        </div>
      </section>

      <FeatureGrid />
      <BottomCTA />
    </>
  );
}
