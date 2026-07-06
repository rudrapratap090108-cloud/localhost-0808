import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/components/dashboard/me";
import { Card, EmptyState, SkeletonRows, AccessDenied } from "@/components/dashboard/ui";
import { listGallery, addGalleryImage, deleteGalleryImage } from "@/lib/school.functions";

export const Route = createFileRoute("/dashboard/gallery")({
  head: () => ({ meta: [{ title: "Gallery — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: GalleryPage,
});

function GalleryPage() {
  const me = useMe();
  const qc = useQueryClient();
  const listFn = useServerFn(listGallery);
  const addFn = useServerFn(addGalleryImage);
  const delFn = useServerFn(deleteGalleryImage);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canUpload = me.roles.includes("admin") || me.roles.includes("teacher");
  const q = useQuery({ queryKey: ["gallery"], queryFn: () => listFn() });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function onUpload(e: React.FormEvent) {
    e.preventDefault();
    const f = fileRef.current?.files?.[0];
    if (!f) return toast.error("Choose an image");
    if (f.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
    setBusy(true);
    try {
      const path = `${me.userId}/${Date.now()}_${f.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await supabase.storage.from("gallery").upload(path, f, { upsert: false });
      if (up.error) throw new Error(up.error.message);
      await addFn({ data: { storage_path: path, title } });
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6">
      {canUpload && (
        <Card title="Upload photo" emoji="⬆️">
          <form onSubmit={onUpload} className="grid md:grid-cols-3 gap-2">
            <input
              type="file"
              accept="image/*"
              ref={fileRef}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-1"
            />
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Caption (optional)"
              maxLength={100}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm md:col-span-1"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
          </form>
        </Card>
      )}

      <Card title="School gallery" emoji="🖼️">
        {q.isLoading ? (
          <SkeletonRows />
        ) : (q.data ?? []).length === 0 ? (
          <EmptyState emoji="📷" label="No photos yet." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {q.data!.map((img) => (
              <div key={img.id} className="relative group rounded-2xl overflow-hidden border border-border bg-cream">
                <img
                  src={img.url}
                  alt={img.title ?? "Gallery"}
                  className="w-full h-40 object-cover"
                  loading="lazy"
                />
                {img.title && (
                  <div className="p-2 text-xs font-semibold truncate">{img.title}</div>
                )}
                {(me.roles.includes("admin") || img.uploaded_by === me.userId) && (
                  <button
                    onClick={() => confirm("Delete this photo?") && del.mutate(img.id)}
                    className="absolute top-2 right-2 rounded-full bg-tomato text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// Guard for parents who somehow open direct nav in future
export function _AccessDenied() { return <AccessDenied />; }
