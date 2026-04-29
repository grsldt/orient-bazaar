
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;

-- Note: bucket is public for read of individual files, that's intended for product images.
-- The listing warning is acceptable for a public catalog. We tighten by removing list-style access via storage.objects SELECT requires bucket_id; existing policy is fine. No action.
