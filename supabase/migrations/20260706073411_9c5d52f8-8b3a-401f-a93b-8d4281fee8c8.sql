
-- =========== fee_assignments ===========
CREATE TABLE public.fee_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name text NOT NULL,
  student_class text,
  title text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  period text NOT NULL,
  due_date date,
  note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','paid','cancelled')),
  paid_payment_id uuid REFERENCES public.fee_payments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fee_assignments_parent_idx ON public.fee_assignments(parent_id, created_at DESC);
CREATE INDEX fee_assignments_status_idx ON public.fee_assignments(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_assignments TO authenticated;
GRANT ALL ON public.fee_assignments TO service_role;
ALTER TABLE public.fee_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fa parent read own" ON public.fee_assignments FOR SELECT TO authenticated
  USING (parent_id = auth.uid());
CREATE POLICY "fa staff read all" ON public.fee_assignments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "fa staff insert" ON public.fee_assignments FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "fa staff update" ON public.fee_assignments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "fa staff delete" ON public.fee_assignments FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE TRIGGER fee_assignments_updated_at BEFORE UPDATE ON public.fee_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== announcements ===========
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','parents','teachers')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX announcements_created_idx ON public.announcements(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ann read audience" ON public.announcements FOR SELECT TO authenticated
  USING (
    audience = 'all'
    OR (audience = 'parents' AND public.has_role(auth.uid(),'parent'))
    OR (audience = 'teachers' AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')))
    OR public.has_role(auth.uid(),'admin')
    OR created_by = auth.uid()
  );
CREATE POLICY "ann staff insert" ON public.announcements FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  );
CREATE POLICY "ann author or admin update" ON public.announcements FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ann author or admin delete" ON public.announcements FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========== complaints ===========
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
  admin_reply text,
  replied_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  replied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX complaints_parent_idx ON public.complaints(parent_id, created_at DESC);
CREATE INDEX complaints_status_idx ON public.complaints(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cmp parent read own" ON public.complaints FOR SELECT TO authenticated
  USING (parent_id = auth.uid());
CREATE POLICY "cmp staff read all" ON public.complaints FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "cmp parent insert" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid() AND public.has_role(auth.uid(),'parent'));
CREATE POLICY "cmp staff update" ON public.complaints FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "cmp admin delete" ON public.complaints FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER complaints_updated_at BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
