import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/components/dashboard/me";
import { AccessDenied, Card, EmptyState, SkeletonRows, Section } from "@/components/dashboard/ui";
import {
  listMyComplaints,
  listAllComplaints,
  createComplaint,
  replyComplaint,
} from "@/lib/school.functions";

export const Route = createFileRoute("/dashboard/complaints")({
  head: () => ({
    meta: [
      { title: "Complaints — Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ComplaintsPage,
});

type Status = "open" | "in_progress" | "resolved";

function ComplaintsPage() {
  const me = useMe();
  const isParent = me.roles.includes("parent");
  const isStaff = me.roles.includes("admin") || me.roles.includes("teacher");
  if (!isParent && !isStaff) return <AccessDenied />;
  return (
    <div className="grid gap-6">
      {isParent && <ParentComplaints />}
      {isStaff && <StaffComplaints />}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-sunshine text-sunshine-foreground",
    in_progress: "bg-primary text-primary-foreground",
    resolved: "bg-leaf text-leaf-foreground",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
        map[status] ?? "bg-muted"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function ParentComplaints() {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyComplaints);
  const createFn = useServerFn(createComplaint);
  const [form, setForm] = useState({ subject: "", body: "" });
  const q = useQuery({ queryKey: ["my-complaints"], queryFn: () => listFn() });

  const addMut = useMutation({
    mutationFn: () =>
      createFn({
        data: { subject: form.subject.trim(), body: form.body.trim() },
      }),
    onSuccess: () => {
      setForm({ subject: "", body: "" });
      qc.invalidateQueries({ queryKey: ["my-complaints"] });
      toast.success("Complaint submitted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Section title="Complaints & feedback" subtitle="We read every message.">
      <Card title="Send a complaint or suggestion" emoji="✉️">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.subject.trim() || !form.body.trim())
              return toast.error("Add subject and message");
            addMut.mutate();
          }}
          className="grid gap-2"
        >
          <input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Subject"
            maxLength={150}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Describe your concern…"
            rows={4}
            maxLength={4000}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <button
            disabled={addMut.isPending}
            className="rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
          >
            {addMut.isPending ? "Sending…" : "Send"}
          </button>
        </form>
      </Card>

      <div className="mt-4">
        <Card title="My complaints" emoji="📜">
          {q.isLoading ? (
            <SkeletonRows />
          ) : (q.data ?? []).length === 0 ? (
            <EmptyState emoji="✨" label="You haven't sent any complaints." />
          ) : (
            <ul className="space-y-3">
              {q.data!.map((c) => (
                <li
                  key={c.id}
                  className="rounded-2xl border border-border bg-cream/40 p-3"
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="font-semibold text-sm">{c.subject}</div>
                    <StatusPill status={c.status} />
                  </div>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
                  {c.admin_reply && (
                    <div className="mt-2 rounded-xl bg-card border border-border p-2">
                      <div className="text-xs font-bold text-primary mb-1">
                        School reply
                      </div>
                      <div className="text-sm whitespace-pre-wrap">
                        {c.admin_reply}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-2">
                    {new Date(c.created_at).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Section>
  );
}

function StaffComplaints() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllComplaints);
  const replyFn = useServerFn(replyComplaint);
  const q = useQuery({ queryKey: ["all-complaints"], queryFn: () => listFn() });
  const [filter, setFilter] = useState<Status | "all">("open");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const replyMut = useMutation({
    mutationFn: (v: { id: string; status: Status; admin_reply?: string }) =>
      replyFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-complaints"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const rows = (q.data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <Section title="Parent complaints" subtitle="Reply and close resolved items.">
      <Card title="Inbox" emoji="📥">
        <div className="flex gap-2 mb-3 flex-wrap">
          {(["open", "in_progress", "resolved", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-bold border transition ${
                filter === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-cream"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
        {q.isLoading ? (
          <SkeletonRows />
        ) : rows.length === 0 ? (
          <EmptyState emoji="✨" label="Nothing here." />
        ) : (
          <ul className="space-y-3">
            {rows.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-cream/40 p-3"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="font-semibold text-sm">{c.subject}</div>
                  <StatusPill status={c.status} />
                </div>
                <p className="text-sm mt-1 whitespace-pre-wrap">{c.body}</p>
                {c.admin_reply && (
                  <div className="mt-2 rounded-xl bg-card border border-border p-2">
                    <div className="text-xs font-bold text-primary mb-1">
                      Previous reply
                    </div>
                    <div className="text-sm whitespace-pre-wrap">
                      {c.admin_reply}
                    </div>
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">
                  {new Date(c.created_at).toLocaleString()}
                </div>

                <div className="mt-3 grid gap-2">
                  <textarea
                    value={drafts[c.id] ?? ""}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [c.id]: e.target.value }))
                    }
                    placeholder="Write a reply (optional)"
                    rows={2}
                    className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() =>
                        replyMut.mutate({
                          id: c.id,
                          status: "in_progress",
                          admin_reply: drafts[c.id] || undefined,
                        })
                      }
                      className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-3 py-1"
                    >
                      In progress
                    </button>
                    <button
                      onClick={() =>
                        replyMut.mutate({
                          id: c.id,
                          status: "resolved",
                          admin_reply: drafts[c.id] || undefined,
                        })
                      }
                      className="rounded-full bg-leaf text-leaf-foreground text-xs font-bold px-3 py-1"
                    >
                      ✓ Resolve
                    </button>
                    <button
                      onClick={() =>
                        replyMut.mutate({
                          id: c.id,
                          status: "open",
                          admin_reply: drafts[c.id] || undefined,
                        })
                      }
                      className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Section>
  );
}
