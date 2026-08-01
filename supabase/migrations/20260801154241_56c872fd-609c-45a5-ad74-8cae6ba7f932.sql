-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'tecnico');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.es_personal_ti(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'tecnico')
  )
$$;

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Las cuentas existentes conservan acceso completo como administradores.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Tablas operativas: se elimina el acceso abierto a cualquier autenticado
DROP POLICY IF EXISTS "equipos_all" ON public.equipos;
DROP POLICY IF EXISTS "asignaciones_all" ON public.asignaciones;
DROP POLICY IF EXISTS "recepciones_all" ON public.recepciones;
DROP POLICY IF EXISTS "recepciones_items_all" ON public.recepciones_items;
DROP POLICY IF EXISTS "fallas_all" ON public.fallas;
DROP POLICY IF EXISTS "reparaciones_all" ON public.reparaciones;
DROP POLICY IF EXISTS "notificaciones_all" ON public.notificaciones;
DROP POLICY IF EXISTS "almacenes_all" ON public.almacenes;
DROP POLICY IF EXISTS "personal_read" ON public.personal;

CREATE POLICY "equipos_select" ON public.equipos FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "equipos_insert" ON public.equipos FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "equipos_update" ON public.equipos FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "equipos_delete" ON public.equipos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "asignaciones_select" ON public.asignaciones FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "asignaciones_insert" ON public.asignaciones FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "asignaciones_update" ON public.asignaciones FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "asignaciones_delete" ON public.asignaciones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "recepciones_select" ON public.recepciones FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "recepciones_insert" ON public.recepciones FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "recepciones_update" ON public.recepciones FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "recepciones_delete" ON public.recepciones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "recepciones_items_select" ON public.recepciones_items FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "recepciones_items_insert" ON public.recepciones_items FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "recepciones_items_update" ON public.recepciones_items FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "recepciones_items_delete" ON public.recepciones_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "fallas_select" ON public.fallas FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "fallas_insert" ON public.fallas FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "fallas_update" ON public.fallas FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "fallas_delete" ON public.fallas FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reparaciones_select" ON public.reparaciones FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "reparaciones_insert" ON public.reparaciones FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "reparaciones_update" ON public.reparaciones FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "reparaciones_delete" ON public.reparaciones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "notificaciones_select" ON public.notificaciones FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "notificaciones_insert" ON public.notificaciones FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "notificaciones_update" ON public.notificaciones FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "notificaciones_delete" ON public.notificaciones FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "almacenes_select" ON public.almacenes FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));
CREATE POLICY "almacenes_insert" ON public.almacenes FOR INSERT TO authenticated WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "almacenes_update" ON public.almacenes FOR UPDATE TO authenticated USING (public.es_personal_ti(auth.uid())) WITH CHECK (public.es_personal_ti(auth.uid()));
CREATE POLICY "almacenes_delete" ON public.almacenes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "personal_select" ON public.personal FOR SELECT TO authenticated USING (public.es_personal_ti(auth.uid()));

-- 3. Almacenamiento de fotografías de recepciones
DROP POLICY IF EXISTS "recepciones_read" ON storage.objects;
DROP POLICY IF EXISTS "recepciones_insert" ON storage.objects;
DROP POLICY IF EXISTS "recepciones_update" ON storage.objects;
DROP POLICY IF EXISTS "recepciones_delete" ON storage.objects;

CREATE POLICY "recepciones_fotos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'recepciones' AND public.es_personal_ti(auth.uid()));

CREATE POLICY "recepciones_fotos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recepciones' AND public.es_personal_ti(auth.uid()) AND owner_id = auth.uid()::text);

CREATE POLICY "recepciones_fotos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'recepciones' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'recepciones' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "recepciones_fotos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'recepciones' AND public.has_role(auth.uid(), 'admin'));