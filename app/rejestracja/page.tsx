"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MailCheck } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";
import { getSiteUrl } from "@/lib/siteUrl";

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
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationResent, setConfirmationResent] = useState(false);

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
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
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
      setAwaitingConfirmation(true);
      return;
    }

    setLoading(false);
    router.replace(nextPath);
  }

  async function resendConfirmation() {
    setErrorMsg(null);
    setResendingConfirmation(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: {
        emailRedirectTo: `${getSiteUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    setResendingConfirmation(false);

    if (error) {
      setErrorMsg(registrationError(error.message));
      return;
    }

    setConfirmationResent(true);
  }

  if (checkingInvitation) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <div className="h-72 animate-pulse rounded-3xl bg-slate-100" />
      </main>
    );
  }

  if (awaitingConfirmation) {
    return (
      <main className="mx-auto max-w-md px-4 py-10">
        <div
          className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 text-amber-950 shadow-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-200 p-2 text-amber-800">
              <MailCheck aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                {confirmationResent
                  ? "Nowa wiadomość aktywacyjna została wysłana"
                  : "Jeszcze jeden krok: potwierdź adres e-mail"}
              </h1>
              <p className="mt-2 text-sm leading-6">
                Konto zostało utworzone, ale nie jest jeszcze aktywne.
                Wysłaliśmy wiadomość na adres{" "}
                <strong className="break-all">{email.trim()}</strong>.
              </p>
            </div>
          </div>

          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-5">
            <li>Otwórz wiadomość aktywacyjną od CRPE.</li>
            <li>Kliknij link potwierdzający adres e-mail.</li>
            <li>
              {invitationFlow
                ? "Po potwierdzeniu wrócisz do zaproszenia placówki."
                : "Po potwierdzeniu wróć do CRPE i zaloguj się."}
            </li>
          </ol>

          <p className="mt-4 rounded-xl bg-white/70 p-3 text-xs leading-5 text-amber-800">
            Nie widzisz wiadomości? Sprawdź folder Spam, Oferty lub Inne.
            Dostarczenie e-maila może potrwać kilka minut.
          </p>

          {errorMsg ? (
            <p className="mt-3 text-sm font-medium text-red-700">{errorMsg}</p>
          ) : null}

          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-amber-400 bg-white px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-sm hover:bg-amber-100 disabled:opacity-60"
            disabled={resendingConfirmation || confirmationResent}
            onClick={resendConfirmation}
          >
            {resendingConfirmation
              ? "Wysyłam…"
              : confirmationResent
                ? "Wiadomość wysłana ponownie"
                : "Wyślij wiadomość aktywacyjną ponownie"}
          </button>

          <Link
            className="mt-4 block text-center text-sm font-semibold text-amber-900 underline underline-offset-4"
            href={`/login?next=${encodeURIComponent(nextPath)}`}
          >
            Przejdź do logowania
          </Link>
        </div>
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
              Nowe konto zostanie utworzone dla adresu, na który wysłano
              zaproszenie.
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

        {invitationFlow ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-center">
            <p className="text-sm text-slate-700">
              Masz już konto CRPE pod innym adresem?
            </p>
            <Link
              href={`/login?use_existing=1&next=${encodeURIComponent(nextPath)}`}
              className="mt-3 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50"
            >
              Zaloguj się do istniejącego konta
            </Link>
          </div>
        ) : null}
      </form>
    </main>
  );
}
