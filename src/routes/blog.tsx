import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SitePage } from "@/components/site-shell";
import { listPublishedPosts, listCategoriesPublic } from "@/lib/blog.functions";
import { z } from "zod";

export const Route = createFileRoute("/blog")({
  validateSearch: (s) => z.object({ category: z.string().optional() }).parse(s),
  component: BlogList,
  head: () => ({
    meta: [
      { title: "Blog — Mighty Mindz" },
      { name: "description", content: "Stories, tips and updates from Mighty Mindz International Pre-school." },
      { property: "og:title", content: "Blog — Mighty Mindz" },
      { property: "og:description", content: "Stories, tips and updates from Mighty Mindz." },
    ],
  }),
});

function BlogList() {
  const { category } = Route.useSearch();
  const listFn = useServerFn(listPublishedPosts);
  const catsFn = useServerFn(listCategoriesPublic);
  const posts = useQuery({
    queryKey: ["blog", "list", category ?? "all"],
    queryFn: () => listFn({ data: { category } }),
  });
  const cats = useQuery({ queryKey: ["blog", "cats"], queryFn: () => catsFn() });

  return (
    <SitePage title="From our journal" intro="Stories, tips and updates from our classrooms.">
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          to="/blog"
          search={{}}
          className={`rounded-full px-4 py-2 text-sm font-semibold border ${
            !category ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
          }`}
        >
          All
        </Link>
        {(cats.data?.categories ?? []).map((c) => (
          <Link
            key={c.id}
            to="/blog"
            search={{ category: c.slug }}
            className={`rounded-full px-4 py-2 text-sm font-semibold border ${
              category === c.slug ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {posts.isLoading && <p>Loading…</p>}
      {posts.data && posts.data.posts.length === 0 && (
        <p className="text-muted-foreground">No posts yet. Check back soon!</p>
      )}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(posts.data?.posts ?? []).map((p) => (
          <Link
            key={p.id}
            to="/blog/$slug"
            params={{ slug: p.slug }}
            className="group rounded-3xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition"
          >
            {p.cover_url ? (
              <img src={p.cover_url} alt={p.title} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="aspect-[16/10] w-full bg-gradient-to-br from-sunshine to-tangerine" />
            )}
            <div className="p-5">
              {p.blog_categories && (
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  {(p.blog_categories as any).name}
                </p>
              )}
              <h2 className="mt-1 text-lg font-extrabold group-hover:text-primary transition">
                {p.title}
              </h2>
              {p.excerpt && <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>}
              {p.published_at && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(p.published_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </SitePage>
  );
}
