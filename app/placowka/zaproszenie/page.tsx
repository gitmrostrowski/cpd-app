"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

export default function OrganizationInvitationPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);
  const router = useRouter();
  const [token, setToken] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") ?? "");
  }, []);

  async function acceptInvitation() {
    if (!token) {
      setError("Brakuje identyfikatora zaproszenia.");
      return;
    }

    setWorking(true);
    setError("");
    const { data, error: acceptError } = await supabase.rpc(
      "accept_organization_invitation",
      { p_token: token },
    );

    if (acceptError) {
      setError(acceptError.message);
      setWorking(false);
      return;
    }

    const result = data as unknown as { organization_id: string };
    setAccepted(true);
    setWorking(false);
    window.setTimeout(() => {
      router.replace(`/placowka/${result.organization_id}`);
    }, 900);
  }

  const invitationPath = `/placowka/zaproszenie?token=${encodeURIComponent(token)}`;

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <section className="rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          {accepted ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          ) : (
            <Building2 className="h-7 w-7" />
          )}
        </div>
        <div className="mt-5 text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
          CRPE dla placówki
        </div>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {accepted ? "Dostęp został aktywowany" : "Zaproszenie do placówki"}
        </h1>

        {accepted ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Otwieramy panel placówki…
          </p>
        ) : user ? (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Jesteś zalogowany jako <strong>{user.email}</strong>. Zaproszenie
              zostanie przyjęte tylko wtedy, gdy zostało wysłane na ten adres.
            </p>
            <button
              type="button"
              onClick={acceptInvitation}
              disabled={working || !token}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {working ? "Aktywowanie…" : "Przyjmij zaproszenie"}
            </button>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Zaloguj się lub załóż własne konto CRPE na adres, na który
              otrzymałeś zaproszenie.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(invitationPath)}`}
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-700"
            >
              Zaloguj się i wróć do zaproszenia
            </Link>
          </>
        )}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-left text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <p className="mt-7 text-xs leading-5 text-slate-500">
          Przyjęcie zaproszenia nie przekazuje placówce automatycznie Twoich
          prywatnych certyfikatów ani aktywności.
        </p>
      </section>
    </main>
  );
}
