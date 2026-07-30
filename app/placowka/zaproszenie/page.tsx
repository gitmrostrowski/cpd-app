"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { roleLabel } from "@/lib/organization";
import { supabaseClient } from "@/lib/supabase/client";

type InvitationLanding = {
  valid: boolean;
  reason: "valid" | "not_found" | "accepted" | "revoked" | "expired" | "unavailable";
  email?: string;
  account_exists: boolean | null;
  organization_name?: string;
  role_code?: string;
  unit_name?: string | null;
  expires_at?: string;
};

function unavailableMessage(reason?: InvitationLanding["reason"]) {
  if (reason === "accepted") return "To zaproszenie zostało już przyjęte.";
  if (reason === "revoked") return "To zaproszenie zostało anulowane.";
  if (reason === "expired") return "Ten link zaproszenia wygasł.";
  return "Ten link zaproszenia jest nieprawidłowy albo nie jest już dostępny.";
}

export default function OrganizationInvitationPage() {
  const { user, loading, signOut } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);
  const router = useRouter();
  const [token, setToken] = useState("");
  const [details, setDetails] = useState<InvitationLanding | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const invitationToken =
      new URLSearchParams(window.location.search).get("token") ?? "";
    setToken(invitationToken);
    if (!invitationToken) {
      setDetails({
        valid: false,
        reason: "not_found",
        account_exists: null,
      });
      setDetailsLoading(false);
      return;
    }

    let active = true;
    void (async () => {
      const [{ data, error: landingError }] = await Promise.all([
        supabase.rpc("get_organization_invitation_landing", {
          p_token: invitationToken,
        }),
        supabase.rpc("mark_organization_invitation_opened", {
          p_token: invitationToken,
        }),
      ]);

      if (!active) return;
      if (landingError) {
        setError("Nie udało się sprawdzić zaproszenia. Odśwież stronę.");
      } else {
        setDetails(data as unknown as InvitationLanding);
      }
      setDetailsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!user || !token) return;
    void supabase.rpc("mark_organization_invitation_authenticated", {
      p_token: token,
    });
  }, [supabase, token, user]);

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
  const expectedEmail = details?.email?.toLocaleLowerCase("pl-PL") ?? "";
  const signedInEmail = user?.email?.toLocaleLowerCase("pl-PL") ?? "";
  const isCorrectUser =
    Boolean(user && expectedEmail) && signedInEmail === expectedEmail;

  async function switchAccount() {
    setWorking(true);
    await signOut();
    setWorking(false);
  }

  if (loading || detailsLoading) {
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
          {accepted
            ? "Dostęp został aktywowany"
            : details?.valid
              ? `Zaproszenie do ${details.organization_name}`
              : "Zaproszenie do placówki"}
        </h1>

        {accepted ? (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Otwieramy panel placówki…
          </p>
        ) : !details?.valid ? (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {unavailableMessage(details?.reason)}
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-extrabold text-slate-700 hover:bg-slate-50"
            >
              Wróć na stronę główną
            </Link>
          </>
        ) : user && isCorrectUser ? (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Jesteś zalogowany jako <strong>{user.email}</strong>. Zaproszenie
              nada Ci dostęp jako{" "}
              <strong>{roleLabel(details.role_code ?? "member")}</strong>
              {details.unit_name ? ` w jednostce ${details.unit_name}` : ""}.
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
        ) : user ? (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Zaproszenie jest przypisane do <strong>{details.email}</strong>,
              a obecnie jesteś zalogowany jako <strong>{user.email}</strong>.
              Wyloguj się i użyj właściwego konta.
            </p>
            <button
              type="button"
              onClick={switchAccount}
              disabled={working}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {working ? "Wylogowywanie…" : "Przejdź do właściwego konta"}
            </button>
          </>
        ) : details.account_exists ? (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Konto dla adresu <strong>{details.email}</strong> już istnieje.
              Zaloguj się, aby przyjąć zaproszenie.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(invitationPath)}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-700"
            >
              <LogIn className="h-4 w-4" />
              Zaloguj się
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Dla adresu <strong>{details.email}</strong> nie ma jeszcze konta
              CRPE. Utwórz je, a po aktywacji wrócisz do tego zaproszenia.
            </p>
            <Link
              href={`/rejestracja?next=${encodeURIComponent(invitationPath)}`}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              Utwórz konto
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
