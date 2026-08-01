CREATE POLICY "recepciones_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'recepciones');
CREATE POLICY "recepciones_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recepciones');
CREATE POLICY "recepciones_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'recepciones') WITH CHECK (bucket_id = 'recepciones');
CREATE POLICY "recepciones_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'recepciones');