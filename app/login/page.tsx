"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const redirectTo = useMemo(() => {
    // callback endpoint musi istnieć: app/auth/callback/route.ts
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback`;
  }, []);

  const canSubmit = email.trim().length > 3 && password.length >= 6;

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) {
      setMsg("Wpisz poprawny e-mail i hasło (min. 6 znaków).");
      return;
    }

    setPending(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // jeśli email confirmations włączone, a użytkownik nie potwierdził,
      // Supabase potrafi nie dać sesji
      if (!data.session) {
        setMsg("Zalogowanie nie powiodło się — sprawdź czy konto zostało potwierdzone e-mailem.");
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
    if (!canSubmit) {
      setMsg("Wpisz poprawny e-mail i hasło (min. 6 znaków).");
      return;
    }

    setPending(true);
    setMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      // Jeśli potwierdzenia są WYŁĄCZONE, czasem dostaniesz od razu sesję
      if (data.session) {
        router.push("/portfolio");
        return;
      }

      // Jeśli potwierdzenia są WŁĄCZONE — user powstaje, ale bez sesji
      setMsg("Konto utworzone. Sprawdź e-mail i kliknij link aktywacyjny, potem zaloguj się.");
    } catch (err: any) {
      setMsg(err?.message || "Nie udało się utworzyć konta (błąd połączenia).");
    } finally {
      setPending(false);
    }
  }

  async function magicLink(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (email.trim().length < 4) {
      setMsg("Wpisz poprawny e-mail.");
      return;
    }

    setPending(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) setMsg(error.message);
      else setMsg("Wysłaliśmy link logowania na e-mail.");
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
          disabled={pending}
          type="submit"
        >
          {pending ? "Loguję…" : "Zaloguj (hasło)"}
        </button>

        <button
          className="w-full rounded border p-2 disabled:opacity-60"
          disabled={pending}
          type="button"
          onClick={signUp}
        >
          Załóż konto
        </button>

        <button
          className="w-full rounded border p-2 disabled:opacity-60"
          disabled={pending}
          type="button"
          onClick={magicLink}
        >
          Magic link na e-mail
        </button>
      </form>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
