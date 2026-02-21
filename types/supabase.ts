// types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      // ✅ TABELA: activities
      activities: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          points: number; // numeric w Supabase typuje się często jako number
          year: number;
          organizer: string | null;

          // NEW: planowanie / realizacja
          status: "planned" | "done" | null;
          planned_start_date: string | null; // date -> string (YYYY-MM-DD)
          training_id: string | null; // uuid -> string

          certificate_path: string | null;
          certificate_name: string | null;
          certificate_mime: string | null;
          certificate_size: number | null; // bigint -> number
          certificate_uploaded_at: string | null;

          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          points?: number;
          year: number;
          organizer?: string | null;

          // NEW
          status?: "planned" | "done" | null;
          planned_start_date?: string | null;
          training_id?: string | null;

          certificate_path?: string | null;
          certificate_name?: string | null;
          certificate_mime?: string | null;
          certificate_size?: number | null;
          certificate_uploaded_at?: string | null;

          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          points?: number;
          year?: number;
          organizer?: string | null;

          // NEW
          status?: "planned" | "done" | null;
          planned_start_date?: string | null;
          training_id?: string | null;

          certificate_path?: string | null;
          certificate_name?: string | null;
          certificate_mime?: string | null;
          certificate_size?: number | null;
          certificate_uploaded_at?: string | null;

          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          // Jeśli NIE masz FK w DB: activities.training_id -> trainings.id
          // usuń poniższy blok, żeby typy były zgodne ze schematem.
          {
            foreignKeyName: "activities_training_id_fkey";
            columns: ["training_id"];
            isOneToOne: false;
            referencedRelation: "trainings";
            referencedColumns: ["id"];
          }
        ];
      };

      // ✅ TABELA: trainings
      trainings: {
        Row: {
          id: string;
          title: string;
          organizer: string | null;
          points: number | null;
          type: string | null; // 'online' | 'stacjonarne' | 'hybrydowe'
          start_date: string | null; // date -> string
          end_date: string | null; // date -> string
          category: string | null;
          profession: string | null;
          voivodeship: string | null;
          external_url: string | null;
          is_partner: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          organizer?: string | null;
          points?: number | null;
          type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          category?: string | null;
          profession?: string | null;
          voivodeship?: string | null;
          external_url?: string | null;
          is_partner?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          organizer?: string | null;
          points?: number | null;
          type?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          category?: string | null;
          profession?: string | null;
          voivodeship?: string | null;
          external_url?: string | null;
          is_partner?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ✅ TABELA: profiles
      profiles: {
        Row: {
          user_id: string;
          profession: string | null;

          // ✅ NOWE: doprecyzowanie gdy profession = "Inne"
          profession_other: string | null;

          period_start: number | null;
          period_end: number | null;
          required_points: number | null;

          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          profession?: string | null;

          // ✅ NOWE
          profession_other?: string | null;

          period_start?: number | null;
          period_end?: number | null;
          required_points?: number | null;

          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          profession?: string | null;

          // ✅ NOWE
          profession_other?: string | null;

          period_start?: number | null;
          period_end?: number | null;
          required_points?: number | null;

          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
