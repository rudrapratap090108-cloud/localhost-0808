import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import logo from "@/assets/logo-header.asset.json";
import kid from "@/assets/kid.asset.json";
import childPlayingVideo from "@/assets/child-playing.mp4.asset.json";
import heroVideo from "@/assets/hero-kids.mp4.asset.json";

import heroImg from "@/assets/hero.jpg";
import classroomImg from "@/assets/classroom.jpg";
import activityImg from "@/assets/activity.jpg";
import playgroundImg from "@/assets/playground.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { submitAdmissionLead } from "@/lib/school.functions";

import libraryImg from "@/assets/library.jpg";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { property: "og:image", content: logo.url },
      { name: "twitter:image", content: logo.url },
    ],
  }),
});

/* ---------- Small building blocks (all use design tokens) ---------- */

function BlockChip({
  children,
  color,
  tilt = -4,
  className = "",
}: {
  children: React.ReactNode;
  color: "sunshine" | "tomato" | "leaf" | "tangerine" | "grape" | "primary";
  tilt?: number;
  className?: string;
}) {
  const map: Record<string, string> = {
    sunshine: "bg-sunshine text-sunshine-foreground",
    tomato: "bg-tomato text-tomato-foreground",
    leaf: "bg-leaf text-leaf-foreground",
    tangerine: "bg-tangerine text-tangerine-foreground",
    grape: "bg-grape text-grape-foreground",
    primary: "bg-primary text-primary-foreground",
  };
  return (
    <span
      className={`block-chip ${map[color]} ${className}`}
      style={{ ["--tilt" as string]: `${tilt}deg` }}
    >
      {children}
    </span>
  );
}

function BlockWord({ word }: { word: string }) {
  const palette = ["tomato", "sunshine", "leaf", "tangerine", "grape", "primary"] as const;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {word.split("").map((ch, i) => (
        <BlockChip
          key={i}
          color={palette[i % palette.length]}
          tilt={i % 2 === 0 ? -6 : 5}
          className="text-2xl md:text-4xl px-3 py-1.5"
        >
          {ch}
        </BlockChip>
      ))}
    </span>
  );
}

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      {children}
    </div>
  );
}

/* ---------- Sections ---------- */

function Nav() {
  const links: Array<[string, string]> = [
    ["About", "#about"],
    ["Programs", "/programs"],
    ["Admissions", "/admissions"],
    ["Activities", "/activities"],
    ["Leadership", "/leadership"],
    ["Blog", "/blog"],
    ["Contact", "/contact"],
  ];
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-cream text-[#1B3A8A] border-b border-[#1B3A8A]/10">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-24 md:h-32 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3">
          <img
            src={logo.url}
            alt="Mighty Mindz International Pre-school logo"
            className="h-20 md:h-28 w-auto"
            width={360}
            height={140}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <span className="sr-only">Mighty Mindz</span>
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 rounded-full text-sm font-semibold text-[#1B3A8A]/85 hover:text-[#1B3A8A] hover:bg-[#1B3A8A]/10 transition"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <AuthNavLink />
          <Link
            to="/admissions"
            className="inline-flex items-center rounded-full bg-[#1B3A8A] px-5 py-2.5 text-sm font-bold text-white btn-3d [--btn-shadow:#1B3A8A]"
          >
            Book School Tour
          </Link>
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full bg-[#1B3A8A]/10 text-[#1B3A8A] ring-1 ring-[#1B3A8A]/30"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-[#1B3A8A]/10 bg-cream text-[#1B3A8A]">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-semibold text-[#1B3A8A] hover:bg-[#1B3A8A]/10"
              >
                {label}
              </a>
            ))}
            <div onClick={() => setOpen(false)} className="mt-2">
              <AuthNavLink />
            </div>
            <Link
              to="/admissions"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center justify-center rounded-full bg-[#1B3A8A] px-5 py-3 text-base font-extrabold text-white shadow-lg"
            >
              Book Your School Tour Now →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

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
      className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-bold hover:bg-cream transition"
    >
      Dashboard
    </Link>
  ) : (
    <Link
      to="/auth"
      className="inline-flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-bold hover:bg-cream transition"
    >
      Sign in
    </Link>
  );
}

