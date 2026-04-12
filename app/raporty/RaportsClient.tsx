// app/raporty/RaportsClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

type ProfileRoleRow = {
  role: string | null;
};

function canAccessOrgReport(role: string | null) {
  return role === "admin" || role === "organization" || role === "manager";
}

export default function RaportsClient() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user?.id) {
        setRole(null);
        return;
      }

      setLoadingRole(true);

      const { data, error } = await supabase
        .from("profiles" as any)
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      const profile = (data as ProfileRoleRow | null) ?? null;
      setRole(!error && profile ? (profile.role ?? null) : null);
      setLoadingRole(false);
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [user?.id, supabase]);

  if (loading || loadingRole) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-4 text-sm">Ładuję…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl border bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">Raporty</h1>
          <p className="mt-2 text-sm text-slate-600">
            Zaloguj się, aby generować raporty użytkownika lub organizacji.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Zaloguj się
            </Link>
            <Link
              href="/aktywnosci"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Aktywności
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const showUserReport = true;
  const showOrgReport = canAccessOrgReport(role);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Raporty</h1>
          <p className="mt-1 text-sm text-slate-600">
            Wybierz rodzaj raportu, który chcesz przygotować.
          </p>
        </div>
        <div className="flex gap-2">
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

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {showUserReport ? (
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Raport użytkownika
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Zestawienie aktywności, punktów i załączników dla jednej osoby.
                </p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[11px] text-blue-700">
                Indywidualny
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• podsumowanie punktów w wybranym okresie</li>
                <li>• lista aktywności do raportu</li>
                <li>• kontrola załączników i certyfikatów</li>
                <li>• eksport PDF i ZIP</li>
              </ul>
            </div>

            <div className="mt-4">
              <Link
                href="/raporty/uzytkownik"
                className="inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Otwórz raport użytkownika
              </Link>
            </div>
          </section>
        ) : null}

        {showOrgReport ? (
          <section className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Raport organizacji
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Zbiorcze raporty dla wielu użytkowników, zespołu lub organizacji.
                </p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">
                Organizacja
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• raport zbiorczy dla wielu osób</li>
                <li>• filtrowanie po okresie i statusie</li>
                <li>• eksport zestawień dla organizacji</li>
                <li>• podgląd braków i kompletności dokumentów</li>
              </ul>
            </div>

            <div className="mt-4">
              <Link
                href="/raporty/organizacja"
                className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Otwórz raport organizacji
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed bg-white p-5 md:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Raport organizacji
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ten widok pojawi się tylko dla użytkowników z odpowiednimi
              uprawnieniami.
            </p>
          </section>
        )}
      </div>

      <div className="mt-5 rounded-2xl border bg-white p-5">
        <h2 className="text-base font-semibold text-slate-900">
          Proponowana logika dostępu
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Raport użytkownika powinien być dostępny dla każdego zalogowanego
          użytkownika. Raport organizacji powinien zależeć od uprawnień, nie od
          profesji. Dzięki temu lekarz może mieć także dostęp do raportów
          organizacyjnych, jeśli dostanie odpowiednią rolę.
        </p>
      </div>
    </main>
  );
}
