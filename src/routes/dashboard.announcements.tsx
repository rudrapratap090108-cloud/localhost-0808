import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/components/dashboard/me";
import { Card, EmptyState, SkeletonRows, Section } from "@/components/dashboard/ui";
import {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/lib/school.functions";

export const Route = createFileRoute("/dashboard/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const me = useMe();
  const isStaff = me.roles.includes("admin") || me.roles.includes("teacher");
  const qc = useQueryClient();
  const listFn = useServerFn(listAnnouncements);
  const createFn = useServerFn(createAnnouncement);
  const delFn = useServerFn(deleteAnnouncement);
  const q = useQuery({ queryKey: ["announcements"], queryFn: () => listFn() });

  const [form, setForm] = useState({
    title: "",
    body: "",
    audience: "all" as "all" | "parents" | "teachers",
  });

  const addMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: form.title.trim(),
          body: form.body.trim(),
          audience: form.audience,
        },
      }),
    onSuccess: () => {
      setForm({ title: "", body: "", audience: "all" });
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Announcement posted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["announcements"] });
      toast.success("Removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="grid gap-6">
      <Section
        title="Announcements"
        subtitle="School news, reminders and events."
      >
        {isStaff && (
          <Card title="Post an announcement" emoji="📣">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!form.title.trim() || !form.body.trim()) {
                  return toast.error("Add a title and message");
                }
                addMut.mutate();
              }}
              className="grid gap-2"
            >
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                maxLength={120}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Write your announcement…"
                rows={4}
                maxLength={4000}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                required
              />
              <div className="flex flex-wrap gap-2 items-center">
                <label className="text-xs text-muted-foreground">Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      audience: e.target.value as "all" | "parents" | "teachers",
                    }))
                  }
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Everyone</option>
                  <option value="parents">Parents only</option>
                  <option value="teachers">Teachers & admin</option>
                </select>
                <button
                  type="submit"
                  disabled={addMut.isPending}
                  className="ml-auto rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
                >
                  {addMut.isPending ? "Posting…" : "Post"}
                </button>
              </div>
            </form>
          </Card>
        )}

        <div className="mt-4">
          {q.isLoading ? (
            <SkeletonRows />
          ) : (q.data ?? []).length === 0 ? (
            <EmptyState emoji="🌤️" label="No announcements yet." />
          ) : (
            <ul className="space-y-3">
              {q.data!.map((a) => {
                const canDelete = a.created_by === me.userId || me.roles.includes("admin");
                return (
                  <li
                    key={a.id}
                    className="rounded-2xl border border-border bg-card p-4"
                  >
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div className="font-semibold">{a.title}</div>
                      <span className="text-xs rounded-full bg-cream border border-border px-2 py-0.5">
                        {a.audience === "all"
                          ? "Everyone"
                          : a.audience === "parents"
                            ? "Parents"
                            : "Teachers"}
                      </span>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{a.body}</p>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center justify-between gap-3">
                      <span>{new Date(a.created_at).toLocaleString()}</span>
                      {canDelete && (
                        <button
                          onClick={() =>
                            confirm("Delete this announcement?") && delMut.mutate(a.id)
                          }
                          className="rounded-full border border-border bg-background text-xs font-bold px-2.5 py-1 hover:bg-cream text-tomato"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
}
