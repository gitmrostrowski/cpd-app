"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

const TERMS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";

type InvitationLanding = {
  valid: boolean;
  account_exists: boolean | null;
  email?: string;
};

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function registrationError(message?: string) {
  const normalized = (message ?? "").toLowerCase();
  if (normalized.includes("signups not allowed")) {
    return "Tworzenie kont jest chwilowo wyłączone. Administrator CRPE musi włączyć rejestrację w Supabase Auth.";
  }
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "Konto z tym adresem już istnieje. Przejdź do logowania.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Za dużo prób. Odczekaj chwilę i spróbuj ponownie.";
  }
  return message || "Nie udało się utworzyć konta.";
}

export default function RegisterPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/");
  const [invitationFlow, setInvitationFlow] = useState(false);
  const [emailLocked, setEmailLocked] = useState(false);
  const [checkingInvitation, setCheckingInvitation] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  useEffect(() => {
    const candidate = safeNextPath(
      new URLSearchParams(window.location.search).get("next"),
    );
    setNextPath(candidate);

    const destination = new URL(candidate, window.location.origin);
    const invitationToken =
      destination.pathname === "/placowka/zaproszenie"
        ? destination.searchParams.get("token")
        : null;

    if (!invitationToken) {
      setCheckingInvitation(false);
      return;
    }

    setInvitationFlow(true);
    let active = true;
    void (async () => {
      const { data, error } = await supabase.rpc(
        "get_organization_invitation_landing",
        { p_token: invitationToken },
      );
      if (!active) return;

      if (error) {
        setErrorMsg("Nie udało się sprawdzić zaproszenia. Wróć do linku z wiadomości.");
      } else {
        const invitation = data as unknown as InvitationLanding;
        if (!invitation.valid || !invitation.email) {
          setErrorMsg("Zaproszenie wygasło albo nie jest już dostępne.");
        } else if (invitation.account_exists) {
          router.replace(`/login?next=${encodeURIComponent(candidate)}`);
          return;
        } else {
          setEmail(invitation.email);
          setEmailLocked(true);
        }
      }
      setCheckingInvitation(false);
    })();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (!accepted) {
      setErrorMsg("Aby utworzyć konto, musisz zaakceptować Regulamin i Politykę Prywatności.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    if (error) {
      setLoading(false);
      setErrorMsg(registrationError(error.message));
      return;
    }

    // Jeżeli masz włączone potwierdzanie e-mail w Supabase:
    if (!data.session) {
      setLoading(false);
      setInfoMsg(
        invitationFlow
          ? "Konto zostało utworzone. Sprawdź e-mail i kliknij link aktywacyjny — wrócisz wtedy do zaproszenia."
          : "Sprawdź skrzynkę e-mail i potwierdź rejestrację, aby aktywować konto.",
      );
      return;
    }

    setLoading(false);
    router.replace(nextPath);
  }

  if (checkingInvitation) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">
        {invitationFlow ? "Utwórz konto i przyjmij zaproszenie" : "Załóż konto"}
      </h1>

      <p className="mt-2 text-sm opacity-70">
        {invitationFlow
          ? "Adres e-mail został pobrany z ważnego zaproszenia."
          : "Masz już konto? "}
        {!invitationFlow ? (
          <Link className="underline underline-offset-4" href="/login">
          Zaloguj się
          </Link>
        ) : null}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm">E-mail</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly={emailLocked}
            aria-readonly={emailLocked}
          />
          {emailLocked ? (
            <p className="text-xs opacity-60">
              Konto musi mieć ten sam adres, na który wysłano zaproszenie.
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label className="text-sm">Hasło</label>
          <input
            className="w-full rounded-xl border px-3 py-2"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <p className="text-xs opacity-60">Minimum 6 znaków.</p>
        </div>

        {/* checkbox + linki */}
        <label className="flex gap-3 text-sm items-start">
          <input
            className="mt-1"
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
          />
          <span>
            Akceptuję{" "}
            <Link
              className="underline underline-offset-4"
              href="/regulamin"
              target="_blank"
              rel="noopener noreferrer"
            >
              Regulamin
            </Link>{" "}
            (wersja {TERMS_VERSION}) oraz{" "}
            <Link
              className="underline underline-offset-4"
              href="/polityka-prywatnosci"
              target="_blank"
              rel="noopener noreferrer"
            >
              Politykę Prywatności
            </Link>{" "}
            (wersja {PRIVACY_VERSION}).
          </span>
        </label>

        {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
        {infoMsg ? <p className="text-sm text-green-700">{infoMsg}</p> : null}

        <button
          type="submit"
          className="w-full rounded-xl bg-blue-600 text-white px-4 py-2 disabled:opacity-50"
          disabled={!accepted || loading}
        >
          {loading ? "Tworzenie konta..." : "Załóż konto"}
        </button>

        <p className="text-xs opacity-60">
          Klikając „Załóż konto” potwierdzasz, że zapoznałeś(-aś) się z dokumentami.
        </p>
      </form>
    </main>
  );
}
