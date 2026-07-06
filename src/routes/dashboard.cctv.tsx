import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/dashboard/ui";

export const Route = createFileRoute("/dashboard/cctv")({
  head: () => ({ meta: [{ title: "Live CCTV — Dashboard" }, { name: "robots", content: "noindex" }] }),
  component: CctvPage,
});

const STEPS = [
  {
    n: 1,
    emoji: "📥",
    title: "Download the gCMOB app",
    body: "Install gCMOB from the Google Play Store (Android) or the App Store (iPhone).",
  },
  {
    n: 2,
    emoji: "▶️",
    title: "Open gCMOB",
    body: "Launch the app and skip / allow the permissions it asks for.",
  },
  {
    n: 3,
    emoji: "➕",
    title: "Tap the + icon",
    body: "On the home screen tap the + button at the top-right to add a new device.",
  },
  {
    n: 4,
    emoji: "🆔",
    title: "Choose 'InstaOn ID'",
    body: "From the add-device options, select InstaOn ID (manual add).",
  },
  {
    n: 5,
    emoji: "🔢",
    title: "Enter serial number",
    body: "Type this serial number exactly:",
    code: "2502013065027138",
  },
  {
    n: 6,
    emoji: "✏️",
    title: "Give it any name",
    body: "Enter any name you like, for example 'School CCTV'.",
  },
  {
    n: 7,
    emoji: "🔑",
    title: "Enter the password",
    body: "Use this password:",
    code: "admin@123",
  },
  {
    n: 8,
    emoji: "🎥",
    title: "Tap the device to watch live",
    body: "Once saved, tap the device to open all cameras live.",
  },
];

function CctvPage() {
  return (
    <div className="grid gap-6">
      <Card title="Live CCTV access" emoji="📹">
        <p className="text-sm text-muted-foreground">
          Parents can watch the school cameras live on their phone using the free
          <b> gCMOB </b> app. Follow the steps below — it only takes a minute.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="bg-card rounded-3xl border border-border p-5 shadow-sm flex gap-4"
          >
            <div className="shrink-0 w-12 h-12 rounded-2xl bg-sunshine/40 grid place-items-center text-2xl">
              {s.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Step {s.n}
              </div>
              <div className="font-display font-bold text-base">{s.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.body}</p>
              {s.code && (
                <div className="mt-2 inline-block font-mono text-sm bg-muted rounded-xl px-3 py-1.5 border border-border select-all">
                  {s.code}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card title="Need help?" emoji="💬">
        <p className="text-sm text-muted-foreground">
          If the app shows "device offline", check your internet and try again after a
          minute. For any other issue, contact the school office.
        </p>
      </Card>
    </div>
  );
}
