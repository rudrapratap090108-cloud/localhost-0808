import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/components/dashboard/me";
import { LeadsSection } from "@/components/dashboard/leads-section";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/leads")({
  head: () => ({ meta: [{ title: "Enquiries — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: LeadsPage,
});

function LeadsPage() {
  const me = useMe();
  if (!me.roles.includes("admin")) return <AccessDenied />;
  return <LeadsSection />;
}
