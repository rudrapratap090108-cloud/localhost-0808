
CREATE OR REPLACE FUNCTION public.is_class_teacher(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes
    WHERE teacher_id = _user_id AND class_id = _class_id
  )
$$;
