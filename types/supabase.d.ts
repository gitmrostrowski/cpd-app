// types/supabase.d.ts
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
          user_id: string;
          title: string;
          type: "ride" | "run" | "walk";
          distance_m?: number | null;
        };
        Update: Partial<{
          user_id: string;
          title: string;
          type: "ride" | "run" | "walk";
          distance_m: number | null;
        }>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
