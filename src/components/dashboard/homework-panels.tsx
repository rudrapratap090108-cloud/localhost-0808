import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listHomework, createHomework, deleteHomework } from "@/lib/school.functions";
import { Card, EmptyState, SkeletonRows } from "./ui";

export function TeacherHomeworkPanel({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listHomework);
  const createFn = useServerFn(createHomework);
  const delFn = useServerFn(deleteHomework);
  const [form, setForm] = useState({ title: "", subject: "", due_date: "", description: "" });

  const hw = useQuery({
    queryKey: ["homework", classId],
    queryFn: () => listFn({ data: { class_id: classId } }),
  });

  const addMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          class_id: classId,
          title: form.title.trim(),
          subject: form.subject.trim() || undefined,
          due_date: form.due_date || undefined,
          description: form.description.trim() || undefined,
        },
      }),
    onSuccess: () => {
      setForm({ title: "", subject: "", due_date: "", description: "" });
      qc.invalidateQueries({ queryKey: ["homework", classId] });
      qc.invalidateQueries({ queryKey: ["homework-all"] });
      toast.success("Homework posted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homework", classId] });
      qc.invalidateQueries({ queryKey: ["homework-all"] });
      toast.success("Removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Card title="Homework & assignments" emoji="📚">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return toast.error("Add a title");
          addMut.mutate();
        }}
        className="grid md:grid-cols-6 gap-2 mb-4"
      >
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Title (e.g. Maths page 12)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-3"
          maxLength={150}
          required
        />
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Subject"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          maxLength={60}
        />
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Instructions (optional)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-6"
          rows={2}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={addMut.isPending}
          className="md:col-span-6 rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2 disabled:opacity-50"
        >
          {addMut.isPending ? "Posting…" : "Post homework"}
        </button>
      </form>

      {hw.isLoading ? (
        <SkeletonRows />
      ) : (hw.data ?? []).length === 0 ? (
        <EmptyState emoji="📭" label="No homework posted yet." />
      ) : (
        <ul className="space-y-2">
          {hw.data!.map((h) => (
            <li
              key={h.id}
              className="rounded-2xl border border-border bg-cream/40 p-3 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {h.subject && <span className="text-primary">{h.subject} · </span>}
                  {h.title}
                </div>
                {h.description && (
                  <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                    {h.description}
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-1">
                  {h.due_date
                    ? `Due ${new Date(h.due_date).toLocaleDateString()}`
                    : "No due date"}
                </div>
              </div>
              <button
                onClick={() => confirm("Delete this homework?") && delMut.mutate(h.id)}
                className="rounded-full border border-border bg-background text-xs font-bold px-2.5 py-1 hover:bg-cream text-tomato"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ParentHomeworkList() {
  const listFn = useServerFn(listHomework);
  const hw = useQuery({
    queryKey: ["homework-all"],
    queryFn: () => listFn({ data: {} }),
  });

  return (
    <Card title="Homework & assignments" emoji="📚">
      {hw.isLoading ? (
        <SkeletonRows />
      ) : (hw.data ?? []).length === 0 ? (
        <EmptyState emoji="📭" label="No homework posted yet. Check back soon." />
      ) : (
        <ul className="space-y-2">
          {hw.data!.map((h) => (
            <li key={h.id} className="rounded-2xl border border-border bg-cream/40 p-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-semibold text-sm">
                  {h.subject && <span className="text-primary">{h.subject} · </span>}
                  {h.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  🏫 {h.classes?.name ?? "Class"} ·{" "}
                  {h.due_date
                    ? `Due ${new Date(h.due_date).toLocaleDateString()}`
                    : "No due date"}
                </div>
              </div>
              {h.description && (
                <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                  {h.description}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
