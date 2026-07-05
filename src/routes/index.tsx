import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import logo from "@/assets/logo.asset.json";
import kid from "@/assets/kid.asset.json";

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
  const links = [
    ["About", "#about"],
    ["Programs", "#programs"],
    ["Facilities", "#facilities"],
    ["Gallery", "#gallery"],
    ["News", "#news"],
    ["Contact", "#contact"],
  ];
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 md:h-20 flex items-center justify-between gap-4">
        <a href="#top" className="flex items-center gap-3">
          <img
            src={logo.url}
            alt="Mighty Mindz International Pre-school logo"
            className="h-12 md:h-16 w-auto"
            width={200}
            height={64}
          />
          <span className="sr-only">Mighty Mindz</span>
        </a>
        <nav className="hidden md:flex items-center gap-1">
          {links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="px-3 py-2 rounded-full text-sm font-semibold text-foreground/80 hover:text-foreground hover:bg-accent transition"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <AuthNavLink />
          <a
            href="#admissions"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground btn-3d [--btn-shadow:var(--primary)]"
          >
            Apply Now
          </a>
        </div>

        <button
          className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-full bg-accent text-accent-foreground btn-3d [--btn-shadow:var(--accent)]"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-3 flex flex-col gap-1">
            {links.map(([label, href]) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-semibold hover:bg-accent"
              >
                {label}
              </a>
            ))}
            <a
              href="#admissions"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground btn-3d [--btn-shadow:var(--primary)]"
            >
              Apply Now
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Playful background blobs */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sunshine/40 blur-3xl" />
        <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-tomato/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8 pt-10 md:pt-16 pb-16 md:pb-24 grid gap-10 md:gap-12 lg:grid-cols-2 items-center">
        <div>
          {(() => {
            const badge = "Nurturing Future · Admissions Open 2026";
            const palette = [
              "var(--primary)",
              "var(--tomato)",
              "var(--tangerine)",
              "var(--sunshine)",
              "var(--leaf)",
              "var(--grape)",
            ];
            let colorIdx = 0;
            return (
              <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-full bg-card pl-2 pr-3 sm:pl-2.5 sm:pr-4 py-1.5 sm:py-2 shadow-soft border border-border max-w-full">
                <span className="relative shrink-0 h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10">
                  <img
                    src={kid.url}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    width={40}
                    height={46}
                    className="absolute inset-x-0 bottom-0 mx-auto h-full w-auto animate-kid-jump-badge select-none pointer-events-none"
                  />
                </span>
                <span
                  className="text-[10px] sm:text-xs font-black uppercase tracking-wider leading-none"
                  aria-label={badge}
                >
                  {badge.split("").map((ch, i) => {
                    if (ch === " " || ch === "\u00A0") {
                      return (
                        <span key={i} aria-hidden>
                          {"\u00A0"}
                        </span>
                      );
                    }
                    const color = palette[colorIdx % palette.length];
                    colorIdx++;
                    return (
                      <span
                        key={i}
                        aria-hidden
                        className="animate-letter-drop"
                        style={{
                          ["--drop-delay" as any]: `${i * 0.06}s`,
                          ["--drop-color" as any]: color,
                        }}
                      >
                        {ch}
                      </span>
                    );
                  })}
                </span>
              </div>
            );
          })()}

          <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] text-foreground">
            Where little{" "}
            <span className="inline-block align-baseline">
              <BlockWord word="MINDZ" />
            </span>{" "}
            <br className="hidden md:block" />
            grow big dreams.
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl">
            Mighty Mindz International Pre-school is a warm, joyful place for
            ages 2–6 to play, wonder, and discover. Rooted in curiosity,
            guided by love.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#admissions"
              className="inline-flex items-center rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground btn-3d [--btn-shadow:var(--primary)]"
            >
              Book a School Tour →
            </a>
            <a
              href="#programs"
              className="inline-flex items-center rounded-full bg-card px-6 py-3.5 text-base font-bold text-foreground border border-border btn-3d [--btn-shadow:var(--border)]"
            >
              Explore Programs
            </a>
          </div>

          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              ["12+", "Years of care"],
              ["1:8", "Teacher ratio"],
              ["500+", "Happy families"],
            ].map(([n, l]) => (
              <div key={l} className="soft-card p-4 text-center">
                <dt className="text-2xl md:text-3xl font-bold text-primary">{n}</dt>
                <dd className="text-xs font-semibold text-muted-foreground mt-1">
                  {l}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="soft-card overflow-hidden rounded-3xl">
            <img
              src={heroImg}
              alt="Happy pre-school children playing with alphabet blocks and a friendly dolphin mascot"
              width={1600}
              height={1200}
              className="w-full h-auto"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 hidden sm:block soft-card px-5 py-4 animate-float-slow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-leaf/20 grid place-items-center text-leaf font-bold">
                ✓
              </div>
              <div>
                <div className="text-sm font-bold">Certified Educators</div>
                <div className="text-xs text-muted-foreground">
                  Early-childhood specialists
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-2 hidden sm:block soft-card px-4 py-3 animate-bob">
            <div className="text-xs font-bold text-tomato">★ ★ ★ ★ ★</div>
            <div className="text-xs text-muted-foreground">
              Loved by 500+ parents
            </div>
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
              A word from our Principal
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
            <div className="flex items-center gap-4 pt-4">
              <div className="h-14 w-14 rounded-full bg-accent grid place-items-center font-display font-bold text-xl text-accent-foreground">
                MM
              </div>
              <div>
                <div className="font-bold text-foreground">Mrs. Priya Sharma</div>
                <div className="text-sm">Principal · M.Ed Early Childhood</div>
              </div>
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
              A peek into our joyful days.
            </h2>
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
              href="tel:+911234567890"
              className="inline-flex items-center rounded-full bg-card border border-border px-7 py-3.5 text-base font-bold btn-3d [--btn-shadow:var(--border)]"
            >
              Call Admissions
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

          <dl className="mt-8 space-y-5 text-sm">
            {[
              ["Address", "Mighty Mindz International Pre-school, Sector 21, Green Park, City"],
              ["Hours", "Mon – Sat · 8:30 AM – 3:30 PM"],
              ["Phone", "+91 12345 67890"],
              ["Email", "hello@mightymindz.school"],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-4">
                <dt className="w-20 shrink-0 font-bold text-primary">{k}</dt>
                <dd className="text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <form
            className="mt-8 soft-card p-6 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Thanks! We'll be in touch shortly.");
            }}
          >
            <label className="text-sm font-semibold sm:col-span-1">
              <span className="block mb-1.5">Parent name</span>
              <input
                required
                className="w-full rounded-xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-1">
              <span className="block mb-1.5">Phone</span>
              <input
                required
                type="tel"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="text-sm font-semibold sm:col-span-2">
              <span className="block mb-1.5">Message</span>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tell us about your little one…"
              />
            </label>
            <button
              type="submit"
              className="sm:col-span-2 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground btn-3d [--btn-shadow:var(--primary)]"
            >
              Send message
            </button>
          </form>
        </div>

        <div className="soft-card overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-full min-h-[420px]">
          <iframe
            title="Mighty Mindz on the map"
            src="https://www.google.com/maps?q=preschool&output=embed"
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
            <li><a href="#gallery" className="hover:underline">Gallery</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-display font-bold mb-4">Contact</h4>
          <ul className="space-y-2 text-primary-foreground/85 text-sm">
            <li>Sector 21, Green Park</li>
            <li>+91 12345 67890</li>
            <li>hello@mightymindz.school</li>
          </ul>
        </div>
      </div>
      <div className="relative mx-auto max-w-7xl px-4 md:px-8 mt-12 pt-6 border-t border-primary-foreground/20 flex flex-wrap items-center justify-between gap-3 text-xs text-primary-foreground/70">
        <div>© {new Date().getFullYear()} Mighty Mindz International Pre-school™</div>
        <div>Made with ❤ for tiny explorers.</div>
      </div>
    </footer>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav />
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
