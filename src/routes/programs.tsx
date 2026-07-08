import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";

export const Route = createFileRoute("/programs")({
  component: ProgramsPage,
  head: () => ({
    meta: [
      { title: "Programs — Mighty Mindz International Pre-school" },
      {
        name: "description",
        content:
          "Playgroup, Nursery, LKG and UKG programs designed for holistic early years development.",
      },
      { property: "og:title", content: "Programs — Mighty Mindz" },
      {
        property: "og:description",
        content: "Age-appropriate curriculum for 1.5 to 5+ year olds.",
      },
    ],
  }),
});

const PROGRAMS = [
  {
    emoji: "🧸",
    name: "Playgroup",
    age: "1.5 – 2.5 yrs",
    desc: "Sensory play, music and movement, gentle separation, mother-toddler friendly.",
  },
  {
    emoji: "🎨",
    name: "Nursery",
    age: "2.5 – 3.5 yrs",
    desc: "Circle time, phonics readiness, art, story time and self-help routines.",
  },
  {
    emoji: "🔤",
    name: "LKG",
    age: "3.5 – 4.5 yrs",
    desc: "Structured phonics, numeracy foundations, show & tell, thematic learning.",
  },
  {
    emoji: "🚀",
    name: "UKG",
    age: "4.5 – 5.5 yrs",
    desc: "Reading fluency, early writing, math patterns, EVS, big-school readiness.",
  },
];

function ProgramsPage() {
  return (
    <SitePage
      title="Our Programs"
      intro="Progressive early-years education that focuses on the holistic development of young minds."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {PROGRAMS.map((p) => (
          <div
            key={p.name}
            className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm"
          >
            <div className="text-5xl">{p.emoji}</div>
            <h2 className="mt-3 text-2xl font-extrabold">{p.name}</h2>
            <p className="text-sm font-semibold text-primary">{p.age}</p>
            <p className="mt-3 text-muted-foreground">{p.desc}</p>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
