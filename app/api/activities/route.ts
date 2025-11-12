import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "../../../lib/supabase/server";
import type { Database } from "../../../types/supabase";

type ActivityInsert = Database["public"]["Tables"]["activities"]["Insert"];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["ride", "run", "walk"]),
  distance_m: z.number().nullable().optional(),
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
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // ⬇️ WYMAGANE przez Twoje typy: przekazujemy user_id z tokena
  const payload: ActivityInsert = {
    user_id: authData.user.id,
    title: parsed.data.title,
    type: parsed.data.type,
    distance_m: parsed.data.distance_m ?? null,
  };

  const { data, error } = await supabase
    .from("activities")
    .insert([payload])
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
