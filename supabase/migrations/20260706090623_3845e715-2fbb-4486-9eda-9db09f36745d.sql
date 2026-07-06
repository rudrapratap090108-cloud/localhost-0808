CREATE TABLE public.cameras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  serial_no TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cameras TO authenticated;
GRANT ALL ON public.cameras TO service_role;

ALTER TABLE public.cameras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view cameras"
  ON public.cameras FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert cameras"
  ON public.cameras FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cameras"
  ON public.cameras FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cameras"
  ON public.cameras FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER cameras_set_updated_at
  BEFORE UPDATE ON public.cameras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();