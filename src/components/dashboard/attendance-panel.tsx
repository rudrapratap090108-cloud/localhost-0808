import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listStudents,
  getAttendance,
  markAttendance,
  getAttendanceRange,
} from "@/lib/school.functions";
import { downloadAttendancePdf } from "@/lib/pdf";
import { Card, EmptyState, SkeletonRows } from "./ui";

export function AttendancePanel({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const listStudentsFn = useServerFn(listStudents);
  const getAttFn = useServerFn(getAttendance);
  const markAttFn = useServerFn(markAttendance);
  const rangeFn = useServerFn(getAttendanceRange);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);

  // Report range — defaults to current month
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [downloading, setDownloading] = useState(false);

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

  async function downloadPdf(rangeFrom: string, rangeTo: string) {
    if (rangeFrom > rangeTo) return toast.error("From date must be before To date");
    setDownloading(true);
    try {
      const res = await rangeFn({
        data: { class_id: classId, from: rangeFrom, to: rangeTo },
      });
      if (!res.students.length) {
        toast.error("No students in this class");
        return;
      }
      await downloadAttendancePdf({
        className: res.className,
        from: rangeFrom,
        to: rangeTo,
        students: res.students,
        records: res.records,
      });
      toast.success("PDF downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setDownloading(false);
    }
  }

  function thisMonth() {
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    setFrom(start);
    setTo(today);
    void downloadPdf(start, today);
  }

  function lastMonth() {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    const sf = s.toISOString().slice(0, 10);
    const ef = e.toISOString().slice(0, 10);
    setFrom(sf);
    setTo(ef);
    void downloadPdf(sf, ef);
  }

  return (
    <div className="grid gap-6">
      <Card title="Attendance" emoji="✅">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-semibold">Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => downloadPdf(date, date)}
            disabled={downloading}
            className="ml-auto rounded-full bg-sky text-sky-foreground font-bold text-xs px-3 py-1.5 disabled:opacity-50"
          >
            📥 Download this day
          </button>
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

      <Card title="Download attendance report" emoji="📄">
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-end">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => downloadPdf(from, to)}
            disabled={downloading}
            className="rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
          >
            {downloading ? "Preparing…" : "📥 Download PDF"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={thisMonth}
            disabled={downloading}
            className="rounded-full border border-border text-xs font-bold px-3 py-1.5 hover:bg-cream disabled:opacity-50"
          >
            This month
          </button>
          <button
            onClick={lastMonth}
            disabled={downloading}
            className="rounded-full border border-border text-xs font-bold px-3 py-1.5 hover:bg-cream disabled:opacity-50"
          >
            Last month
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Choose any date range or use quick presets. PDF includes each student's daily status and P/A/L totals.
        </p>
      </Card>
    </div>
  );
}
