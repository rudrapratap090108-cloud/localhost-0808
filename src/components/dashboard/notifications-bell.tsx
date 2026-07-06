import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

type Notif = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationsBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  async function load() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (data) setItems(data as Notif[]);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`notif-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [userId]);

  const unread = items.filter((n) => !n.read_at).length;

  async function markAll() {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    load();
  }

  async function openItem(n: Notif) {
    if (!n.read_at) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id);
    }
    setOpen(false);
    if (n.link) navigate({ to: n.link as never });
    load();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full bg-background border border-border h-10 w-10 flex items-center justify-center hover:bg-cream transition"
        aria-label="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-tomato text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-card border border-border rounded-xl shadow-lg z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card">
              <div className="font-bold text-sm">Notifications</div>
              {unread > 0 && (
                <button onClick={markAll} className="text-xs text-primary font-semibold hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => openItem(n)}
                      className={`w-full text-left px-4 py-3 border-b border-border hover:bg-cream transition ${
                        !n.read_at ? "bg-cream/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.read_at && (
                          <span className="mt-1.5 h-2 w-2 rounded-full bg-tomato flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{n.title}</div>
                          {n.body && (
                            <div className="text-xs text-muted-foreground line-clamp-2">{n.body}</div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
