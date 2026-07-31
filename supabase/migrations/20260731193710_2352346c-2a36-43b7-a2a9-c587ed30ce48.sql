-- helpers
CREATE OR REPLACE FUNCTION public.norm_nombre(t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT NULLIF(btrim(regexp_replace(upper(coalesce(t,'')), '\s+', ' ', 'g')), '')
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text,
  nombre text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- personal (sincronizado desde Google Sheets)
CREATE TABLE public.personal (
  codigo text PRIMARY KEY,
  nombre text NOT NULL,
  puesto text,
  estado text NOT NULL DEFAULT 'ACTIVO',
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX personal_nombre_idx ON public.personal (nombre);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personal TO authenticated;
GRANT ALL ON public.personal TO service_role;
ALTER TABLE public.personal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "personal_read" ON public.personal FOR SELECT TO authenticated USING (true);
CREATE TRIGGER personal_updated_at BEFORE UPDATE ON public.personal FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- almacenes
CREATE TABLE public.almacenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  lugar text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.almacenes TO authenticated;
GRANT ALL ON public.almacenes TO service_role;
ALTER TABLE public.almacenes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "almacenes_all" ON public.almacenes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER almacenes_updated_at BEFORE UPDATE ON public.almacenes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- equipos
CREATE TABLE public.equipos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('COMPUTADORA','TELEFONO','IMPRESORA','LINEA','RED','OTRO')),
  codigo_interno text NOT NULL UNIQUE,
  estado_asignacion text NOT NULL DEFAULT 'LIBRE' CHECK (estado_asignacion IN ('ASIGNADO','LIBRE','BAJA')),
  personal_codigo text REFERENCES public.personal(codigo) ON DELETE SET NULL,
  almacen_id uuid REFERENCES public.almacenes(id) ON DELETE SET NULL,
  lugar text,
  marca text,
  modelo text,
  serie text,
  fecha_compra date,
  costo numeric(12,2),
  color text,
  observaciones text,
  datos jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX equipos_tipo_idx ON public.equipos (tipo);
CREATE INDEX equipos_personal_idx ON public.equipos (personal_codigo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipos TO authenticated;
GRANT ALL ON public.equipos TO service_role;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipos_all" ON public.equipos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER equipos_updated_at BEFORE UPDATE ON public.equipos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- recepciones
CREATE TABLE public.recepciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('COMPUTADORA','TELEFONO_LINEA')),
  personal_codigo text REFERENCES public.personal(codigo) ON DELETE SET NULL,
  personal_nombre text,
  fecha date NOT NULL DEFAULT current_date,
  recibido_por text,
  estado_fisico text,
  accesorios jsonb NOT NULL DEFAULT '[]'::jsonb,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recepciones TO authenticated;
GRANT ALL ON public.recepciones TO service_role;
ALTER TABLE public.recepciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recepciones_all" ON public.recepciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER recepciones_updated_at BEFORE UPDATE ON public.recepciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- asignaciones (historial)
CREATE TABLE public.asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  personal_codigo text REFERENCES public.personal(codigo) ON DELETE SET NULL,
  personal_nombre text NOT NULL,
  fecha_entrega date NOT NULL DEFAULT current_date,
  fecha_retorno date,
  recepcion_id uuid REFERENCES public.recepciones(id) ON DELETE SET NULL,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX asignaciones_equipo_idx ON public.asignaciones (equipo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asignaciones TO authenticated;
GRANT ALL ON public.asignaciones TO service_role;
ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asignaciones_all" ON public.asignaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER asignaciones_updated_at BEFORE UPDATE ON public.asignaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.recepciones_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recepcion_id uuid NOT NULL REFERENCES public.recepciones(id) ON DELETE CASCADE,
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  observaciones text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recepciones_items TO authenticated;
GRANT ALL ON public.recepciones_items TO service_role;
ALTER TABLE public.recepciones_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recepciones_items_all" ON public.recepciones_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- fallas
CREATE TABLE public.fallas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipo_id uuid NOT NULL REFERENCES public.equipos(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  reportado_por text NOT NULL,
  descripcion text NOT NULL,
  estado text NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','EN REPARACION','REPARADO','SIN SOLUCION')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fallas_equipo_idx ON public.fallas (equipo_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fallas TO authenticated;
GRANT ALL ON public.fallas TO service_role;
ALTER TABLE public.fallas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fallas_all" ON public.fallas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER fallas_updated_at BEFORE UPDATE ON public.fallas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- reparaciones
CREATE TABLE public.reparaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  falla_id uuid NOT NULL REFERENCES public.fallas(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT current_date,
  descripcion text NOT NULL,
  proveedor text,
  costo numeric(12,2),
  factura text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reparaciones_falla_idx ON public.reparaciones (falla_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reparaciones TO authenticated;
GRANT ALL ON public.reparaciones TO service_role;
ALTER TABLE public.reparaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reparaciones_all" ON public.reparaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER reparaciones_updated_at BEFORE UPDATE ON public.reparaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- notificaciones
CREATE TABLE public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL DEFAULT 'DESVINCULACION',
  personal_codigo text,
  personal_nombre text,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  leida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX notificaciones_unicas_idx ON public.notificaciones (tipo, personal_codigo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notificaciones TO authenticated;
GRANT ALL ON public.notificaciones TO service_role;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notificaciones_all" ON public.notificaciones FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER notificaciones_updated_at BEFORE UPDATE ON public.notificaciones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- aviso automático al pasar a DESVINCULADO
CREATE OR REPLACE FUNCTION public.notificar_desvinculacion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n_equipos int;
BEGIN
  IF NEW.estado = 'DESVINCULADO' AND coalesce(OLD.estado,'') <> 'DESVINCULADO' THEN
    SELECT count(*) INTO n_equipos FROM public.equipos
      WHERE personal_codigo = NEW.codigo AND estado_asignacion = 'ASIGNADO';
    INSERT INTO public.notificaciones (tipo, personal_codigo, personal_nombre, titulo, mensaje)
    VALUES ('DESVINCULACION', NEW.codigo, NEW.nombre,
            'Personal desvinculado: ' || NEW.nombre,
            'RRHH cambió el estado a DESVINCULADO. Se sugiere realizar la recepción de ' || n_equipos || ' equipo(s) asignado(s).')
    ON CONFLICT (tipo, personal_codigo) DO UPDATE
      SET leida = false, mensaje = EXCLUDED.mensaje, updated_at = now();
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER personal_desvinculacion AFTER UPDATE OF estado ON public.personal
FOR EACH ROW EXECUTE FUNCTION public.notificar_desvinculacion();