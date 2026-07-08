import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";

export const Route = createFileRoute("/campuses")({
  component: CampusesPage,
  head: () => ({
    meta: [
      { title: "Our Campuses — Mighty Mindz" },
      { name: "description", content: "Vrindavan main campus and Gomti Nagar Vistar branch in Lucknow." },
      { property: "og:title", content: "Our Campuses — Mighty Mindz" },
      { property: "og:description", content: "Two Lucknow campuses, one Mighty Mindz family." },
    ],
  }),
});

function CampusesPage() {
  const campuses = [
    {
      name: "Vrindavan (Main)",
      principal: "Mrs. Seema Bansal",
      address: "Sec 11A/197, Vrindavan Yojna, Lucknow 226029",
      phone: "+91 84001 00348",
      hours: "Mon–Sat, 9:00 AM – 2:00 PM",
      color: "bg-primary/10",
    },
    {
      name: "Gomti Nagar Vistar",
      principal: "Ms. Taruna Bhaskar",
      address: "1/321, Vardan Khand, Sector 1, Gomti Nagar Vistar, Lucknow 226010",
      phone: "+91 92500 31755 · +91 99997 81268",
      hours: "Mon–Sat, 9:00 AM – 2:00 PM",
      color: "bg-leaf/20",
    },
  ];
  return (
    <SitePage title="Our Campuses" intro="Two Lucknow campuses, one Mighty Mindz family.">
      <div className="grid gap-6 md:grid-cols-2">
        {campuses.map((c) => (
          <div key={c.name} className={`rounded-3xl border border-border p-6 md:p-8 ${c.color}`}>
            <h2 className="text-2xl font-extrabold">{c.name}</h2>
            <p className="text-sm font-semibold text-primary">Principal · {c.principal}</p>
            <p className="mt-3">📍 {c.address}</p>
            <p className="mt-1">📞 {c.phone}</p>
            <p className="mt-1">🕘 {c.hours}</p>
          </div>
        ))}
      </div>
    </SitePage>
  );
}
