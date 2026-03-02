INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own images" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'generated-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read generated images" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'generated-images');
