ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS documents_issued integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.record_documents_issued(_count integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR _count IS NULL OR _count < 1 OR _count > 1000 THEN RETURN; END IF;
  UPDATE public.profiles SET documents_issued = documents_issued + _count WHERE id = auth.uid();
END; $$;
REVOKE ALL ON FUNCTION public.record_documents_issued(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_documents_issued(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, email text, created_at timestamptz, tier subscription_tier, documents_issued integer, last_sign_in_at timestamptz, banned_until timestamptz, is_admin boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'forbidden'; END IF;
  RETURN QUERY
  SELECT p.id, p.email, p.created_at, p.tier, p.documents_issued, u.last_sign_in_at, u.banned_until,
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = p.id AND r.role = 'admin')
  FROM public.profiles p LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END; $$;
REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;