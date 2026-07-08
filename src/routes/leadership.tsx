import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";

export const Route = createFileRoute("/leadership")({
  component: LeadershipPage,
  head: () => ({
    meta: [
      { title: "Leadership — Mighty Mindz" },
      { name: "description", content: "Meet the founder and principals of Mighty Mindz International Pre-school." },
      { property: "og:title", content: "Leadership — Mighty Mindz" },
      { property: "og:description", content: "Founded by Ms. Reema Mishra. Led by Mrs. Seema Bansal and Ms. Taruna Bhaskar." },
    ],
  }),
});

const LEADERS = [
  {
    name: "Ms. Reema Mishra",
    title: "Founder Member · Tara Devi Educational Welfare & Trust",
    color: "bg-tomato/15",
    body: "Mighty Mindz International Preschool is her brainchild. She has 15+ years of experience running schools and colleges in Pratapgarh, and her vision continues to guide every classroom at Mighty Mindz.",
  },
  {
    name: "Mrs. Seema Bansal",
    title: "Principal · Vrindavan (Main Campus)",
    color: "bg-primary/15",
    body: "A passionate educator committed to nurturing young learners with kindness, structure and joy. She leads our flagship Vrindavan campus.",
  },
  {
    name: "Mr. Taruna Bhaskar",
    title: "Director · Mighty Mindz Gomti Nagar Extension Branch",
    color: "bg-leaf/25",
    body: "Qualification: M.Phil (Mathematics). 10 years of experience as a lecturer of Mathematics in engineering colleges. Alumnus of Delhi University and Jamia Millia Islamia.",
  },
];

function LeadershipPage() {
  return (
    <SitePage title="Our Leadership" intro="The people who shape every day at Mighty Mindz.">
      <div className="space-y-6">
        {LEADERS.map((l) => (
          <article key={l.name} className={`rounded-3xl border border-border p-6 md:p-8 ${l.color}`}>
            <h2 className="text-2xl font-extrabold">{l.name}</h2>
            <p className="text-sm font-semibold text-primary mt-1">{l.title}</p>
            <p className="mt-3 text-foreground/80">{l.body}</p>
          </article>
        ))}
      </div>
    </SitePage>
  );
}
