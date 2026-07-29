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
      organization_memberships: LooseTable;
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
      is_platform_staff: {
        Args: { accepted_roles: string[] };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
