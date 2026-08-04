import "server-only";

import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contactSchema = z.object({
  role: z.enum(["medyk", "placowka", "organizator"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(320),
  organisation: z.string().trim().max(180).optional(),
  scale: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(),
  startedAt: z.number().int().positive(),
});

const roleSettings = {
  medyk: {
    label: "Medyk",
    recipient: "pomoc@crpe.pl",
  },
  placowka: {
    label: "Placówka",
    recipient: "kontakt@crpe.pl",
  },
  organizator: {
    label: "Organizator",
    recipient: "zgloszenia@crpe.pl",
  },
} as const;

type BrevoMessage = {
  sender: { name: string; email: string };
  to: Array<{ email: string; name?: string }>;
  replyTo?: { email: string; name?: string };
  subject: string;
  htmlContent: string;
  textContent: string;
  headers: Record<string, string>;
  tags: string[];
};

function json(body: object, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function validSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    const requestUrl = new URL(request.url);
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const expectedHost = forwardedHost || request.headers.get("host") || requestUrl.host;
    return originUrl.host === expectedHost && ["https:", "http:"].includes(originUrl.protocol);
  } catch {
    return false;
  }
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  ).slice(0, 80);
}

function referenceFromId(id: string) {
  return `CRPE-${id.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

async function sendBrevoMessage(apiKey: string, message: BrevoMessage) {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify(message),
  });

  const result = (await response.json().catch(() => ({}))) as {
    messageId?: string;
    message?: string;
    code?: string;
  };
  if (!response.ok || !result.messageId) {
    const providerCode = result.code || result.message || `http_${response.status}`;
    throw new Error(String(providerCode).slice(0, 160));
  }

  return result.messageId;
}

export async function POST(request: Request) {
  if (!validSameOrigin(request)) {
    return json({ error: "invalid_request" }, 403);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 32_000) {
    return json({ error: "invalid_request" }, 413);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const parsed = contactSchema.safeParse(rawBody);
  if (!parsed.success) {
    const looksLikeBot = Boolean(
      rawBody && typeof rawBody === "object" && "website" in rawBody && (rawBody as { website?: unknown }).website,
    );
    if (looksLikeBot) {
      return json({ reference: `CRPE-${crypto.randomUUID().slice(0, 10).toUpperCase()}` }, 202);
    }
    return json({ error: "invalid_request" }, 400);
  }

  const body = parsed.data;
  const elapsed = Date.now() - body.startedAt;
  if (elapsed < 1_500 || elapsed > 2 * 60 * 60 * 1000) {
    return json({ error: "invalid_request" }, 400);
  }

  if (body.role !== "medyk" && !body.organisation) {
    return json({ error: "invalid_request" }, 400);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail =
    process.env.CRPE_NOTIFICATION_FROM_EMAIL?.trim() ||
    process.env.CRPE_INVITATION_FROM_EMAIL?.trim();

  if (!brevoKey || !fromEmail) {
    console.error("Contact form email configuration is incomplete", {
      hasBrevoKey: Boolean(brevoKey),
      hasFromEmail: Boolean(fromEmail),
    });
    return json({ error: "contact_unavailable" }, 503);
  }

  const supabase =
    supabaseUrl && serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;
  const normalizedEmail = body.email.toLocaleLowerCase("pl-PL");
  const senderHash = createHash("sha256")
    .update(`${serviceRoleKey || brevoKey}|${clientIp(request)}|${normalizedEmail}`)
    .digest("hex");

  const settings = roleSettings[body.role];
  const recipient = settings.recipient;
  let contactId = crypto.randomUUID();
  let recordStored = false;

  if (supabase) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_hash", senderHash)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.warn("Contact form database rate-limit unavailable; email delivery continues", {
        code: countError.code,
      });
    } else if ((count || 0) >= 5) {
      return json({ error: "rate_limited" }, 429);
    }

    const { data: record, error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        role: body.role,
        name: body.name,
        email: normalizedEmail,
        organisation: body.organisation || null,
        scale: body.scale || null,
        message: body.message,
        recipient,
        sender_hash: senderHash,
        status: "pending",
        recipient_status: "pending",
        confirmation_status: "not_attempted",
      })
      .select("id")
      .single();

    if (insertError || !record?.id) {
      console.warn("Contact form database insert unavailable; email delivery continues", {
        code: insertError?.code,
      });
    } else {
      contactId = record.id;
      recordStored = true;
    }
  } else {
    console.warn("Contact form database configuration unavailable; email delivery continues");
  }

  async function updateStoredRecord(
    values: Record<string, unknown>,
    stage: string,
  ) {
    if (!supabase || !recordStored) return;
    const { error } = await supabase
      .from("contact_messages")
      .update(values)
      .eq("id", contactId);
    if (error) {
      console.warn("Contact form database status update unavailable", {
        stage,
        code: error.code,
      });
    }
  }

  const reference = referenceFromId(contactId);
  const subject = `[${reference}] Kontakt CRPE — ${settings.label}`;
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.65">
      <h2>Nowa wiadomość z formularza CRPE</h2>
      <p><strong>Numer:</strong> ${escapeHtml(reference)}</p>
      <p><strong>Rola:</strong> ${escapeHtml(settings.label)}</p>
      <p><strong>Imię i nazwisko:</strong> ${escapeHtml(body.name)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(normalizedEmail)}</p>
      ${body.organisation ? `<p><strong>Organizacja:</strong> ${escapeHtml(body.organisation)}</p>` : ""}
      ${body.scale ? `<p><strong>Skala:</strong> ${escapeHtml(body.scale)}</p>` : ""}
      <div style="margin-top:20px;padding:16px;border-radius:12px;background:#f1f5f9;white-space:pre-wrap">${escapeHtml(body.message)}</div>
      <p style="margin-top:20px;color:#64748b;font-size:12px">Odpowiedź w programie pocztowym zostanie skierowana na adres nadawcy formularza.</p>
    </div>
  `;

  let recipientMessageId: string;
  try {
    recipientMessageId = await sendBrevoMessage(brevoKey, {
      sender: { name: "CRPE", email: fromEmail },
      to: [{ email: recipient, name: "Zespół CRPE" }],
      replyTo: { name: body.name, email: normalizedEmail },
      subject,
      htmlContent,
      textContent: [
        "Nowa wiadomość z formularza CRPE",
        `Numer: ${reference}`,
        `Rola: ${settings.label}`,
        `Imię i nazwisko: ${body.name}`,
        `E-mail: ${normalizedEmail}`,
        body.organisation ? `Organizacja: ${body.organisation}` : "",
        body.scale ? `Skala: ${body.scale}` : "",
        "",
        body.message,
      ].filter(Boolean).join("\n"),
      headers: { "X-Crpe-Contact-Id": contactId },
      tags: ["contact_form", "contact_recipient", `contact_${body.role}`],
    });
  } catch (deliveryError) {
    const errorCode = deliveryError instanceof Error ? deliveryError.message.slice(0, 160) : "unknown";
    console.error("Contact form recipient delivery failed", { id: contactId, error: errorCode });
    await updateStoredRecord(
      { status: "failed", recipient_status: "failed", error_code: errorCode },
      "recipient_failed",
    );
    return json({ error: "delivery_failed", reference }, 502);
  }

  const acceptedAt = new Date().toISOString();
  await updateStoredRecord(
    {
      status: "sent",
      recipient_status: "accepted",
      provider_message_id: recipientMessageId,
      recipient_provider_message_id: recipientMessageId,
      sent_at: acceptedAt,
    },
    "recipient_accepted",
  );

  const confirmationSubject = `[${reference}] Otrzymaliśmy Twoją wiadomość — CRPE`;
  const confirmationHtml = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.65">
      <h2>Dziękujemy za kontakt z CRPE</h2>
      <p>Twoja wiadomość została przekazana do właściwego zespołu pod adresem <strong>${escapeHtml(recipient)}</strong>.</p>
      <p><strong>Numer zgłoszenia:</strong> ${escapeHtml(reference)}</p>
      <div style="margin-top:20px;padding:16px;border-radius:12px;background:#f1f5f9;white-space:pre-wrap">${escapeHtml(body.message)}</div>
      <p style="margin-top:20px;color:#64748b;font-size:12px">Zachowaj numer zgłoszenia. Na tę automatyczną wiadomość możesz odpowiedzieć — odpowiedź trafi do właściwego zespołu CRPE.</p>
    </div>
  `;

  try {
    const confirmationMessageId = await sendBrevoMessage(brevoKey, {
      sender: { name: "CRPE", email: fromEmail },
      to: [{ email: normalizedEmail, name: body.name }],
      replyTo: { email: recipient, name: "Zespół CRPE" },
      subject: confirmationSubject,
      htmlContent: confirmationHtml,
      textContent: [
        "Dziękujemy za kontakt z CRPE.",
        `Twoja wiadomość została przekazana do: ${recipient}`,
        `Numer zgłoszenia: ${reference}`,
        "",
        body.message,
      ].join("\n"),
      headers: { "X-Crpe-Contact-Confirmation-Id": contactId },
      tags: ["contact_form", "contact_confirmation", `contact_${body.role}`],
    });

    const confirmationAcceptedAt = new Date().toISOString();
    await updateStoredRecord(
      {
        confirmation_status: "accepted",
        confirmation_provider_message_id: confirmationMessageId,
        confirmation_sent_at: confirmationAcceptedAt,
      },
      "confirmation_accepted",
    );

    return json({ reference, confirmation_sent: true }, 201);
  } catch (confirmationError) {
    const errorCode = confirmationError instanceof Error
      ? confirmationError.message.slice(0, 160)
      : "unknown";
    console.error("Contact form confirmation delivery failed", { id: contactId, error: errorCode });
    await updateStoredRecord(
      {
        status: "partial",
        confirmation_status: "failed",
        confirmation_error_code: errorCode,
      },
      "confirmation_failed",
    );

    return json({ reference, confirmation_sent: false }, 201);
  }
}
