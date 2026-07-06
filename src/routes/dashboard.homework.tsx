import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMe } from "@/components/dashboard/me";
import { ClassPicker } from "@/components/dashboard/class-picker";
import { TeacherHomeworkPanel, ParentHomeworkList } from "@/components/dashboard/homework-panels";
import { AccessDenied } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/homework")({
  head: () => ({ meta: [{ title: "Homework — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const me = useMe();
  const [classId, setClassId] = useState<string | null>(null);
  const isTeacher = me.roles.includes("teacher");
  const isParent = me.roles.includes("parent");

  if (!isTeacher && !isParent) return <AccessDenied />;

  if (isTeacher) {
    return (
      <ClassPicker value={classId} onChange={setClassId}>
        {(id) => <TeacherHomeworkPanel key={id} classId={id} />}
      </ClassPicker>
    );
  }
  return <ParentHomeworkList />;
}
