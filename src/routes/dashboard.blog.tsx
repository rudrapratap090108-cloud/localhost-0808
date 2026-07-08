import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContext, useState } from "react";
import { toast } from "sonner";
import { MeContext } from "@/components/dashboard/me";
import {
  listAllPosts,
  upsertPost,
  deletePost,
  listCategoriesPublic,
  upsertCategory,
  deleteCategory,
  listAllComments,
  moderateComment,
  deleteComment,
} from "@/lib/blog.functions";

export const Route = createFileRoute("/dashboard/blog")({
  component: AdminBlog,
});

type Tab = "posts" | "categories" | "comments";

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
}

function AdminBlog() {
  const me = useContext(MeContext);
  const isAdmin = me?.roles?.includes("admin");
  const [tab, setTab] = useState<Tab>("posts");

  if (!isAdmin) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-extrabold">Admins only</h1>
        <p className="text-muted-foreground mt-2">The blog editor is available to administrators.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-extrabold">Blog</h1>
        <div className="inline-flex rounded-full bg-background border border-border p-1">
          {(["posts", "categories", "comments"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-bold rounded-full capitalize ${
                tab === t ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {tab === "posts" && <PostsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "comments" && <CommentsTab />}
    </div>
  );
}

function PostsTab() {
  const listFn = useServerFn(listAllPosts);
  const upsertFn = useServerFn(upsertPost);
  const deleteFn = useServerFn(deletePost);
  const catsFn = useServerFn(listCategoriesPublic);
  const qc = useQueryClient();

  const posts = useQuery({ queryKey: ["admin-blog", "posts"], queryFn: () => listFn() });
  const cats = useQuery({ queryKey: ["blog", "cats"], queryFn: () => catsFn() });

  const [editing, setEditing] = useState<any | null>(null);

  const save = useMutation({
    mutationFn: (payload: any) => upsertFn({ data: payload }),
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-blog", "posts"] });
      qc.invalidateQueries({ queryKey: ["blog"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-blog", "posts"] });
    },
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() =>
            setEditing({ title: "", slug: "", excerpt: "", cover_url: "", body_md: "", tags: [], status: "draft", category_id: null })
          }
          className="rounded-full bg-primary text-primary-foreground font-bold px-4 py-2"
        >
          + New post
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card overflow-hidden">
        {(posts.data?.posts ?? []).length === 0 && (
          <p className="p-6 text-muted-foreground">No posts yet.</p>
        )}
        {(posts.data?.posts ?? []).map((p: any) => (
          <div key={p.id} className="flex items-center gap-3 border-b border-border last:border-0 p-4">
            <div className="flex-1">
              <div className="font-bold">{p.title}</div>
              <div className="text-xs text-muted-foreground">/{p.slug}</div>
            </div>
            <span
              className={`text-xs font-bold rounded-full px-2 py-1 ${
                p.status === "published" ? "bg-leaf text-leaf-foreground" : "bg-background border border-border"
              }`}
            >
              {p.status}
            </span>
            <button onClick={() => setEditing({ ...p })} className="text-sm font-bold underline">
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${p.title}"?`)) remove.mutate(p.id);
              }}
              className="text-sm font-bold text-tomato"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start md:items-center justify-center overflow-auto p-4">
          <div className="bg-card rounded-3xl w-full max-w-3xl p-6 md:p-8 my-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold">{editing.id ? "Edit post" : "New post"}</h2>
              <button onClick={() => setEditing(null)} className="text-2xl">✕</button>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                className="w-full rounded-xl border border-input bg-background px-4 py-3"
                placeholder="Title"
                value={editing.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditing((p: any) => ({ ...p, title, slug: p.slug || slugify(title) }));
                }}
              />
              <input
                className="w-full rounded-xl border border-input bg-background px-4 py-3"
                placeholder="slug-like-this"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
              <select
                className="w-full rounded-xl border border-input bg-background px-4 py-3"
                value={editing.category_id ?? ""}
                onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
              >
                <option value="">— No category —</option>
                {(cats.data?.categories ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                className="w-full rounded-xl border border-input bg-background px-4 py-3"
                placeholder="Cover image URL"
                value={editing.cover_url ?? ""}
                onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })}
              />
              <input
                className="w-full rounded-xl border border-input bg-background px-4 py-3"
                placeholder="Tags (comma separated)"
                value={(editing.tags ?? []).join(", ")}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
              <textarea
                className="w-full rounded-xl border border-input bg-background px-4 py-3"
                rows={2}
                placeholder="Excerpt"
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
              />
              <textarea
                className="w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm"
                rows={14}
                placeholder="# Body (markdown)"
                value={editing.body_md ?? ""}
                onChange={(e) => setEditing({ ...editing, body_md: e.target.value })}
              />
              <div className="flex items-center justify-between">
                <select
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                  className="rounded-xl border border-input bg-background px-4 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(null)} className="rounded-full border border-border px-4 py-2 font-bold">
                    Cancel
                  </button>
                  <button
                    disabled={save.isPending}
                    onClick={() =>
                      save.mutate({
                        id: editing.id,
                        title: editing.title,
                        slug: editing.slug,
                        excerpt: editing.excerpt || null,
                        cover_url: editing.cover_url || null,
                        body_md: editing.body_md || "",
                        category_id: editing.category_id || null,
                        status: editing.status,
                        tags: editing.tags ?? [],
                      })
                    }
                    className="rounded-full bg-primary text-primary-foreground px-5 py-2 font-bold disabled:opacity-60"
                  >
                    {save.isPending ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoriesTab() {
  const listFn = useServerFn(listCategoriesPublic);
  const upsertFn = useServerFn(upsertCategory);
  const delFn = useServerFn(deleteCategory);
  const qc = useQueryClient();
  const cats = useQuery({ queryKey: ["blog", "cats"], queryFn: () => listFn() });
  const [name, setName] = useState("");

  const add = useMutation({
    mutationFn: () => upsertFn({ data: { name, slug: slugify(name) } }),
    onSuccess: () => {
      setName("");
      qc.invalidateQueries({ queryKey: ["blog", "cats"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["blog", "cats"] }),
  });

  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border border-input bg-background px-4 py-2"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          disabled={!name.trim() || add.isPending}
          onClick={() => add.mutate()}
          className="rounded-full bg-primary text-primary-foreground font-bold px-4 py-2 disabled:opacity-60"
        >
          Add
        </button>
      </div>
      <ul className="mt-4 divide-y divide-border">
        {(cats.data?.categories ?? []).map((c: any) => (
          <li key={c.id} className="flex items-center justify-between py-3">
            <span>
              <b>{c.name}</b> <span className="text-muted-foreground text-sm">/{c.slug}</span>
            </span>
            <button onClick={() => del.mutate(c.id)} className="text-tomato font-bold text-sm">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CommentsTab() {
  const listFn = useServerFn(listAllComments);
  const modFn = useServerFn(moderateComment);
  const delFn = useServerFn(deleteComment);
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-blog", "comments"], queryFn: () => listFn() });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "pending" | "approved" | "rejected" }) => modFn({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blog", "comments"] }),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-blog", "comments"] }),
  });

  return (
    <div className="space-y-3">
      {(q.data?.comments ?? []).length === 0 && (
        <p className="text-muted-foreground">No comments yet.</p>
      )}
      {(q.data?.comments ?? []).map((c: any) => (
        <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm">
                <b>{c.profiles?.full_name ?? "Anonymous"}</b> on{" "}
                <i>{c.blog_posts?.title ?? "post"}</i>
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(c.created_at).toLocaleString()} · {c.status}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setStatus.mutate({ id: c.id, status: "approved" })}
                className="text-xs font-bold text-leaf-foreground bg-leaf rounded-full px-3 py-1"
              >
                Approve
              </button>
              <button
                onClick={() => setStatus.mutate({ id: c.id, status: "rejected" })}
                className="text-xs font-bold bg-background border border-border rounded-full px-3 py-1"
              >
                Reject
              </button>
              <button
                onClick={() => del.mutate(c.id)}
                className="text-xs font-bold text-tomato"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
