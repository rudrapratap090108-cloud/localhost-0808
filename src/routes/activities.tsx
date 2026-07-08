import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";
import childPlayingVideo from "@/assets/child-playing.mp4.asset.json";
import activityImg from "@/assets/activity.jpg";
import playgroundImg from "@/assets/playground.jpg";
import classroomImg from "@/assets/classroom.jpg";
import libraryImg from "@/assets/library.jpg";

export const Route = createFileRoute("/activities")({
  component: ActivitiesPage,
  head: () => ({
    meta: [
      { title: "Activities — Mighty Mindz" },
      { name: "description", content: "A peek into joyful days at Mighty Mindz." },
      { property: "og:title", content: "Activities — Mighty Mindz" },
      { property: "og:description", content: "Play, art, music, story time and more." },
    ],
  }),
});

function ActivitiesPage() {
  const shots = [
    { src: activityImg, label: "Art & craft" },
    { src: playgroundImg, label: "Playground fun" },
    { src: classroomImg, label: "Classroom vibes" },
    { src: libraryImg, label: "Story time" },
  ];
  return (
    <SitePage title="Activities" intro="A peek into our joyful days.">
      <div className="rounded-3xl overflow-hidden bg-black aspect-video">
        <video
          src={childPlayingVideo.url}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="w-full h-full object-cover"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {shots.map((s) => (
          <figure key={s.label} className="rounded-2xl overflow-hidden border border-border bg-card">
            <img src={s.src} alt={s.label} className="aspect-square w-full object-cover" />
            <figcaption className="p-3 text-sm font-semibold text-center">{s.label}</figcaption>
          </figure>
        ))}
      </div>
    </SitePage>
  );
}
