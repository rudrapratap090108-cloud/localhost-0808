import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMe } from "@/components/dashboard/me";
import { Card, EmptyState, SkeletonRows, AccessDenied } from "@/components/dashboard/ui";
import {
  findResults,
  listClasses,
  listMyClasses,
  upsertResult,
  deleteResult,
  listClassResults,
} from "@/lib/school.functions";
import { downloadResultPdf } from "@/lib/pdf";

export const Route = createFileRoute("/dashboard/results")({
  head: () => ({ meta: [{ title: "Results — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const me = useMe();
  const isStaff = me.roles.includes("admin") || me.roles.includes("teacher");
  return (
    <div className="grid gap-6">
      <ParentLookup />
      {isStaff && <StaffPublisher />}
    </div>
  );
}

function ParentLookup() {
  const findFn = useServerFn(findResults);
  const classesFn = useServerFn(listClasses);
  const classesQ = useQuery({ queryKey: ["classes"], queryFn: () => classesFn() });
  const [classId, setClassId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [submitted, setSubmitted] = useState<{ class_id: string; roll_no: string } | null>(null);

  const q = useQuery({
    queryKey: ["results-find", submitted?.class_id, submitted?.roll_no],
    queryFn: () => findFn({ data: submitted! }),
    enabled: !!submitted,
  });

  return (
    <Card title="Result portal — look up by roll number" emoji="🎓">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!classId || !rollNo.trim()) return toast.error("Pick a class and enter roll no.");
          setSubmitted({ class_id: classId, roll_no: rollNo.trim() });
        }}
        className="grid md:grid-cols-4 gap-2 mb-4"
      >
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          required
        >
          <option value="">Select class…</option>
          {(classesQ.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="Roll number"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
          maxLength={30}
        />
        <button className="rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2">
          Look up
        </button>
      </form>

      {submitted && (
        q.isLoading ? (
          <SkeletonRows />
        ) : (q.data ?? []).length === 0 ? (
          <EmptyState emoji="🗂️" label="No results published for this roll yet." />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {q.data!.map((r) => (
              <div key={r.id} className="rounded-2xl border border-border bg-cream/40 p-4">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div className="font-display font-bold">
                    {r.term === "annual" ? "Annual" : "Half-yearly"} {r.year}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.classes?.name} · Roll {r.roll_no}
                  </div>
                </div>
                <div className="text-sm">{r.student_name}</div>
                <div className="mt-2 flex gap-4 text-sm">
                  <span><b>Total:</b> {r.total}/{r.max_total}</span>
                  <span><b>%:</b> {r.percentage}</span>
                  {r.grade && <span><b>Grade:</b> {r.grade}</span>}
                </div>
                <button
                  onClick={() =>
                    downloadResultPdf({
                      student_name: r.student_name,
                      roll_no: r.roll_no,
                      className: r.classes?.name ?? "-",
                      term: r.term,
                      year: r.year,
                      subjects: (r.subjects as { name: string; marks: number; max: number }[]) ?? [],
                      total: Number(r.total),
                      max_total: Number(r.max_total),
                      percentage: Number(r.percentage),
                      grade: r.grade,
                      remarks: r.remarks,
                    })
                  }
                  className="mt-3 rounded-full bg-leaf text-leaf-foreground text-xs font-bold px-3 py-1.5"
                >
                  ⬇ Download PDF
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </Card>
  );
}

function StaffPublisher() {
  const me = useMe();
  const qc = useQueryClient();
  const upsert = useServerFn(upsertResult);
  const del = useServerFn(deleteResult);
  const listClassesFn = useServerFn(listClasses);
  const myClassesFn = useServerFn(listMyClasses);
  const listResultsFn = useServerFn(listClassResults);

  const isAdmin = me.roles.includes("admin");
  const classesQ = useQuery({
    queryKey: [isAdmin ? "classes" : "my-classes"],
    queryFn: () => (isAdmin ? listClassesFn() : myClassesFn()),
  });

  const [classId, setClassId] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [term, setTerm] = useState<"half_yearly" | "annual">("half_yearly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [grade, setGrade] = useState("");
  const [remarks, setRemarks] = useState("");
  const [subjects, setSubjects] = useState([
    { name: "English", marks: 0, max: 100 },
    { name: "Maths", marks: 0, max: 100 },
    { name: "Science", marks: 0, max: 100 },
  ]);

  const listQ = useQuery({
    queryKey: ["class-results", classId],
    queryFn: () => listResultsFn({ data: { class_id: classId } }),
    enabled: !!classId,
  });

  const mut = useMutation({
    mutationFn: () =>
      upsert({
        data: {
          class_id: classId,
          roll_no: rollNo.trim(),
          student_name: studentName.trim(),
          term,
          year,
          subjects,
          grade: grade.trim() || undefined,
          remarks: remarks.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Result published");
      qc.invalidateQueries({ queryKey: ["class-results", classId] });
      qc.invalidateQueries({ queryKey: ["results-find"] });
      setRollNo("");
      setStudentName("");
      setGrade("");
      setRemarks("");
      setSubjects((s) => s.map((x) => ({ ...x, marks: 0 })));
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["class-results", classId] });
    },
  });

  const total = useMemo(() => subjects.reduce((s, x) => s + Number(x.marks || 0), 0), [subjects]);
  const max = useMemo(() => subjects.reduce((s, x) => s + Number(x.max || 0), 0), [subjects]);

  if (!me.roles.includes("admin") && !me.roles.includes("teacher"))
    return <AccessDenied />;

  return (
    <Card title="Publish result" emoji="📝">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!classId || !rollNo.trim() || !studentName.trim()) return toast.error("Fill class, roll & name");
          mut.mutate();
        }}
        className="grid md:grid-cols-4 gap-2"
      >
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          required
        >
          <option value="">Select class…</option>
          {(classesQ.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          value={rollNo}
          onChange={(e) => setRollNo(e.target.value)}
          placeholder="Roll no."
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Student name"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={term}
          onChange={(e) => setTerm(e.target.value as "half_yearly" | "annual")}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="half_yearly">Half-yearly</option>
          <option value="annual">Annual</option>
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          min={2000}
          max={2100}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Grade (A/B/…)"
          maxLength={4}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="Remarks (optional)"
          maxLength={500}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-4"
        />

        <div className="md:col-span-4 mt-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Subjects</div>
          <div className="space-y-1.5">
            {subjects.map((s, i) => (
              <div key={i} className="grid grid-cols-12 gap-2">
                <input
                  value={s.name}
                  onChange={(e) =>
                    setSubjects((arr) => arr.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))
                  }
                  placeholder="Subject"
                  className="col-span-6 rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={s.marks}
                  onChange={(e) =>
                    setSubjects((arr) =>
                      arr.map((x, k) => (k === i ? { ...x, marks: Number(e.target.value) } : x)),
                    )
                  }
                  placeholder="Marks"
                  className="col-span-3 rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                />
                <input
                  type="number"
                  value={s.max}
                  onChange={(e) =>
                    setSubjects((arr) =>
                      arr.map((x, k) => (k === i ? { ...x, max: Number(e.target.value) } : x)),
                    )
                  }
                  placeholder="Max"
                  className="col-span-2 rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setSubjects((arr) => arr.filter((_, k) => k !== i))}
                  className="col-span-1 rounded-full border border-border text-tomato text-sm"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setSubjects((s) => [...s, { name: "", marks: 0, max: 100 }])}
              className="rounded-full border border-border bg-background px-3 py-1 font-bold hover:bg-cream"
            >
              + Subject
            </button>
            <div className="font-semibold">
              Total: {total} / {max} · {max > 0 ? ((total / max) * 100).toFixed(1) : "0"}%
            </div>
          </div>
        </div>

        <button
          disabled={mut.isPending}
          className="md:col-span-4 rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
        >
          {mut.isPending ? "Publishing…" : "Publish / update"}
        </button>
      </form>

      {classId && (
        <div className="mt-6">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
            Published in this class
          </div>
          {listQ.isLoading ? (
            <SkeletonRows />
          ) : (listQ.data ?? []).length === 0 ? (
            <EmptyState emoji="📭" label="No results published yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="text-left py-1">Roll</th>
                    <th className="text-left">Name</th>
                    <th className="text-left">Term</th>
                    <th className="text-left">Year</th>
                    <th className="text-right">%</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {listQ.data!.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-1.5 font-semibold">{r.roll_no}</td>
                      <td>{r.student_name}</td>
                      <td>{r.term === "annual" ? "Annual" : "Half-yearly"}</td>
                      <td>{r.year}</td>
                      <td className="text-right">{r.percentage}%</td>
                      <td className="text-right">
                        <button
                          onClick={() => confirm("Delete this result?") && delMut.mutate(r.id)}
                          className="text-tomato text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
