import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-shell";
import { getPostBySlug, listApprovedComments, submitComment } from "@/lib/blog.functions";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPost,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Mighty Mindz Blog` },
      { property: "og:title", content: `${params.slug} — Mighty Mindz Blog` },
    ],
  }),
});

function BlogPost() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getPostBySlug);
  const commentsFn = useServerFn(listApprovedComments);
  const submitFn = useServerFn(submitComment);
  const qc = useQueryClient();

  const postQ = useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => getFn({ data: { slug } }),
  });

  const post = postQ.data?.post;
  const commentsQ = useQuery({
    queryKey: ["blog", "comments", post?.id],
    queryFn: () => commentsFn({ data: { postId: post!.id } }),
    enabled: !!post?.id,
  });

  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const [body, setBody] = useState("");
  const submit = useMutation({
    mutationFn: (b: string) => submitFn({ data: { postId: post!.id, body: b } }),
    onSuccess: () => {
      setBody("");
      toast.success("Comment submitted — will appear after moderation.");
      qc.invalidateQueries({ queryKey: ["blog", "comments", post?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      {postQ.isLoading && <p className="max-w-3xl mx-auto p-8">Loading…</p>}
      {postQ.error && (
        <div className="max-w-3xl mx-auto p-8">
          <p className="text-tomato">This post is not available.</p>
          <Link to="/blog" className="mt-4 inline-block underline">Back to blog</Link>
        </div>
      )}
      {post && (
        <article className="max-w-3xl mx-auto px-4 md:px-8 py-10">
          {post.blog_categories && (
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              {(post.blog_categories as any).name}
            </p>
          )}
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold">{post.title}</h1>
          {post.published_at && (
            <p className="mt-2 text-sm text-muted-foreground">
              {new Date(post.published_at).toLocaleDateString()}
            </p>
          )}
          {post.cover_url && (
            <img src={post.cover_url} alt={post.title} className="mt-6 rounded-3xl w-full aspect-[16/9] object-cover" />
          )}
          <div
            className="prose prose-slate max-w-none mt-6"
            dangerouslySetInnerHTML={{ __html: marked.parse(post.body_md || "") as string }}
          />
          {post.tags && post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {post.tags.map((t: string) => (
                <span key={t} className="text-xs bg-background border border-border rounded-full px-3 py-1">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-2xl font-extrabold">Comments</h2>
            <div className="mt-4 space-y-4">
              {(commentsQ.data?.comments ?? []).length === 0 && (
                <p className="text-muted-foreground text-sm">Be the first to comment.</p>
              )}
              {(commentsQ.data?.comments ?? []).map((c: any) => (
                <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold text-sm">{c.profiles?.full_name ?? "Parent"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>

            {signedIn ? (
              <form
                className="mt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (body.trim().length > 0) submit.mutate(body.trim());
                }}
              >
                <textarea
                  className="w-full rounded-2xl border border-input bg-background p-4 focus:outline-none focus:ring-2 focus:ring-ring"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Share a kind thought…"
                  maxLength={2000}
                />
                <button
                  disabled={submit.isPending}
                  className="mt-3 rounded-full bg-primary text-primary-foreground font-bold px-5 py-2.5 disabled:opacity-60"
                >
                  {submit.isPending ? "Posting…" : "Post comment"}
                </button>
              </form>
            ) : (
              <button
                onClick={() => navigate({ to: "/auth" })}
                className="mt-6 rounded-full border border-border bg-background font-bold px-5 py-2.5"
              >
                Sign in to comment
              </button>
            )}
          </section>
        </article>
      )}
      <SiteFooter />
    </div>
  );
}
