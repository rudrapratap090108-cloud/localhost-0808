import { createFileRoute, useNavigate, Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMe } from "@/lib/school.functions";
import logo from "@/assets/logo.asset.json";
import { FullscreenLoader, ErrorState } from "@/components/dashboard/ui";
import { MeContext, type Me, type Role } from "@/components/dashboard/me";
import { NotificationsBell } from "@/components/dashboard/notifications-bell";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Mighty Mindz" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DashboardLayout,
});

const NAV: Array<{
  to:
    | "/dashboard"
    | "/dashboard/leads"
    | "/dashboard/users"
    | "/dashboard/classes"
    | "/dashboard/students"
    | "/dashboard/attendance"
    | "/dashboard/homework"
    | "/dashboard/fees"
    | "/dashboard/assignments"
    | "/dashboard/announcements"
    | "/dashboard/complaints"
    | "/dashboard/results"
    | "/dashboard/gallery"
    | "/dashboard/cctv"
    | "/dashboard/profile"
    | "/dashboard/create-parent"
    | "/dashboard/blog";
  label: string;
  emoji: string;
  roles: Role[];
}> = [
  { to: "/dashboard", label: "Overview", emoji: "🏠", roles: ["admin", "teacher", "parent"] },
  { to: "/dashboard/leads", label: "Enquiries", emoji: "📮", roles: ["admin"] },
  { to: "/dashboard/users", label: "Users & roles", emoji: "👥", roles: ["admin"] },
  { to: "/dashboard/classes", label: "Classes", emoji: "🏫", roles: ["admin"] },
  { to: "/dashboard/blog", label: "Blog", emoji: "📰", roles: ["admin"] },
  { to: "/dashboard/create-parent", label: "New parent", emoji: "🪪", roles: ["admin", "teacher"] },
  { to: "/dashboard/students", label: "My students", emoji: "👶", roles: ["teacher"] },
  { to: "/dashboard/attendance", label: "Attendance", emoji: "✅", roles: ["teacher"] },
  { to: "/dashboard/homework", label: "Homework", emoji: "📚", roles: ["teacher", "parent"] },
  { to: "/dashboard/announcements", label: "Announcements", emoji: "📣", roles: ["admin", "teacher", "parent"] },
  { to: "/dashboard/complaints", label: "Complaints", emoji: "✉️", roles: ["admin", "teacher", "parent"] },
  { to: "/dashboard/results", label: "Results", emoji: "🎓", roles: ["admin", "teacher", "parent"] },
  { to: "/dashboard/gallery", label: "Gallery", emoji: "🖼️", roles: ["admin", "teacher", "parent"] },
  { to: "/dashboard/cctv", label: "CCTV", emoji: "📹", roles: ["parent", "admin"] },
  { to: "/dashboard/assignments", label: "Fee assignments", emoji: "🧾", roles: ["admin", "teacher", "parent"] },
  { to: "/dashboard/fees", label: "Fees", emoji: "💳", roles: ["parent", "admin", "teacher"] },
  { to: "/dashboard/profile", label: "Profile", emoji: "🙂", roles: ["admin", "teacher", "parent"] },
];

const SOCIALS = [
  { label: "Instagram", emoji: "📸", url: "https://www.instagram.com/reel/DaczE6oyvWX/?igsh=MnVxZWF5Y2x3ejE3" },
  { label: "Facebook", emoji: "📘", url: "https://www.facebook.com/reel/4114081708882705/" },
  { label: "WhatsApp", emoji: "💬", url: "https://wa.me/918400100348" },
];


function DashboardLayout() {
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

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => getMeFn(),
    enabled: checked,
  });

  if (!checked || meQ.isLoading) return <FullscreenLoader />;
  if (meQ.error)
    return <ErrorState message={meQ.error.message} onRetry={() => meQ.refetch()} />;

  const data = meQ.data!;
  const roles = data.roles as Role[];
  const primary: Role =
    (["admin", "teacher", "parent"] as Role[]).find((r) => roles.includes(r)) ?? "parent";
  const me: Me = {
    userId: data.userId,
    email: data.email,
    roles,
    primary,
    profile: data.profile,
  };

  const badge: Record<Role, { label: string; cls: string; emoji: string }> = {
    admin: { label: "Admin", cls: "bg-tomato text-white", emoji: "🛠" },
    teacher: { label: "Teacher", cls: "bg-primary text-primary-foreground", emoji: "👩‍🏫" },
    parent: { label: "Parent", cls: "bg-leaf text-leaf-foreground", emoji: "👨‍👩‍👧" },
  };
  const b = badge[primary];

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const visibleNav = NAV.filter((item) => item.roles.some((r) => roles.includes(r)));

  return (
    <MeContext.Provider value={me}>
      <div className="min-h-screen bg-cream">
        <header className="bg-card border-b border-border sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-24 flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo.url} alt="Mighty Mindz" className="h-20 w-auto" />
            </Link>
            <span className={`ml-2 rounded-full px-3 py-1 text-xs font-bold ${b.cls}`}>
              {b.emoji} {b.label}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <NotificationsBell userId={data.userId} />
              <div className="hidden md:block text-right leading-tight">
                <div className="text-sm font-semibold">{data.profile?.full_name ?? data.email}</div>
                <div className="text-xs text-muted-foreground">{data.email}</div>
              </div>
              <button
                onClick={signOut}
                className="rounded-full bg-background border border-border text-sm font-semibold px-4 py-2 hover:bg-cream transition"
              >
                Sign out
              </button>
            </div>
          </div>
          <nav className="max-w-7xl mx-auto px-4 md:px-8 pb-3 flex flex-wrap gap-1.5 overflow-x-auto">
            {visibleNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/dashboard" }}
                activeProps={{
                  className:
                    "bg-primary text-primary-foreground border-primary",
                }}
                inactiveProps={{
                  className: "bg-background border-border hover:bg-cream",
                }}
                className="rounded-full border text-xs font-bold px-3 py-1.5 transition whitespace-nowrap"
              >
                {item.emoji} {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <Outlet />
        </main>
      </div>
    </MeContext.Provider>
  );
}
