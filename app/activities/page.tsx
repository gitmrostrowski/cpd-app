import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";

type ActivityListRow = {
  id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;
  certificate_path: string | null;
};

export default async function ActivitiesPage() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("activities")
    .select("id,type,points,year,organizer,created_at,certificate_path")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

  const activities = (data ?? []) as ActivityListRow[];

  if (error) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="text-xl font-semibold">Aktywności</h1>
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
            Kliknij, żeby dodać/podejrzeć certyfikat.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/calculator" className="rounded border px-3 py-2 text-sm hover:bg-gray-50">
            Kalkulator
          </Link>
        </div>
      </div>

      {activities.length === 0 ? (
        <p className="text-gray-600">Brak zapisanych aktywności.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => {
            const hasCert = Boolean(a.certificate_path && a.certificate_path.trim().length);
            return (
              <li key={a.id} className="rounded border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">{a.type}</div>
                    <div className="text-sm text-gray-600">
                      {a.year} · {a.points} pkt · {a.organizer ?? "—"}
                    </div>
                    <div className="mt-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 ${
                          hasCert ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        📎 Certyfikat: {hasCert ? "Dodany" : "Brak"}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/activities/${a.id}#certificate`}
                    className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {hasCert ? "Szczegóły" : "Dodaj"}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
