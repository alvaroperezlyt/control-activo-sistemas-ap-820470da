-- 1) Políticas de escritura explícitas para personal (solo admin)
CREATE POLICY personal_insert ON public.personal
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY personal_update ON public.personal
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY personal_delete ON public.personal
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

GRANT INSERT, UPDATE, DELETE ON public.personal TO authenticated;

-- 2) Revocar EXECUTE de funciones SECURITY DEFINER que no deben ser invocables por clientes
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notificar_desvinculacion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.es_personal_ti(uuid) FROM PUBLIC, anon, authenticated;
