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
          title: string;
          type: "ride" | "run" | "walk";
          distance_m: number | null;
          created_at: string;
        };
        Insert: {
          // user_id nie wymagamy w Insert — wstawi DB przez DEFAULT auth.uid()
          user_id?: string;
          title: string;
          type: "ride" | "run" | "walk";
          distance_m?: number | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          type?: "ride" | "run" | "walk";
          distance_m?: number | null;
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
