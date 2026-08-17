"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Building2,
  Check,
  ClipboardCheck,
  Copy,
  FileBarChart,
  History,
  LayoutDashboard,
  Mail,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import {
  ASSIGNABLE_ORGANIZATION_ROLES,
  ASSIGNABLE_UNIT_ROLES,
  INVITATION_ROLES,
  ORGANIZATION_PERMISSION_MATRIX,
  ORGANIZATION_ROLE_DESCRIPTIONS,
  roleLabel,
} from "@/lib/organization";
import { supabaseClient } from "@/lib/supabase/client";

type Unit = {
  id: string;
  name: string;
  unit_type: string;
  parent_unit_id: string | null;
  status: string;
  member_count: number;
};

type UnitRole = {
  id: string;
  unit_id: string;
  unit_name: string;
  role_code: string;
};

type Member = {
  membership_id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  status: string;
  joined_at?: string | null;
  profession?: string | null;
  organization_roles: string[];
  units: Array<{ id: string; name: string }>;
  unit_roles: UnitRole[];
};

type Invitation = {
  id: string;
  email: string;
  token: string;
  role_code: string;
  unit_id: string | null;
  unit_name: string | null;
  status: string;
  delivery_status: string;
  send_attempts: number;
  invited_at: string;
  expires_at: string;
  last_sent_at: string | null;
  last_send_error: string | null;
  opened_at: string | null;
  authenticated_at: string | null;
  accepted_at: string | null;
};

type AuditEvent = {
  id: number;
  event_code: string;
  target_type: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor_name: string;
};

type PanelData = {
  organization: {
    id: string;
    display_name: string;
    legal_name: string;
    status: string;
    slug: string;
  };
  current_membership_id: string;
  permissions: string[];
  current_roles: string[];
  summary: {
    active_members: number;
    units: number;
    shared_activities: number;
    pending_reviews: number;
    pending_invitations: number;
  };
  units: Unit[];
  members: Member[];
  invitations: Invitation[];
  audit_events: AuditEvent[];
};

type TabCode = "dashboard" | "team" | "units" | "access";

const tabs: Array<{
  code: TabCode;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { code: "dashboard", label: "Pulpit", icon: LayoutDashboard },
  { code: "team", label: "Zespół", icon: Users },
  { code: "units", label: "Struktura", icon: Building2 },
  { code: "access", label: "Role i dostęp", icon: ShieldCheck },
];

const unitTypeLabels: Record<string, string> = {
  facility: "Placówka",
  branch: "Filia",
  department: "Dział / jednostka",
  ward: "Oddział",
  team: "Zespół",
  other: "Inna",
};

const eventLabels: Record<string, string> = {
  "invitation.created": "Utworzono zaproszenie",
  "invitation.sent": "Wysłano zaproszenie",
  "invitation.send_failed": "Błąd wysyłki zaproszenia",
  "invitation.resent": "Ponowiono zaproszenie",
  "invitation.revoked": "Anulowano zaproszenie",
  "invitation.accepted": "Przyjęto zaproszenie",
  "unit.created": "Dodano jednostkę",
  "role.granted": "Nadano rolę",
  "role.revoked": "Odebrano rolę",
  "membership.status_changed": "Zmieniono status członkostwa",
};

function memberName(member: Member) {
  const fullName = `${member.first_name ?? ""} ${member.last_name ?? ""}`.trim();
  return fullName || "Użytkownik CRPE";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function permission(panel: PanelData | null, code: string) {
  return Boolean(panel?.permissions.includes(code));
}

function invitationWord(count: number) {
  if (count === 1) return "zaproszenie";
  const lastTwo = count % 100;
  const last = count % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return "zaproszenia";
  }
  return "zaproszeń";
}

