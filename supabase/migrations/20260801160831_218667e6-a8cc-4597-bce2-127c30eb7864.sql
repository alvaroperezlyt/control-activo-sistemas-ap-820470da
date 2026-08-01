CREATE TABLE public.usuarios_autorizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  nombre text NOT NULL,
  rol public.app_role NOT NULL DEFAULT 'tecnico',
  creado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_autorizados TO authenticated;
GRANT ALL ON public.usuarios_autorizados TO service_role;

ALTER TABLE public.usuarios_autorizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuarios_autorizados_admin_all ON public.usuarios_autorizados
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER usuarios_autorizados_set_updated_at
  BEFORE UPDATE ON public.usuarios_autorizados
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Los administradores pueden listar cuentas y roles
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Asignar rol automáticamente según la lista de autorizados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE aut record;
BEGIN
  SELECT * INTO aut FROM public.usuarios_autorizados
   WHERE lower(email) = lower(NEW.email) LIMIT 1;

  INSERT INTO public.profiles (id, email, nombre)
  VALUES (NEW.id, NEW.email, COALESCE(aut.nombre, NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', NEW.email))
  ON CONFLICT (id) DO NOTHING;

  IF aut.email IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, aut.rol)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();