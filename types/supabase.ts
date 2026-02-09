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
      activities: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          points: number; // numeric w Supabase typuje się często jako number
          year: number;
          organizer: string | null;

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
          }
        ];
      };

      // ✅ NOWA TABELA: profiles
      profiles: {
        Row: {
          user_id: string;
          profession: string | null;
          period_start: number | null;
          period_end: number | null;
          required_points: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          user_id: string;
          profession?: string | null;
          period_start?: number | null;
          period_end?: number | null;
          required_points?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          user_id?: string;
          profession?: string | null;
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

