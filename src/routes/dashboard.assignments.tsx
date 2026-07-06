import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/components/dashboard/me";
import { AccessDenied, Card, EmptyState, Section, SkeletonRows } from "@/components/dashboard/ui";
import {
  listParents,
  createFeeAssignment,
  listAllFeeAssignments,
  updateFeeAssignment,
  deleteFeeAssignment,
  listMyFeeAssignments,
} from "@/lib/school.functions";

export const Route = createFileRoute("/dashboard/assignments")({
  head: () => ({
    meta: [
      { title: "Fee assignments — Dashboard" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  const me = useMe();
  const isStaff = me.roles.includes("admin") || me.roles.includes("teacher");
  const isParent = me.roles.includes("parent");
  if (!isStaff && !isParent) return <AccessDenied />;
  return (
    <div className="grid gap-6">
      {isStaff && <StaffAssignments />}
      {isParent && <ParentAssignments />}
    </div>
  );
}

function money(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: "bg-sunshine text-sunshine-foreground",
    paid: "bg-leaf text-leaf-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
        map[status] ?? "bg-muted"
      }`}
    >
      {status}
    </span>
  );
}

function StaffAssignments() {
  const qc = useQueryClient();
  const parentsFn = useServerFn(listParents);
  const createFn = useServerFn(createFeeAssignment);
  const listFn = useServerFn(listAllFeeAssignments);
  const updateFn = useServerFn(updateFeeAssignment);
  const delFn = useServerFn(deleteFeeAssignment);

  const parents = useQuery({ queryKey: ["parents"], queryFn: () => parentsFn() });
  const all = useQuery({ queryKey: ["fee-assignments-all"], queryFn: () => listFn() });

  const [form, setForm] = useState({
    parent_id: "",
    student_name: "",
    student_class: "",
    title: "Tuition fee",
    amount: 0,
    period: new Date().toLocaleString("en-US", { month: "long", year: "numeric" }),
    due_date: "",
    note: "",
  });

  const selectedParent = useMemo(
    () => (parents.data ?? []).find((p) => p.id === form.parent_id),
    [parents.data, form.parent_id],
  );

  function pickParent(id: string) {
    const p = (parents.data ?? []).find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      parent_id: id,
      student_name: p?.child_name ?? f.student_name,
      student_class: p?.class_name ?? f.student_class,
    }));
  }

  const addMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          parent_id: form.parent_id,
          student_name: form.student_name.trim(),
          student_class: form.student_class || undefined,
          title: form.title.trim(),
          amount: Number(form.amount),
          period: form.period.trim(),
          due_date: form.due_date || undefined,
          note: form.note || undefined,
        },
      }),
    onSuccess: () => {
      setForm((f) => ({ ...f, amount: 0, note: "", due_date: "" }));
      qc.invalidateQueries({ queryKey: ["fee-assignments-all"] });
      qc.invalidateQueries({ queryKey: ["my-fee-assignments"] });
      toast.success("Fee assigned");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: (v: { id: string; status: "open" | "paid" | "cancelled" }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-assignments-all"] });
      qc.invalidateQueries({ queryKey: ["my-fee-assignments"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fee-assignments-all"] });
      qc.invalidateQueries({ queryKey: ["my-fee-assignments"] });
      toast.success("Removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Section
      title="Fee assignments"
      subtitle="Assign a fee to a parent. They will see it in their fees page."
    >
      <Card title="Assign a fee" emoji="🧾">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.parent_id) return toast.error("Pick a parent");
            if (!form.student_name.trim()) return toast.error("Student name");
            if (!form.title.trim()) return toast.error("Title");
            if (!form.amount || form.amount <= 0) return toast.error("Amount");
            if (!form.period.trim()) return toast.error("Period");
            addMut.mutate();
          }}
          className="grid md:grid-cols-2 gap-2"
        >
          <select
            value={form.parent_id}
            onChange={(e) => pickParent(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
            required
          >
            <option value="">
              {parents.isLoading ? "Loading parents…" : "— Select parent —"}
            </option>
            {(parents.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name ?? "Parent"}
                {p.child_name ? ` · child: ${p.child_name}` : ""}
                {p.class_name ? ` (${p.class_name})` : ""}
              </option>
            ))}
          </select>
          <input
            value={form.student_name}
            onChange={(e) => setForm((f) => ({ ...f, student_name: e.target.value }))}
            placeholder="Student name"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            value={form.student_class}
            onChange={(e) => setForm((f) => ({ ...f, student_class: e.target.value }))}
            placeholder="Class"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Title (e.g. Tuition, Trip, Books)"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            type="number"
            min={1}
            value={form.amount || ""}
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            placeholder="Amount (₹)"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            value={form.period}
            onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))}
            placeholder="Period (e.g. Nov 2026)"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            required
          />
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          />
          <textarea
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            placeholder="Note (optional)"
            rows={2}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          />
          <button
            disabled={addMut.isPending}
            className="md:col-span-2 rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
          >
            {addMut.isPending
              ? "Saving…"
              : `Assign ${selectedParent ? "to " + (selectedParent.full_name ?? "parent") : "fee"}`}
          </button>
        </form>
      </Card>

      <div className="mt-4">
        <Card title="All assignments" emoji="📚">
          {all.isLoading ? (
            <SkeletonRows />
          ) : (all.data ?? []).length === 0 ? (
            <EmptyState emoji="🗃️" label="No fees assigned yet." />
          ) : (
            <ul className="space-y-2">
              {all.data!.map((a) => (
                <li
                  key={a.id}
                  className="rounded-2xl border border-border bg-cream/40 p-3"
                >
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="font-semibold text-sm">
                      {a.title} — {a.student_name}
                      {a.student_class ? ` · ${a.student_class}` : ""}
                    </div>
                    <StatusPill status={a.status} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {money(Number(a.amount))} · {a.period}
                    {a.due_date && ` · due ${new Date(a.due_date).toLocaleDateString()}`}
                  </div>
                  {a.note && <div className="text-xs mt-1">{a.note}</div>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {a.status !== "paid" && (
                      <button
                        onClick={() => updateMut.mutate({ id: a.id, status: "paid" })}
                        className="rounded-full bg-leaf text-leaf-foreground text-xs font-bold px-3 py-1"
                      >
                        Mark paid
                      </button>
                    )}
                    {a.status !== "cancelled" && (
                      <button
                        onClick={() =>
                          updateMut.mutate({ id: a.id, status: "cancelled" })
                        }
                        className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
                      >
                        Cancel
                      </button>
                    )}
                    {a.status !== "open" && (
                      <button
                        onClick={() => updateMut.mutate({ id: a.id, status: "open" })}
                        className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
                      >
                        Reopen
                      </button>
                    )}
                    <button
                      onClick={() =>
                        confirm("Delete this assignment?") && delMut.mutate(a.id)
                      }
                      className="ml-auto rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream text-tomato"
                    >
                      Delete
                    </button>
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

function ParentAssignments() {
  const listFn = useServerFn(listMyFeeAssignments);
  const q = useQuery({ queryKey: ["my-fee-assignments"], queryFn: () => listFn() });

  return (
    <Section
      title="Fees assigned to you"
      subtitle="Assigned by your teacher or the principal. Pay any amount from the Fees page."
    >
      <Card title="Your assigned fees" emoji="💳">
        {q.isLoading ? (
          <SkeletonRows />
        ) : (q.data ?? []).length === 0 ? (
          <EmptyState emoji="✨" label="Nothing pending right now." />
        ) : (
          <ul className="space-y-2">
            {q.data!.map((a) => (
              <li
                key={a.id}
                className="rounded-2xl border border-border bg-cream/40 p-3"
              >
                <div className="flex items-baseline justify-between gap-3 flex-wrap">
                  <div className="font-semibold text-sm">
                    {a.title} — {a.student_name}
                    {a.student_class ? ` · ${a.student_class}` : ""}
                  </div>
                  <StatusPill status={a.status} />
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {money(Number(a.amount))} · {a.period}
                  {a.due_date && ` · due ${new Date(a.due_date).toLocaleDateString()}`}
                </div>
                {a.note && <div className="text-xs mt-1">{a.note}</div>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Section>
  );
}
