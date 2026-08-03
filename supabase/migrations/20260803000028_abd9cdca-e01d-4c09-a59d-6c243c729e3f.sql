ALTER TABLE public.planes
  ADD COLUMN IF NOT EXISTS fecha_inicio date,
  ADD COLUMN IF NOT EXISTS fecha_fin date;

UPDATE public.planes
SET fecha_inicio = COALESCE(fecha_inicio, make_date(anio, mes, 1)),
    fecha_fin = COALESCE(fecha_fin, (make_date(anio, mes, 1) + interval '1 month - 1 day')::date);

ALTER TABLE public.planes
  ALTER COLUMN fecha_inicio SET NOT NULL,
  ALTER COLUMN fecha_fin SET NOT NULL;