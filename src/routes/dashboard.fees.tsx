import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/components/dashboard/me";
import { FeesCard } from "@/components/dashboard/fees-card";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/fees")({
  head: () => ({ meta: [{ title: "Fees — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: FeesPage,
});

function FeesPage() {
  const me = useMe();
  if (!me.roles.includes("parent")) return <AccessDenied />;
  return <FeesCard childName={me.profile?.child_name ?? null} />;
}
