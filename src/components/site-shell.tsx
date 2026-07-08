import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-header.asset.json";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/programs", label: "Programs" },
  { to: "/admissions", label: "Admissions" },
  { to: "/activities", label: "Activities" },
  { to: "/leadership", label: "Leadership" },
  { to: "/campuses", label: "Campuses" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
] as const;

function AuthNavLink() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  if (signedIn === null) return <span className="w-16" />;
  return signedIn ? (
    <Link
      to="/dashboard"
      className="inline-flex items-center rounded-full border border-white/30 bg-white/10 text-white px-4 py-2 text-sm font-bold hover:bg-white/20 transition"
    >
      Dashboard
    </Link>
  ) : (
    <Link
      to="/auth"
      className="inline-flex items-center rounded-full border border-white/30 bg-white/10 text-white px-4 py-2 text-sm font-bold hover:bg-white/20 transition"
    >
      Sign in
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#1B3A8A] text-white border-b border-white/15">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-28 md:h-40 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo.url}
            alt="Mighty Mindz International Pre-school"
            className="h-24 md:h-36 w-auto"
            width={420}
            height={160}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </Link>
        <nav className="hidden lg:flex items-center gap-1">
          {LINKS.map((l) => {
            const active = l.to === "/" ? path === "/" : path.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-full text-sm font-semibold transition ${
                  active
                    ? "bg-white text-[#1B3A8A]"
                    : "text-white/90 hover:text-white hover:bg-white/15"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden lg:flex items-center gap-2">
          <AuthNavLink />
          <Link
            to="/admissions"
            className="inline-flex items-center rounded-full bg-sunshine px-5 py-2.5 text-sm font-bold text-[#1B3A8A] btn-3d [--btn-shadow:#c9a000]"
          >
            Book School Tour
          </Link>
        </div>
        <button
          className="lg:hidden inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/15 text-white ring-1 ring-white/30"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-white/15 bg-[#1B3A8A] text-white">
          <div className="px-4 py-3 flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-semibold text-white hover:bg-white/15"
              >
                {l.label}
              </Link>
            ))}
            <div onClick={() => setOpen(false)} className="mt-2">
              <AuthNavLink />
            </div>
            <Link
              to="/admissions"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-sunshine px-5 py-3 text-sm font-bold text-[#1B3A8A]"
            >
              Book School Tour
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-[#0f2b6b] text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <img src={logo.url} alt="Mighty Mindz" className="h-16 w-auto bg-white/95 rounded-2xl p-2" />
          <p className="mt-4 text-sm text-white/80">
            Nurturing future minds since day one. Founded by Ms. Reema Mishra · Under the caring
            leadership of Mrs. Seema Bansal & Ms. Taruna Bhaskar.
          </p>
        </div>
        <div className="text-sm">
          <h3 className="font-bold mb-3">Vrindavan (Main)</h3>
          <p className="text-white/80">Sec 11A/197 Vrindavan Yojna, Lucknow 226029</p>
          <p className="mt-1">📞 +91 84001 00348</p>
          <p>✉️ seema.m.bansal@gmail.com</p>
          <h3 className="font-bold mt-4 mb-3">Gomti Nagar Vistar</h3>
          <p className="text-white/80">1/321 Vardan Khand, Sector 1, 226010</p>
          <p className="mt-1">📞 +91 92500 31755 · +91 99997 81268</p>
        </div>
        <div className="text-sm">
          <h3 className="font-bold mb-3">Follow us</h3>
          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/reel/DaczE6oyvWX/?igsh=MnVxZWF5Y2x3ejE3"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 hover:bg-white/20 px-4 py-2"
            >
              📸 Instagram
            </a>
            <a
              href="https://www.facebook.com/reel/4114081708882705/"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 hover:bg-white/20 px-4 py-2"
            >
              📘 Facebook
            </a>
            <a
              href="https://wa.me/918400100348"
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-white/10 hover:bg-white/20 px-4 py-2"
            >
              💬 WhatsApp
            </a>
          </div>
          <p className="mt-6 text-xs text-white/60">
            © {new Date().getFullYear()} Mighty Mindz International Pre-school. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export function SitePage({
  children,
  title,
  intro,
}: {
  children: React.ReactNode;
  title: string;
  intro?: string;
}) {
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <section className="bg-[#0f2b6b] text-white">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-14 md:py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl mx-auto text-white/85 text-lg">{intro}</p>}
        </div>
      </section>
      <main className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-14">{children}</main>
      <SiteFooter />
    </div>
  );
}
