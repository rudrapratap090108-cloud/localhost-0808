
DO $$ BEGIN
  CREATE TYPE public.attendance_status AS ENUM ('present','absent','late');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CLASSES
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- TEACHER_CLASSES
CREATE TABLE public.teacher_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, class_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_classes TO authenticated;
GRANT ALL ON public.teacher_classes TO service_role;
ALTER TABLE public.teacher_classes ENABLE ROW LEVEL SECURITY;

-- STUDENTS
CREATE TABLE public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name text NOT NULL,
  roll_no text NOT NULL,
  phone text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, roll_no)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- ATTENDANCE
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  status public.attendance_status NOT NULL DEFAULT 'present',
  marked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Helper function (after tables exist)
CREATE OR REPLACE FUNCTION public.is_class_teacher(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes
    WHERE teacher_id = _user_id AND class_id = _class_id
  )
$$;

-- Policies
CREATE POLICY "classes admin all" ON public.classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "classes teacher read assigned" ON public.classes FOR SELECT TO authenticated
  USING (public.is_class_teacher(auth.uid(), id));

CREATE POLICY "tc admin all" ON public.teacher_classes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "tc teacher read own" ON public.teacher_classes FOR SELECT TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "students admin all" ON public.students FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "students teacher read" ON public.students FOR SELECT TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "students teacher insert" ON public.students FOR INSERT TO authenticated
  WITH CHECK (public.is_class_teacher(auth.uid(), class_id)
    AND length(btrim(name)) BETWEEN 1 AND 100
    AND length(btrim(roll_no)) BETWEEN 1 AND 30
    AND (phone IS NULL OR length(btrim(phone)) BETWEEN 6 AND 20));
CREATE POLICY "students teacher update" ON public.students FOR UPDATE TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id))
  WITH CHECK (public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "students teacher delete" ON public.students FOR DELETE TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id));

CREATE POLICY "att admin all" ON public.attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "att teacher read" ON public.attendance FOR SELECT TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "att teacher insert" ON public.attendance FOR INSERT TO authenticated
  WITH CHECK (public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "att teacher update" ON public.attendance FOR UPDATE TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id))
  WITH CHECK (public.is_class_teacher(auth.uid(), class_id));

-- Triggers
CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
