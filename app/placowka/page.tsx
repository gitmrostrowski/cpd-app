"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { primaryRoleLabel } from "@/lib/organization";
import { supabaseClient } from "@/lib/supabase/client";

type OrganizationContext = {
  organization_id: string;
  membership_id: string;
  display_name: string;
  organization_status: string;
  primary_role: string;
  role_codes: string[];
};

export default function PlacowkaPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);
  const [contexts, setContexts] = useState<OrganizationContext[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadContexts() {
      if (!user) {
        setFetching(false);
        return;
      }

      setFetching(true);
      const { data, error: loadError } = await supabase.rpc(
        "get_my_organization_contexts",
      );

      if (cancelled) return;
      if (loadError) {
        setError(loadError.message);
        setContexts([]);
      } else {
        setContexts((data ?? []) as OrganizationContext[]);
      }
      setFetching(false);
    }

    loadContexts();
    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  if (loading || fetching) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-44 animate-pulse rounded-3xl bg-slate-100" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <Building2 className="h-10 w-10 text-blue-600" />
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
            Panel placówki
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Każda osoba loguje się własnym kontem CRPE. Po zalogowaniu zobaczy
            tylko placówki, do których przyjęła zaproszenie.
          </p>
          <Link
            href="/login?next=/placowka"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-700"
          >
            Zaloguj się
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.18em] text-blue-600">
            Kontekst organizacyjny
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Wybierz placówkę
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Twoje konto osobiste pozostaje oddzielone od panelu pracodawcy.
          </p>
        </div>
        <Link
          href="/kalkulator"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <UserRound className="h-4 w-4" /> Moje CRPE
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Nie udało się pobrać placówek: {error}
        </div>
      ) : null}

      {contexts.length ? (
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {contexts.map((context) => (
            <Link
              key={context.organization_id}
              href={`/placowka/${context.organization_id}`}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
              </div>
              <h2 className="mt-5 text-xl font-black text-slate-950">
                {context.display_name}
              </h2>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                {primaryRoleLabel(context.role_codes)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <section className="mt-7 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Building2 className="mx-auto h-10 w-10 text-slate-400" />
          <h2 className="mt-4 text-lg font-black text-slate-900">
            Nie masz jeszcze dostępu do placówki
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Administrator placówki musi wysłać zaproszenie na adres e-mail,
            którego używasz w CRPE. Członkostwo nie powstaje automatycznie.
          </p>
        </section>
      )}
    </main>
  );
}
