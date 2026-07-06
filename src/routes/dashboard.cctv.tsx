import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/dashboard/ui";
import { useMe } from "@/components/dashboard/me";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/cctv")({
  head: () => ({ meta: [{ title: "Live CCTV — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: CctvPage,
});

const CAMERAS = [
  { id: "playground", label: "Playground", emoji: "🛝" },
  { id: "class-a", label: "Classroom A", emoji: "🅰️" },
  { id: "class-b", label: "Classroom B", emoji: "🅱️" },
  { id: "cafeteria", label: "Cafeteria", emoji: "🍎" },
  { id: "entrance", label: "Main entrance", emoji: "🚪" },
  { id: "art-room", label: "Art room", emoji: "🎨" },
];

type CameraRow = {
  id: string;
  name: string;
  serial_no: string;
  password: string;
  created_at: string;
};

function CctvPage() {
  const me = useMe();
  const isAdmin = me.roles.includes("admin");

  return (
    <div className="grid gap-6">
      <Card title="Live CCTV" emoji="📹">
        <p className="text-sm text-muted-foreground">
          Live camera feeds from around the school. Streams are throttled to protect
          bandwidth and are only available during school hours (8:00 AM – 4:30 PM).
        </p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-sunshine/40 px-3 py-1 text-xs font-bold">
          ⚙️ Live streams are being set up. Below is a preview of the camera grid.
        </div>
      </Card>

      {isAdmin && <AdminCameras />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CAMERAS.map((c) => (
          <div key={c.id} className="bg-card rounded-3xl border border-border overflow-hidden shadow-sm">
            <div className="relative aspect-video bg-black text-white grid place-items-center overflow-hidden">
              <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-slate-700 via-slate-900 to-black" />
              <div className="relative text-center">
                <div className="text-5xl mb-2">{c.emoji}</div>
                <div className="text-xs uppercase tracking-widest opacity-70">Feed coming soon</div>
              </div>
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-tomato/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE (demo)
              </div>
              <div className="absolute bottom-2 right-2 text-[10px] font-mono opacity-80">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
            <div className="p-3">
              <div className="font-display font-bold text-sm">{c.label}</div>
              <div className="text-xs text-muted-foreground">HD · 15 fps</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCameras() {
  const [rows, setRows] = useState<CameraRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [serial, setSerial] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reveal, setReveal] = useState<Record<string, boolean>>({});

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cameras")
      .select("id,name,serial_no,password,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setRows((data ?? []) as CameraRow[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !serial.trim() || !password) {
      toast.error("Fill in name, serial number and password.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("cameras").insert({
      name: name.trim(),
      serial_no: serial.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Camera registered");
    setName("");
    setSerial("");
    setPassword("");
    load();
  }

  async function onDelete(id: string) {
    if (!confirm("Remove this camera?")) return;
    const { error } = await supabase.from("cameras").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Camera removed");
      setRows((r) => r.filter((x) => x.id !== id));
    }
  }

  return (
    <Card title="Register a camera" emoji="🔐">
      <p className="text-sm text-muted-foreground">
        Add cameras by their serial number and access password. Only admins can see this list.
      </p>

      <form onSubmit={onAdd} className="mt-4 grid gap-3 md:grid-cols-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Camera name (e.g. Playground)"
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm md:col-span-1"
          maxLength={80}
        />
        <input
          value={serial}
          onChange={(e) => setSerial(e.target.value)}
          placeholder="Serial number"
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm md:col-span-1"
          maxLength={120}
          autoComplete="off"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          className="rounded-2xl border border-border bg-background px-3 py-2 text-sm md:col-span-1"
          maxLength={200}
          autoComplete="new-password"
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-2xl bg-primary text-primary-foreground font-bold px-4 py-2 text-sm disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Add camera"}
        </button>
      </form>

      <div className="mt-6">
        <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
          Registered cameras ({rows.length})
        </div>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">No cameras registered yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Serial no</th>
                  <th className="px-3 py-2">Password</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{r.name}</td>
                    <td className="px-3 py-2 font-mono text-xs">{r.serial_no}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      <button
                        type="button"
                        onClick={() => setReveal((s) => ({ ...s, [r.id]: !s[r.id] }))}
                        className="underline-offset-2 hover:underline"
                      >
                        {reveal[r.id] ? r.password : "••••••••"}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        className="text-xs font-bold text-tomato hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
