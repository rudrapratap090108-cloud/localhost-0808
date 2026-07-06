import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMe } from "@/components/dashboard/me";
import { ClassPicker } from "@/components/dashboard/class-picker";
import { AttendancePanel } from "@/components/dashboard/attendance-panel";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/attendance")({
  head: () => ({ meta: [{ title: "Attendance — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: AttendancePage,
});

function AttendancePage() {
  const me = useMe();
  const [classId, setClassId] = useState<string | null>(null);
  if (!me.roles.includes("teacher")) return <AccessDenied />;
  return (
    <ClassPicker value={classId} onChange={setClassId}>
      {(id) => <AttendancePanel key={id} classId={id} />}
    </ClassPicker>
  );
}
