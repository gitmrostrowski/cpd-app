import Link from "next/link";
import { supabaseServer } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

type ActivityListRow = {
  id: string;
  title: string;
  activity_date: string;          // ISO date (string)
  points: number | string | null; // jeśli w DB numeric/decimal -> może być string
  status: string | null;
};

export default async function Page() {
  const supabase = supabaseServer();

  // (opcjonalnie) sprawdź zalogowanie
  // const { data: auth } = await supabase.auth.getUser();
  // if (!auth?.user) redirect("/login");

  const { data: activities, error } = await supabase
    .from("activities")
    .select("id,title,activity_date,points,status")
    .order("activity_date", { ascending: false })
    .returns<ActivityListRow[]>();

  if (error) {
    return <div className="p-4 text-red-600">DB error: {error.message}</div>;
  }

  const rows = activities ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Aktywności</h1>
        <Link href="/activities/new" className="text-sm underline">
          Dodaj
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <div>Brak wpisów.</div>
        ) : (
          rows.map((a) => (
            <div
              key={a.id}
              className="rounded-md border bg-white p-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-gray-500">
                  {a.activity_date} • {a.status ?? "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {Number(a.points ?? 0).toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">pkt</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
