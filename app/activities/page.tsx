import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

type ActivityListRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;

  // Opcjonalnie (jeśli dodasz w DB):
  certificate_url?: string | null;
  certificate_path?: string | null;
};

function getCertificateUrl(a: ActivityListRow): string | null {
  // Jeśli trzymasz pełny URL w DB
  if (a.certificate_url && a.certificate_url.trim().length) return a.certificate_url;

  // Jeśli trzymasz ścieżkę (np. w Supabase Storage) – na razie zwracamy null,
  // bo generowanie signed URL zwykle robi się w server action / API route.
  // Tu zostawiamy hook na przyszłość.
  if (a.certificate_path && a.certificate_path.trim().length) return null;

  return null;
}

export default async function ActivitiesPage() {
  const supabase = await supabaseServer();

  // Uwaga: select("*") jest celowe — nie wywali się, jeśli nie masz jeszcze kolumn certyfikatu.
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const activities = (data ?? []) as ActivityListRow[];

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold">Aktywności</h1>
          <Link
            href="/"
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Wróć
          </Link>
        </div>
        <p className="mt-4 text-red-600">Błąd pobierania danych: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Aktywności</h1>
          <p className="mt-1 text-sm text-gray-600">
            Lista zapisanych aktywności. Do każdej możesz dodać certyfikat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Dashboard
          </Link>
          <Link
            href="/calculator"
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Kalkulator
          </Link>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="rounded border p-6">
          <p className="text-gray-700">Brak zapisanych aktywności.</p>
          <p className="mt-2 text-sm text-gray-600">
            Dodaj pierwszą aktywność w kalkulatorze lub w formularzu dodawania.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {activities.map((a) => {
            const certUrl = getCertificateUrl(a);
            const hasCert = Boolean(certUrl || (a.certificate_path && a.certificate_path.trim().length));

            return (
              <li key={a.id} className="rounded border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{a.type}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      {a.year} · {a.points} pkt · {a.organizer ?? "—"}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          hasCert ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                        title="Status certyfikatu"
                      >
                        📎 Certyfikat: {hasCert ? "Dodany" : "Brak"}
                      </span>

                      {certUrl ? (
                        <a
                          href={certUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          Podgląd
                        </a>
                      ) : (
                        <Link
                          href={`/activities/${a.id}#certificate`}
                          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                        >
                          Dodaj certyfikat
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Link
                      href={`/activities/${a.id}`}
                      className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
                    >
                      Szczegóły
                    </Link>
                    <div className="text-xs text-gray-500">
                      Dodano: {new Date(a.created_at).toLocaleDateString("pl-PL")}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
