CREATE OR REPLACE FUNCTION public.notificar_desvinculacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n_equipos int; etiqueta text;
BEGIN
  IF NEW.estado = 'DESVINCULADO' AND coalesce(OLD.estado,'') <> 'DESVINCULADO' THEN
    SELECT count(*) INTO n_equipos FROM public.equipos
      WHERE personal_codigo = NEW.codigo AND estado_asignacion = 'ASIGNADO';
    etiqueta := NEW.nombre || coalesce(' · ' || nullif(btrim(NEW.puesto), ''), '');
    INSERT INTO public.notificaciones (tipo, personal_codigo, personal_nombre, titulo, mensaje)
    VALUES ('DESVINCULACION', NEW.codigo, NEW.nombre,
            'Personal desvinculado: ' || etiqueta,
            'RRHH cambió el estado a DESVINCULADO de ' || etiqueta || ' (' || NEW.codigo || '). Se sugiere realizar la recepción de ' || n_equipos || ' equipo(s) asignado(s).')
    ON CONFLICT (tipo, personal_codigo) DO UPDATE
      SET leida = false, titulo = EXCLUDED.titulo, mensaje = EXCLUDED.mensaje, updated_at = now();
  END IF;
  RETURN NEW;
END; $$;