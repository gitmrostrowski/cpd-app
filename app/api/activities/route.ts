import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "../../../lib/supabase/server";
import type { Database } from "../../../types/supabase";

type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];

const schema = z.object({
  type: z.string().min(1, "Type is required"),
  points: z.coerce.number().min(0, "Points must be >= 0"),
  year: z.coerce.number().int().min(1900).max(2100),
  organizer: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payload: ActivityInsert = {
    user_id: authData.user.id,
    type: parsed.data.type,
    points: parsed.data.points,
    year: parsed.data.year,
    organizer: parsed.data.organizer ?? null,
  };

  const { data, error } = await supabase
    .from("activities")
    .insert(payload)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
