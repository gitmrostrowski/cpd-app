"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

function isRateLimitError(message?: string) {
  const m = (message ?? "").toLowerCase();
  return m.includes("rate limit") || m.includes("too many requests") || m.includes("throttle");
}

export default function LoginPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // cooldown dla maili (otp / signup), żeby nie wpadać w limit
  const [emailCooldownUntil, setEmailCooldownUntil] = useState<number>(0);

  const redirectTo = useMemo(() => {
    // callback endpoint musi istnieć: app/auth/callback/route.ts
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback`;
  }, []);

  const emailTrim = email.trim();
  const canPasswordSubmit = emailTrim.length > 3 && password.length >= 6;
  const canEmailSubmit = emailTrim.length > 3;

  const now = Date.now();
  const emailCooldownActive = now < emailCooldownUntil;
  const cooldownSecondsLeft = emailCooldownActive
    ? Math.ceil((emailCooldownUntil - now) / 1000)
    : 0;

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!canPasswordSubmit) {
      setMsg("Wpisz poprawny e-mail i hasło (min. 6 znaków).");
      return;
    }

    setPending(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTrim,
        password,
      });

      if (error) {
        setMsg(error.message || "Nie udało się zalogować.");
        return;
      }

      // jeśli email confirmations włączone, a użytkownik nie potwierdził,
      // Supabase potrafi nie dać sesji
      if (!data.session) {
        setMsg("Brak sesji po logowaniu. Sprawdź czy konto jest potwierdzone e-mailem.");
        return;
      }

      router.push("/portfolio");
    } catch (err: any) {
      setMsg(err?.message || "Nie udało się zalogować (błąd połączenia).");
    } finally {
      setPending(false);
    }
  }

  async function signUp(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (!canPasswordSubmit) {
      setMsg("Wpisz poprawny e-mail i hasło (min. 6 znaków).");
      return;
    }

    if (emailCooldownActive) {
      setMsg(`Odczekaj ${cooldownSecondsLeft}s przed kolejną wysyłką e-mail.`);
      return;
    }

    setPending(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailTrim,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        if (isRateLimitError(error.message)) {
          setMsg("Za dużo prób wysyłki e-mail. Odczekaj 1–2 minuty i spróbuj ponownie.");
          setEmailCooldownUntil(Date.now() + 90_000);
          return;
        }
        setMsg(error.message || "Nie udało się utworzyć konta.");
        return;
      }

      // Jeśli potwierdzenia są WYŁĄCZONE, czasem dostaniesz od razu sesję
      if (data.session) {
        router.push("/portfolio");
        return;
      }

      // Jeśli potwierdzenia są WŁĄCZONE — user powstaje, ale bez sesji
      setMsg("Konto utworzone. Sprawdź e-mail i kliknij link aktywacyjny, potem zaloguj się.");
      setEmailCooldownUntil(Date.now() + 60_000);
    } catch (err: any) {
      setMsg(err?.message || "Nie udało się utworzyć konta (błąd połączenia).");
    } finally {
      setPending(false);
    }
  }

  async function magicLink(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();

    if (!canEmailSubmit) {
      setMsg("Wpisz poprawny e-mail.");
      return;
    }

    if (emailCooldownActive) {
      setMsg(`Odczekaj ${cooldownSecondsLeft}s przed kolejną wysyłką e-mail.`);
      return;
    }

    setPending(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: emailTrim,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        if (isRateLimitError(error.message)) {
          setMsg("Za dużo prób wysyłki e-mail. Odczekaj 1–2 minuty i spróbuj ponownie.");
          setEmailCooldownUntil(Date.now() + 90_000);
          return;
        }
        setMsg(error.message || "Nie udało się wysłać linku.");
        return;
      }

      setMsg("Wysłaliśmy link logowania na e-mail.");
      setEmailCooldownUntil(Date.now() + 60_000);
    } catch (err: any) {
      setMsg(err?.message || "Nie udało się wysłać linku (błąd połączenia).");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Zaloguj się</h1>

      <form className="space-y-3" onSubmit={signInWithPassword}>
        <input
          className="w-full rounded border p-2"
          placeholder="e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          className="w-full rounded border p-2"
          placeholder="hasło (min. 6 znaków)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="current-password"
        />

        <button
          className="w-full rounded border bg-black p-2 text-white disabled:opacity-60"
          disabled={pending || !canPasswordSubmit}
          type="submit"
          title={!canPasswordSubmit ? "Wpisz e-mail i hasło (min. 6 znaków)" : undefined}
        >
          {pending ? "Loguję…" : "Zaloguj (hasło)"}
        </button>

        <button
          className="w-full rounded border p-2 disabled:opacity-60"
          disabled={pending || !canPasswordSubmit || emailCooldownActive}
          type="button"
          onClick={signUp}
          title={
            emailCooldownActive
              ? `Odczekaj ${cooldownSecondsLeft}s`
              : !canPasswordSubmit
              ? "Wpisz e-mail i hasło (min. 6 znaków)"
              : undefined
          }
        >
          {emailCooldownActive ? `Załóż konto (${cooldownSecondsLeft}s)` : "Załóż konto"}
        </button>

        <button
          className="w-full rounded border p-2 disabled:opacity-60"
          disabled={pending || !canEmailSubmit || emailCooldownActive}
          type="button"
          onClick={magicLink}
          title={
            emailCooldownActive
              ? `Odczekaj ${cooldownSecondsLeft}s`
              : !canEmailSubmit
              ? "Wpisz e-mail"
              : undefined
          }
        >
          {emailCooldownActive ? `Magic link (${cooldownSecondsLeft}s)` : "Magic link na e-mail"}
        </button>
      </form>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
