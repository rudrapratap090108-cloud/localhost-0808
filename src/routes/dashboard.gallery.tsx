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

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 80;

function GalleryPage() {
  const me = useMe();
  const qc = useQueryClient();
  const listFn = useServerFn(listGallery);
  const addFn = useServerFn(addGalleryImage);
  const delFn = useServerFn(deleteGalleryImage);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
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
    if (!f) return toast.error("Choose a photo or video");
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) return toast.error("Only images or videos are allowed");
    const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (f.size > maxMb * 1024 * 1024) return toast.error(`Max ${maxMb}MB`);
    setBusy(true);
    setProgress(10);
    try {
      const path = `${me.userId}/${Date.now()}_${f.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await supabase.storage.from("gallery").upload(path, f, {
        upsert: false,
        contentType: f.type,
      });
      if (up.error) throw new Error(up.error.message);
      setProgress(80);
      await addFn({
        data: { storage_path: path, title, media_type: isVideo ? "video" : "image" },
      });
      setProgress(100);
      setTitle("");
      if (fileRef.current) fileRef.current.value = "";
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success(isVideo ? "Video uploaded" : "Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }

  return (
    <div className="grid gap-6">
      {canUpload && (
        <Card title="Upload photo or video" emoji="⬆️">
          <form onSubmit={onUpload} className="grid md:grid-cols-3 gap-2">
            <input
              type="file"
              accept="image/*,video/*"
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
          {busy && progress > 0 && (
            <div className="mt-3 h-2 bg-cream rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Photos up to {MAX_IMAGE_MB}MB · Videos up to {MAX_VIDEO_MB}MB (mp4, mov, webm)
          </p>
        </Card>
      )}

      <Card title="School gallery" emoji="🖼️">
        {q.isLoading ? (
          <SkeletonRows />
        ) : (q.data ?? []).length === 0 ? (
          <EmptyState emoji="📷" label="No photos or videos yet." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {q.data!.map((img) => {
              const isVideo = (img as { media_type?: string }).media_type === "video";
              return (
                <div
                  key={img.id}
                  className="relative group rounded-2xl overflow-hidden border border-border bg-cream"
                >
                  {isVideo ? (
                    <video
                      src={img.url}
                      controls
                      preload="metadata"
                      className="w-full h-40 object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={img.url}
                      alt={img.title ?? "Gallery"}
                      className="w-full h-40 object-cover"
                      loading="lazy"
                    />
                  )}
                  {img.title && (
                    <div className="p-2 text-xs font-semibold truncate">
                      {isVideo ? "🎬 " : ""}{img.title}
                    </div>
                  )}
                  {(me.roles.includes("admin") || img.uploaded_by === me.userId) && (
                    <button
                      onClick={() =>
                        confirm(`Delete this ${isVideo ? "video" : "photo"}?`) && del.mutate(img.id)
                      }
                      className="absolute top-2 right-2 rounded-full bg-tomato text-white text-xs font-bold px-2 py-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// Guard for parents who somehow open direct nav in future
export function _AccessDenied() { return <AccessDenied />; }
