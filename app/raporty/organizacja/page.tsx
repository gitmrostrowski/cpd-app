// app/raporty/organizacja/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

function canAccess(role: string | null) {
  return role === "admin" || role === "organization" || role === "manager";
}

export default function RaportOrganizacjiPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!user?.id) {
      setRole(null);
      return;
    }

    const userId = user.id;

    async function loadRole() {
      setLoadingRole(true);

      const { data } = await supabase
        .from("profiles" as any)
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      setRole((data as { role?: string | null } | null)?.role ?? null);
      setLoadingRole(false);
    }

    loadRole();

    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase]);

  if (loading || loadingRole) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-4 text-sm">Ładowanie…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Raport organizacji</h1>
          <p className="mt-2 text-sm text-slate-600">
            Musisz być zalogowany, aby uzyskać dostęp do tego widoku.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zaloguj się
            </Link>
            <Link
              href="/raporty"
              className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Wróć do raportów
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!canAccess(role)) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Brak dostępu</h1>
          <p className="mt-2 text-sm text-slate-600">
            Ten widok jest dostępny tylko dla użytkowników z uprawnieniami organizacyjnymi.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/raporty"
              className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Wróć do raportów
            </Link>
            <Link
              href="/kalkulator"
              className="inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kalkulator
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Raport organizacji
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Widok dla organizacji i zespołów pracujących w środowiskach regulowanych.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/raporty"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Wróć do raportów
          </Link>
          <Link
            href="/aktywnosci"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Aktywności
          </Link>
          <Link
            href="/kalkulator"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Kalkulator
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-12">
        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                W budowie...
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Przygotowujemy moduł raportowy dla organizacji.
              </p>
            </div>

            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700">
              W budowie
            </span>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                Organizacje działające w środowiskach regulowanych, szczególnie
                w sektorze medycznym, nie posiadają narzędzi umożliwiających
                bieżące monitorowanie kompetencji pracowników i zgodności z
                obowiązkowymi wymaganiami edukacyjnymi.
              </p>

              <p>
                Pracodawcy nie mają wglądu w czasie rzeczywistym w to, czy ich
                personel spełnia wymagane standardy edukacyjne. Utrudnia to
                zarządzanie zespołami, wczesne reagowanie i zwiększa ryzyko
                operacyjne.
              </p>

              <p>
                Chcemy pomóc organizacjom, które zatrudniają kadrę w zawodach
                wymagających ustawicznego kształcenia.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm lg:col-span-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Docelowo w tym module
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Planowany zakres raportu organizacyjnego.
          </p>

          <div className="mt-4 space-y-3">
            {[
              "Zbiorczy widok pracowników i statusów edukacyjnych",
              "Filtrowanie po zawodzie, okresie, jednostce i kompletności",
              "Szybki podgląd braków punktowych i dokumentowych",
              "Raporty PDF i eksport zestawień dla organizacji",
              "Wczesne wychwytywanie ryzyk zgodności",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
