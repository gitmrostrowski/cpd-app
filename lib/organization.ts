export const ORGANIZATION_ROLE_LABELS: Record<string, string> = {
  owner: "Właściciel",
  admin: "Administrator",
  coordinator: "Koordynator",
  reviewer: "Weryfikator",
  report_viewer: "Odbiorca raportów",
  training_manager: "Menedżer szkoleń",
  member: "Pracownik",
};

export const ORGANIZATION_ROLE_DESCRIPTIONS: Record<string, string> = {
  owner: "Pełna kontrola nad placówką, administratorami i właścicielami.",
  admin: "Zespół, jednostki, zaproszenia, role operacyjne i ustawienia.",
  coordinator: "Widok zespołu, kompletności danych i raportów bez zmiany dostępu.",
  reviewer: "Weryfikacja aktywności i dokumentów udostępnionych placówce.",
  report_viewer: "Odczyt zestawień bez dostępu do zarządzania personelem.",
  training_manager: "Obsługa modułu organizatora szkoleń, gdy zostanie uruchomiony.",
  member: "Własne konto i kontrola nad udostępnianiem danych placówce.",
};

export const ASSIGNABLE_ORGANIZATION_ROLES = [
  "admin",
  "coordinator",
  "reviewer",
  "report_viewer",
] as const;

export const ASSIGNABLE_UNIT_ROLES = [
  "coordinator",
  "reviewer",
  "report_viewer",
] as const;

export const INVITATION_ROLES = [
  "member",
  "coordinator",
  "reviewer",
  "report_viewer",
  "admin",
] as const;

export const ORGANIZATION_PERMISSION_MATRIX = [
  {
    permission: "Cała placówka i ustawienia",
    owner: true,
    admin: true,
    coordinator: false,
    reviewer: false,
    report_viewer: false,
    member: false,
  },
  {
    permission: "Zespół i jednostki — odczyt",
    owner: true,
    admin: true,
    coordinator: true,
    reviewer: true,
    report_viewer: false,
    member: false,
  },
  {
    permission: "Zaproszenia i członkostwa",
    owner: true,
    admin: true,
    coordinator: false,
    reviewer: false,
    report_viewer: false,
    member: false,
  },
  {
    permission: "Nadawanie ról operacyjnych",
    owner: true,
    admin: true,
    coordinator: false,
    reviewer: false,
    report_viewer: false,
    member: false,
  },
  {
    permission: "Nadawanie administratora / właściciela",
    owner: true,
    admin: false,
    coordinator: false,
    reviewer: false,
    report_viewer: false,
    member: false,
  },
  {
    permission: "Weryfikacja udostępnionych wpisów",
    owner: true,
    admin: true,
    coordinator: false,
    reviewer: true,
    report_viewer: false,
    member: false,
  },
  {
    permission: "Raporty",
    owner: true,
    admin: true,
    coordinator: true,
    reviewer: false,
    report_viewer: true,
    member: false,
  },
] as const;

export function roleLabel(roleCode: string) {
  return ORGANIZATION_ROLE_LABELS[roleCode] ?? roleCode;
}

export function primaryRoleLabel(roleCodes: string[]) {
  const priority = [
    "owner",
    "admin",
    "coordinator",
    "reviewer",
    "report_viewer",
    "training_manager",
    "member",
  ];
  const role = priority.find((item) => roleCodes.includes(item)) ?? "member";
  return roleLabel(role);
}
