DROP POLICY IF EXISTS "Authenticated users can upload catalog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update catalog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete catalog images" ON storage.objects;

CREATE POLICY "Admins upload catalog images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins update catalog images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins delete catalog images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'catalog' AND public.has_role(auth.uid(), 'admin'::public.app_role));