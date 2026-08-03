CREATE OR REPLACE FUNCTION public.avisar_planes_proximos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT t.tipo, t.meses, g.anio, m.mes
    FROM (VALUES
            ('RESPALDO', ARRAY[2,4,6,8,10,12], 'PLAN DE RESPALDO DE LA INFORMACION'),
            ('MANTENIMIENTO', ARRAY[5,11], 'PLAN DE MANTENIMIENTO TECNICO PREVENTIVO')
         ) AS t(tipo, meses, titulo)
    CROSS JOIN (SELECT unnest(ARRAY[extract(year from current_date)::int,
                                    extract(year from current_date)::int + 1]) AS anio) g
    CROSS JOIN LATERAL (SELECT unnest(t.meses) AS mes) m
  LOOP
    IF current_date >= (make_date(r.anio, r.mes, 1) - INTERVAL '5 days')::date
       AND current_date <= (make_date(r.anio, r.mes, 1) + INTERVAL '1 month - 1 day')::date THEN
      IF EXISTS (SELECT 1 FROM public.planes p
                  WHERE p.tipo = r.tipo AND p.anio = r.anio AND p.mes = r.mes) THEN
        UPDATE public.notificaciones
           SET leida = true, updated_at = now()
         WHERE tipo = 'PLAN_PENDIENTE'
           AND personal_codigo = r.tipo || '-' || r.anio || '-' || lpad(r.mes::text, 2, '0')
           AND leida = false;
      ELSE
        INSERT INTO public.notificaciones (tipo, personal_codigo, personal_nombre, titulo, mensaje)
        VALUES (
          'PLAN_PENDIENTE',
          r.tipo || '-' || r.anio || '-' || lpad(r.mes::text, 2, '0'),
          NULL,
          CASE WHEN r.tipo = 'RESPALDO'
               THEN 'Plan de respaldo pendiente: ' || to_char(make_date(r.anio, r.mes, 1), 'TMMonth YYYY')
               ELSE 'Plan de mantenimiento pendiente: ' || to_char(make_date(r.anio, r.mes, 1), 'TMMonth YYYY')
          END,
          'Faltan ' || GREATEST(0, (make_date(r.anio, r.mes, 1) - current_date)) ||
          ' dia(s) para el inicio del mes. Genera el plan de ' || lower(r.tipo) ||
          ' en el modulo Planes y mantenimiento.'
        )
        ON CONFLICT (tipo, personal_codigo) DO UPDATE
          SET leida = false, titulo = EXCLUDED.titulo, mensaje = EXCLUDED.mensaje, updated_at = now();
      END IF;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.avisar_planes_proximos() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.avisar_planes_proximos() FROM anon;
REVOKE ALL ON FUNCTION public.avisar_planes_proximos() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.avisar_planes_proximos() TO service_role;