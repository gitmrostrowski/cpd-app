export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Schemat po migracji CRPE do Frankfurtu.
 *
 * Dane są znormalizowane: aktywność, punkty i dokumenty znajdują się w
 * oddzielnych tabelach. Konkretne typy domenowe aplikacji są utrzymywane w
 * lib/data/crpe.ts; ten plik pozostawia wiersze elastyczne, aby wdrożenie nie
 * blokowało się po dodaniu kolejnej bezpiecznej kolumny w Supabase.
 */
type LooseTable = {
  Row: Record<string, any>;
  Insert: Record<string, any>;
  Update: Record<string, any>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      activity_documents: LooseTable;
      activity_point_entries: LooseTable;
      activity_types: LooseTable;
      cpd_cycles: LooseTable;
      cpd_rule_requirements: LooseTable;
      cpd_rule_sets: LooseTable;
      cpd_rule_sources: LooseTable;
      educational_activities: LooseTable;
      medical_professionals: LooseTable;
      organization_audit_events: LooseTable;
      organization_invitations: LooseTable;
      organization_memberships: LooseTable;
      organization_membership_roles: LooseTable;
      organization_role_permissions: LooseTable;
      organization_unit_role_assignments: LooseTable;
      organization_units: LooseTable;
      organizations: LooseTable;
      platform_staff_roles: LooseTable;
      professional_identifiers: LooseTable;
      professions: LooseTable;
      profiles: LooseTable;
      trainings: LooseTable;
    };
    Views: Record<string, never>;
    Functions: {
      has_organization_role: {
        Args: {
          target_organization_id: string;
          accepted_roles: string[];
        };
        Returns: boolean;
      };
      has_organization_permission: {
        Args: {
          target_organization_id: string;
          accepted_permission: string;
          target_unit_id?: string | null;
        };
        Returns: boolean;
      };
      get_my_organization_contexts: {
        Args: Record<string, never>;
        Returns: Array<{
          organization_id: string;
          membership_id: string;
          display_name: string;
          organization_status: string;
          primary_role: string;
          role_codes: string[];
        }>;
      };
      get_organization_panel: {
        Args: { p_organization_id: string };
        Returns: Json;
      };
      create_organization_invitation: {
        Args: {
          p_organization_id: string;
          p_email: string;
          p_role_code?: string;
          p_unit_id?: string | null;
        };
        Returns: Json;
      };
      accept_organization_invitation: {
        Args: {
          p_token: string;
          p_accept_different_email?: boolean;
        };
        Returns: Json;
      };
      get_organization_invitation_landing: {
        Args: { p_token: string };
        Returns: Json;
      };
      get_organization_invitations: {
        Args: { p_organization_id: string };
        Returns: Array<{
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
        }>;
      };
      record_organization_invitation_send: {
        Args: {
          p_invitation_id: string;
          p_sent: boolean;
          p_provider_message_id?: string | null;
          p_error?: string | null;
        };
        Returns: undefined;
      };
      prepare_organization_invitation_resend: {
        Args: { p_invitation_id: string };
        Returns: Json;
      };
      cancel_organization_invitation: {
        Args: { p_invitation_id: string };
        Returns: undefined;
      };
      mark_organization_invitation_opened: {
        Args: { p_token: string };
        Returns: undefined;
      };
      mark_organization_invitation_authenticated: {
        Args: { p_token: string };
        Returns: undefined;
      };
      create_organization_unit: {
        Args: {
          p_organization_id: string;
          p_name: string;
          p_unit_type?: string;
          p_parent_unit_id?: string | null;
        };
        Returns: string;
      };
      set_organization_role: {
        Args: {
          p_membership_id: string;
          p_role_code: string;
          p_unit_id?: string | null;
          p_enabled?: boolean;
        };
        Returns: undefined;
      };
      set_organization_membership_status: {
        Args: {
          p_membership_id: string;
          p_status: string;
        };
        Returns: undefined;
      };
      is_platform_staff: {
        Args: { accepted_roles: string[] };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
