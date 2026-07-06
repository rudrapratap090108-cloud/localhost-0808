
-- 1. notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  type text NOT NULL,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own notifications select" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own notifications update" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own notifications delete" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. Trigger: result published -> notify parent
CREATE OR REPLACE FUNCTION public.notify_result_published()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent uuid;
  student_name text;
BEGIN
  SELECT s.parent_id, s.full_name INTO parent, student_name
  FROM public.students s WHERE s.id = NEW.student_id;

  IF parent IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      parent,
      'Exam result published',
      COALESCE(student_name, 'Your child') || ' - ' || COALESCE(NEW.exam_name, 'Exam') || ' result is out.',
      'result',
      '/dashboard/results'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_result_published
AFTER INSERT ON public.results
FOR EACH ROW EXECUTE FUNCTION public.notify_result_published();

-- 3. Trigger: fee assigned -> notify parent
CREATE OR REPLACE FUNCTION public.notify_fee_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  parent uuid;
  student_name text;
BEGIN
  SELECT s.parent_id, s.full_name INTO parent, student_name
  FROM public.students s WHERE s.id = NEW.student_id;

  IF parent IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      parent,
      'New fee assigned',
      COALESCE(student_name, 'Your child') || ' - ' || COALESCE(NEW.title, 'Fee') || ' due.',
      'fee',
      '/dashboard/fees'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_fee_assigned
AFTER INSERT ON public.fee_assignments
FOR EACH ROW EXECUTE FUNCTION public.notify_fee_assigned();

-- 4. Trigger: new admission lead -> notify all admins
CREATE OR REPLACE FUNCTION public.notify_admission_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id uuid;
BEGIN
  FOR admin_id IN SELECT user_id FROM public.user_roles WHERE role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, body, type, link)
    VALUES (
      admin_id,
      'New admission enquiry',
      COALESCE(NEW.parent_name, 'A parent') || ' enquired about admission.',
      'admission',
      '/dashboard'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admission_lead
AFTER INSERT ON public.admissions_leads
FOR EACH ROW EXECUTE FUNCTION public.notify_admission_lead();
