// types/supabase.d.ts
export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          points: number;
          year: number;
          organizer: string | null;
          created_at: string;
        };
        Insert: {
          // Jeśli user_id w DB ma DEFAULT (np. auth.uid()) i ustawiasz go w triggerze,
          // możesz zmienić na user_id?: string;
          user_id: string;
          type: string;
          points: number;
          year: number;
          organizer?: string | null;
          // created_at zwykle ma DEFAULT now(), więc nie wpisujemy
          created_at?: string;
          id?: string;
        };
        Update: {
          user_id?: string;
          type?: string;
          points?: number;
          year?: number;
          organizer?: string | null;
          created_at?: string;
          id?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
