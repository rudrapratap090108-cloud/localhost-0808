import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMe } from "@/components/dashboard/me";
import { ClassPicker } from "@/components/dashboard/class-picker";
import { StudentsPanel } from "@/components/dashboard/students-panel";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/students")({
  head: () => ({ meta: [{ title: "My students — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const me = useMe();
  const [classId, setClassId] = useState<string | null>(null);
  if (!me.roles.includes("teacher")) return <AccessDenied />;
  return (
    <ClassPicker value={classId} onChange={setClassId}>
      {(id) => <StudentsPanel key={id} classId={id} />}
    </ClassPicker>
  );
}
