import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";
import { toNormalizedTraining } from "@/lib/data/crpe";
import {
  removeTrainingLogo,
  TrainingLogoError,
  uploadTrainingLogo,
} from "@/lib/server/trainingOrganizerLogo";

const submissionSchema = z.object({
  title: z.string().trim().min(3).max(240),
  organizer: z.string().trim().max(180).nullable().optional(),
  points: z.number().min(0).max(10000),
  format: z.enum(["online", "stacjonarne", "hybrydowe"]),
  category: z.enum([
    "kurs",
    "konferencja",
    "warsztaty",
    "publikacja",
    "szkolenie",
    "inne",
  ]),
  start_date: z.iso.date(),
  end_date: z.iso.date().nullable().optional(),
  voivodeship: z.string().trim().max(160).nullable().optional(),
  url: z.url().max(2000).nullable().optional(),
  topics: z.array(z.string().trim().min(1).max(80)).max(20).nullable().optional(),
  price_pln: z.number().min(0).max(1000000).nullable().optional(),
  has_recording: z.boolean().optional(),
  capacity: z.number().int().min(0).max(1000000).nullable().optional(),
  enrollment_status: z
    .enum(["open", "waiting_list", "closed"])
    .nullable()
    .optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  profession: z.string().trim().min(2).max(500),
});

async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function notifyOperator(input: {
  id: string;
  title: string;
  organizer: string | null;
  profession: string;
  submittedEmail: string | null;
}) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const recipient = process.env.CRPE_TRAINING_SUBMISSIONS_EMAIL?.trim();
  const fromEmail =
    process.env.CRPE_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.CRPE_INVITATION_FROM_EMAIL?.trim();

  if (!apiKey || !recipient || !fromEmail) return false;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://www.crpe.pl"
  ).replace(/\/+$/, "");
  const adminUrl = `${siteUrl}/admin/szkolenia`;

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "CRPE", email: fromEmail },
      to: [{ email: recipient, name: "Zgłoszenia szkoleń CRPE" }],
      replyTo: input.submittedEmail
        ? { email: input.submittedEmail }
        : undefined,
      subject: `Nowe zgłoszenie szkolenia: ${input.title}`,
      htmlContent: `
        <h2>Nowe zgłoszenie szkolenia w CRPE</h2>
        <p><strong>Tytuł:</strong> ${escapeHtml(input.title)}</p>
        <p><strong>Organizator:</strong> ${escapeHtml(input.organizer || "nie podano")}</p>
        <p><strong>Adresaci:</strong> ${escapeHtml(input.profession)}</p>
        <p><strong>Zgłaszający:</strong> ${escapeHtml(input.submittedEmail || "brak adresu")}</p>
        <p><strong>ID:</strong> ${escapeHtml(input.id)}</p>
        <p><a href="${escapeHtml(adminUrl)}">Otwórz panel moderacji CRPE</a></p>
      `,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Brevo ${response.status}: ${details.slice(0, 300)}`);
  }

  return true;
}

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  const user = auth.user;

  if (authError || !user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 3 * 1024 * 1024) {
    return NextResponse.json({ error: "invalid_logo_size" }, { status: 413 });
  }

  let rawBody: unknown;
  let logoFile: File | null = null;
  try {
    if (request.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const submission = formData.get("submission");
      const logo = formData.get("organizer_logo");
      if (typeof submission !== "string") {
        return NextResponse.json(
          { error: "invalid_submission" },
          { status: 400 },
        );
      }
      rawBody = JSON.parse(submission);
      logoFile = logo instanceof File && logo.size > 0 ? logo : null;
    } else {
      // Zachowujemy zgodność z klientami v6, które wysyłały sam JSON.
      rawBody = await request.json();
    }
  } catch {
    return NextResponse.json({ error: "invalid_submission" }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_submission" }, { status: 400 });
  }

  if (
    parsed.data.end_date &&
    parsed.data.end_date < parsed.data.start_date
  ) {
    return NextResponse.json({ error: "invalid_date_range" }, { status: 400 });
  }

  let uploadedLogo: { path: string; url: string } | null = null;
  if (logoFile) {
    try {
      uploadedLogo = await uploadTrainingLogo(logoFile, user.id);
    } catch (error) {
      const code =
        error instanceof TrainingLogoError
          ? error.code
          : "logo_upload_failed";
      const status = [
        "logo_configuration_missing",
        "logo_upload_failed",
      ].includes(code)
        ? 500
        : 400;
      return NextResponse.json({ error: code }, { status });
    }
  }

  const normalized = toNormalizedTraining({
    ...parsed.data,
    external_url: parsed.data.url ?? null,
    organizer_logo_url: uploadedLogo?.url ?? null,
    organizer_logo_path: uploadedLogo?.path ?? null,
    approval_status: "pending",
    submitted_by: user.id,
    submitted_email: user.email ?? null,
  });

  const { data, error } = await supabase
    .from("trainings")
    .insert(normalized)
    .select("id,title,organizer_name")
    .single();

  if (error) {
    console.error("Training submission insert failed", error);
    await removeTrainingLogo(uploadedLogo?.path);
    return NextResponse.json({ error: "submission_failed" }, { status: 500 });
  }

  let notificationSent = false;
  try {
    notificationSent = await notifyOperator({
      id: data.id,
      title: data.title,
      organizer: data.organizer_name ?? null,
      profession: parsed.data.profession,
      submittedEmail: user.email ?? null,
    });
  } catch (notificationError) {
    console.error("Training submission notification failed", notificationError);
  }

  return NextResponse.json(
    { id: data.id, notification_sent: notificationSent },
    { status: 201 },
  );
}
