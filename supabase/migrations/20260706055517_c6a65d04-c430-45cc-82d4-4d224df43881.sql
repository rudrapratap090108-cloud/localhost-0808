
-- 1) Restrict profiles SELECT to owner + admin
DROP POLICY IF EXISTS "profiles read own or any authenticated" ON public.profiles;

CREATE POLICY "profiles read own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "profiles admin read all"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) has_role: switch to SECURITY INVOKER so it isn't a definer function
--    callable by every authenticated user. user_roles has a "read own"
--    SELECT policy plus the admin-read-all policy, so INVOKER still lets
--    each user (and admins) evaluate has_role() correctly.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3) Tighten the always-true INSERT policy on admissions_leads with real
--    validation checks so the public form still works but the policy is
--    no longer `WITH CHECK (true)`.
DROP POLICY IF EXISTS "leads insert public" ON public.admissions_leads;

CREATE POLICY "leads insert public"
  ON public.admissions_leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(btrim(parent_name)) BETWEEN 2 AND 100
    AND length(btrim(child_name)) BETWEEN 1 AND 100
    AND length(btrim(phone))      BETWEEN 6 AND 20
    AND (child_age IS NULL OR (child_age BETWEEN 0 AND 25))
    AND (email    IS NULL OR length(email)    <= 200)
    AND (program  IS NULL OR length(program)  <= 50)
    AND (message  IS NULL OR length(message)  <= 1000)
    AND status = 'new'::public.lead_status
  );
