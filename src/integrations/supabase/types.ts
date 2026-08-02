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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      almacenes: {
        Row: {
          created_at: string
          id: string
          lugar: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lugar: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lugar?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      asignaciones: {
        Row: {
          created_at: string
          equipo_id: string
          fecha_entrega: string
          fecha_retorno: string | null
          id: string
          observaciones: string | null
          personal_codigo: string | null
          personal_nombre: string
          recepcion_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          equipo_id: string
          fecha_entrega?: string
          fecha_retorno?: string | null
          id?: string
          observaciones?: string | null
          personal_codigo?: string | null
          personal_nombre: string
          recepcion_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          equipo_id?: string
          fecha_entrega?: string
          fecha_retorno?: string | null
          id?: string
          observaciones?: string | null
          personal_codigo?: string | null
          personal_nombre?: string
          recepcion_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_personal_codigo_fkey"
            columns: ["personal_codigo"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "asignaciones_recepcion_id_fkey"
            columns: ["recepcion_id"]
            isOneToOne: false
            referencedRelation: "recepciones"
            referencedColumns: ["id"]
          },
        ]
      }
      equipos: {
        Row: {
          almacen_id: string | null
          codigo_interno: string
          color: string | null
          costo: number | null
          created_at: string
          datos: Json
          estado_asignacion: string
          fecha_compra: string | null
          id: string
          lugar: string | null
          marca: string | null
          modelo: string | null
          observaciones: string | null
          personal_codigo: string | null
          serie: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          almacen_id?: string | null
          codigo_interno: string
          color?: string | null
          costo?: number | null
          created_at?: string
          datos?: Json
          estado_asignacion?: string
          fecha_compra?: string | null
          id?: string
          lugar?: string | null
          marca?: string | null
          modelo?: string | null
          observaciones?: string | null
          personal_codigo?: string | null
          serie?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          almacen_id?: string | null
          codigo_interno?: string
          color?: string | null
          costo?: number | null
          created_at?: string
          datos?: Json
          estado_asignacion?: string
          fecha_compra?: string | null
          id?: string
          lugar?: string | null
          marca?: string | null
          modelo?: string | null
          observaciones?: string | null
          personal_codigo?: string | null
          serie?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipos_almacen_id_fkey"
            columns: ["almacen_id"]
            isOneToOne: false
            referencedRelation: "almacenes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_personal_codigo_fkey"
            columns: ["personal_codigo"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["codigo"]
          },
        ]
      }
      fallas: {
        Row: {
          created_at: string
          descripcion: string
          equipo_id: string
          estado: string
          fecha: string
          id: string
          reportado_por: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          equipo_id: string
          estado?: string
          fecha?: string
          id?: string
          reportado_por: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          equipo_id?: string
          estado?: string
          fecha?: string
          id?: string
          reportado_por?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fallas_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados: {
        Row: {
          created_at: string
          descripcion: string
          fecha: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion: string
          fecha: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      notificaciones: {
        Row: {
          created_at: string
          id: string
          leida: boolean
          mensaje: string
          personal_codigo: string | null
          personal_nombre: string | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          leida?: boolean
          mensaje: string
          personal_codigo?: string | null
          personal_nombre?: string | null
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          leida?: boolean
          mensaje?: string
          personal_codigo?: string | null
          personal_nombre?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      personal: {
        Row: {
          codigo: string
          created_at: string
          estado: string
          nombre: string
          puesto: string | null
          synced_at: string
          updated_at: string
        }
        Insert: {
          codigo: string
          created_at?: string
          estado?: string
          nombre: string
          puesto?: string | null
          synced_at?: string
          updated_at?: string
        }
        Update: {
          codigo?: string
          created_at?: string
          estado?: string
          nombre?: string
          puesto?: string | null
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plan_items: {
        Row: {
          codigo_interno: string
          created_at: string
          equipo_id: string | null
          fecha: string
          id: string
          lugar: string | null
          orden: number
          personal_nombre: string
          plan_id: string
          sucursal_nombre: string | null
          turno: string
          updated_at: string
        }
        Insert: {
          codigo_interno: string
          created_at?: string
          equipo_id?: string | null
          fecha: string
          id?: string
          lugar?: string | null
          orden?: number
          personal_nombre: string
          plan_id: string
          sucursal_nombre?: string | null
          turno?: string
          updated_at?: string
        }
        Update: {
          codigo_interno?: string
          created_at?: string
          equipo_id?: string | null
          fecha?: string
          id?: string
          lugar?: string | null
          orden?: number
          personal_nombre?: string
          plan_id?: string
          sucursal_nombre?: string | null
          turno?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes"
            referencedColumns: ["id"]
          },
        ]
      }
      planes: {
        Row: {
          alcance: string
          anio: number
          autoriza: string
          created_at: string
          elabora: string
          fecha_elaboracion: string
          fecha_realizacion: string
          id: string
          mes: number
          nota: string | null
          numero: number
          objetivo: string
          recursos: string
          tipo: string
          updated_at: string
        }
        Insert: {
          alcance?: string
          anio: number
          autoriza?: string
          created_at?: string
          elabora?: string
          fecha_elaboracion?: string
          fecha_realizacion?: string
          id?: string
          mes: number
          nota?: string | null
          numero?: number
          objetivo?: string
          recursos?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          alcance?: string
          anio?: number
          autoriza?: string
          created_at?: string
          elabora?: string
          fecha_elaboracion?: string
          fecha_realizacion?: string
          id?: string
          mes?: number
          nota?: string | null
          numero?: number
          objetivo?: string
          recursos?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nombre: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          nombre?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recepciones: {
        Row: {
          accesorios: Json
          created_at: string
          estado_fisico: string | null
          fecha: string
          formulario: string | null
          fotos: Json
          id: string
          observaciones: string | null
          personal_codigo: string | null
          personal_nombre: string | null
          recibido_por: string | null
          respuestas: Json
          revisor: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          accesorios?: Json
          created_at?: string
          estado_fisico?: string | null
          fecha?: string
          formulario?: string | null
          fotos?: Json
          id?: string
          observaciones?: string | null
          personal_codigo?: string | null
          personal_nombre?: string | null
          recibido_por?: string | null
          respuestas?: Json
          revisor?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          accesorios?: Json
          created_at?: string
          estado_fisico?: string | null
          fecha?: string
          formulario?: string | null
          fotos?: Json
          id?: string
          observaciones?: string | null
          personal_codigo?: string | null
          personal_nombre?: string | null
          recibido_por?: string | null
          respuestas?: Json
          revisor?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recepciones_personal_codigo_fkey"
            columns: ["personal_codigo"]
            isOneToOne: false
            referencedRelation: "personal"
            referencedColumns: ["codigo"]
          },
        ]
      }
      recepciones_items: {
        Row: {
          created_at: string
          equipo_id: string
          id: string
          observaciones: string | null
          recepcion_id: string
        }
        Insert: {
          created_at?: string
          equipo_id: string
          id?: string
          observaciones?: string | null
          recepcion_id: string
        }
        Update: {
          created_at?: string
          equipo_id?: string
          id?: string
          observaciones?: string | null
          recepcion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recepciones_items_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recepciones_items_recepcion_id_fkey"
            columns: ["recepcion_id"]
            isOneToOne: false
            referencedRelation: "recepciones"
            referencedColumns: ["id"]
          },
        ]
      }
      reparaciones: {
        Row: {
          costo: number | null
          created_at: string
          descripcion: string
          factura: string | null
          falla_id: string
          fecha: string
          id: string
          proveedor: string | null
          updated_at: string
        }
        Insert: {
          costo?: number | null
          created_at?: string
          descripcion: string
          factura?: string | null
          falla_id: string
          fecha?: string
          id?: string
          proveedor?: string | null
          updated_at?: string
        }
        Update: {
          costo?: number | null
          created_at?: string
          descripcion?: string
          factura?: string | null
          falla_id?: string
          fecha?: string
          id?: string
          proveedor?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reparaciones_falla_id_fkey"
            columns: ["falla_id"]
            isOneToOne: false
            referencedRelation: "fallas"
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
      usuarios_autorizados: {
        Row: {
          creado_por: string | null
          created_at: string
          email: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          creado_por?: string | null
          created_at?: string
          email: string
          id?: string
          nombre: string
          rol?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          creado_por?: string | null
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_personal_ti: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      norm_nombre: { Args: { t: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "tecnico"
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
      app_role: ["admin", "tecnico"],
    },
  },
} as const
