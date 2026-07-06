
CREATE TABLE public.homework (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  due_date DATE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Any signed-in user can view homework"
  ON public.homework FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage all homework"
  ON public.homework FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Class teachers insert homework"
  ON public.homework FOR INSERT
  TO authenticated
  WITH CHECK (public.is_class_teacher(auth.uid(), class_id) AND created_by = auth.uid());

CREATE POLICY "Class teachers update homework"
  ON public.homework FOR UPDATE
  TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id))
  WITH CHECK (public.is_class_teacher(auth.uid(), class_id));

CREATE POLICY "Class teachers delete homework"
  ON public.homework FOR DELETE
  TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id));

CREATE TRIGGER homework_set_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX homework_class_due_idx ON public.homework(class_id, due_date DESC);
