
-- Helper: parent is linked to a class when profile.class_name matches the class name
CREATE OR REPLACE FUNCTION public.is_parent_of_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.classes c ON c.id = _class_id
    WHERE p.id = _user_id
      AND p.class_name IS NOT NULL
      AND lower(trim(p.class_name)) = lower(trim(c.name))
  ) AND public.has_role(_user_id, 'parent'::app_role)
$$;

-- Helper: parent is linked to a specific result (matches child_name + class)
CREATE OR REPLACE FUNCTION public.is_parent_of_result(_user_id uuid, _class_id uuid, _student_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.classes c ON c.id = _class_id
    WHERE p.id = _user_id
      AND p.class_name IS NOT NULL
      AND p.child_name IS NOT NULL
      AND lower(trim(p.class_name)) = lower(trim(c.name))
      AND lower(trim(p.child_name)) = lower(trim(_student_name))
  ) AND public.has_role(_user_id, 'parent'::app_role)
$$;

-- Homework: restrict parent read to their own child's class
DROP POLICY IF EXISTS "Homework visible to admins, class teachers, and parents" ON public.homework;
CREATE POLICY "Homework visible to admins, class teachers, and linked parents"
ON public.homework
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_class_teacher(auth.uid(), class_id)
  OR is_parent_of_class(auth.uid(), class_id)
);

-- Results: replace open SELECT with scoped policy
DROP POLICY IF EXISTS "results view" ON public.results;
CREATE POLICY "results view scoped"
ON public.results
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR is_class_teacher(auth.uid(), class_id)
  OR is_parent_of_result(auth.uid(), class_id, student_name)
);

-- Storage: homework-media bucket read restricted by homework's class access.
-- Path convention: `${homework_id}/filename`, so the first folder segment = homework_id.
DROP POLICY IF EXISTS "hwmedia auth read" ON storage.objects;
CREATE POLICY "hwmedia scoped read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'homework-media'
  AND EXISTS (
    SELECT 1 FROM public.homework h
    WHERE h.id::text = (storage.foldername(name))[1]
      AND (
        has_role(auth.uid(), 'admin'::app_role)
        OR is_class_teacher(auth.uid(), h.class_id)
        OR is_parent_of_class(auth.uid(), h.class_id)
      )
  )
);
