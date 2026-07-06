import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/components/dashboard/me";
import { FeesCard, FeeVerificationPanel } from "@/components/dashboard/fees-card";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/fees")({
  head: () => ({ meta: [{ title: "Fees — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: FeesPage,
});

function FeesPage() {
  const me = useMe();
  const isParent = me.roles.includes("parent");
  const isStaff = me.roles.includes("admin") || me.roles.includes("teacher");
  if (!isParent && !isStaff) return <AccessDenied />;
  return (
    <div className="grid gap-6">
      {isParent && <FeesCard childName={me.profile?.child_name ?? null} />}
      {isStaff && <FeeVerificationPanel />}
    </div>
  );
}
