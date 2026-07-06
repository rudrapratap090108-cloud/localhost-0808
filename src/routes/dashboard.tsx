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
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card title="My classes" emoji="🏫">
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between"><span>Playgroup A</span><span className="text-muted-foreground">14 kids</span></li>
          <li className="flex justify-between"><span>Nursery B</span><span className="text-muted-foreground">18 kids</span></li>
        </ul>
      </Card>
      <Card title="Today's attendance" emoji="✅">
        <p className="text-sm text-muted-foreground">Attendance grid module — coming soon.</p>
      </Card>
      <Card title="Send a notice" emoji="📣">
        <textarea
          placeholder="Reminder: Please pack a water bottle tomorrow…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          rows={3}
        />
        <button className="mt-2 rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2">Post to parents</button>
        <p className="text-xs text-muted-foreground mt-2">Delivery to parent inboxes ships in the next update.</p>
      </Card>
      <Card title="Homework & assignments" emoji="📚">
        <p className="text-sm text-muted-foreground">Assignments module — coming soon.</p>
      </Card>
    </div>
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
      <Card title="Fees" emoji="💳">
        <p className="text-sm text-muted-foreground">Fee ledger and online payment — coming soon.</p>
      </Card>

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
