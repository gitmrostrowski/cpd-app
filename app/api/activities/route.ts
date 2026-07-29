import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createActivity, fetchActivities } from "@/lib/data/crpe";

export async function GET() {
  const supabase = await supabaseServer(); // ✅ NAJWAŻNIEJSZA ZMIANA

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await fetchActivities(supabase, user.id, {
      includeCertificateFields: true,
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const supabase = await supabaseServer(); // ✅ NAJWAŻNIEJSZA ZMIANA

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(body?.type ?? "").trim();
  const points = Number(body?.points ?? 0);
  const year = Number(body?.year ?? 0);
  const organizerRaw = String(body?.organizer ?? "").trim();
  const organizer = organizerRaw.length ? organizerRaw : null;

  if (!type || !Number.isFinite(points) || !Number.isFinite(year)) {
    return NextResponse.json(
      { error: "Missing/invalid fields: type, points, year" },
      { status: 400 }
    );
  }

  try {
    const id = await createActivity(supabase, user.id, {
      type,
      points,
      year,
      organizer,
    });
    const data = (await fetchActivities(supabase, user.id)).find(
      (row) => row.id === id,
    );
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Database error" },
      { status: 500 },
    );
  }
}
