"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
      else router.push("/portfolio");
    } catch (err: any) {
      setMsg(err?.message || "Nie udało się zalogować (błąd połączenia).");
    } finally {
      setPending(false);
    }
  }

  async function signUp(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setPending(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setMsg(error.message);
      else setMsg("Konto utworzone. Jeśli wymagane – potwierdź e-mail i zaloguj się.");
    } catch (err: any) {
      setMsg(err?.message || "Nie udało się utworzyć konta (błąd połączenia).");
    } finally {
      setPending(false);
    }
  }

  async function magicLink(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    setPending(true);
    setMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // WAŻNE: callback endpoint musi istnieć w app/auth/callback/route.ts
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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
        />

        <input
          className="w-full rounded border p-2"
          placeholder="hasło"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
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

