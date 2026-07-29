import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { roleLabel } from "@/lib/organization";

type InvitationPayload = {
  id: string;
  token: string;
  email: string;
  role_code: string;
  organization_name: string;
  expires_at: string;
};

type CreateBody = {
  action?: "create" | "resend";
  organizationId?: string;
  emails?: string[];
  roleCode?: string;
  unitId?: string | null;
  invitationId?: string;
};

function normalizeEmails(values: unknown) {
  if (!Array.isArray(values)) return [];
  return Array.from(
    new Set(
      values
        .flatMap((value) =>
          String(value ?? "")
            .split(/[\s,;]+/)
            .map((email) => email.trim().toLocaleLowerCase("pl-PL")),
        )
        .filter(Boolean),
    ),
  ).slice(0, 50);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character] ?? character,
  );
}

async function supabaseServer() {
  const cookieStore = (await cookies()) as any;
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }: any) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

async function sendInvitationEmail(
  invitation: InvitationPayload,
  roleCode: string,
  origin: string,
) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.CRPE_INVITATION_FROM_EMAIL;
  if (!apiKey || !fromEmail) {
    throw new Error(
      "Wysyłka e-mail nie jest jeszcze skonfigurowana. Ustaw BREVO_API_KEY i CRPE_INVITATION_FROM_EMAIL.",
    );
  }

  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const siteUrl = configuredSiteUrl || origin;
  const invitationUrl = `${siteUrl}/placowka/zaproszenie?token=${encodeURIComponent(invitation.token)}`;
  const organizationName = escapeHtml(invitation.organization_name);
  const role = escapeHtml(roleLabel(roleCode));
  const expires = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(invitation.expires_at));

  const html = `
    <div style="margin:0;background:#f4f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#0f172a">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ee;border-radius:20px;padding:32px">
        <div style="font-size:13px;font-weight:800;color:#2563eb;letter-spacing:.08em;text-transform:uppercase">CRPE dla placówki</div>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">Zaproszenie do ${organizationName}</h1>
        <p style="margin:18px 0 0;font-size:16px;line-height:1.7;color:#475569">
          Administrator placówki zaprasza Cię do połączenia własnego konta CRPE z placówką.
          Zakres po przyjęciu: <strong>${role}</strong>.
        </p>
        <p style="margin:24px 0">
          <a href="${invitationUrl}" style="display:inline-block;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 20px">
            Otwórz zaproszenie
          </a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#64748b">
          Link jest ważny do ${escapeHtml(expires)} i działa wyłącznie po zalogowaniu
          na adres, na który wysłano tę wiadomość.
        </p>
        <div style="margin-top:22px;border-radius:12px;background:#eff6ff;padding:14px;font-size:13px;line-height:1.6;color:#334155">
          Przyjęcie zaproszenia nie udostępnia placówce automatycznie Twoich prywatnych aktywności ani certyfikatów.
        </div>
        <p style="margin-top:22px;font-size:12px;line-height:1.6;color:#94a3b8">
          Jeśli nie spodziewasz się tej wiadomości, możesz ją zignorować.
        </p>
      </div>
    </div>
  `;

  const text = [
    `Zaproszenie do ${invitation.organization_name}`,
    "",
    `Administrator placówki zaprasza Cię do połączenia konta CRPE z placówką.`,
    `Zakres po przyjęciu: ${roleLabel(roleCode)}.`,
    "",
    `Otwórz zaproszenie: ${invitationUrl}`,
    `Link jest ważny do ${expires}.`,
    "",
    "Przyjęcie zaproszenia nie udostępnia automatycznie prywatnych aktywności ani certyfikatów.",
  ].join("\n");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: "CRPE",
        email: fromEmail,
      },
      to: [{ email: invitation.email }],
      subject: `Zaproszenie do ${invitation.organization_name} w CRPE`,
      htmlContent: html,
      textContent: text,
      headers: {
        "Idempotency-Key": `crpe-inv-${invitation.id}-${invitation.token}`,
        "X-Crpe-Invitation-Id": invitation.id,
      },
      tags: ["organization_invitation"],
    }),
  });

  const responseBody = (await response.json().catch(() => ({}))) as {
    messageId?: string;
    message?: string;
    code?: string;
  };
  if (!response.ok || !responseBody.messageId) {
    throw new Error(
      responseBody.message ||
        responseBody.code ||
        `System pocztowy zwrócił błąd ${response.status}.`,
    );
  }

  return responseBody.messageId;
}

