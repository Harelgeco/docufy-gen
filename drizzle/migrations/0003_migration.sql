ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS month_issued integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS usage_month date NOT NULL DEFAULT date_trunc('month', now())::date;

CREATE OR REPLACE FUNCTION public.record_documents_issued(_count integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE m date := date_trunc('month', now())::date;
BEGIN
  IF auth.uid() IS NULL OR _count IS NULL OR _count < 1 OR _count > 1000 THEN RETURN; END IF;
  UPDATE public.profiles SET documents_issued = documents_issued + _count,
    month_issued = CASE WHEN usage_month = m THEN month_issued + _count ELSE _count END,
    usage_month = m
  WHERE id = auth.uid();
END; $$;

CREATE OR REPLACE FUNCTION public.get_issue_usage()
RETURNS TABLE(tier text, used integer) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.tier::text, CASE WHEN p.usage_month = date_trunc('month', now())::date THEN p.month_issued ELSE 0 END
  FROM public.profiles p WHERE p.id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_issue_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_issue_usage() TO authenticated;