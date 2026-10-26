CREATE TYPE public.subscription_tier AS ENUM ('free', 'pro', 'enterprise');
ALTER TABLE public.profiles ADD COLUMN tier public.subscription_tier NOT NULL DEFAULT 'free';
GRANT UPDATE (tier) ON public.profiles TO authenticated;
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));