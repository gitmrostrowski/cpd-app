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
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};