export async function POST(request: Request) {
  const supabase = await supabaseServer();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Zaloguj się ponownie." }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: "Nieprawidłowe dane zaproszenia." },
      { status: 400 },
    );
  }

  if (
    !process.env.BREVO_API_KEY ||
    !process.env.CRPE_INVITATION_FROM_EMAIL
  ) {
    return NextResponse.json(
      {
        error:
          "Wysyłka e-mail nie jest jeszcze skonfigurowana. Administrator CRPE musi ustawić dane nadawcy.",
      },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;

  if (body.action === "resend") {
    if (!body.invitationId) {
      return NextResponse.json(
        { error: "Nie wskazano zaproszenia." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.rpc(
      "prepare_organization_invitation_resend",
      { p_invitation_id: body.invitationId },
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const invitation = data as InvitationPayload;
    try {
      const providerMessageId = await sendInvitationEmail(
        invitation,
        invitation.role_code,
        origin,
      );
      const { error: recordError } = await supabase.rpc(
        "record_organization_invitation_send",
        {
          p_invitation_id: invitation.id,
          p_sent: true,
          p_provider_message_id: providerMessageId,
          p_error: null,
        },
      );
      if (recordError) throw new Error(recordError.message);
      return NextResponse.json({ sent: 1, failed: 0 });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nie udało się wysłać wiadomości.";
      await supabase.rpc("record_organization_invitation_send", {
        p_invitation_id: invitation.id,
        p_sent: false,
        p_provider_message_id: null,
        p_error: message,
      });
      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  if (!body.organizationId) {
    return NextResponse.json(
      { error: "Nie wskazano placówki." },
      { status: 400 },
    );
  }

  const emails = normalizeEmails(body.emails);
  if (!emails.length) {
    return NextResponse.json(
      { error: "Wpisz co najmniej jeden adres e-mail." },
      { status: 400 },
    );
  }
  const invalidEmails = emails.filter((email) => !isEmail(email));
  if (invalidEmails.length) {
    return NextResponse.json(
      {
        error: `Popraw nieprawidłowe adresy: ${invalidEmails.slice(0, 3).join(", ")}`,
      },
      { status: 400 },
    );
  }

  const results: Array<{ email: string; sent: boolean; error?: string }> = [];
  for (const email of emails) {
    const { data, error: createError } = await supabase.rpc(
      "create_organization_invitation",
      {
        p_organization_id: body.organizationId,
        p_email: email,
        p_role_code: body.roleCode || "member",
        p_unit_id: body.unitId || null,
      },
    );

    if (createError) {
      results.push({ email, sent: false, error: createError.message });
      continue;
    }

    const invitation = data as InvitationPayload;
    try {
      const providerMessageId = await sendInvitationEmail(
        invitation,
        body.roleCode || "member",
        origin,
      );
      const { error: recordError } = await supabase.rpc(
        "record_organization_invitation_send",
        {
          p_invitation_id: invitation.id,
          p_sent: true,
          p_provider_message_id: providerMessageId,
          p_error: null,
        },
      );
      if (recordError) throw new Error(recordError.message);
      results.push({ email, sent: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nie udało się wysłać wiadomości.";
      await supabase.rpc("record_organization_invitation_send", {
        p_invitation_id: invitation.id,
        p_sent: false,
        p_provider_message_id: null,
        p_error: message,
      });
      results.push({ email, sent: false, error: message });
    }
  }

  const sent = results.filter((result) => result.sent).length;
  const failed = results.length - sent;
  return NextResponse.json(
    { sent, failed, results },
    { status: sent ? 200 : 502 },
  );
}

export async function DELETE(request: Request) {
  const supabase = await supabaseServer();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "Zaloguj się ponownie." }, { status: 401 });
  }

  let body: { invitationId?: string };
  try {
    body = (await request.json()) as { invitationId?: string };
  } catch {
    body = {};
  }
  if (!body.invitationId) {
    return NextResponse.json(
      { error: "Nie wskazano zaproszenia." },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("cancel_organization_invitation", {
    p_invitation_id: body.invitationId,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ canceled: true });
}
