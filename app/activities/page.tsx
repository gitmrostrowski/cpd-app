import { supabaseServer } from "@/lib/supabase/server";

type ActivityListRow = {
  id: string;
  user_id: string;
  type: string;
  points: number;
  year: number;
  organizer: string | null;
  created_at: string;
};

export default async function ActivitiesPage() {
  // ✅ MUSI BYĆ await
  const supabase = await supabaseServer();

  const { data: activities, error } = await supabase
    .from("activities")
    .select("id,user_id,type,points,year,organizer,created_at")
    .order("year", { ascending: false })
    .order("created_at", { ascending: false });

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
      <h1 className="text-2xl font-semibold">Aktywności</h1>

      {(!activities || activities.length === 0) ? (
        <p className="text-gray-600">Brak zapisanych aktywności.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => (
            <li key={a.id} className="rounded border p-3">
              <div className="font-medium">{a.type}</div>
              <div className="text-sm text-gray-600">
                {a.year} · {a.points} pkt · {a.organizer ?? "—"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
