// app/raporty/organizacja/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabaseClient } from "@/lib/supabase/client";

function canAccess(role: string | null) {
  return role === "admin" || role === "organization" || role === "manager";
}

export default function RaportOrganizacjiPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);

  const [role, setRole] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadRole() {
      setLoadingRole(true);

      const { data } = await supabase
        .from("profiles" as any)
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setRole((data as any)?.role ?? null);
      setLoadingRole(false);
    }

    loadRole();
  }, [user, supabase]);

  if (loading || loadingRole) {
    return <div className="p-8">Ładowanie…</div>;
  }

  if (!user) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Raport organizacji</h1>
        <p className="mt-2 text-slate-600">
          Musisz być zalogowany, aby uzyskać dostęp.
        </p>

        <Link
          href="/login"
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-xl"
        >
          Zaloguj się
        </Link>
      </div>
    );
  }

  if (!canAccess(role)) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">Brak dostępu</h1>
        <p className="mt-2 text-slate-600">
          Ten widok jest dostępny tylko dla użytkowników z uprawnieniami
          organizacyjnymi.
        </p>

        <Link
          href="/raporty"
          className="mt-4 inline-block border px-4 py-2 rounded-xl"
        >
          Wróć do raportów
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold">Raport organizacji</h1>

      <div className="mt-4 p-4 border rounded-xl bg-slate-50">
        <p className="font-semibold">W budowie...</p>

        <p className="mt-2 text-sm text-slate-600">
          Docelowo tutaj pojawi się panel do zarządzania zespołem,
          monitorowania punktów i raportów zbiorczych.
        </p>
      </div>
    </div>
  );
}
