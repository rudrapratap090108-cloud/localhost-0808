DROP POLICY IF EXISTS "Any signed-in user can view homework" ON public.homework;

CREATE POLICY "Homework visible to admins, class teachers, and parents"
  ON public.homework FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_class_teacher(auth.uid(), class_id)
    OR public.has_role(auth.uid(), 'parent')
  );