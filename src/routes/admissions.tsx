import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SitePage } from "@/components/site-shell";
import { submitAdmissionLead } from "@/lib/school.functions";

export const Route = createFileRoute("/admissions")({
  component: AdmissionsPage,
  head: () => ({
    meta: [
      { title: "Admissions Open 2026-2027 — Mighty Mindz" },
      {
        name: "description",
        content:
          "Book a school tour or apply for admission at Mighty Mindz International Pre-school, Lucknow.",
      },
      { property: "og:title", content: "Admissions Open 2026-2027" },
      {
        property: "og:description",
        content: "Your door to the future — apply now for Playgroup, Nursery, LKG or UKG.",
      },
    ],
  }),
});

function AdmissionsPage() {
  const submit = useServerFn(submitAdmissionLead);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    parent_name: "",
    child_name: "",
    child_age: "",
    phone: "",
    email: "",
    program: "",
    message: "",
  });
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await submit({
        data: {
          parent_name: f.parent_name,
          child_name: f.child_name,
          child_age: f.child_age ? Number(f.child_age) : undefined,
          phone: f.phone,
          email: f.email || undefined,
          program: f.program || undefined,
          message: f.message || undefined,
        },
      });
      toast.success("Thanks! Our admissions team will call you shortly. 🎉");
      setF({ parent_name: "", child_name: "", child_age: "", phone: "", email: "", program: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }
  const input =
    "w-full rounded-xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring";
  return (
    <SitePage title="Admissions Open 2025-26" intro="Your door to the future.">
      <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
        <div className="rounded-3xl bg-sunshine/40 border border-border p-6 md:p-8">
          <h2 className="text-2xl font-extrabold">Book a School Tour</h2>
          <p className="mt-2 text-muted-foreground">
            Visit either campus, meet our team, and see Mighty Mindz in action.
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>📞 Vrindavan: +91 84001 00348</li>
            <li>📞 Gomti Nagar: +91 92500 31755 · +91 99997 81268</li>
            <li>✉️ seema.m.bansal@gmail.com</li>
            <li>🕘 Mon–Sat, 9:00 AM – 2:00 PM</li>
          </ul>
          <a
            href="https://wa.me/918400100348"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center rounded-full bg-leaf text-leaf-foreground px-5 py-3 font-bold btn-3d [--btn-shadow:var(--leaf)]"
          >
            💬 Chat on WhatsApp
          </a>
        </div>
        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-3"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input required placeholder="Parent name" className={input} value={f.parent_name} onChange={(e) => setF({ ...f, parent_name: e.target.value })} />
            <input required placeholder="Child name" className={input} value={f.child_name} onChange={(e) => setF({ ...f, child_name: e.target.value })} />
            <input placeholder="Child age" className={input} value={f.child_age} onChange={(e) => setF({ ...f, child_age: e.target.value })} inputMode="numeric" />
            <input required placeholder="Phone" className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <input placeholder="Email (optional)" type="email" className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <select className={input} value={f.program} onChange={(e) => setF({ ...f, program: e.target.value })}>
              <option value="">Program of interest</option>
              <option>Playgroup</option>
              <option>Nursery</option>
              <option>LKG</option>
              <option>UKG</option>
            </select>
          </div>
          <textarea placeholder="Anything we should know?" rows={4} className={input} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          <button disabled={busy} className="w-full rounded-full bg-primary text-primary-foreground font-bold py-3 btn-3d [--btn-shadow:var(--primary)] disabled:opacity-60">
            {busy ? "Sending…" : "Submit enquiry"}
          </button>
        </form>
      </div>
    </SitePage>
  );
}
