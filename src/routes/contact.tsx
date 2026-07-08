import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site-shell";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Mighty Mindz" },
      { name: "description", content: "Phone, WhatsApp, email and campus addresses for Mighty Mindz Lucknow." },
      { property: "og:title", content: "Contact — Mighty Mindz" },
      { property: "og:description", content: "We'd love to hear from you." },
    ],
  }),
});

function ContactPage() {
  return (
    <SitePage title="Get in touch" intro="We'd love to hear from you.">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-xl font-extrabold">Vrindavan (Main)</h2>
          <p className="text-sm text-muted-foreground">Principal: Mrs. Seema Bansal</p>
          <p className="mt-3">📍 Sec 11A/197, Vrindavan Yojna, Lucknow 226029</p>
          <p className="mt-1">📞 +91 84001 00348</p>
          <p>✉️ seema.m.bansal@gmail.com</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="text-xl font-extrabold">Gomti Nagar Vistar</h2>
          <p className="text-sm text-muted-foreground">Principal: Ms. Taruna Bhaskar</p>
          <p className="mt-3">📍 1/321, Vardan Khand, Sector 1, Lucknow 226010</p>
          <p className="mt-1">📞 +91 92500 31755</p>
          <p>📞 +91 99997 81268</p>
        </div>
      </div>
      <div className="mt-8 rounded-3xl bg-sunshine/40 border border-border p-6 md:p-8">
        <h2 className="text-xl font-extrabold">Reach us instantly</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href="https://wa.me/918400100348" target="_blank" rel="noreferrer" className="rounded-full bg-leaf text-leaf-foreground px-5 py-3 font-bold">💬 WhatsApp</a>
          <a href="https://www.instagram.com/reel/DaczE6oyvWX/?igsh=MnVxZWF5Y2x3ejE3" target="_blank" rel="noreferrer" className="rounded-full bg-tomato text-white px-5 py-3 font-bold">📸 Instagram</a>
          <a href="https://www.facebook.com/reel/4114081708882705/" target="_blank" rel="noreferrer" className="rounded-full bg-primary text-primary-foreground px-5 py-3 font-bold">📘 Facebook</a>
          <a href="tel:+918400100348" className="rounded-full bg-background border border-border px-5 py-3 font-bold">📞 Call now</a>
        </div>
      </div>
    </SitePage>
  );
}
