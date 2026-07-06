import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/components/dashboard/me";
import { Card } from "@/components/dashboard/ui";
import { updateMyProfile } from "@/lib/school.functions";

export const Route = createFileRoute("/dashboard/profile")({
  head: () => ({ meta: [{ title: "Profile — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const me = useMe();
  const qc = useQueryClient();
  const updateFn = useServerFn(updateMyProfile);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    full_name: me.profile?.full_name ?? "",
    phone: me.profile?.phone ?? "",
    child_name: me.profile?.child_name ?? "",
    class_name: me.profile?.class_name ?? "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(me.profile?.avatar_url ?? null);

  const save = useMutation({
    mutationFn: (extra?: { avatar_url?: string }) =>
      updateFn({ data: { ...form, ...(extra ?? {}) } }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("Max 5MB");
    setBusy(true);
    try {
      const path = `${me.userId}/avatar_${Date.now()}_${f.name.replace(/[^\w.-]+/g, "_")}`;
      const up = await supabase.storage.from("profile-photos").upload(path, f, { upsert: true });
      if (up.error) throw new Error(up.error.message);
      const { data: signed } = await supabase.storage
        .from("profile-photos")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? "";
      setAvatarUrl(url);
      await save.mutateAsync({ avatar_url: url });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const isParent = me.roles.includes("parent");

  return (
    <div className="max-w-2xl grid gap-6">
      <Card title="Your profile" emoji="🙂">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-cream border border-border overflow-hidden grid place-items-center text-3xl">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{(form.full_name || me.email || "?").slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPhoto}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
            >
              {busy ? "Uploading…" : avatarUrl ? "Change photo" : "Upload photo"}
            </button>
            <div className="text-xs text-muted-foreground mt-1">Max 5MB · JPG/PNG</div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(undefined);
          }}
          className="grid gap-2"
        >
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Your name</label>
          <input
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            maxLength={100}
          />
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
            maxLength={20}
          />
          {isParent && (
            <>
              <label className="text-xs uppercase tracking-wide text-muted-foreground">
                Child's name (auto-suggested from your registered name)
              </label>
              <input
                value={form.child_name}
                onChange={(e) => setForm((f) => ({ ...f, child_name: e.target.value }))}
                placeholder={form.full_name ? `${form.full_name.split(" ")[0]}'s child` : ""}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                maxLength={100}
              />
              <label className="text-xs uppercase tracking-wide text-muted-foreground">Child's class</label>
              <input
                value={form.class_name}
                onChange={(e) => setForm((f) => ({ ...f, class_name: e.target.value }))}
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm"
                maxLength={50}
              />
            </>
          )}
          <button
            disabled={save.isPending}
            className="mt-3 rounded-full bg-primary text-primary-foreground font-bold text-sm px-4 py-2 disabled:opacity-50"
          >
            {save.isPending ? "Saving…" : "Save profile"}
          </button>
        </form>
      </Card>
    </div>
  );
}
