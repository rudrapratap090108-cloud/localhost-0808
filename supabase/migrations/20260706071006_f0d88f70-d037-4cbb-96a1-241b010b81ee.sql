
-- ============ homework_media ============
CREATE TABLE public.homework_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id uuid NOT NULL REFERENCES public.homework(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image','video')),
  size_bytes bigint,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX homework_media_hw_idx ON public.homework_media(homework_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_media TO authenticated;
GRANT ALL ON public.homework_media TO service_role;
ALTER TABLE public.homework_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hw media view" ON public.homework_media FOR SELECT TO authenticated USING (true);
CREATE POLICY "hw media admin all" ON public.homework_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "hw media teacher insert" ON public.homework_media FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.homework h WHERE h.id = homework_id AND public.is_class_teacher(auth.uid(), h.class_id)
  ));
CREATE POLICY "hw media teacher delete" ON public.homework_media FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.homework h WHERE h.id = homework_id AND public.is_class_teacher(auth.uid(), h.class_id)));

-- ============ results ============
CREATE TABLE public.results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  roll_no text NOT NULL,
  student_name text NOT NULL,
  term text NOT NULL CHECK (term IN ('half_yearly','annual')),
  year int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(8,2) NOT NULL DEFAULT 0,
  max_total numeric(8,2) NOT NULL DEFAULT 0,
  percentage numeric(5,2) NOT NULL DEFAULT 0,
  grade text,
  remarks text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, roll_no, term, year)
);
CREATE INDEX results_lookup_idx ON public.results(class_id, roll_no);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.results TO authenticated;
GRANT ALL ON public.results TO service_role;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "results view" ON public.results FOR SELECT TO authenticated USING (true);
CREATE POLICY "results admin all" ON public.results FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "results teacher insert" ON public.results FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "results teacher update" ON public.results FOR UPDATE TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id))
  WITH CHECK (public.is_class_teacher(auth.uid(), class_id));
CREATE POLICY "results teacher delete" ON public.results FOR DELETE TO authenticated
  USING (public.is_class_teacher(auth.uid(), class_id));
CREATE TRIGGER results_updated_at BEFORE UPDATE ON public.results FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ gallery ============
CREATE TABLE public.gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  title text,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX gallery_created_idx ON public.gallery(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery TO authenticated;
GRANT ALL ON public.gallery TO service_role;
ALTER TABLE public.gallery ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gallery view" ON public.gallery FOR SELECT TO authenticated USING (true);
CREATE POLICY "gallery admin all" ON public.gallery FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "gallery teacher insert" ON public.gallery FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.has_role(auth.uid(),'teacher'));
CREATE POLICY "gallery teacher delete own" ON public.gallery FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() AND public.has_role(auth.uid(),'teacher'));

-- ============ fee_payments ============
CREATE TABLE public.fee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_class text,
  period text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  method text,
  reference text,
  screenshot_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes text,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fee_payments_parent_idx ON public.fee_payments(parent_id, created_at DESC);
CREATE INDEX fee_payments_status_idx ON public.fee_payments(status, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fee_payments TO authenticated;
GRANT ALL ON public.fee_payments TO service_role;
ALTER TABLE public.fee_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fee parent own read" ON public.fee_payments FOR SELECT TO authenticated USING (parent_id = auth.uid());
CREATE POLICY "fee parent insert own" ON public.fee_payments FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid() AND status = 'pending');
CREATE POLICY "fee admin all" ON public.fee_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "fee teacher read all" ON public.fee_payments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'teacher'));
CREATE POLICY "fee teacher verify" ON public.fee_payments FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'teacher'));
CREATE TRIGGER fee_payments_updated_at BEFORE UPDATE ON public.fee_payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ storage.objects policies ============
-- homework-media: authenticated read; teachers+admin write; owner or admin delete
CREATE POLICY "hwmedia auth read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'homework-media');
CREATE POLICY "hwmedia teacher admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'homework-media' AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "hwmedia owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'homework-media' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));

-- gallery: authenticated read; teacher+admin write; owner or admin delete
CREATE POLICY "gallery auth read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'gallery');
CREATE POLICY "gallery teacher admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND (public.has_role(auth.uid(),'teacher') OR public.has_role(auth.uid(),'admin')));
CREATE POLICY "gallery owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));

-- fee-screenshots: owner or admin/teacher read; owner write; owner or admin delete
CREATE POLICY "fee ss owner read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'fee-screenshots' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher')));
CREATE POLICY "fee ss owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'fee-screenshots' AND owner = auth.uid());
CREATE POLICY "fee ss owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'fee-screenshots' AND (owner = auth.uid() OR public.has_role(auth.uid(),'admin')));

-- profile-photos: authenticated read; owner write/update/delete
CREATE POLICY "profphoto auth read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'profile-photos');
CREATE POLICY "profphoto owner write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND owner = auth.uid());
CREATE POLICY "profphoto owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'profile-photos' AND owner = auth.uid());
CREATE POLICY "profphoto owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND owner = auth.uid());
