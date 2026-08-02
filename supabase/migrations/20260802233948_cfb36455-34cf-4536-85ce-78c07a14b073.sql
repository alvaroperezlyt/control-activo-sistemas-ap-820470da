-- Feriados
CREATE TABLE public.feriados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fecha date NOT NULL UNIQUE,
  descripcion text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feriados TO authenticated;
GRANT ALL ON public.feriados TO service_role;
ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;
CREATE POLICY feriados_select ON public.feriados FOR SELECT TO authenticated USING (es_personal_ti(auth.uid()));
CREATE POLICY feriados_insert ON public.feriados FOR INSERT TO authenticated WITH CHECK (es_personal_ti(auth.uid()));
CREATE POLICY feriados_update ON public.feriados FOR UPDATE TO authenticated USING (es_personal_ti(auth.uid())) WITH CHECK (es_personal_ti(auth.uid()));
CREATE POLICY feriados_delete ON public.feriados FOR DELETE TO authenticated USING (es_personal_ti(auth.uid()));
CREATE TRIGGER feriados_updated_at BEFORE UPDATE ON public.feriados FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Planes
CREATE TABLE public.planes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo text NOT NULL CHECK (tipo IN ('RESPALDO','MANTENIMIENTO')),
  anio integer NOT NULL,
  mes integer NOT NULL CHECK (mes BETWEEN 1 AND 12),
  numero integer NOT NULL DEFAULT 1,
  fecha_elaboracion date NOT NULL DEFAULT CURRENT_DATE,
  fecha_realizacion text NOT NULL DEFAULT '',
  objetivo text NOT NULL DEFAULT '',
  alcance text NOT NULL DEFAULT '',
  recursos text NOT NULL DEFAULT '',
  nota text,
  elabora text NOT NULL DEFAULT 'Resp. Sistemas Informaticos',
  autoriza text NOT NULL DEFAULT 'CAO',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planes TO authenticated;
GRANT ALL ON public.planes TO service_role;
ALTER TABLE public.planes ENABLE ROW LEVEL SECURITY;
CREATE POLICY planes_select ON public.planes FOR SELECT TO authenticated USING (es_personal_ti(auth.uid()));
CREATE POLICY planes_insert ON public.planes FOR INSERT TO authenticated WITH CHECK (es_personal_ti(auth.uid()));
CREATE POLICY planes_update ON public.planes FOR UPDATE TO authenticated USING (es_personal_ti(auth.uid())) WITH CHECK (es_personal_ti(auth.uid()));
CREATE POLICY planes_delete ON public.planes FOR DELETE TO authenticated USING (es_personal_ti(auth.uid()));
CREATE TRIGGER planes_updated_at BEFORE UPDATE ON public.planes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Items del plan
CREATE TABLE public.plan_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid NOT NULL REFERENCES public.planes(id) ON DELETE CASCADE,
  equipo_id uuid REFERENCES public.equipos(id) ON DELETE SET NULL,
  codigo_interno text NOT NULL,
  personal_nombre text NOT NULL,
  sucursal_nombre text,
  lugar text,
  fecha date NOT NULL,
  turno text NOT NULL DEFAULT 'MANANA' CHECK (turno IN ('MANANA','TARDE')),
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.plan_items TO authenticated;
GRANT ALL ON public.plan_items TO service_role;
ALTER TABLE public.plan_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY plan_items_select ON public.plan_items FOR SELECT TO authenticated USING (es_personal_ti(auth.uid()));
CREATE POLICY plan_items_insert ON public.plan_items FOR INSERT TO authenticated WITH CHECK (es_personal_ti(auth.uid()));
CREATE POLICY plan_items_update ON public.plan_items FOR UPDATE TO authenticated USING (es_personal_ti(auth.uid())) WITH CHECK (es_personal_ti(auth.uid()));
CREATE POLICY plan_items_delete ON public.plan_items FOR DELETE TO authenticated USING (es_personal_ti(auth.uid()));
CREATE TRIGGER plan_items_updated_at BEFORE UPDATE ON public.plan_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX plan_items_plan_idx ON public.plan_items(plan_id);