export type AppRole = 'admin' | 'auditor' | 'cliente';
export type CuotaEstado = 'pendiente' | 'en_revision' | 'pagado' | 'rechazado';
export type SolicitudEstado = 'abierta' | 'en_revision' | 'aprobada' | 'rechazada' | 'respondida' | 'cerrada';
export type SolicitudTipo = 'consulta' | 'indicacion' | 'solicitud';
export type EstadoTipoInput = 'boolean' | 'text' | 'select' | 'date';

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          identificador: string;
          rut: string | null;
          nombre_completo: string;
          email: string | null;
          parcela: string | null;
          rol: AppRole;
          requiere_cambio_pass: boolean;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          identificador: string;
          rut?: string | null;
          nombre_completo: string;
          email?: string | null;
          parcela?: string | null;
          rol?: AppRole;
          requiere_cambio_pass?: boolean;
          activo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['perfiles']['Insert']>;
      };
      fichas_cliente: {
        Row: {
          id: string;
          perfil_id: string;
          titular_parcela: string | null;
          rut_titular: string | null;
          numero_rol_parcela: string | null;
          numero_parcela: string | null;
          parcela: string | null;
          telefono: string | null;
          email_contacto: string | null;
          direccion_referencia: string | null;
          observaciones: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          titular_parcela?: string | null;
          rut_titular?: string | null;
          numero_rol_parcela?: string | null;
          numero_parcela?: string | null;
          parcela?: string | null;
          telefono?: string | null;
          email_contacto?: string | null;
          direccion_referencia?: string | null;
          observaciones?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['fichas_cliente']['Insert']>;
      };
      ficha_estado_tipos: {
        Row: {
          id: string;
          codigo: string;
          etiqueta: string;
          tipo_input: EstadoTipoInput;
          opciones_json: unknown | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          codigo: string;
          etiqueta: string;
          tipo_input: EstadoTipoInput;
          opciones_json?: unknown | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ficha_estado_tipos']['Insert']>;
      };
      ficha_estado_valores: {
        Row: {
          id: string;
          ficha_id: string;
          estado_tipo_id: string;
          valor_bool: boolean | null;
          valor_texto: string | null;
          valor_fecha: string | null;
          observacion: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ficha_id: string;
          estado_tipo_id: string;
          valor_bool?: boolean | null;
          valor_texto?: string | null;
          valor_fecha?: string | null;
          observacion?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['ficha_estado_valores']['Insert']>;
      };
      seguimiento_parcela: {
        Row: {
          id: string;
          perfil_id: string;
          ficha_id: string;
          avance_particular: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          ficha_id: string;
          avance_particular?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['seguimiento_parcela']['Insert']>;
      };
      cuotas: {
        Row: {
          id: string;
          perfil_id: string;
          concepto: string;
          monto_total: number;
          fecha_vencimiento: string;
          estado: CuotaEstado;
          comprobante_url: string | null;
          motivo_rechazo: string | null;
          transaccion_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          concepto: string;
          monto_total: number;
          fecha_vencimiento: string;
          estado?: CuotaEstado;
          comprobante_url?: string | null;
          motivo_rechazo?: string | null;
          transaccion_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cuotas']['Insert']>;
      };
      cuota_auditorias: {
        Row: {
          id: string;
          cuota_id: string;
          actor_id: string;
          accion: string;
          detalle: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cuota_id: string;
          actor_id: string;
          accion: string;
          detalle?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cuota_auditorias']['Insert']>;
      };
      avances_obra: {
        Row: {
          id: string;
          titulo: string;
          descripcion: string;
          fecha: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          titulo: string;
          descripcion: string;
          fecha?: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['avances_obra']['Insert']>;
      };
      solicitudes: {
        Row: {
          id: string;
          perfil_id: string;
          creada_por: string;
          tipo: SolicitudTipo;
          asunto: string;
          detalle_inicial: string;
          estado: SolicitudEstado;
          prioridad: 'baja' | 'media' | 'alta';
          categoria: string | null;
          motivo_rechazo: string | null;
          revisada_por: string | null;
          fecha_revision: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          perfil_id: string;
          creada_por: string;
          tipo: SolicitudTipo;
          asunto: string;
          detalle_inicial: string;
          estado?: SolicitudEstado;
          prioridad?: 'baja' | 'media' | 'alta';
          categoria?: string | null;
          motivo_rechazo?: string | null;
          revisada_por?: string | null;
          fecha_revision?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['solicitudes']['Insert']>;
      };
      solicitud_mensajes: {
        Row: {
          id: string;
          solicitud_id: string;
          autor_id: string;
          mensaje: string;
          es_interno: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          solicitud_id: string;
          autor_id: string;
          mensaje: string;
          es_interno?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['solicitud_mensajes']['Insert']>;
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          entidad: string;
          entidad_id: string | null;
          accion: string;
          detalle: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          entidad: string;
          entidad_id?: string | null;
          accion: string;
          detalle?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
      };
    };
    Functions: {
      mark_password_changed: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
  };
}
