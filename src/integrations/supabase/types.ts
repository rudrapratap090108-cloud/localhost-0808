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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admissions_leads: {
        Row: {
          child_age: number | null
          child_name: string
          created_at: string
          email: string | null
          id: string
          message: string | null
          parent_name: string
          phone: string
          program: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          child_age?: number | null
          child_name: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          parent_name: string
          phone: string
          program?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          child_age?: number | null
          child_name?: string
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          parent_name?: string
          phone?: string
          program?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          created_by: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          created_by: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          created_by?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          password: string
          serial_no: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          password: string
          serial_no: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          password?: string
          serial_no?: string
          updated_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      complaints: {
        Row: {
          admin_reply: string | null
          body: string
          created_at: string
          id: string
          parent_id: string
          replied_at: string | null
          replied_by: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          admin_reply?: string | null
          body: string
          created_at?: string
          id?: string
          parent_id: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          admin_reply?: string | null
          body?: string
          created_at?: string
          id?: string
          parent_id?: string
          replied_at?: string | null
          replied_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      fee_assignments: {
        Row: {
          amount: number
          assigned_by: string | null
          created_at: string
          due_date: string | null
          id: string
          note: string | null
          paid_payment_id: string | null
          parent_id: string
          period: string
          status: string
          student_class: string | null
          student_name: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          assigned_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          paid_payment_id?: string | null
          parent_id: string
          period: string
          status?: string
          student_class?: string | null
          student_name: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          assigned_by?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          note?: string | null
          paid_payment_id?: string | null
          parent_id?: string
          period?: string
          status?: string
          student_class?: string | null
          student_name?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_assignments_paid_payment_id_fkey"
            columns: ["paid_payment_id"]
            isOneToOne: false
            referencedRelation: "fee_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          notes: string | null
          parent_id: string
          period: string
          reference: string | null
          screenshot_path: string | null
          status: string
          student_class: string | null
          student_name: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          notes?: string | null
          parent_id: string
          period: string
          reference?: string | null
          screenshot_path?: string | null
          status?: string
          student_class?: string | null
          student_name: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          notes?: string | null
          parent_id?: string
          period?: string
          reference?: string | null
          screenshot_path?: string | null
          status?: string
          student_class?: string | null
          student_name?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      gallery: {
        Row: {
          created_at: string
          id: string
          storage_path: string
          title: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          storage_path: string
          title?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          storage_path?: string
          title?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      homework: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_media: {
        Row: {
          created_at: string
          created_by: string
          homework_id: string
          id: string
          kind: string
          size_bytes: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          created_by: string
          homework_id: string
          id?: string
          kind: string
          size_bytes?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          created_by?: string
          homework_id?: string
          id?: string
          kind?: string
          size_bytes?: number | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_media_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          child_name: string | null
          class_name: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          child_name?: string | null
          class_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          child_name?: string | null
          class_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          grade: string | null
          id: string
          max_total: number
          percentage: number
          remarks: string | null
          roll_no: string
          student_name: string
          subjects: Json
          term: string
          total: number
          updated_at: string
          year: number
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          grade?: string | null
          id?: string
          max_total?: number
          percentage?: number
          remarks?: string | null
          roll_no: string
          student_name: string
          subjects?: Json
          term: string
          total?: number
          updated_at?: string
          year: number
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          grade?: string | null
          id?: string
          max_total?: number
          percentage?: number
          remarks?: string | null
          roll_no?: string
          student_name?: string
          subjects?: Json
          term?: string
          total?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "results_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          phone: string | null
          roll_no: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          phone?: string | null
          roll_no: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          phone?: string | null
          roll_no?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_classes: {
        Row: {
          class_id: string
          created_at: string
          id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_classes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_class_teacher: {
        Args: { _class_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "parent" | "student"
      attendance_status: "present" | "absent" | "late"
      lead_status: "new" | "contacted" | "enrolled" | "declined"
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
    Enums: {
      app_role: ["admin", "teacher", "parent", "student"],
      attendance_status: ["present", "absent", "late"],
      lead_status: ["new", "contacted", "enrolled", "declined"],
    },
  },
} as const
