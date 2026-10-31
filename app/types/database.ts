export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      diet_plan_food_items: {
        Row: {
          calories: number;
          carbs_g: number;
          created_at: string;
          display_order: number;
          fat_g: number;
          fiber_g: number;
          food_item_id: string;
          id: string;
          meal_id: string;
          protein_g: number;
          quantity_g: number;
        };
        ComputedFields: never;
        Insert: {
          calories: number;
          carbs_g: number;
          created_at?: string;
          display_order: number;
          fat_g: number;
          fiber_g: number;
          food_item_id: string;
          id?: string;
          meal_id: string;
          protein_g: number;
          quantity_g: number;
        };
        Update: {
          calories?: number;
          carbs_g?: number;
          created_at?: string;
          display_order?: number;
          fat_g?: number;
          fiber_g?: number;
          food_item_id?: string;
          id?: string;
          meal_id?: string;
          protein_g?: number;
          quantity_g?: number;
        };
        Relationships: [
          {
            foreignKeyName: "diet_plan_food_items_food_item_id_fkey";
            columns: ["food_item_id"];
            isOneToOne: false;
            referencedRelation: "food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diet_plan_food_items_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "diet_plan_meals";
            referencedColumns: ["id"];
          },
        ];
      };
      diet_plan_logs: {
        Row: {
          consumed: boolean;
          consumed_at: string | null;
          created_at: string;
          diet_plan_id: string;
          food_item_id: string;
          id: string;
          log_date: string;
          mentee_id: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          consumed?: boolean;
          consumed_at?: string | null;
          created_at?: string;
          diet_plan_id: string;
          food_item_id: string;
          id?: string;
          log_date: string;
          mentee_id: string;
          updated_at?: string;
        };
        Update: {
          consumed?: boolean;
          consumed_at?: string | null;
          created_at?: string;
          diet_plan_id?: string;
          food_item_id?: string;
          id?: string;
          log_date?: string;
          mentee_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diet_plan_logs_diet_plan_id_fkey";
            columns: ["diet_plan_id"];
            isOneToOne: false;
            referencedRelation: "diet_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diet_plan_logs_food_item_id_fkey";
            columns: ["food_item_id"];
            isOneToOne: false;
            referencedRelation: "diet_plan_food_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diet_plan_logs_mentee_id_fkey";
            columns: ["mentee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      diet_plan_meals: {
        Row: {
          created_at: string;
          diet_plan_id: string;
          display_order: number;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          diet_plan_id: string;
          display_order: number;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          diet_plan_id?: string;
          display_order?: number;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diet_plan_meals_diet_plan_id_fkey";
            columns: ["diet_plan_id"];
            isOneToOne: false;
            referencedRelation: "diet_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      diet_plan_notes: {
        Row: {
          created_at: string;
          diet_plan_id: string;
          id: string;
          log_date: string;
          mentee_id: string;
          notes: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          diet_plan_id: string;
          id?: string;
          log_date: string;
          mentee_id: string;
          notes?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          diet_plan_id?: string;
          id?: string;
          log_date?: string;
          mentee_id?: string;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diet_plan_notes_diet_plan_id_fkey";
            columns: ["diet_plan_id"];
            isOneToOne: false;
            referencedRelation: "diet_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diet_plan_notes_mentee_id_fkey";
            columns: ["mentee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      diet_plans: {
        Row: {
          coach_id: string;
          created_at: string;
          end_date: string;
          id: string;
          mentee_id: string;
          name: string;
          notes: string | null;
          start_date: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          coach_id: string;
          created_at?: string;
          end_date: string;
          id?: string;
          mentee_id: string;
          name: string;
          notes?: string | null;
          start_date: string;
          updated_at?: string;
        };
        Update: {
          coach_id?: string;
          created_at?: string;
          end_date?: string;
          id?: string;
          mentee_id?: string;
          name?: string;
          notes?: string | null;
          start_date?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diet_plans_coach_id_fkey";
            columns: ["coach_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diet_plans_mentee_id_fkey";
            columns: ["mentee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      food_items: {
        Row: {
          calories_per_100g: number;
          carbs_g_per_100g: number;
          created_at: string;
          created_by: string | null;
          fat_g_per_100g: number;
          fiber_g_per_100g: number;
          id: string;
          name: string;
          protein_g_per_100g: number;
          source: string;
          updated_at: string;
          usda_fdc_id: number | null;
        };
        ComputedFields: never;
        Insert: {
          calories_per_100g: number;
          carbs_g_per_100g: number;
          created_at?: string;
          created_by?: string | null;
          fat_g_per_100g: number;
          fiber_g_per_100g: number;
          id?: string;
          name: string;
          protein_g_per_100g: number;
          source?: string;
          updated_at?: string;
          usda_fdc_id?: number | null;
        };
        Update: {
          calories_per_100g?: number;
          carbs_g_per_100g?: number;
          created_at?: string;
          created_by?: string | null;
          fat_g_per_100g?: number;
          fiber_g_per_100g?: number;
          id?: string;
          name?: string;
          protein_g_per_100g?: number;
          source?: string;
          updated_at?: string;
          usda_fdc_id?: number | null;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          angle: string;
          created_at: string;
          filename: string;
          id: string;
          stat_id: string;
          user_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          angle: string;
          created_at?: string;
          filename: string;
          id?: string;
          stat_id?: string;
          user_id?: string | null;
        };
        Update: {
          angle?: string;
          created_at?: string;
          filename?: string;
          id?: string;
          stat_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "photos_stat_id_fkey";
            columns: ["stat_id"];
            isOneToOne: false;
            referencedRelation: "stats";
            referencedColumns: ["id"];
          },
        ];
      };
      plans: {
        Row: {
          created_at: string;
          duration: number;
          id: string;
          name: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          duration: number;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          duration?: number;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          height: number;
          id: string;
          name: string;
          role: string;
          sex: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          height?: number;
          id: string;
          name: string;
          role?: string;
          sex?: string;
        };
        Update: {
          created_at?: string;
          height?: number;
          id?: string;
          name?: string;
          role?: string;
          sex?: string;
        };
        Relationships: [];
      };
      stats: {
        Row: {
          bfp: number;
          created_at: string;
          hip: number;
          id: string;
          neck: number;
          user_id: string;
          waist: number;
          weight: number;
        };
        ComputedFields: never;
        Insert: {
          bfp: number;
          created_at?: string;
          hip: number;
          id?: string;
          neck: number;
          user_id: string;
          waist: number;
          weight: number;
        };
        Update: {
          bfp?: number;
          created_at?: string;
          hip?: number;
          id?: string;
          neck?: number;
          user_id?: string;
          waist?: number;
          weight?: number;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          end_date: string;
          id: string;
          plan_id: string;
          start_date: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          end_date: string;
          id?: string;
          plan_id: string;
          start_date: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          end_date?: string;
          id?: string;
          plan_id?: string;
          start_date?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "plans";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
