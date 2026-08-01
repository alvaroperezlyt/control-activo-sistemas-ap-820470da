ALTER TABLE public.recepciones
  ADD COLUMN IF NOT EXISTS formulario text,
  ADD COLUMN IF NOT EXISTS revisor text,
  ADD COLUMN IF NOT EXISTS respuestas jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS fotos jsonb NOT NULL DEFAULT '[]'::jsonb;