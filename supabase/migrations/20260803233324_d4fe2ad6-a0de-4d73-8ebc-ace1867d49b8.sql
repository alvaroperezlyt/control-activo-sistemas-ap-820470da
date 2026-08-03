CREATE TABLE public.ajustes (
  clave text PRIMARY KEY,
  valor text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ajustes TO authenticated;
GRANT ALL ON public.ajustes TO service_role;

ALTER TABLE public.ajustes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ajustes_select_ti" ON public.ajustes
  FOR SELECT TO authenticated
  USING (public.es_personal_ti(auth.uid()));

CREATE POLICY "ajustes_insert_admin" ON public.ajustes
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "ajustes_update_admin" ON public.ajustes
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ajustes_updated_at BEFORE UPDATE ON public.ajustes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.ajustes (clave, valor) VALUES ('acerca_de', '') ON CONFLICT DO NOTHING;