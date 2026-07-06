import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listStudents, addStudent, deleteStudent } from "@/lib/school.functions";
import { Card, EmptyState, SkeletonRows } from "./ui";

export function StudentsPanel({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const listStudentsFn = useServerFn(listStudents);
  const addStudentFn = useServerFn(addStudent);
  const deleteStudentFn = useServerFn(deleteStudent);
  const [form, setForm] = useState({ name: "", roll_no: "", phone: "" });

  const students = useQuery({
    queryKey: ["students", classId],
    queryFn: () => listStudentsFn({ data: { class_id: classId } }),
  });

  const addMut = useMutation({
    mutationFn: () =>
      addStudentFn({
        data: {
          class_id: classId,
          name: form.name.trim(),
          roll_no: form.roll_no.trim(),
          phone: form.phone.trim() || undefined,
        },
      }),
    onSuccess: () => {
      setForm({ name: "", roll_no: "", phone: "" });
      qc.invalidateQueries({ queryKey: ["students", classId] });
      toast.success("Student added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => deleteStudentFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["students", classId] });
      toast.success("Removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="grid gap-6">
      <Card title="Add a student" emoji="➕">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (form.name.trim() && form.roll_no.trim()) addMut.mutate();
          }}
          className="grid md:grid-cols-4 gap-2"
        >
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Full name"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
            maxLength={100}
            required
          />
          <input
            value={form.roll_no}
            onChange={(e) => setForm((f) => ({ ...f, roll_no: e.target.value }))}
            placeholder="Roll no."
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            maxLength={30}
            required
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="Phone (optional)"
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            maxLength={20}
          />
          <button
            type="submit"
            disabled={addMut.isPending}
            className="md:col-span-4 rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2 disabled:opacity-50"
          >
            {addMut.isPending ? "Adding…" : "Add student"}
          </button>
        </form>
      </Card>

      <Card title="Students" emoji="👶">
        {students.isLoading ? (
          <SkeletonRows />
        ) : (students.data ?? []).length === 0 ? (
          <EmptyState emoji="👶" label="No students yet. Add one above." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Roll</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.data!.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{s.roll_no}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3 text-muted-foreground">{s.phone ?? "—"}</td>
                    <td className="p-3">
                      <button
                        onClick={() => confirm(`Remove ${s.name}?`) && delMut.mutate(s.id)}
                        className="rounded-full border border-border bg-background text-xs font-bold px-2.5 py-1 hover:bg-cream"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
