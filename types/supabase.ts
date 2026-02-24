export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          certificate_mime: string | null
          certificate_name: string | null
          certificate_path: string | null
          certificate_size: number | null
          certificate_uploaded_at: string | null
          created_at: string
          id: string
          organizer: string | null
          planned_start_date: string | null
          points: number
          status: string
          training_id: string | null
          type: string
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          certificate_mime?: string | null
          certificate_name?: string | null
          certificate_path?: string | null
          certificate_size?: number | null
          certificate_uploaded_at?: string | null
          created_at?: string
          id?: string
          organizer?: string | null
          planned_start_date?: string | null
          points?: number
          status?: string
          training_id?: string | null
          type: string
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          certificate_mime?: string | null
          certificate_name?: string | null
          certificate_path?: string | null
          certificate_size?: number | null
          certificate_uploaded_at?: string | null
          created_at?: string
          id?: string
          organizer?: string | null
          planned_start_date?: string | null
          points?: number
          status?: string
          training_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "activities_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_documents: {
        Row: {
          activity_id: string
          id: string
          kind: string
          mime: string | null
          name: string | null
          path: string
          size: number | null
          uploaded_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          id?: string
          kind: string
          mime?: string | null
          name?: string | null
          path: string
          size?: number | null
          uploaded_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          id?: string
          kind?: string
          mime?: string | null
          name?: string | null
          path?: string
          size?: number | null
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_documents_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          period_end: number
          period_start: number
          profession: string
          profession_other: string | null
          pwz_issue_date: string | null
          pwz_number: string | null
          required_points: number
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          period_end?: number
          period_start?: number
          profession?: string
          profession_other?: string | null
          pwz_issue_date?: string | null
          pwz_number?: string | null
          required_points?: number
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          period_end?: number
          period_start?: number
          profession?: string
          profession_other?: string | null
          pwz_issue_date?: string | null
          pwz_number?: string | null
          required_points?: number
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          approval_status: string
          approved_at: string | null
          approved_by: string | null
          capacity: number | null
          category: string | null
          created_at: string
          description: string | null
          end_date: string | null
          enrollment_status: string | null
          external_url: string | null
          format: string | null
          has_recording: boolean | null
          id: string
          is_partner: boolean
          organizer: string | null
          points: number | null
          price_pln: number | null
          profession: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string | null
          status: string
          submitted_by: string | null
          title: string
          topics: string[] | null
          type: string | null
          updated_at: string
          url: string | null
          voivodeship: string | null
        }
        Insert: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          capacity?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          enrollment_status?: string | null
          external_url?: string | null
          format?: string | null
          has_recording?: boolean | null
          id?: string
          is_partner?: boolean
          organizer?: string | null
          points?: number | null
          price_pln?: number | null
          profession?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          submitted_by?: string | null
          title: string
          topics?: string[] | null
          type?: string | null
          updated_at?: string
          url?: string | null
          voivodeship?: string | null
        }
        Update: {
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
          capacity?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          enrollment_status?: string | null
          external_url?: string | null
          format?: string | null
          has_recording?: boolean | null
          id?: string
          is_partner?: boolean
          organizer?: string | null
          points?: number | null
          price_pln?: number | null
          profession?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string | null
          status?: string
          submitted_by?: string | null
          title?: string
          topics?: string[] | null
          type?: string | null
          updated_at?: string
          url?: string | null
          voivodeship?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
