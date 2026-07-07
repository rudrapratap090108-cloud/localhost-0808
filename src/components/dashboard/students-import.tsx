import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bulkAddStudents } from "@/lib/school.functions";

type Row = { name: string; roll_no: string; phone?: string };

function pick(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of Object.keys(obj)) {
    const norm = k.toLowerCase().replace(/[\s_.-]+/g, "");
    if (keys.some((t) => norm === t || norm.includes(t))) {
      const v = obj[k];
      if (v === null || v === undefined) return "";
      return String(v).trim();
    }
  }
  return "";
}

export function StudentsImport({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const bulkFn = useServerFn(bulkAddStudents);
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Row[] | null>(null);
  const [fileName, setFileName] = useState("");

  const mut = useMutation({
    mutationFn: (students: Row[]) => bulkFn({ data: { class_id: classId, students } }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["students", classId] });
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success(`Imported ${r.inserted} student${r.inserted === 1 ? "" : "s"}`);
      setPreview(null);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Import failed"),
  });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const rows: Row[] = [];
      for (const r of json) {
        const name = pick(r, ["name", "fullname", "studentname", "childname"]);
        const roll_no = pick(r, ["rollno", "roll", "rollnumber", "admissionno", "id"]);
        const phone = pick(r, ["phone", "mobile", "contact", "parentphone", "whatsapp"]);
        if (!name || !roll_no) continue;
        rows.push({
          name: name.slice(0, 100),
          roll_no: roll_no.slice(0, 30),
          phone: phone ? phone.slice(0, 20) : undefined,
        });
      }
      if (rows.length === 0) {
        toast.error("No valid rows. Need columns: name, roll_no (phone optional)");
        setPreview(null);
        return;
      }
      setPreview(rows);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read file");
      setPreview(null);
    }
  }

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      { name: "Aarav Sharma", roll_no: "1", phone: "9876543210" },
      { name: "Isha Verma", roll_no: "2", phone: "" },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students-template.xlsx");
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="font-display font-bold">📥 Import from Excel</div>
          <div className="text-xs text-muted-foreground">
            Upload .xlsx, .xls or .xlsm — columns: name, roll_no, phone
          </div>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
        >
          Download template
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.xlsm,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel.sheet.macroEnabled.12"
          onChange={onFile}
          className="flex-1 min-w-[200px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        {preview && (
          <button
            type="button"
            disabled={mut.isPending}
            onClick={() => mut.mutate(preview)}
            className="rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2 disabled:opacity-50"
          >
            {mut.isPending ? "Importing…" : `Import ${preview.length}`}
          </button>
        )}
      </div>
      {preview && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="bg-cream text-xs px-3 py-2 font-semibold">
            {fileName} · {preview.length} row{preview.length === 1 ? "" : "s"} ready
          </div>
          <div className="max-h-60 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-2">Roll</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((r, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="p-2 font-semibold">{r.roll_no}</td>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-muted-foreground">{r.phone ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div className="text-xs text-muted-foreground p-2 text-center">
                …and {preview.length - 50} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
