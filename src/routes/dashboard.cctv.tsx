import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/dashboard/ui";

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

function CctvPage() {
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
