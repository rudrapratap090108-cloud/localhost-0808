
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.blog_post_status AS ENUM ('draft','published');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.blog_comment_status AS ENUM ('pending','approved','rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CATEGORIES
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cats public read" ON public.blog_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cats admin write" ON public.blog_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- POSTS
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  cover_url text,
  body_md text NOT NULL DEFAULT '',
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.blog_post_status NOT NULL DEFAULT 'draft',
  tags text[] NOT NULL DEFAULT '{}',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts public read published" ON public.blog_posts FOR SELECT TO anon, authenticated
  USING (status = 'published');
CREATE POLICY "posts admin all" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX blog_posts_status_pub_idx ON public.blog_posts (status, published_at DESC);
CREATE INDEX blog_posts_category_idx ON public.blog_posts (category_id);

-- COMMENTS
CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  status public.blog_comment_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments public read approved" ON public.blog_comments FOR SELECT TO anon, authenticated
  USING (status = 'approved');
CREATE POLICY "comments author read own" ON public.blog_comments FOR SELECT TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "comments author insert" ON public.blog_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND status = 'pending');
CREATE POLICY "comments admin all" ON public.blog_comments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX blog_comments_post_idx ON public.blog_comments (post_id, created_at DESC);
