import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "./me";
import {
  listHomework,
  createHomework,
  deleteHomework,
  listHomeworkMedia,
  addHomeworkMedia,
  deleteHomeworkMedia,
} from "@/lib/school.functions";
import { downloadHomeworkPdf } from "@/lib/pdf";
import { Card, EmptyState, SkeletonRows } from "./ui";

type HwRow = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  subject: string | null;
  due_date: string | null;
  classes?: { name: string } | null;
};

export function TeacherHomeworkPanel({ classId }: { classId: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listHomework);
  const createFn = useServerFn(createHomework);
  const delFn = useServerFn(deleteHomework);
  const [form, setForm] = useState({ title: "", subject: "", due_date: "", description: "" });

  const hw = useQuery({
    queryKey: ["homework", classId],
    queryFn: () => listFn({ data: { class_id: classId } }),
  });

  const addMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          class_id: classId,
          title: form.title.trim(),
          subject: form.subject.trim() || undefined,
          due_date: form.due_date || undefined,
          description: form.description.trim() || undefined,
        },
      }),
    onSuccess: () => {
      setForm({ title: "", subject: "", due_date: "", description: "" });
      qc.invalidateQueries({ queryKey: ["homework", classId] });
      qc.invalidateQueries({ queryKey: ["homework-all"] });
      toast.success("Homework posted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });
  const delMut = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homework", classId] });
      qc.invalidateQueries({ queryKey: ["homework-all"] });
      toast.success("Removed");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <Card title="Homework & assignments" emoji="📚">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.title.trim()) return toast.error("Add a title");
          addMut.mutate();
        }}
        className="grid md:grid-cols-6 gap-2 mb-4"
      >
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="Title (e.g. Maths page 12)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-3"
          maxLength={150}
          required
        />
        <input
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="Subject"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-2"
          maxLength={60}
        />
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
        />
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Instructions (optional)"
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-6"
          rows={2}
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={addMut.isPending}
          className="md:col-span-6 rounded-full bg-primary text-primary-foreground text-sm font-bold px-4 py-2 disabled:opacity-50"
        >
          {addMut.isPending ? "Posting…" : "Post homework"}
        </button>
      </form>

      {hw.isLoading ? (
        <SkeletonRows />
      ) : (hw.data ?? []).length === 0 ? (
        <EmptyState emoji="📭" label="No homework posted yet." />
      ) : (
        <ul className="space-y-3">
          {(hw.data as HwRow[]).map((h) => (
            <HomeworkItem
              key={h.id}
              hw={h}
              canEdit
              onDelete={() => confirm("Delete this homework?") && delMut.mutate(h.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ParentHomeworkList() {
  const listFn = useServerFn(listHomework);
  const hw = useQuery({
    queryKey: ["homework-all"],
    queryFn: () => listFn({ data: {} }),
  });

  return (
    <Card title="Homework & assignments" emoji="📚">
      {hw.isLoading ? (
        <SkeletonRows />
      ) : (hw.data ?? []).length === 0 ? (
        <EmptyState emoji="📭" label="No homework posted yet. Check back soon." />
      ) : (
        <ul className="space-y-3">
          {(hw.data as HwRow[]).map((h) => (
            <HomeworkItem key={h.id} hw={h} canEdit={false} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function HomeworkItem({
  hw,
  canEdit,
  onDelete,
}: {
  hw: HwRow;
  canEdit: boolean;
  onDelete?: () => void;
}) {
  const me = useMe();
  const qc = useQueryClient();
  const listMedia = useServerFn(listHomeworkMedia);
  const addMedia = useServerFn(addHomeworkMedia);
  const delMedia = useServerFn(deleteHomeworkMedia);
  const [showMedia, setShowMedia] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const media = useQuery({
    queryKey: ["hw-media", hw.id],
    queryFn: () => listMedia({ data: { homework_id: hw.id } }),
    enabled: showMedia,
  });

  const delMed = useMutation({
    mutationFn: (id: string) => delMedia({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hw-media", hw.id] });
      toast.success("Removed");
    },
  });

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) return toast.error("Only images or videos");
    const limit = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
    if (f.size > limit) return toast.error(isVideo ? "Max 100MB" : "Max 10MB");
    setBusy(true);
    try {
      const path = `${hw.id}/${Date.now()}_${f.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await supabase.storage
        .from("homework-media")
        .upload(path, f, { upsert: false, contentType: f.type });
      if (up.error) throw new Error(up.error.message);
      await addMedia({
        data: {
          homework_id: hw.id,
          storage_path: path,
          kind: isVideo ? "video" : "image",
          size_bytes: f.size,
        },
      });
      qc.invalidateQueries({ queryKey: ["hw-media", hw.id] });
      setShowMedia(true);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function downloadPdf() {
    let items: Array<{ url: string; kind: "image" | "video" }> = [];
    if (media.data) {
      items = media.data.map((m) => ({ url: m.url, kind: m.kind as "image" | "video" }));
    } else {
      const fetched = await listMedia({ data: { homework_id: hw.id } });
      items = fetched.map((m) => ({ url: m.url, kind: m.kind as "image" | "video" }));
    }
    await downloadHomeworkPdf({
      title: hw.title,
      subject: hw.subject,
      className: hw.classes?.name ?? "-",
      due_date: hw.due_date,
      description: hw.description,
      media: items,
    });
  }

  return (
    <li className="rounded-2xl border border-border bg-cream/40 p-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">
            {hw.subject && <span className="text-primary">{hw.subject} · </span>}
            {hw.title}
          </div>
          {hw.description && (
            <div className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
              {hw.description}
            </div>
          )}
          <div className="text-xs text-muted-foreground mt-1">
            {hw.classes?.name && `🏫 ${hw.classes.name} · `}
            {hw.due_date
              ? `Due ${new Date(hw.due_date).toLocaleDateString()}`
              : "No due date"}
          </div>
        </div>
        {canEdit && onDelete && (
          <button
            onClick={onDelete}
            className="rounded-full border border-border bg-background text-xs font-bold px-2.5 py-1 hover:bg-cream text-tomato"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={() => setShowMedia((v) => !v)}
          className="rounded-full border border-border bg-background text-xs font-bold px-3 py-1 hover:bg-cream"
        >
          {showMedia ? "Hide attachments" : "Show attachments"}
        </button>
        <button
          onClick={downloadPdf}
          className="rounded-full bg-leaf text-leaf-foreground text-xs font-bold px-3 py-1"
        >
          ⬇ Download PDF
        </button>
        {canEdit && (me.roles.includes("teacher") || me.roles.includes("admin")) && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={upload}
              className="hidden"
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-3 py-1 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "+ Photo / video"}
            </button>
          </>
        )}
      </div>

      {showMedia && (
        <div className="mt-3">
          {media.isLoading ? (
            <div className="text-xs text-muted-foreground">Loading…</div>
          ) : (media.data ?? []).length === 0 ? (
            <div className="text-xs text-muted-foreground">No attachments.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {media.data!.map((m) => (
                <div key={m.id} className="relative group rounded-xl overflow-hidden border border-border bg-black">
                  {m.kind === "image" ? (
                    <img
                      src={m.url}
                      alt="Homework attachment"
                      className="w-full h-28 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <video src={m.url} controls className="w-full h-28 object-cover" />
                  )}
                  <a
                    href={m.url}
                    download
                    target="_blank"
                    rel="noopener"
                    className="absolute bottom-1 left-1 rounded-full bg-white/90 text-black text-[10px] font-bold px-2 py-0.5"
                  >
                    ⬇ Download
                  </a>
                  {canEdit && (
                    <button
                      onClick={() => confirm("Delete this attachment?") && delMed.mutate(m.id)}
                      className="absolute top-1 right-1 rounded-full bg-tomato text-white text-[10px] font-bold px-2 py-0.5 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