function AdmissionForm() {
  const submit = useServerFn(submitAdmissionLead);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
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
      setDone(true);
      toast.success("Thanks! Our admissions team will call you shortly. 🎉");
      setF({ parent_name: "", child_name: "", child_age: "", phone: "", email: "", program: "", message: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Please try again");
    } finally {
      setBusy(false);
    }
  }
  const input = "w-full rounded-xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring";
  if (done) {
    return (
      <div className="mt-8 soft-card p-8 text-center">
        <div className="text-4xl mb-2">🎈</div>
        <h3 className="font-bold text-xl">We got your enquiry!</h3>
        <p className="text-sm text-muted-foreground mt-1">Our admissions team will reach out within 24 hours.</p>
        <button onClick={() => setDone(false)} className="mt-4 text-sm font-semibold text-primary underline">
          Send another
        </button>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="mt-8 soft-card p-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">
        <span className="block mb-1.5">Parent name</span>
        <input required maxLength={100} className={input} value={f.parent_name} onChange={(e) => setF({ ...f, parent_name: e.target.value })} />
      </label>
      <label className="text-sm font-semibold">
        <span className="block mb-1.5">Phone</span>
        <input required type="tel" maxLength={20} className={input} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </label>
      <label className="text-sm font-semibold">
        <span className="block mb-1.5">Child's name</span>
        <input required maxLength={100} className={input} value={f.child_name} onChange={(e) => setF({ ...f, child_name: e.target.value })} />
      </label>
      <label className="text-sm font-semibold">
        <span className="block mb-1.5">Child's age</span>
        <input type="number" min={1} max={12} className={input} value={f.child_age} onChange={(e) => setF({ ...f, child_age: e.target.value })} />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        <span className="block mb-1.5">Email (optional)</span>
        <input type="email" maxLength={200} className={input} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        <span className="block mb-1.5">Program of interest</span>
        <select className={input} value={f.program} onChange={(e) => setF({ ...f, program: e.target.value })}>
          <option value="">— Select —</option>
          <option value="Playgroup">Playgroup (2–3 yrs)</option>
          <option value="Nursery">Nursery (3–4 yrs)</option>
          <option value="LKG">LKG (4–5 yrs)</option>
          <option value="UKG">UKG (5–6 yrs)</option>
        </select>
      </label>
      <label className="text-sm font-semibold sm:col-span-2">
        <span className="block mb-1.5">Message</span>
        <textarea rows={3} maxLength={1000} className={input} placeholder="Tell us about your little one…" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground btn-3d [--btn-shadow:var(--primary)] disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}



function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[#1B3A8A] text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-10 md:py-16 relative">
        {/* Carousel chevrons (decorative) */}
        <button
          aria-label="Previous"
          className="hidden md:grid absolute left-2 top-1/2 -translate-y-1/2 h-12 w-12 place-items-center rounded-full text-white/80 hover:text-white text-3xl font-light"
        >
          ‹
        </button>
        <button
          aria-label="Next"
          className="hidden md:grid absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 place-items-center rounded-full text-white/80 hover:text-white text-3xl font-light"
        >
          ›
        </button>

        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-extrabold tracking-tight text-white leading-[1.05] text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
            Your Door
            <br />
            To The Future
          </h1>

          <div className="mt-6 md:mt-8 inline-block">
            <div
              className="rounded-2xl bg-sunshine px-5 py-3 md:px-8 md:py-4 shadow-lg ring-4 ring-sunshine/60"
              style={{ transform: "rotate(-1deg)" }}
            >
              <span className="block font-black tracking-tight text-tomato text-3xl sm:text-5xl md:text-6xl leading-none drop-shadow-sm">
                ADMISSION OPEN
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-5 text-white font-extrabold text-3xl sm:text-5xl md:text-6xl">
            2026-2027
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/admissions"
              className="inline-flex items-center rounded-full bg-tomato px-6 py-3.5 text-base font-extrabold text-tomato-foreground shadow-lg ring-2 ring-sunshine"
            >
              Book Your School Tour Now →
            </Link>
            <a
              href="#programs"
              className="inline-flex items-center rounded-full bg-white/10 hover:bg-white/20 px-6 py-3.5 text-base font-bold text-white border border-white/30"
            >
              Explore Programs
            </a>
          </div>

          <div className="mt-8 md:mt-10 relative mx-auto max-w-2xl">
            <video
              src={heroVideo.url}
              autoPlay
              loop
              muted
              playsInline
              className="relative mx-auto w-full h-auto rounded-3xl shadow-2xl ring-4 ring-white/20"
              poster={heroImg}
            />
          </div>
        </div>
      </div>
    </section>
  );
}


function Welcome() {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              From our leadership
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">
              Every child is a mighty little mind.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-3 space-y-5 text-lg text-muted-foreground">
          <Reveal delay={100}>
            <p>
              At Mighty Mindz, we believe learning should feel like play. Our
              classrooms are gentle, colorful spaces where children build
              confidence, curiosity and kindness — one giggle at a time.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <p>
              From art and storytelling to music, movement and hands-on
              science, our early-years curriculum blends the best of Montessori,
              play-based and inquiry learning. We nurture the whole child, so
              your little one steps into big school ready and radiant.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="soft-card border-l-4 border-l-leaf bg-leaf/5 p-5 mt-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-leaf text-leaf-foreground grid place-items-center font-display font-bold text-2xl shadow-md">
                  RM
                </div>
                <div>
                  <div className="font-bold text-foreground text-lg">Ms. Reema Mishra</div>
                  <div className="text-sm font-semibold text-leaf">Founder Member · Tara Devi Educational Welfare & Trust</div>
                </div>
              </div>
              <p className="mt-3 text-base text-foreground/90 leading-relaxed">
                Mighty Mindz International Preschool is her brainchild. She has 15+ years of experience running schools and colleges in Pratapgarh, and her vision continues to guide every classroom at Mighty Mindz.
              </p>
            </div>
          </Reveal>
          <Reveal delay={400}>
            <div className="soft-card border-l-4 border-l-primary bg-primary/5 p-5 mt-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground grid place-items-center font-display font-bold text-2xl shadow-md">
                  SB
                </div>
                <div>
                  <div className="font-bold text-foreground text-lg">Mrs. Seema Bansal</div>
                  <div className="text-sm font-semibold text-primary">Principal & Founder Visionary</div>
                </div>
              </div>
              <p className="mt-3 text-base text-foreground/90 leading-relaxed">
                Post-graduate Educationist · Psychologist by passion · Trustee, Tara Devi Educational & Welfare Trust · 20+ years of running pre-schools & colleges in Pratapgarh.
              </p>
            </div>
          </Reveal>
          <Reveal delay={500}>
            <div className="soft-card border-l-4 border-l-tomato bg-tomato/5 p-5 mt-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-tomato text-white grid place-items-center font-display font-bold text-2xl shadow-md">
                  TB
                </div>
                <div>
                  <div className="font-bold text-foreground text-lg">Ms. Taruna Bhaskar</div>
                  <div className="text-sm font-semibold text-tomato">Principal · Gomti Nagar Branch</div>
                </div>
              </div>
              <p className="mt-3 text-base text-foreground/90 leading-relaxed">
                Leading our Gomti Nagar Vistar campus with warmth and dedication — bringing the Mighty Mindz way of joyful learning to families across Gomti Nagar, Lucknow.
              </p>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}

const PROGRAMS = [
  {
    color: "tomato",
    age: "Playgroup",
    ages: "2 – 3 yrs",
    desc: "Gentle first steps away from home — sensory play, songs, and lots of cuddles.",
  },
  {
    color: "sunshine",
    age: "Nursery",
    ages: "3 – 4 yrs",
    desc: "Phonics, numbers, art and outdoor adventures spark a love of learning.",
  },
  {
    color: "leaf",
    age: "LKG",
    ages: "4 – 5 yrs",
    desc: "Reading, writing and story-based math — with drama, dance and discovery.",
  },
  {
    color: "grape",
    age: "UKG",
    ages: "5 – 6 yrs",
    desc: "Big-school readiness with confidence, curiosity and rich hands-on projects.",
  },
] as const;

function Programs() {
  return (
    <section id="programs" className="py-20 md:py-28 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Our Programs
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">
              A curriculum that grows with your child.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Four thoughtfully-designed years, each one full of wonder,
              friendship and gentle challenge.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAMS.map((p, i) => (
            <Reveal key={p.age} delay={i * 80}>
              <article className="soft-card h-full p-6 hover:-translate-y-1 transition-transform">
                <BlockChip color={p.color as any} tilt={-6} className="text-sm">
                  {p.ages}
                </BlockChip>
                <h3 className="mt-5 text-2xl font-bold">{p.age}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                  {p.desc}
                </p>
                <a
                  href="#admissions"
                  className="mt-5 inline-flex items-center text-sm font-bold text-primary hover:underline"
                >
                  Learn more →
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const FACILITIES = [
  {
    title: "Bright, safe classrooms",
    desc: "Sunlit rooms with child-height furniture, learning corners and gentle acoustics.",
    img: classroomImg,
  },
  {
    title: "Creative art studios",
    desc: "Paint, clay, music and messy play — where imagination gets its hands dirty.",
    img: activityImg,
  },
  {
    title: "Outdoor playground",
    desc: "Soft-tiled play areas with slides, swings and a mini nature garden.",
    img: playgroundImg,
  },
  {
    title: "Story-time library",
    desc: "A cozy nook stocked with picture books, bean bags and read-aloud circles.",
    img: libraryImg,
  },
];

function Facilities() {
  return (
    <section id="facilities" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-end justify-between flex-wrap gap-6 mb-12">
          <div className="max-w-2xl">
            <Reveal>
              <p className="text-sm font-bold uppercase tracking-widest text-primary">
                Our Facilities
              </p>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold">
                Spaces designed for tiny explorers.
              </h2>
            </Reveal>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FACILITIES.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <figure className="soft-card overflow-hidden h-full">
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={f.img}
                    alt={f.title}
                    loading="lazy"
                    width={1200}
                    height={900}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
                <figcaption className="p-5">
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">{f.desc}</p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const items = [
    { icon: "🎨", title: "Play-based learning", desc: "Curiosity-led days full of stories, songs and exploration." },
    { icon: "🧑‍🏫", title: "Loving educators", desc: "Certified early-childhood teachers who truly listen." },
    { icon: "🛡️", title: "Safe & secure", desc: "CCTV-monitored campus, trained staff, and clean routines." },
    { icon: "🌱", title: "Whole-child growth", desc: "Emotional, social, physical and cognitive — every day." },
    { icon: "🎭", title: "Enrichment clubs", desc: "Dance, music, yoga, storytelling and outdoor adventures." },
    { icon: "🤝", title: "Parent partnership", desc: "Weekly updates, open days and warm two-way conversations." },
  ];
  return (
    <section className="py-20 md:py-28 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Why Mighty Mindz
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">
              Little things done with a lot of love.
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={it.title} delay={i * 60}>
              <div className="soft-card p-6 h-full">
                <div className="h-12 w-12 rounded-2xl bg-accent grid place-items-center text-2xl">
                  {it.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold">{it.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const shots = [heroImg, classroomImg, activityImg, playgroundImg, libraryImg, heroImg];
  return (
    <section id="gallery" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Life at Mighty Mindz
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">
              Activities — a peek into our joyful days.
            </h2>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-10 soft-card overflow-hidden">
            <div className="relative aspect-video bg-black">
              <video
                src={childPlayingVideo.url}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4 md:p-5 flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <div className="font-bold">Little hands, big imaginations</div>
                <p className="text-sm text-foreground/75">A glimpse of the joyful play and discovery that fills every day at Mighty Mindz.</p>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-4 grid-cols-2 md:grid-cols-4 auto-rows-[140px] md:auto-rows-[180px]">
          {shots.map((src, i) => (
            <div
              key={i}
              className={`soft-card overflow-hidden ${
                i === 0 ? "col-span-2 row-span-2" : ""
              } ${i === 3 ? "row-span-2" : ""}`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      q: "Our daughter runs into class every morning. The teachers know her, love her and celebrate her tiny wins.",
      n: "Ananya & Rohan",
      r: "Parents of Aarav, LKG",
      c: "tomato",
    },
    {
      q: "It feels less like a school and more like a warm second home. We can't imagine anywhere else.",
      n: "Priyanka Menon",
      r: "Parent of Meera, Nursery",
      c: "leaf",
    },
    {
      q: "The weekly updates, the art she brings home, the songs she sings — everything shows how much thought goes in.",
      n: "Karan Verma",
      r: "Parent of Ishaan, Playgroup",
      c: "grape",
    },
  ] as const;
  return (
    <section className="py-20 md:py-28 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Parents love us
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">
              Kind words from our families.
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {quotes.map((q, i) => (
            <Reveal key={q.n} delay={i * 100}>
              <blockquote className="soft-card p-7 h-full flex flex-col">
                <div className="text-4xl leading-none text-primary">"</div>
                <p className="mt-2 text-foreground leading-relaxed">{q.q}</p>
                <footer className="mt-6 flex items-center gap-3">
                  <BlockChip color={q.c} tilt={-6} className="w-10 h-10">
                    {q.n[0]}
                  </BlockChip>
                  <div>
                    <div className="font-bold text-sm">{q.n}</div>
                    <div className="text-xs text-muted-foreground">{q.r}</div>
                  </div>
                </footer>
              </blockquote>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function News() {
  const items = [
    { tag: "Event", date: "Aug 15", title: "Independence Day Parade & mini-band performance" },
    { tag: "Announcement", date: "Jul 22", title: "Admissions for 2026–27 are now open" },
    { tag: "Workshop", date: "Jun 30", title: "Parent–child pottery morning at the studio" },
  ];
  return (
    <section id="news" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Reveal>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-primary">
                News & Events
              </p>
              <h2 className="mt-3 text-3xl md:text-5xl font-bold">
                What's happening this term.
              </h2>
            </div>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.map((n, i) => (
            <Reveal key={n.title} delay={i * 80}>
              <article className="soft-card p-6 h-full hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
                  <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                    {n.tag}
                  </span>
                  <span className="text-muted-foreground">{n.date}</span>
                </div>
                <h3 className="mt-4 text-xl font-bold leading-snug">{n.title}</h3>
                <a
                  href="#contact"
                  className="mt-4 inline-flex text-sm font-bold text-primary hover:underline"
                >
                  Read more →
                </a>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Admissions() {
  return (
    <section id="admissions" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="soft-card relative overflow-hidden p-8 md:p-14 text-center">
          <div aria-hidden className="absolute inset-0 -z-10">
            <div className="absolute -top-16 -left-10 h-56 w-56 rounded-full bg-sunshine/40 blur-3xl" />
            <div className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
          </div>
          <div className="flex justify-center gap-1 mb-5">
            <BlockChip color="tomato" tilt={-8}>A</BlockChip>
            <BlockChip color="sunshine" tilt={6}>B</BlockChip>
            <BlockChip color="leaf" tilt={-4}>C</BlockChip>
            <BlockChip color="tangerine" tilt={5}>!</BlockChip>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold max-w-2xl mx-auto">
            Admissions open for 2026–27.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Come visit us, meet our teachers, and see your little one's face
            light up. School tours run every Tuesday & Saturday.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#contact"
              className="inline-flex items-center rounded-full bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground btn-3d [--btn-shadow:var(--primary)]"
            >
              Book a Tour
            </a>
            <a
              href="tel:+918400100348"
              className="inline-flex items-center rounded-full bg-card border border-border px-7 py-3.5 text-base font-bold btn-3d [--btn-shadow:var(--border)]"
            >
              Call Admissions
            </a>
            <a
              href="https://wa.me/918400100348"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-leaf px-7 py-3.5 text-base font-bold text-leaf-foreground btn-3d [--btn-shadow:var(--leaf)]"
            >
              WhatsApp
            </a>

          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section id="contact" className="py-20 md:py-28 bg-card/60">
      <div className="mx-auto max-w-7xl px-4 md:px-8 grid gap-10 lg:grid-cols-2 items-start">
        <div>
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-widest text-primary">
              Come say hi
            </p>
            <h2 className="mt-3 text-3xl md:text-5xl font-bold">Visit our campus.</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
              We'd love to show you around. Reach out and our admissions team
              will schedule a warm, unhurried visit.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="soft-card p-5 border-l-4 border-l-primary">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">Main Branch · Vrindavan</div>
              <div className="mt-2 font-bold text-foreground">Mighty Mindz International Pre-school</div>
              <p className="mt-1 text-sm text-foreground/85">Sec 11A/197, Vrindavan Yojna, Lucknow, UP 226029</p>
              <p className="mt-2 text-sm"><span className="font-semibold text-primary">Principal:</span> Mrs. Seema Bansal</p>
              <p className="text-sm"><span className="font-semibold text-primary">Phone / WhatsApp:</span> +91 84001 00348</p>
            </div>
            <div className="soft-card p-5 border-l-4 border-l-tomato">
              <div className="text-xs font-bold uppercase tracking-widest text-tomato">Gomti Nagar Branch</div>
              <div className="mt-2 font-bold text-foreground">Mighty Mindz International Preschool & Daycare</div>
              <p className="mt-1 text-sm text-foreground/85">1/321, Vardan Khand, Sector 1, Gomti Nagar Vistar, Lucknow, UP 226010</p>
              <p className="mt-2 text-sm"><span className="font-semibold text-tomato">Principal:</span> Ms. Taruna Bhaskar</p>
              <p className="text-sm"><span className="font-semibold text-tomato">Phone:</span> +91 92500 31755 · +91 99997 81268 · Mon–Sat, closes 6 PM</p>
            </div>
          </div>

          <dl className="mt-6 space-y-3 text-sm">
            {[
              ["Hours", "Mon – Sat · 8:30 AM – 3:30 PM"],
              ["Email", "seema.m.bansal@gmail.com"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="w-24 shrink-0 font-bold text-primary">{k}</dt>
                <dd className="text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-primary">Follow us:</span>
            <a
              href="https://www.instagram.com/reel/DaczE6oyvWX/?igsh=MnVxZWF5Y2x3ejE3"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-tomato text-white px-4 py-2 text-sm font-bold shadow-sm hover:scale-105 transition"
            >
              📸 Instagram
            </a>
            <a
              href="https://www.facebook.com/reel/4114081708882705/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-bold shadow-sm hover:scale-105 transition"
            >
              📘 Facebook
            </a>
          </div>


          <AdmissionForm />

        </div>

        <div className="soft-card overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-full min-h-[420px]">
          <iframe
            title="Mighty Mindz on the map"
            src="https://www.google.com/maps?q=Mighty+Mindz+International+Preschool+Sec+11A+Vrindavan+Yojna+Lucknow+226029&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative bg-primary text-primary-foreground pt-16 pb-10 mt-6 overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-0 opacity-20">
        <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-sunshine blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-tomato blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 md:px-8 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="inline-flex items-center gap-3 bg-background rounded-2xl px-4 py-3">
            <img src={logo.url} alt="Mighty Mindz logo" className="h-12 w-auto" />
          </div>
          <p className="mt-5 max-w-sm text-primary-foreground/80">
            Mighty Mindz International Pre-school — a warm, joyful place for
            little minds to bloom. Nurturing future, one giggle at a time.
          </p>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4">Explore</h4>
          <ul className="space-y-2 text-primary-foreground/85">
            <li><a href="#about" className="hover:underline">About</a></li>
            <li><a href="#programs" className="hover:underline">Programs</a></li>
            <li><a href="#facilities" className="hover:underline">Facilities</a></li>
            <li><a href="#gallery" className="hover:underline">Activities</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4">Our Campuses</h4>
          <ul className="space-y-3 text-primary-foreground/85 text-sm">
            <li>
              <div className="font-bold text-primary-foreground">Vrindavan (Main)</div>
              <div>Sec 11A/197, Vrindavan Yojna, Lucknow, UP 226029</div>
              <div className="opacity-90">Principal: Mrs. Seema Bansal</div>
            </li>
            <li>
              <div className="font-bold text-primary-foreground">Gomti Nagar</div>
              <div>1/321, Vardan Khand, Sector 1, Gomti Nagar Vistar, Lucknow, UP 226010</div>
              <div className="opacity-90">Principal: Ms. Taruna Bhaskar</div>
            </li>
            <li className="pt-1">📞 Vrindavan: +91 84001 00348</li>
            <li>📞 Gomti Nagar: +91 92500 31755 · +91 99997 81268</li>
            <li>✉️ seema.m.bansal@gmail.com</li>
            <li className="pt-2 flex gap-3">
              <a
                href="https://www.instagram.com/reel/DaczE6oyvWX/?igsh=MnVxZWF5Y2x3ejE3"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/15 hover:bg-background/25 transition"
              >
                📸
              </a>
              <a
                href="https://www.facebook.com/reel/4114081708882705/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/15 hover:bg-background/25 transition"
              >
                📘
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="relative mx-auto max-w-7xl px-4 md:px-8 mt-12 pt-6 border-t border-primary-foreground/20 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-foreground/70">
        <div>© {new Date().getFullYear()} Mighty Mindz International Pre-school™</div>
        <div className="font-semibold">Founded by Ms. Reema Mishra · Under the caring leadership of Mrs. Seema Bansal, Principal & Ms. Taruna Bhaskar, Gomti Nagar Branch</div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
      <a
        href="/admissions"
        className="block bg-[#0f2b6b] text-white text-center py-3 font-extrabold tracking-wide hover:bg-[#0a2158] transition"
      >
        🎓 ADMISSIONS OPEN 2025-26 · Book your school tour today →
      </a>
      <main>
        <Hero />
        <Welcome />
        <Programs />
        <Facilities />
        <WhyUs />
        <Gallery />
        <Testimonials />
        <News />
        <Admissions />
        <Contact />
      </main>
      <Footer />
    </div>

  );
}
