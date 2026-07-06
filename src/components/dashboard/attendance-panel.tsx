import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listStudents, getAttendance, markAttendance } from "@/lib/school.functions";
import { Card, EmptyState, SkeletonRows } from "./ui";

export function AttendancePanel({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const listStudentsFn = useServerFn(listStudents);
  const getAttFn = useServerFn(getAttendance);
  const markAttFn = useServerFn(markAttendance);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  const students = useQuery({
    queryKey: ["students", classId],
    queryFn: () => listStudentsFn({ data: { class_id: classId } }),
  });
  const attendance = useQuery({
    queryKey: ["att", classId, date],
    queryFn: () => getAttFn({ data: { class_id: classId, date } }),
  });

  const attMap = new Map(
    (attendance.data ?? []).map((a) => [a.student_id, a.status as "present" | "absent" | "late"]),
  );

  const markMut = useMutation({
    mutationFn: (v: { student_id: string; status: "present" | "absent" | "late" }) =>
      markAttFn({
        data: { class_id: classId, student_id: v.student_id, date, status: v.status },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["att", classId, date] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Card title="Attendance" emoji="✅">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-sm font-semibold">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>
      {students.isLoading ? (
        <SkeletonRows />
      ) : (students.data ?? []).length === 0 ? (
        <EmptyState emoji="👶" label="No students yet. Add students first." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-cream text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="p-3">Roll</th>
                <th className="p-3">Name</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.data!.map((s) => {
                const status = attMap.get(s.id);
                return (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3 font-semibold">{s.roll_no}</td>
                    <td className="p-3">{s.name}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {(["present", "absent", "late"] as const).map((st) => {
                          const active = status === st;
                          const cls =
                            st === "present"
                              ? active
                                ? "bg-leaf text-leaf-foreground border-leaf"
                                : "hover:bg-leaf/10"
                              : st === "absent"
                                ? active
                                  ? "bg-tomato text-white border-tomato"
                                  : "hover:bg-tomato/10"
                                : active
                                  ? "bg-sunshine text-sunshine-foreground border-sunshine"
                                  : "hover:bg-sunshine/20";
                          return (
                            <button
                              key={st}
                              onClick={() =>
                                markMut.mutate({ student_id: s.id, status: st })
                              }
                              className={`rounded-full px-3 py-1 text-xs font-bold border border-border transition ${cls}`}
                            >
                              {st === "present" ? "P" : st === "absent" ? "A" : "L"}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-3">
        Tap P (present), A (absent) or L (late) — saved instantly.
      </p>
    </Card>
  );
}
