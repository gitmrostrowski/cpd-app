"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function ResetHasla() {
  const supabase = supabaseClient();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setMsg(null);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMsg(error.message);
      setPending(false);
      return;
    }

    setMsg("Hasło zmienione. Możesz się zalogować.");
    setPending(false);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold mb-4">Ustaw nowe hasło</h1>

      {msg && <div className="mb-3 text-sm">{msg}</div>}

      <form onSubmit={updatePassword} className="space-y-4">
        <input
          type="password"
          placeholder="Nowe hasło (min. 6 znaków)"
          className="w-full border rounded-xl p-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-blue-600 text-white rounded-xl p-3"
        >
          {pending ? "Zmieniam..." : "Zmień hasło"}
        </button>
      </form>
    </div>
  );
}
