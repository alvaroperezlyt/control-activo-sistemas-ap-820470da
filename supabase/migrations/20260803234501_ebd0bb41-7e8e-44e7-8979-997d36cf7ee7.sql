CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION private.es_personal_ti(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','tecnico'))
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.es_personal_ti(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.es_personal_ti(uuid) TO authenticated, service_role;

DO $do$
DECLARE
  p record;
  nueva_qual text;
  nueva_check text;
  sql text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname IN ('public','storage')
      AND (coalesce(qual,'') ~* '(has_role|es_personal_ti)'
        OR coalesce(with_check,'') ~* '(has_role|es_personal_ti)')
  LOOP
    nueva_qual := regexp_replace(regexp_replace(coalesce(p.qual,''),
        '(public\.)?\mhas_role\(', 'private.has_role(', 'g'),
        '(public\.)?\mes_personal_ti\(', 'private.es_personal_ti(', 'g');
    nueva_check := regexp_replace(regexp_replace(coalesce(p.with_check,''),
        '(public\.)?\mhas_role\(', 'private.has_role(', 'g'),
        '(public\.)?\mes_personal_ti\(', 'private.es_personal_ti(', 'g');

    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);

    sql := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
      p.policyname, p.schemaname, p.tablename,
      CASE WHEN p.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      p.cmd,
      array_to_string(p.roles, ', '));
    IF p.qual IS NOT NULL THEN
      sql := sql || format(' USING (%s)', nueva_qual);
    END IF;
    IF p.with_check IS NOT NULL THEN
      sql := sql || format(' WITH CHECK (%s)', nueva_check);
    END IF;
    EXECUTE sql;
  END LOOP;
END
$do$;

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.es_personal_ti(uuid);