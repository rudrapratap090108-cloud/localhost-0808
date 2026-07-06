import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/components/dashboard/me";
import { UsersSection } from "@/components/dashboard/users-section";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/users")({
  head: () => ({ meta: [{ title: "Users & roles — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: UsersPage,
});

function UsersPage() {
  const me = useMe();
  if (!me.roles.includes("admin")) return <AccessDenied />;
  return <UsersSection />;
}
