import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/components/dashboard/me";
import { ClassesAdminSection } from "@/components/dashboard/classes-section";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/classes")({
  head: () => ({ meta: [{ title: "Classes — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const me = useMe();
  if (!me.roles.includes("admin")) return <AccessDenied />;
  return <ClassesAdminSection />;
}
