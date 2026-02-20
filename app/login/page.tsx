"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

function isRateLimitError(message?: string) {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("rate limit") ||
    m.includes("too many requests") ||
    m.includes("throttle")
  );
}

export default function LoginPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // cooldown dla maili (otp / signup / reset), żeby nie wpadać w limit
  const [emailCooldownUntil, setEmailCooldownUntil] = useState<number>(0);

  // ticker do odświeżania UI co 1s (żeby countdown schodził bez refresh)
  const [tick, setTick] = useState(0);

  const redirectTo = useMemo(() => {
    // callback endpoint musi istnieć: app/auth/callback/route.ts
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback`;
  }, []);

  const emailTrim = email.trim();
  const canPasswordSubmit = emailTrim.length > 3 && password.length >= 6;
  const canEmailSubmit = emailTrim.length > 3;

  // odświeżaj raz na sekundę, tylko gdy cooldown aktywny
  useEffect(() => {
    if (!emailCooldownUntil) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [emailCooldownUntil]);

  const now = Date.now(); // tick powoduje re-render, więc "now" się zmienia
  const emailCooldownActive = now < emailCooldownUntil;
  const cooldownSecondsLeft = emailCooldownActive
    ? Math.ceil((emailCooldownUntil - now) / 1000)
    : 0;

  // jak cooldown minie, usuń komunikat rate-limit (żeby nie wisiał)
  useEffect(() => {
    if (!emailCooldownActive && msg && isRateLimitError(msg)) {
      setMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emailCooldownActive]);

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

      if (!data.session) {
        setMsg(
          "Brak sesji po logowaniu. Sprawdź czy konto jest potwierdzone e-mailem."
        );
        return;
      }

      router.replace("/kalkulator");
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
          setMsg(
            "Za dużo prób wysyłki e-mail. Odczekaj 1–2 minuty i spróbuj ponownie."
          );
          setEmailCooldownUntil(Date.now() + 90_000);
          return;
        }
        setMsg(error.message || "Nie udało się utworzyć konta.");
        return;
      }

      if (data.session) {
        router.replace("/kalkulator");
        return;
      }

      setMsg(
        "Konto utworzone. Sprawdź e-mail i kliknij link aktywacyjny, potem zaloguj się."
      );
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
          setMsg(
            "Za dużo prób wysyłki e-mail. Odczekaj 1–2 minuty i spróbuj ponownie."
          );
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

  async function resetPassword(e: React.MouseEvent<HTMLButtonElement>) {
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
      const { error } = await supabase.auth.resetPasswordForEmail(emailTrim, {
        redirectTo: `${window.location.origin}/reset-hasla`,
      });

      if (error) {
        if (isRateLimitError(error.message)) {
          setMsg(
            "Za dużo prób wysyłki e-mail. Odczekaj 1–2 minuty i spróbuj ponownie."
          );
          setEmailCooldownUntil(Date.now() + 90_000);
          return;
        }
        setMsg(error.message || "Nie udało się wysłać linku resetującego.");
        return;
      }

      setMsg("Wysłaliśmy e-mail do resetu hasła. Sprawdź skrzynkę.");
      setEmailCooldownUntil(Date.now() + 60_000);
    } catch (err: any) {
      setMsg(err?.message || "Nie udało się wysłać linku (błąd połączenia).");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* tło spójne z landing */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/70 via-white to-white" />
      <div className="pointer-events-none absolute left-[-10%] top-[-25%] h-[34rem] w-[34rem] rounded-full bg-blue-200/35 blur-3xl" />
      <div className="pointer-events-none absolute right-[-12%] top-[5%] h-[28rem] w-[28rem] rounded-full bg-indigo-200/25 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
        <div className="mx-auto max-w-xl">
          <div className="rounded-[32px] border border-slate-200 bg-white/75 p-6 md:p-10 shadow-md backdrop-blur">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-medium text-blue-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              CRPE — logowanie
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
              Zaloguj się
            </h1>
            <p className="mt-2 text-slate-600">
              Wpisz e-mail i hasło. Jeśli nie masz konta — utworzysz je poniżej.
            </p>

            {msg ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {msg}
              </div>
            ) : null}

            <form className="mt-6 space-y-4" onSubmit={signInWithPassword}>
              <div>
                <label className="text-sm font-semibold text-slate-800">
                  E-mail
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                  placeholder="np. anna@szpital.pl"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-800">
                  Hasło
                </label>

                <div className="relative">
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 pr-16 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    placeholder="min. 6 znaków"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                    title={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
                  >
                    {showPassword ? "Ukryj" : "Pokaż"}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={resetPassword}
                disabled={pending || !canEmailSubmit || emailCooldownActive}
                className="text-left text-xs font-semibold text-blue-700 hover:underline disabled:opacity-60"
                title={
                  emailCooldownActive
                    ? `Odczekaj ${cooldownSecondsLeft}s`
                    : !canEmailSubmit
                    ? "Wpisz e-mail"
                    : undefined
                }
              >
                Nie pamiętasz hasła? Zresetuj je
              </button>

              <button
                className="w-full rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                disabled={pending || !canPasswordSubmit}
                type="submit"
                title={
                  !canPasswordSubmit
                    ? "Wpisz e-mail i hasło (min. 6 znaków)"
                    : undefined
                }
              >
                {pending ? "Loguję…" : "Zaloguj"}
              </button>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <button
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-blue-200 hover:bg-blue-50/50 disabled:opacity-60"
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
                  {emailCooldownActive
                    ? `Wyślij link (${cooldownSecondsLeft}s)`
                    : "Wyślij magic link"}
                </button>

                <div className="text-xs text-slate-500">
                  {emailCooldownActive ? (
                    <>Limit wysyłek: odczekaj {cooldownSecondsLeft}s.</>
                  ) : (
                    <>Jeśli nie pamiętasz hasła, użyj magic linku.</>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">
                  Nie masz konta?
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Utwórz konto tym samym e-mailem i hasłem. Potem (jeśli
                  wymagane) potwierdź link w wiadomości.
                </div>

                <button
                  className="mt-3 w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-white/80 disabled:opacity-60"
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
                  {emailCooldownActive
                    ? `Utwórz konto (${cooldownSecondsLeft}s)`
                    : "Utwórz konto"}
                </button>

                <div className="mt-3 text-xs text-slate-500">
                  Masz już konto? Po prostu zaloguj się powyżej.
                </div>
              </div>

              <div className="pt-2 text-center text-xs text-slate-500">
                <Link href="/" className="hover:text-slate-700">
                  ← Wróć na stronę główną
                </Link>
              </div>
            </form>
          </div>

          {/* mała notka pod kartą */}
          <div className="mt-6 text-center text-xs text-slate-500">
            Logowanie i rejestracja są w jednym miejscu — w menu zostaje tylko
            „Zaloguj”.
          </div>
        </div>
      </div>
    </section>
  );
}
