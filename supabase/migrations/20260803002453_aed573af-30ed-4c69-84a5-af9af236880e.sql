REVOKE ALL ON FUNCTION public.avisar_planes_proximos() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.avisar_planes_proximos() TO service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notificar_desvinculacion() FROM PUBLIC, anon, authenticated;