export default function OrganizationPanelClient({
  organizationId,
  showJoinedNotice = false,
}: {
  organizationId: string;
  showJoinedNotice?: boolean;
}) {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => supabaseClient(), []);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [activeTab, setActiveTab] = useState<TabCode>("dashboard");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [joinedNotice, setJoinedNotice] = useState(showJoinedNotice);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteScope, setInviteScope] = useState("organization");

  const [unitName, setUnitName] = useState("");
  const [unitType, setUnitType] = useState("department");
  const [parentUnitId, setParentUnitId] = useState("");

  const [roleMemberId, setRoleMemberId] = useState("");
  const [roleCode, setRoleCode] = useState("coordinator");
  const [roleScope, setRoleScope] = useState("organization");

  const loadPanel = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    const [
      { data, error: loadError },
      { data: invitations, error: invitationsError },
    ] = await Promise.all([
      supabase.rpc("get_organization_panel", {
        p_organization_id: organizationId,
      }),
      supabase.rpc("get_organization_invitations", {
        p_organization_id: organizationId,
      }),
    ]);

    if (loadError) {
      setPanel(null);
      setError(loadError.message);
    } else {
      const nextPanel = data as unknown as PanelData;
      setPanel({
        ...nextPanel,
        invitations: invitationsError
          ? nextPanel.invitations
          : ((invitations ?? []) as unknown as Invitation[]),
      });
      if (invitationsError) setError(invitationsError.message);
    }
    setLoading(false);
  }, [organizationId, supabase, user]);

  useEffect(() => {
    loadPanel();
  }, [loadPanel]);

  useEffect(() => {
    if (!panel?.members.length || roleMemberId) return;
    const candidate =
      panel.members.find(
        (member) => member.membership_id !== panel.current_membership_id,
      ) ?? panel.members[0];
    setRoleMemberId(candidate.membership_id);
  }, [panel, roleMemberId]);

  async function runAction(
    action: () => PromiseLike<{ error: { message: string } | null }>,
    successMessage: string,
  ) {
    setWorking(true);
    setMessage("");
    setError("");
    const result = await action();
    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(successMessage);
      await loadPanel();
    }
    setWorking(false);
  }

  async function invitationRequest(
    method: "POST" | "DELETE",
    body: Record<string, unknown>,
  ) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    }

    return fetch("/api/organizations/invitations", {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async function createInvitation(event: FormEvent) {
    event.preventDefault();
    const unitId = inviteScope === "organization" ? null : inviteScope;
    const emails = Array.from(
      new Set(
        inviteEmail
          .split(/[\s,;]+/)
          .map((email) => email.trim().toLocaleLowerCase("pl-PL"))
          .filter(Boolean),
      ),
    );

    setWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await invitationRequest("POST", {
        action: "create",
        organizationId,
        emails,
        roleCode: inviteRole,
        unitId,
      });
      const result = (await response.json()) as {
        sent?: number;
        failed?: number;
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "Nie udało się wysłać zaproszeń.");

      setInviteEmail("");
      setMessage(
        result.failed
          ? `Wysłano: ${result.sent ?? 0}. Błędy: ${result.failed}. Szczegóły są w rejestrze zaproszeń.`
          : `Wysłano ${result.sent ?? emails.length} ${invitationWord(
              result.sent ?? emails.length,
            )}.`,
      );
      await loadPanel();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Nie udało się wysłać zaproszeń.",
      );
    }
    setWorking(false);
  }

  async function resendInvitation(invitation: Invitation) {
    setWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await invitationRequest("POST", {
        action: "resend",
        invitationId: invitation.id,
        roleCode: invitation.role_code,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Nie udało się ponowić zaproszenia.");
      setMessage(`Ponownie wysłano zaproszenie do ${invitation.email}.`);
      await loadPanel();
    } catch (resendError) {
      setError(
        resendError instanceof Error
          ? resendError.message
          : "Nie udało się ponowić zaproszenia.",
      );
    }
    setWorking(false);
  }

  async function cancelInvitation(invitation: Invitation) {
    setWorking(true);
    setMessage("");
    setError("");
    try {
      const response = await invitationRequest("DELETE", {
        invitationId: invitation.id,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Nie udało się anulować zaproszenia.");
      setMessage(`Anulowano zaproszenie do ${invitation.email}.`);
      await loadPanel();
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : "Nie udało się anulować zaproszenia.",
      );
    }
    setWorking(false);
  }

  async function createUnit(event: FormEvent) {
    event.preventDefault();
    await runAction(
      () =>
        supabase.rpc("create_organization_unit", {
          p_organization_id: organizationId,
          p_name: unitName,
          p_unit_type: unitType,
          p_parent_unit_id: parentUnitId || null,
        }),
      "Jednostka została dodana.",
    );
    setUnitName("");
    setParentUnitId("");
  }

  async function assignRole(event: FormEvent) {
    event.preventDefault();
    const unitId = roleScope === "organization" ? null : roleScope;
    await runAction(
      () =>
        supabase.rpc("set_organization_role", {
          p_membership_id: roleMemberId,
          p_role_code: roleCode,
          p_unit_id: unitId,
          p_enabled: true,
        }),
      "Rola została nadana.",
    );
  }

  async function removeRole(
    membershipId: string,
    selectedRole: string,
    unitId: string | null,
  ) {
    await runAction(
      () =>
        supabase.rpc("set_organization_role", {
          p_membership_id: membershipId,
          p_role_code: selectedRole,
          p_unit_id: unitId,
          p_enabled: false,
        }),
      "Rola została odebrana.",
    );
  }

  async function toggleMembership(member: Member) {
    const nextStatus = member.status === "active" ? "suspended" : "active";
    await runAction(
      () =>
        supabase.rpc("set_organization_membership_status", {
          p_membership_id: member.membership_id,
          p_status: nextStatus,
        }),
      nextStatus === "active"
        ? "Dostęp pracownika został przywrócony."
        : "Dostęp pracownika został wstrzymany.",
    );
  }

  async function copyLink(link: string) {
    const absoluteLink = link.startsWith("/")
      ? `${window.location.origin}${link}`
      : link;
    await navigator.clipboard.writeText(absoluteLink);
    setMessage("Link zaproszenia został skopiowany.");
  }

  if (authLoading || loading) {
    return (
      <main className="mx-auto max-w-[1200px] px-4 py-8">
        <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-7">
          <h1 className="text-2xl font-black">Panel placówki</h1>
          <p className="mt-2 text-sm text-slate-600">
            Zaloguj się własnym kontem CRPE, aby sprawdzić dostęp.
          </p>
          <Link
            href={`/login?next=/placowka/${organizationId}`}
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold text-white"
          >
            Zaloguj się
          </Link>
        </div>
      </main>
    );
  }

  if (!panel) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-7">
          <h1 className="text-2xl font-black text-slate-950">Brak dostępu</h1>
          <p className="mt-2 text-sm leading-6 text-red-700">
            {error || "Nie masz aktywnego członkostwa w tej placówce."}
          </p>
          <Link
            href="/placowka"
            className="mt-5 inline-flex rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"
          >
            Wróć do listy placówek
          </Link>
        </div>
      </main>
    );
  }

  const canManageInvites = permission(panel, "invitations.manage");
  const canManageUnits = permission(panel, "units.manage");
  const canManageRoles = permission(panel, "roles.manage");
  const canManageMembers = permission(panel, "members.manage");
  const isOwner = panel.current_roles.includes("owner");

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6 lg:px-8">
      {joinedNotice ? (
        <div
          className="mb-4 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 shadow-sm"
          role="status"
        >
          <span className="flex items-start gap-3">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <span>
              <span className="block font-bold">
                Dołączyłeś do placówki „{panel.organization.display_name}”
              </span>
              <span className="mt-1 block text-sm leading-5 text-emerald-800">
                Dostęp jest aktywny. Panel placówki znajdziesz od teraz także
                w stałym przełączniku w górnym menu.
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => setJoinedNotice(false)}
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Zamknij komunikat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-100">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase tracking-[0.16em] text-blue-600">
                Panel placówki
              </div>
              <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                {panel.organization.display_name}
              </h1>
              <div className="mt-2 flex flex-wrap gap-2">
                {panel.current_roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                  >
                    {roleLabel(role)}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/panel-cpd"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Moje CRPE
            </Link>
            <Link
              href="/profil#placowki-i-role"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Placówki i role
            </Link>
          </div>
        </div>
      </div>

      <nav
        className="mt-4 flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
        aria-label="Nawigacja panelu placówki"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.code;
          return (
            <button
              key={tab.code}
              type="button"
              onClick={() => setActiveTab(tab.code)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {message ? (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" /> {message}
          </span>
          <button type="button" onClick={() => setMessage("")} aria-label="Zamknij">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Zamknij">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {activeTab === "dashboard" ? (
        <DashboardTab panel={panel} />
      ) : null}

      {activeTab === "team" ? (
        <section className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-950">Zespół</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Widoczne są wyłącznie osoby należące do tej placówki.
                </p>
              </div>
              <button
                type="button"
                onClick={loadPanel}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
                aria-label="Odśwież"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5 space-y-3">
              {panel.members.map((member) => (
                <article
                  key={member.membership_id}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-slate-950">
                        {memberName(member)}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {member.profession ?? "Zawód nieuzupełniony"} ·{" "}
                        {member.status === "active" ? "aktywny dostęp" : "dostęp wstrzymany"}
                      </p>
                    </div>
                    {canManageMembers &&
                    member.membership_id !== panel.current_membership_id ? (
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => toggleMembership(member)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {member.status === "active"
                          ? "Wstrzymaj dostęp"
                          : "Przywróć dostęp"}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.organization_roles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
                      >
                        {roleLabel(role)}
                        {role !== "member" &&
                        role !== "owner" &&
                        (canManageRoles || (isOwner && role === "admin")) ? (
                          <button
                            type="button"
                            onClick={() =>
                              removeRole(member.membership_id, role, null)
                            }
                            aria-label={`Odbierz rolę ${roleLabel(role)}`}
                            className="rounded-full hover:bg-blue-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        ) : null}
                      </span>
                    ))}
                    {member.unit_roles.map((unitRole) => (
                      <span
                        key={unitRole.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700"
                      >
                        {roleLabel(unitRole.role_code)} · {unitRole.unit_name}
                        {canManageRoles ? (
                          <button
                            type="button"
                            onClick={() =>
                              removeRole(
                                member.membership_id,
                                unitRole.role_code,
                                unitRole.unit_id,
                              )
                            }
                            aria-label={`Odbierz rolę ${roleLabel(unitRole.role_code)}`}
                            className="rounded-full hover:bg-violet-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            </div>

            <div className="space-y-5">
              {canManageInvites ? (
                <InviteForm
                  units={panel.units}
                  inviteEmail={inviteEmail}
                  setInviteEmail={setInviteEmail}
                  inviteRole={inviteRole}
                  setInviteRole={setInviteRole}
                  inviteScope={inviteScope}
                  setInviteScope={setInviteScope}
                  onSubmit={createInvitation}
                  working={working}
                />
              ) : (
                <InfoCard
                  title="Zaproszenia"
                  text="Zaproszenia może tworzyć właściciel lub administrator placówki."
                />
              )}
            </div>
          </div>

          {permission(panel, "invitations.view") ? (
            <InvitationRegistry
              invitations={panel.invitations}
              canManage={canManageInvites}
              working={working}
              onResend={resendInvitation}
              onCancel={cancelInvitation}
              onCopy={copyLink}
            />
          ) : null}
        </section>
      ) : null}

      {activeTab === "units" ? (
        <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-black text-slate-950">Struktura placówki</h2>
            <p className="mt-1 text-sm text-slate-600">
              Role jednostkowe obowiązują tylko w przypisanym oddziale lub zespole.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {panel.units.map((unit) => (
                <article
                  key={unit.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-extrabold text-slate-950">{unit.name}</h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {unitTypeLabels[unit.unit_type] ?? unit.unit_type}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                      {unit.member_count} os.
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {canManageUnits ? (
            <form
              onSubmit={createUnit}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-black text-slate-950">Dodaj jednostkę</h2>
              </div>
              <label className="mt-5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Nazwa
                <input
                  value={unitName}
                  onChange={(event) => setUnitName(event.target.value)}
                  required
                  maxLength={160}
                  placeholder="np. Oddział kardiologii"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-blue-500"
                />
              </label>
              <label className="mt-4 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Typ
                <select
                  value={unitType}
                  onChange={(event) => setUnitType(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900"
                >
                  {Object.entries(unitTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mt-4 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Jednostka nadrzędna
                <select
                  value={parentUnitId}
                  onChange={(event) => setParentUnitId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900"
                >
                  <option value="">Brak</option>
                  {panel.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={working}
                className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Dodaj jednostkę
              </button>
            </form>
          ) : (
            <InfoCard
              title="Zarządzanie strukturą"
              text="Strukturę może zmieniać właściciel lub administrator."
            />
          )}
        </section>
      ) : null}

      {activeTab === "access" ? (
        <section className="mt-5 space-y-5">
          <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <PermissionMatrix />
            {canManageRoles ? (
              <form
                onSubmit={assignRole}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-black text-slate-950">Nadaj rolę</h2>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Administrator może nadawać role operacyjne. Tylko właściciel
                  może nadać rolę administratora.
                </p>
                <label className="mt-5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Osoba
                  <select
                    value={roleMemberId}
                    onChange={(event) => setRoleMemberId(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900"
                  >
                    {panel.members.map((member) => (
                      <option key={member.membership_id} value={member.membership_id}>
                        {memberName(member)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Zakres
                  <select
                    value={roleScope}
                    onChange={(event) => {
                      const value = event.target.value;
                      setRoleScope(value);
                      if (
                        value !== "organization" &&
                        !ASSIGNABLE_UNIT_ROLES.includes(
                          roleCode as (typeof ASSIGNABLE_UNIT_ROLES)[number],
                        )
                      ) {
                        setRoleCode("coordinator");
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900"
                  >
                    <option value="organization">Cała placówka</option>
                    {panel.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        Jednostka: {unit.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Rola
                  <select
                    value={roleCode}
                    onChange={(event) => setRoleCode(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900"
                  >
                    {(roleScope === "organization"
                      ? ASSIGNABLE_ORGANIZATION_ROLES
                      : ASSIGNABLE_UNIT_ROLES
                    )
                      .filter((role) => role !== "admin" || isOwner)
                      .map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  {ORGANIZATION_ROLE_DESCRIPTIONS[roleCode]}
                </div>
                <button
                  type="submit"
                  disabled={working || !roleMemberId}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Nadaj rolę
                </button>
              </form>
            ) : (
              <InfoCard
                title="Nadawanie ról"
                text="Role może nadawać właściciel lub administrator. Właściciel pozostaje jedyną osobą zarządzającą administratorami."
              />
            )}
          </div>

          {permission(panel, "audit.view") ? (
            <AuditLog events={panel.audit_events} />
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function DashboardTab({ panel }: { panel: PanelData }) {
  const cards = [
    {
      label: "Aktywni członkowie",
      value: panel.summary.active_members,
      icon: Users,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Jednostki",
      value: panel.summary.units,
      icon: Building2,
      color: "bg-violet-50 text-violet-700",
    },
    {
      label: "Udostępnione aktywności",
      value: panel.summary.shared_activities,
      icon: Activity,
      color: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Oczekujące weryfikacje",
      value: panel.summary.pending_reviews,
      icon: ClipboardCheck,
      color: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <section className="mt-5 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              key={card.label}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${card.color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-3xl font-black text-slate-950">
                {card.value}
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-600">
                {card.label}
              </div>
            </article>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Weryfikacje
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Placówka widzi tylko aktywności dobrowolnie udostępnione przez
                pracowników. V5 pokazuje kolejkę; pełna karta decyzji będzie
                rozwinięta w następnym kroku pilotażu.
              </p>
            </div>
          </div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <FileBarChart className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-950">Raporty</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Wyniki opisujemy jako kompletność danych w CRPE, nie jako
                formalne potwierdzenie spełnienia obowiązku zawodowego.
              </p>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function InviteForm({
  units,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  inviteScope,
  setInviteScope,
  onSubmit,
  working,
}: {
  units: Unit[];
  inviteEmail: string;
  setInviteEmail: (value: string) => void;
  inviteRole: string;
  setInviteRole: (value: string) => void;
  inviteScope: string;
  setInviteScope: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  working: boolean;
}) {
  const availableRoles =
    inviteScope === "organization" ? INVITATION_ROLES : ASSIGNABLE_UNIT_ROLES;
  const emailCount = new Set(
    inviteEmail
      .split(/[\s,;]+/)
      .map((email) => email.trim().toLocaleLowerCase("pl-PL"))
      .filter(Boolean),
  ).size;

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-black text-slate-950">
          Wyślij zaproszenia
        </h2>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Wpisz jeden adres albo wklej listę z Excela lub wiadomości.
      </p>
      <label className="mt-5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
        Adresy e-mail
        <textarea
          value={inviteEmail}
          onChange={(event) => setInviteEmail(event.target.value)}
          required
          rows={4}
          placeholder={"anna@placowka.pl\njan@placowka.pl"}
          className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900 outline-none focus:border-blue-500"
        />
      </label>
      <p className="mt-1.5 text-[11px] leading-5 text-slate-500">
        Rozdziel adresy przecinkami, średnikami, spacjami lub nowymi wierszami.
        Powtórzenia zostaną usunięte.
      </p>
      <label className="mt-4 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
        Jednostka i zakres
        <select
          value={inviteScope}
          onChange={(event) => {
            const value = event.target.value;
            setInviteScope(value);
            if (
              value !== "organization" &&
              !ASSIGNABLE_UNIT_ROLES.includes(
                inviteRole as (typeof ASSIGNABLE_UNIT_ROLES)[number],
              )
            ) {
              setInviteRole("coordinator");
            }
          }}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900"
        >
          <option value="organization">Cała placówka</option>
          {units.map((unit) => (
            <option key={unit.id} value={unit.id}>
              Jednostka: {unit.name}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-4 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
        Rola po przyjęciu
        <select
          value={inviteRole}
          onChange={(event) => setInviteRole(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-900"
        >
          {availableRoles.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={working || emailCount === 0}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-extrabold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <UserPlus className="h-4 w-4" />
        {working
          ? "Wysyłanie…"
          : `Wyślij ${emailCount} ${invitationWord(emailCount)}`}
      </button>
      <p className="mt-3 text-[11px] leading-5 text-slate-500">
        Zaproszenie jest ważne 14 dni. Samo przyjęcie nie udostępnia
        automatycznie prywatnych aktywności ani certyfikatów.
      </p>
    </form>
  );
}

function invitationStatus(invitation: Invitation) {
  if (invitation.status === "accepted") {
    return {
      label: "Powiązana z placówką",
      className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    };
  }
  if (invitation.status === "revoked") {
    return {
      label: "Anulowane",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
    };
  }
  if (
    invitation.status === "expired" ||
    new Date(invitation.expires_at).getTime() <= Date.now()
  ) {
    return {
      label: "Wygasło",
      className: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }
  if (invitation.authenticated_at) {
    return {
      label: "Zalogowano się",
      className: "bg-violet-50 text-violet-700 ring-violet-200",
    };
  }
  if (invitation.opened_at) {
    return {
      label: "Link otwarty",
      className: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    };
  }
  if (invitation.delivery_status === "failed") {
    return {
      label: "Błąd wysyłki",
      className: "bg-red-50 text-red-700 ring-red-200",
    };
  }
  if (invitation.delivery_status === "sent") {
    return {
      label: "Wysłane",
      className: "bg-blue-50 text-blue-700 ring-blue-200",
    };
  }
  return {
    label: "Przygotowane",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
  };
}

function InvitationRegistry({
  invitations,
  canManage,
  working,
  onResend,
  onCancel,
  onCopy,
}: {
  invitations: Invitation[];
  canManage: boolean;
  working: boolean;
  onResend: (invitation: Invitation) => void;
  onCancel: (invitation: Invitation) => void;
  onCopy: (link: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div>
          <h2 className="text-xl font-black text-slate-950">
            Rejestr zaproszeń
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Tutaj sprawdzisz wysyłkę, wejście w link, logowanie i powiązanie
            konta z placówką.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
          {invitations.length} {invitationWord(invitations.length)}
        </span>
      </div>

      {invitations.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-y border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-extrabold">Adres e-mail</th>
                <th className="px-4 py-3 font-extrabold">Jednostka i rola</th>
                <th className="px-4 py-3 font-extrabold">Wysłano</th>
                <th className="px-4 py-3 font-extrabold">Status</th>
                <th className="px-4 py-3 font-extrabold">Ważność</th>
                <th className="px-4 py-3 text-right font-extrabold">Operacje</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invitation) => {
                const badge = invitationStatus(invitation);
                const pending =
                  invitation.status === "pending" &&
                  new Date(invitation.expires_at).getTime() > Date.now();
                const canResend =
                  invitation.status !== "accepted" &&
                  invitation.status !== "revoked";
                const link = `/placowka/zaproszenie?token=${invitation.token}`;
                return (
                  <tr key={invitation.id} className="border-b border-slate-100">
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800">
                        {invitation.email}
                      </div>
                      {invitation.last_send_error ? (
                        <div
                          className="mt-1 max-w-[260px] truncate text-[11px] text-red-600"
                          title={invitation.last_send_error}
                        >
                          {invitation.last_send_error}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>{invitation.unit_name || "Cała placówka"}</div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {roleLabel(invitation.role_code)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>{formatDate(invitation.last_sent_at || invitation.invited_at)}</div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {invitation.send_attempts
                          ? `Próby: ${invitation.send_attempts}`
                          : "Nie wysłano"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 font-bold ring-1 ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {invitation.status === "accepted"
                        ? formatDate(invitation.accepted_at)
                        : formatDate(invitation.expires_at)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-3">
                        {canManage && canResend ? (
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => onResend(invitation)}
                            className="font-extrabold text-blue-700 hover:text-blue-800 disabled:opacity-50"
                          >
                            Ponów
                          </button>
                        ) : null}
                        {pending ? (
                          <button
                            type="button"
                            onClick={() => onCopy(link)}
                            className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900"
                            title="Awaryjnie skopiuj bezpieczny link"
                          >
                            <Copy className="h-3.5 w-3.5" /> Link
                          </button>
                        ) : null}
                        {canManage && pending ? (
                          <button
                            type="button"
                            disabled={working}
                            onClick={() => onCancel(invitation)}
                            className="font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            Anuluj
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-t border-slate-100 px-5 py-8 text-center text-sm text-slate-500">
          Nie wysłano jeszcze żadnego zaproszenia.
        </div>
      )}
    </div>
  );
}

function PermissionMatrix() {
  const roles = ["owner", "admin", "coordinator", "reviewer", "report_viewer", "member"];
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <h2 className="text-xl font-black text-slate-950">Macierz uprawnień</h2>
        <p className="mt-1 text-sm text-slate-600">
          Uprawnienia wynikają z roli. Nie nadajemy pojedynczych wyjątków
          użytkownikom, dzięki czemu dostęp pozostaje czytelny i audytowalny.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[820px] w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-slate-600">
              <th className="px-4 py-3 font-extrabold">Operacja</th>
              {roles.map((role) => (
                <th key={role} className="px-3 py-3 text-center font-extrabold">
                  {roleLabel(role)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ORGANIZATION_PERMISSION_MATRIX.map((row) => (
              <tr key={row.permission} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold text-slate-700">
                  {row.permission}
                </td>
                {roles.map((role) => {
                  const allowed = Boolean(
                    row[role as keyof typeof row] === true,
                  );
                  return (
                    <td key={role} className="px-3 py-3 text-center">
                      {allowed ? (
                        <Check className="mx-auto h-4 w-4 text-emerald-600" />
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLog({ events }: { events: AuditEvent[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-black text-slate-950">Ostatnie zmiany dostępu</h2>
      </div>
      <div className="mt-4 divide-y divide-slate-100">
        {events.length ? (
          events.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
            >
              <div>
                <span className="font-bold text-slate-800">
                  {eventLabels[event.event_code] ?? event.event_code}
                </span>
                <span className="ml-2 text-slate-500">
                  {event.actor_name || "System"}
                </span>
              </div>
              <time className="text-xs text-slate-500">
                {formatDate(event.created_at)}
              </time>
            </div>
          ))
        ) : (
          <p className="py-4 text-sm text-slate-500">Brak zarejestrowanych zmian.</p>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <ShieldCheck className="h-5 w-5 text-slate-500" />
      <h2 className="mt-3 text-lg font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}
