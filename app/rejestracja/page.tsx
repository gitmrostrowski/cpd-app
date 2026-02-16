"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabase } from "@/lib/supabaseBrowser";

const TERMS_VERSION = "1.0";
const PRIVACY_VERSION = "1.0";

export default function RegisterPage() {
  const supabase = createBrowserSupabase();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

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
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMsg(error.message);
      return;
    }

    // Jeżeli masz włączone potwierdzanie e-mail w Supabase:
    if (!data.session) {
      setLoading(false);
      setInfoMsg("Sprawdź skrzynkę e-mail i potwierdź rejestrację, aby aktywować konto.");
      return;
    }

    setLoading(false);
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Załóż konto</h1>

      <p className="mt-2 text-sm opacity-70">
        Masz już konto?{" "}
        <Link className="underline underline-offset-4" href="/login">
          Zaloguj się
        </Link>
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
          />
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
