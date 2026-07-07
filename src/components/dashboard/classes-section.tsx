import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listUsers,
  listClasses,
  createClass,
  deleteClass,
  listTeacherAssignments,
  assignTeacherClass,
  listStudents,
} from "@/lib/school.functions";
import { Section, SkeletonRows, EmptyState } from "./ui";
import { StudentsImport } from "./students-import";

export function ClassesAdminSection() {
  const qc = useQueryClient();
  const listUsersFn = useServerFn(listUsers);
  const listClassesFn = useServerFn(listClasses);
  const createClassFn = useServerFn(createClass);
  const deleteClassFn = useServerFn(deleteClass);
  const listAssignFn = useServerFn(listTeacherAssignments);
  const assignFn = useServerFn(assignTeacherClass);

  const users = useQuery({ queryKey: ["users"], queryFn: () => listUsersFn() });
  const classes = useQuery({ queryKey: ["classes"], queryFn: () => listClassesFn() });
  const assigns = useQuery({ queryKey: ["assigns"], queryFn: () => listAssignFn() });
  const [className, setClassName] = useState("");

  const teachers = (users.data ?? []).filter((u) => u.roles.includes("teacher"));

  const create = useMutation({
    mutationFn: (name: string) => createClassFn({ data: { name } }),
    onSuccess: () => {
      setClassName("");
      qc.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class added");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteClassFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["assigns"] });
      toast.success("Class removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const toggle = useMutation({
    mutationFn: (v: { teacher_id: string; class_id: string; action: "add" | "remove" }) =>
      assignFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assigns"] });
      toast.success("Assignment updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const assignSet = new Set(
    (assigns.data ?? []).map((a) => `${a.teacher_id}:${a.class_id}`),
  );

  return (
    <Section title="Classes & teacher assignments" subtitle="Create classes, assign teachers, view students">
      <div className="grid gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = className.trim();
            if (!name) return toast.error("Please enter a class name");
            create.mutate(name);
          }}
          className="flex gap-2"
        >
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Class name (e.g. Nursery A)"
            className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm"
            maxLength={60}
          />
          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2 disabled:opacity-50"
          >
            {create.isPending ? "Adding…" : "Add class"}
          </button>
        </form>

        {classes.isLoading ? (
          <SkeletonRows />
        ) : (classes.data ?? []).length === 0 ? (
          <EmptyState emoji="🏫" label="No classes yet — add one above." />
        ) : (
          <div className="grid gap-3">
            {classes.data!.map((c) => (
              <AdminClassRow
                key={c.id}
                classId={c.id}
                className={c.name}
                teachers={teachers}
                assignSet={assignSet}
                onToggleTeacher={(teacher_id, action) =>
                  toggle.mutate({ teacher_id, class_id: c.id, action })
                }
                onDelete={() =>
                  confirm(`Delete class "${c.name}"?`) && remove.mutate(c.id)
                }
              />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

function AdminClassRow({
  classId,
  className,
  teachers,
  assignSet,
  onToggleTeacher,
  onDelete,
}: {
  classId: string;
  className: string;
  teachers: Array<{ id: string; full_name: string | null; email: string }>;
  assignSet: Set<string>;
  onToggleTeacher: (teacher_id: string, action: "add" | "remove") => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const listStudentsFn = useServerFn(listStudents);
  const students = useQuery({
    queryKey: ["students", classId],
    queryFn: () => listStudentsFn({ data: { class_id: classId } }),
    enabled: open,
  });

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="p-4 flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-[180px]">
          <div className="font-display font-bold text-lg">🏫 {className}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {students.data
              ? `${students.data.length} student${students.data.length === 1 ? "" : "s"}`
              : "Tap to view students"}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 max-w-full">
          {teachers.length === 0 ? (
            <span className="text-xs text-muted-foreground self-center">
              No teachers — grant the teacher role first.
            </span>
          ) : (
            teachers.map((t) => {
              const has = assignSet.has(`${t.id}:${classId}`);
              return (
                <button
                  key={t.id}
                  onClick={() => onToggleTeacher(t.id, has ? "remove" : "add")}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold border transition ${
                    has
                      ? "bg-leaf text-leaf-foreground border-leaf"
                      : "bg-background border-border hover:bg-cream"
                  }`}
                >
                  {has ? "✓ " : "+ "}
                  {t.full_name ?? t.email}
                </button>
              );
            })
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
          >
            {open ? "Hide students" : "View students"}
          </button>
          <button
            onClick={onDelete}
            className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream text-tomato"
          >
            Delete
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-cream/40 p-4 grid gap-3">
          <StudentsImport classId={classId} />

          {students.isLoading ? (
            <SkeletonRows />
          ) : (students.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No students in this class yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm">
                <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="p-2.5">Roll</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {students.data!.map((s) => (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-2.5 font-semibold">{s.roll_no}</td>
                      <td className="p-2.5">{s.name}</td>
                      <td className="p-2.5 text-muted-foreground">{s.phone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
