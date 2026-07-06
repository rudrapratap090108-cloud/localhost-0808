import { createFileRoute, Link } from "@tanstack/react-router";
import { useMe, type Role } from "@/components/dashboard/me";
import { Card } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardIndex,
});

const LINKS: Array<{
  to:
    | "/dashboard/leads"
    | "/dashboard/users"
    | "/dashboard/classes"
    | "/dashboard/students"
    | "/dashboard/attendance"
    | "/dashboard/homework"
    | "/dashboard/fees";
  title: string;
  emoji: string;
  desc: string;
  roles: Role[];
}> = [
  { to: "/dashboard/leads", title: "Admission enquiries", emoji: "📮", desc: "See and update leads from the website form.", roles: ["admin"] },
  { to: "/dashboard/users", title: "Users & roles", emoji: "👥", desc: "Grant admin, teacher or parent access.", roles: ["admin"] },
  { to: "/dashboard/classes", title: "Classes", emoji: "🏫", desc: "Create classes and assign teachers.", roles: ["admin"] },
  { to: "/dashboard/students", title: "My students", emoji: "👶", desc: "Add and manage students in your class.", roles: ["teacher"] },
  { to: "/dashboard/attendance", title: "Attendance", emoji: "✅", desc: "Mark daily attendance for your class.", roles: ["teacher"] },
  { to: "/dashboard/homework", title: "Homework", emoji: "📚", desc: "Post assignments (teachers) or view them (parents).", roles: ["teacher", "parent"] },
  { to: "/dashboard/fees", title: "Fees", emoji: "💳", desc: "Pay this month's fees by UPI or bank transfer.", roles: ["parent"] },
];

function DashboardIndex() {
  const me = useMe();
  const cards = LINKS.filter((l) => l.roles.some((r) => me.roles.includes(r)));
  const name = me.profile?.full_name ?? "there";

  return (
    <div className="grid gap-6">
      <Card title={`Welcome back, ${name}! 🎉`} emoji="🌞">
        <p className="text-sm text-muted-foreground">
          Jump into any section below. Your role determines what you can access.
        </p>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className="bg-card rounded-3xl border border-border p-5 shadow-sm hover:shadow-md hover:border-primary transition group"
          >
            <div className="text-3xl mb-2">{c.emoji}</div>
            <h3 className="font-display font-bold text-lg group-hover:text-primary">
              {c.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
