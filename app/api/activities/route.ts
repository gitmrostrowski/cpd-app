import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await supabaseServer(); // ✅ NAJWAŻNIEJSZA ZMIANA

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
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

  const { data, error } = await supabase
    .from("activities")
    .insert({
      user_id: user.id,
      type,
      points,
      year,
      organizer,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
