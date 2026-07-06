import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getMe,
  listLeads,
  updateLeadStatus,
  listUsers,
  assignRole,
  listClasses,
  createClass,
  deleteClass,
  listTeacherAssignments,
  assignTeacherClass,
  listMyClasses,
  listStudents,
  addStudent,
  deleteStudent,
  getAttendance,
  markAttendance,
  listHomework,
  createHomework,
  deleteHomework,
} from "@/lib/school.functions";
import logo from "@/assets/logo.asset.json";

type Role = "admin" | "teacher" | "parent";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Mighty Mindz" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const getMeFn = useServerFn(getMe);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) navigate({ to: "/auth" });
      else setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => getMeFn(),
    enabled: checked,
  });

  if (!checked || me.isLoading) {
    return <FullscreenLoader />;
  }
  if (me.error) {
    return <ErrorState message={me.error.message} onRetry={() => me.refetch()} />;
  }

  const data = me.data!;
  const roles = data.roles as Role[];
  const primary: Role =
    (["admin", "teacher", "parent"] as Role[]).find((r) => roles.includes(r)) ?? "parent";

  return (
    <DashboardShell email={data.email} roles={roles} primary={primary} name={data.profile?.full_name ?? null}>
      {primary === "admin" && <AdminHome />}
      {primary === "teacher" && <TeacherHome />}
      {primary === "parent" && (
        <ParentHome
          childName={data.profile?.child_name ?? null}
          parentName={data.profile?.full_name ?? null}
        />
      )}
    </DashboardShell>
  );
}

/* ---------- Shell ---------- */
function DashboardShell({
  email,
  roles,
  primary,
  name,
  children,
}: {
  email: string | null;
  roles: Role[];
  primary: Role;
  name: string | null;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }
  const roleBadge: Record<Role, { label: string; cls: string; emoji: string }> = {
    admin: { label: "Admin", cls: "bg-tomato text-white", emoji: "🛠" },
    teacher: { label: "Teacher", cls: "bg-primary text-primary-foreground", emoji: "👩‍🏫" },
    parent: { label: "Parent", cls: "bg-leaf text-leaf-foreground", emoji: "👨‍👩‍👧" },
  };
  const b = roleBadge[primary];

  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo.url} alt="Mighty Mindz" className="h-9 w-auto" />
          </Link>
          <span className={`ml-2 rounded-full px-3 py-1 text-xs font-bold ${b.cls}`}>
            {b.emoji} {b.label}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden md:block text-right leading-tight">
              <div className="text-sm font-semibold">{name ?? email}</div>
              <div className="text-xs text-muted-foreground">{email}</div>
            </div>
            <button
              onClick={signOut}
              className="rounded-full bg-background border border-border text-sm font-semibold px-4 py-2 hover:bg-cream transition"
            >
              Sign out
            </button>
          </div>
        </div>
        {roles.length > 1 && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 pb-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center">Also:</span>
            {roles
              .filter((r) => r !== primary)
              .map((r) => (
                <span key={r} className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-foreground">
                  {roleBadge[r].emoji} {roleBadge[r].label}
                </span>
              ))}
          </div>
        )}
      </header>
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">{children}</main>
    </div>
  );
}

