CREATE POLICY "gen images own select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'generated-images' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "gen images own insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "gen images own update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "gen images own delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "style refs read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'style-references');
CREATE POLICY "style refs admin write" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'style-references' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "style refs admin update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'style-references' AND public.has_role(auth.uid(),'admin'));