/* ---------- Admin ---------- */
function AdminHome() {
  const qc = useQueryClient();
  const listLeadsFn = useServerFn(listLeads);
  const updateFn = useServerFn(updateLeadStatus);
  const listUsersFn = useServerFn(listUsers);
  const assignFn = useServerFn(assignRole);

  const leads = useQuery({ queryKey: ["leads"], queryFn: () => listLeadsFn() });
  const users = useQuery({ queryKey: ["users"], queryFn: () => listUsersFn() });

  const setStatus = useMutation({
    mutationFn: (v: { id: string; status: "new" | "contacted" | "enrolled" | "declined" }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const toggleRole = useMutation({
    mutationFn: (v: { user_id: string; role: Role; action: "add" | "remove" }) => assignFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("Role updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="grid gap-8">
      <Section title="Admission enquiries" subtitle="Public form submissions from the website">
        {leads.isLoading ? (
          <SkeletonRows />
        ) : (leads.data ?? []).length === 0 ? (
          <EmptyState emoji="📭" label="No enquiries yet." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Parent</th>
                  <th className="p-3">Child</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Program</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.data!.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{l.parent_name}</td>
                    <td className="p-3">
                      {l.child_name}
                      {l.child_age ? <span className="text-muted-foreground"> · {l.child_age}y</span> : null}
                    </td>
                    <td className="p-3">
                      <div>{l.phone}</div>
                      {l.email && <div className="text-xs text-muted-foreground">{l.email}</div>}
                    </td>
                    <td className="p-3">{l.program ?? "—"}</td>
                    <td className="p-3">
                      <StatusPill status={l.status} />
                    </td>
                    <td className="p-3">
                      <select
                        value={l.status}
                        onChange={(e) =>
                          setStatus.mutate({ id: l.id, status: e.target.value as "new" | "contacted" | "enrolled" | "declined" })
                        }
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold"
                      >
                        <option value="new">new</option>
                        <option value="contacted">contacted</option>
                        <option value="enrolled">enrolled</option>
                        <option value="declined">declined</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Users & roles" subtitle="Grant admin, teacher, parent or student access">
        {users.isLoading ? (
          <SkeletonRows />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Roles</th>
                  <th className="p-3">Grant / revoke</th>
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{u.full_name ?? "—"}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 flex flex-wrap gap-1">
                      {u.roles.length === 0 && <span className="text-muted-foreground text-xs">none</span>}
                      {u.roles.map((r) => (
                        <span key={r} className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold">
                          {r}
                        </span>
                      ))}
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(["admin", "teacher", "parent", "student"] as Role[]).map((r) => {
                          const has = u.roles.includes(r);
                          return (
                            <button
                              key={r}
                              onClick={() =>
                                toggleRole.mutate({ user_id: u.id, role: r, action: has ? "remove" : "add" })
                              }
                              className={`rounded-full px-2.5 py-1 text-xs font-bold border transition ${
                                has
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-cream"
                              }`}
                            >
                              {has ? "✓ " : "+ "}
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <ClassesAdminSection users={users.data ?? []} />
    </div>
  );
}

/* ---------- Admin: classes + teacher assignments ---------- */
function ClassesAdminSection({ users }: { users: Array<{ id: string; full_name: string | null; email: string; roles: string[] }> }) {
  const qc = useQueryClient();
  const listClassesFn = useServerFn(listClasses);
  const createClassFn = useServerFn(createClass);
  const deleteClassFn = useServerFn(deleteClass);
  const listAssignFn = useServerFn(listTeacherAssignments);
  const assignFn = useServerFn(assignTeacherClass);

  const classes = useQuery({ queryKey: ["classes"], queryFn: () => listClassesFn() });
  const assigns = useQuery({ queryKey: ["assigns"], queryFn: () => listAssignFn() });
  const [className, setClassName] = useState("");

  const teachers = users.filter((u) => u.roles.includes("teacher"));

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
    mutationFn: (v: { teacher_id: string; class_id: string; action: "add" | "remove" }) => assignFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assigns"] });
      toast.success("Assignment updated");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const assignSet = new Set((assigns.data ?? []).map((a) => `${a.teacher_id}:${a.class_id}`));

  return (
    <Section title="Classes & teacher assignments" subtitle="Create classes, assign teachers, view students">
      <div className="grid gap-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = className.trim();
            if (!name) {
              toast.error("Please enter a class name");
              return;
            }
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
                onDelete={() => confirm(`Delete class "${c.name}"?`) && remove.mutate(c.id)}
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
            {students.data ? `${students.data.length} student${students.data.length === 1 ? "" : "s"}` : "Tap to view students"}
          </div>
        </div>
        <div className="flex flex-wrap gap-1 max-w-full">
          {teachers.length === 0 ? (
            <span className="text-xs text-muted-foreground self-center">
              No teachers — grant the teacher role above.
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
        <div className="border-t border-border bg-cream/40 p-4">
          {students.isLoading ? (
            <SkeletonRows />
          ) : (students.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No students in this class yet. Teachers can add them from their dashboard.
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



function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    new: "bg-sunshine text-sunshine-foreground",
    contacted: "bg-primary text-primary-foreground",
    enrolled: "bg-leaf text-leaf-foreground",
    declined: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[status] ?? "bg-muted"}`}>{status}</span>
  );
}

/* ---------- Teacher ---------- */
function TeacherHome() {
  const listMyClassesFn = useServerFn(listMyClasses);
  const myClasses = useQuery({ queryKey: ["my-classes"], queryFn: () => listMyClassesFn() });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && myClasses.data && myClasses.data.length > 0) {
      setSelectedId(myClasses.data[0].id);
    }
  }, [myClasses.data, selectedId]);

  if (myClasses.isLoading) return <SkeletonRows />;

  const classes = myClasses.data ?? [];
  if (classes.length === 0) {
    return (
      <EmptyState
        emoji="🏫"
        label="No classes assigned yet. Ask an admin to assign a class to you."
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap gap-2">
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedId(c.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold border transition ${
              selectedId === c.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-cream"
            }`}
          >
            🏫 {c.name}
          </button>
        ))}
      </div>
      {selectedId && <ClassPanel key={selectedId} classId={selectedId} />}
    </div>
  );
}

function ClassPanel({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const listStudentsFn = useServerFn(listStudents);
  const addStudentFn = useServerFn(addStudent);
  const deleteStudentFn = useServerFn(deleteStudent);
  const getAttFn = useServerFn(getAttendance);
  const markAttFn = useServerFn(markAttendance);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [form, setForm] = useState({ name: "", roll_no: "", phone: "" });

  const students = useQuery({
    queryKey: ["students", classId],
    queryFn: () => listStudentsFn({ data: { class_id: classId } }),
  });
  const attendance = useQuery({
    queryKey: ["att", classId, date],
    queryFn: () => getAttFn({ data: { class_id: classId, date } }),
  });

  const attMap = new Map(
    (attendance.data ?? []).map((a) => [a.student_id, a.status as "present" | "absent" | "late"]),
  );

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
      qc.invalidateQueries({ queryKey: ["att", classId, date] });
      toast.success("Removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const markMut = useMutation({
    mutationFn: (v: { student_id: string; status: "present" | "absent" | "late" }) =>
      markAttFn({
        data: { class_id: classId, student_id: v.student_id, date, status: v.status },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["att", classId, date] }),
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

      <Card title="Attendance" emoji="✅">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-semibold">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
          />
        </div>
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
                  <th className="p-3">Status</th>
                  <th className="p-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.data!.map((s) => {
                  const status = attMap.get(s.id);
                  return (
                    <tr key={s.id} className="border-t border-border">
                      <td className="p-3 font-semibold">{s.roll_no}</td>
                      <td className="p-3">{s.name}</td>
                      <td className="p-3 text-muted-foreground">{s.phone ?? "—"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          {(["present", "absent", "late"] as const).map((st) => {
                            const active = status === st;
                            const cls =
                              st === "present"
                                ? active
                                  ? "bg-leaf text-leaf-foreground border-leaf"
                                  : "hover:bg-leaf/10"
                                : st === "absent"
                                  ? active
                                    ? "bg-tomato text-white border-tomato"
                                    : "hover:bg-tomato/10"
                                  : active
                                    ? "bg-sunshine text-sunshine-foreground border-sunshine"
                                    : "hover:bg-sunshine/20";
                            return (
                              <button
                                key={st}
                                onClick={() => markMut.mutate({ student_id: s.id, status: st })}
                                className={`rounded-full px-3 py-1 text-xs font-bold border border-border transition ${cls}`}
                              >
                                {st === "present" ? "P" : st === "absent" ? "A" : "L"}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => confirm(`Remove ${s.name}?`) && delMut.mutate(s.id)}
                          className="rounded-full border border-border bg-background text-xs font-bold px-2.5 py-1 hover:bg-cream"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Tap P (present), A (absent) or L (late) — saved instantly.
        </p>
      </Card>

      <TeacherHomeworkCard classId={classId} />
    </div>
  );
}

/* ---------- Homework ---------- */
function TeacherHomeworkCard({ classId }: { classId: string }) {
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
                  {h.due_date ? `Due ${new Date(h.due_date).toLocaleDateString()}` : "No due date"}
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

function ParentHomeworkCard() {
  const listFn = useServerFn(listHomework);
  const hw = useQuery({
    queryKey: ["homework-all"],
    queryFn: () => listFn({ data: {} }),
  });

  return (
    <Card title="Homework & assignments" emoji="📚" className="md:col-span-3">
      {hw.isLoading ? (
        <SkeletonRows />
      ) : (hw.data ?? []).length === 0 ? (
        <EmptyState emoji="📭" label="No homework posted yet. Check back soon." />
      ) : (
        <ul className="space-y-2">
          {hw.data!.slice(0, 10).map((h) => (
            <li key={h.id} className="rounded-2xl border border-border bg-cream/40 p-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-semibold text-sm">
                  {h.subject && <span className="text-primary">{h.subject} · </span>}
                  {h.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  🏫 {h.classes?.name ?? "Class"} ·{" "}
                  {h.due_date ? `Due ${new Date(h.due_date).toLocaleDateString()}` : "No due date"}
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


/* ---------- Parent (includes former student features) ---------- */
function ParentHome({ childName, parentName }: { childName: string | null; parentName: string | null }) {
  const kid = childName ?? "your little one";
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card title={`Hi ${parentName ?? "there"}! 🎉`} emoji="🌞" className="md:col-span-3">
        <p className="text-sm">
          Here's what's happening with {kid} today — a peek at the day, notices from school, and quick ways to reach us.
        </p>
      </Card>

      <Card title={childName ? `${childName}'s week` : "Your child's week"} emoji="🌈" className="md:col-span-2">
        <p className="text-sm text-muted-foreground">
          Progress, activities and photos will appear here once your child's teacher posts them.
        </p>
      </Card>
      <Card title="School notices" emoji="🔔">
        <ul className="text-sm space-y-2">
          <li>🎨 Art day this Friday — send old clothes.</li>
          <li>📅 Parent-teacher meet: 15th of next month.</li>
        </ul>
      </Card>

      <Card title={`${childName ?? "Today's"} schedule`} emoji="🗓">
        <ul className="text-sm space-y-1">
          <li>9:00 — Circle time</li>
          <li>10:00 — Art & craft</li>
          <li>11:30 — Outdoor play</li>
          <li>12:30 — Story time</li>
        </ul>
      </Card>
      <Card title="Fun fact of the day" emoji="🐘">
        <p className="text-sm">Elephants can't jump — but they can swim really well! Share it with {kid} tonight.</p>
      </Card>
      <FeesCard childName={childName} />
      <ParentHomeworkCard />


      <Card title="Chat with school" emoji="💬" className="md:col-span-3">
        <p className="text-sm text-muted-foreground mb-2">
          Reach out via WhatsApp for quick answers, or the AI helper on the bottom right for admissions info.
        </p>
        <a
          href="https://wa.me/351930656040"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-full bg-leaf text-leaf-foreground text-sm font-bold px-4 py-2"
        >
          Open WhatsApp
        </a>
      </Card>
    </div>
  );
}

/* ---------- Fees (demo) ---------- */
const FEE_ITEMS = [
  { label: "Tuition — Nov", amount: 4500 },
  { label: "Activity kit", amount: 800 },
  { label: "Snacks & meals", amount: 1200 },
];
const UPI_ID = "mightymindz@upi";
const PAYEE_NAME = "Mighty Mindz Preschool";
const BANK = {
  name: "HDFC Bank",
  account: "50100 1234 5678",
  ifsc: "HDFC0001234",
  branch: "MG Road, Bengaluru",
};

function FeesCard({ childName }: { childName: string | null }) {
  const total = FEE_ITEMS.reduce((s, i) => s + i.amount, 0);
  const [tab, setTab] = useState<"qr" | "upi" | "bank">("qr");
  const [paid, setPaid] = useState(false);
  const note = `MightyMindz fees${childName ? " - " + childName : ""}`;
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(
    PAYEE_NAME,
  )}&am=${total}&cu=INR&tn=${encodeURIComponent(note)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiLink,
  )}`;

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <Card title="Fees" emoji="💳" className="md:col-span-3">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="rounded-2xl border border-border bg-cream/60 p-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
              This month
            </div>
            <ul className="text-sm space-y-1.5">
              {FEE_ITEMS.map((i) => (
                <li key={i.label} className="flex justify-between">
                  <span>{i.label}</span>
                  <span className="font-semibold">₹{i.amount.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-border flex justify-between items-baseline">
              <span className="font-display font-bold">Total due</span>
              <span className="font-display font-bold text-2xl">
                ₹{total.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Demo billing · Due by 10th of the month
            </div>
          </div>
          {paid && (
            <div className="mt-3 rounded-2xl border border-leaf/40 bg-leaf/10 p-3 text-sm">
              ✅ Payment marked as received (demo). We'll email a receipt shortly.
            </div>
          )}
          <button
            onClick={() => setPaid(true)}
            className="mt-3 w-full rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2"
          >
            I've paid — mark as done
          </button>
        </div>

        <div>
          <div className="flex gap-2 mb-3">
            {(["qr", "upi", "bank"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold border transition ${
                  tab === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-cream"
                }`}
              >
                {t === "qr" ? "Scan QR" : t === "upi" ? "UPI ID" : "Bank transfer"}
              </button>
            ))}
          </div>

          {tab === "qr" && (
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <img
                src={qrSrc}
                alt="Demo UPI QR"
                className="mx-auto rounded-xl border border-border bg-white p-2"
                width={220}
                height={220}
              />
              <div className="text-xs text-muted-foreground mt-2">
                Scan with any UPI app (GPay / PhonePe / Paytm)
              </div>
              <div className="text-sm font-semibold mt-1">₹{total.toLocaleString("en-IN")}</div>
            </div>
          )}

          {tab === "upi" && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <Row label="UPI ID" value={UPI_ID} onCopy={() => copy(UPI_ID, "UPI ID")} />
              <Row label="Payee" value={PAYEE_NAME} />
              <Row
                label="Amount"
                value={`₹${total.toLocaleString("en-IN")}`}
                onCopy={() => copy(String(total), "Amount")}
              />
              <a
                href={upiLink}
                className="block text-center rounded-full bg-leaf text-leaf-foreground text-sm font-bold px-4 py-2"
              >
                Open in UPI app
              </a>
            </div>
          )}

          {tab === "bank" && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <Row label="Account name" value={PAYEE_NAME} />
              <Row
                label="Account no."
                value={BANK.account}
                onCopy={() => copy(BANK.account.replace(/\s/g, ""), "Account number")}
              />
              <Row label="IFSC" value={BANK.ifsc} onCopy={() => copy(BANK.ifsc, "IFSC")} />
              <Row label="Bank" value={`${BANK.name} · ${BANK.branch}`} />
              <div className="text-xs text-muted-foreground">
                Add child's name in the transfer remarks so we can match your payment.
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
        >
          Copy
        </button>
      )}
    </div>
  );
}

/* ---------- UI bits ---------- */
function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="text-xl font-display font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
function Card({ title, emoji, children, className = "" }: { title: string; emoji?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-3xl border border-border p-5 shadow-sm ${className}`}>
      <h3 className="font-display font-bold text-lg mb-3">
        {emoji && <span className="mr-2">{emoji}</span>}
        {title}
      </h3>
      {children}
    </div>
  );
}
function EmptyState({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
      <div className="text-3xl mb-2">{emoji}</div>
      {label}
    </div>
  );
}
function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 rounded-xl bg-cream animate-pulse" />
      ))}
    </div>
  );
}
function FullscreenLoader() {
  return (
    <div className="min-h-screen bg-cream grid place-items-center">
      <div className="text-muted-foreground text-sm">Loading your dashboard…</div>
    </div>
  );
}
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-cream grid place-items-center px-4">
      <div className="max-w-md text-center bg-card rounded-3xl border border-border p-8">
        <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-4">{message}</p>
        <button onClick={onRetry} className="rounded-full bg-primary text-primary-foreground font-bold px-4 py-2">Try again</button>
      </div>
    </div>
  );
}
