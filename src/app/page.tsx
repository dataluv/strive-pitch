"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import ECGLine from "@/components/ECGLine";
import ICUDemo from "@/components/ICUDemo";
import StatCard from "@/components/StatCard";
import AnimatedCounter from "@/components/AnimatedCounter";

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`relative py-24 px-6 md:px-12 lg:px-24 ${className}`}>
      {children}
    </section>
  );
}

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* =============================================
   NAV
   ============================================= */
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-white text-lg tracking-tight">STRIVE</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#problem" className="hover:text-white transition-colors">Problem</a>
          <a href="#technology" className="hover:text-white transition-colors">Technology</a>
          <a href="#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="#evidence" className="hover:text-white transition-colors">Evidence</a>
          <a href="#catalysts" className="hover:text-white transition-colors">Catalysts</a>
        </div>
      </div>
    </nav>
  );
}

/* =============================================
   HERO
   ============================================= */
function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden"
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.08),transparent_70%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ECG lines in background */}
      <div className="absolute top-1/4 left-0 right-0 opacity-20">
        <ECGLine color="#3b82f6" height={40} speed={1.5} />
      </div>
      <div className="absolute top-3/4 left-0 right-0 opacity-10">
        <ECGLine color="#10b981" height={30} speed={1} />
      </div>

      <motion.div
        style={{ opacity, y }}
        className="relative z-10 max-w-5xl mx-auto text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-mono">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            World&apos;s first actionable AI in critical care
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.05] tracking-tight mb-8"
        >
          The decision
          <br />
          <span className="gradient-text">infrastructure</span>
          <br />
          for medicine
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-12"
        >
          STRIVE builds autonomous AI agents that integrate into hospital EHRs
          and guide treatment decisions in real-time. Not generating text.{" "}
          <span className="text-white font-semibold">Generating treatment decisions.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Cleveland Clinic
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Harvard
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Baxter
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Philips (85% patient monitoring market)
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
          className="mt-16"
        >
          <a
            href="#problem"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <span className="text-sm">Scroll to explore</span>
            <motion.svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </motion.svg>
          </a>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* =============================================
   PROBLEM
   ============================================= */
function Problem() {
  return (
    <Section id="problem">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">The Opportunity</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Within 5 years, every hospital will use AI
            <br />
            to guide treatment decisions.
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mb-16">
            Hospitals spend <span className="text-white font-semibold">$50B+/year</span> on monitoring infrastructure.
            The data is there. The intelligence layer is missing.
          </p>
        </FadeIn>

        {/* Why incumbents can't */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: "🏢",
              title: "Big Tech Can't",
              desc: "Google, Anthropic — hospitals will never give them live access to patient vitals for treatment decisions. Trust and regulatory barriers are too high.",
              label: "Structural barrier",
            },
            {
              icon: "🏥",
              title: "EHR Companies Won't",
              desc: "Epic is built to distribute tools, not tell a doctor what to do. When a recommendation harms a patient, their entire franchise is at risk.",
              label: "Risk-reward misalignment",
            },
            {
              icon: "🎯",
              title: "STRIVE Is Purpose-Built",
              desc: "Clinician-trusted, regulatory-cleared, built solely for real-time clinical intelligence. The category requires a dedicated company.",
              label: "Category leader",
            },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.15}>
              <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors h-full">
                <span className="text-3xl mb-4 block">{item.icon}</span>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  {item.label}
                </span>
                <h3 className="text-xl font-bold text-white mt-2 mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* =============================================
   TECHNOLOGY
   ============================================= */
function Technology() {
  return (
    <Section id="technology" className="bg-gray-950/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">The Technology</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Not an LLM.
            <br />
            <span className="gradient-text">Reinforcement learning.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mb-16">
            Most &ldquo;clinical AI agents&rdquo; are LLM wrappers — they generate text.
            Our agent generates <span className="text-white font-semibold">treatment decisions</span>, optimised
            across millions of past patient outcomes.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* LLM comparison */}
          <FadeIn>
            <div className="p-8 rounded-2xl bg-gray-900/30 border border-gray-800 relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gray-800 text-gray-500 text-xs font-mono">
                Competitors
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-6">LLM-based AI</h3>
              <ul className="space-y-4 text-gray-500">
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 mt-0.5">&mdash;</span>
                  <span>Pattern-matching on text</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 mt-0.5">&mdash;</span>
                  <span>Summarises notes, triages patients</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 mt-0.5">&mdash;</span>
                  <span>Static output — no temporal reasoning</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-600 mt-0.5">&mdash;</span>
                  <span>Cannot optimise sequential decisions</span>
                </li>
              </ul>
            </div>
          </FadeIn>

          {/* RL comparison */}
          <FadeIn delay={0.15}>
            <div className="p-8 rounded-2xl bg-blue-500/5 border border-blue-500/30 relative overflow-hidden glow-pulse">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono">
                STRIVE
              </div>
              <h3 className="text-2xl font-bold text-white mb-6">Reinforcement Learning</h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Optimises sequences of decisions over time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Same algorithm class behind AlphaGo</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Adapts to live, evolving patient physiology</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-0.5">&#10003;</span>
                  <span>Generates treatment decisions, not text</span>
                </li>
              </ul>
            </div>
          </FadeIn>
        </div>

        {/* Founder */}
        <FadeIn>
          <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 max-w-4xl">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-blue-400">MK</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Matthieu Komorowski, MD PhD
                </h3>
                <p className="text-blue-400 text-sm font-mono mb-3">Co-founder &amp; CMO</p>
                <p className="text-gray-400 leading-relaxed">
                  <span className="text-white font-semibold">Invented</span> the application of reinforcement
                  learning in medicine. Top 0.8% most cited scientists globally. 20+ years as ICU physician.
                  PhD in ML from MIT &amp; Imperial. His 2018{" "}
                  <span className="italic">Nature Medicine</span> paper has been cited 1,500+ times and
                  replicated by 50+ independent research groups.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* =============================================
   DEMO
   ============================================= */
function DemoSection() {
  return (
    <Section id="demo">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">Live Demo</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
              See the agent in action
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              StriveMAP ingests 50+ variables in real-time, matches to similar historical cases
              from 5M hours of ICU data, and delivers personalised treatment recommendations.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <ICUDemo />
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              {
                num: "50+",
                label: "Variables synthesised in real-time",
                desc: "Vitals, labs, medications, clinical trajectory",
              },
              {
                num: "5M",
                label: "Hours of ICU data",
                desc: "60,000+ patients across US and Europe",
              },
              {
                num: "24/7",
                label: "Continuous adaptation",
                desc: "Updates as patient physiology evolves",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-xl bg-gray-900/30 border border-gray-800"
              >
                <span className="text-3xl font-bold gradient-text">{item.num}</span>
                <p className="text-white font-semibold mt-2">{item.label}</p>
                <p className="text-gray-500 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* =============================================
   EVIDENCE
   ============================================= */
function Evidence() {
  return (
    <Section id="evidence" className="bg-gray-950/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">Clinical Evidence</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Peer-reviewed. Award-winning.
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mb-16">
            First use case: sepsis — the #1 cause of death in hospitals.
            $100B+ economic impact per year.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <StatCard value={41} suffix="%" label="Mortality reduction" sublabel="vs. standard care" color="green" delay={0} />
          <StatCard value={18} suffix="%" label="Shorter ICU stay" sublabel="Reduced length of stay" color="blue" delay={0.1} />
          <StatCard value={97} suffix="%" label="Clinician adoption" sublabel="Would use in daily practice" color="purple" delay={0.2} />
          <StatCard value={10} suffix="x+" label="Hospital ROI" sublabel="1-day ICU reduction saves ~$10K" color="yellow" delay={0.3} />
        </div>

        <FadeIn>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <span className="text-yellow-400 text-lg">&#127942;</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Star Research Award</h4>
                  <p className="text-gray-500 text-sm">SCCM 2026 — World&apos;s largest critical care congress</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                6,000+ attendees. Peer-reviewed research published in{" "}
                <span className="text-white italic">Critical Care Medicine</span>.
                Tier 1 journal publication in final stages.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <span className="text-blue-400 text-lg">&#128202;</span>
                </div>
                <div>
                  <h4 className="text-white font-semibold">Validated across datasets</h4>
                  <p className="text-gray-500 text-sm">Consistent results across US and European data</p>
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                35,000+ patients. 1.7M ICU hours analysed. Two independent datasets confirm
                mortality reduction is consistent across all patient subgroups — severity,
                organ dysfunction, demographics.
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* =============================================
   CATALYSTS & TIMELINE
   ============================================= */
function Catalysts() {
  const milestones = [
    {
      date: "Q2 2026",
      title: "CE Mark (Europe)",
      desc: "Regulatory clearance expected within 3 months. ISO 13485, ISO 27001, QMS complete.",
      status: "in-progress" as const,
    },
    {
      date: "Summer 2026",
      title: "Tier 1 Journal Publication",
      desc: "Full debut of STRIVE's system with complete data validation suite. Major milestone for the field.",
      status: "in-progress" as const,
    },
    {
      date: "Summer 2026",
      title: "RCT Enrolment Begins",
      desc: "World's first RCT of an actionable AI decision system. Cleveland Clinic, Harvard, UC Health. 200 ICU patients.",
      status: "upcoming" as const,
    },
    {
      date: "Q4 2026",
      title: "FDA 510(k) Clearance",
      desc: "Expected within 6 months. Alignment on risk classification confirmed with FDA.",
      status: "upcoming" as const,
    },
    {
      date: "Q4 2027",
      title: "RCT Results",
      desc: "If confirmed: first proof that AI can guide treatment decisions in live clinical care. Unlocks >$100M ARR.",
      status: "upcoming" as const,
    },
  ];

  return (
    <Section id="catalysts">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">Near-Term Catalysts</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Three milestones that each
            <br />
            independently derisk the company.
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mb-16">
            The evidence base is built. What&apos;s coming next creates a permanent proof moat —
            regulatory, clinical, and scientific.
          </p>
        </FadeIn>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-blue-500/50 to-transparent" />

          <div className="space-y-8">
            {milestones.map((m, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex items-start gap-6 pl-2">
                  <div className="relative z-10 mt-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        m.status === "in-progress"
                          ? "bg-blue-500 shadow-lg shadow-blue-500/30"
                          : "bg-gray-800 border border-gray-700"
                      }`}
                    >
                      {m.status === "in-progress" ? (
                        <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 pb-8">
                    <span className="text-sm font-mono text-blue-400">{m.date}</span>
                    <h3 className="text-xl font-bold text-white mt-1">{m.title}</h3>
                    <p className="text-gray-400 mt-2 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* =============================================
   PARTNERSHIPS
   ============================================= */
function Partnerships() {
  const partners = [
    {
      name: "Cleveland Clinic",
      role: "RCT Trial Site",
      detail: "Principal Investigator: Dr Abhijit Duggal",
    },
    {
      name: "Harvard",
      role: "RCT Trial Site",
      detail: "PI: Dr Nathan Shapiro. Leading heart failure expansion.",
    },
    {
      name: "UC Health",
      role: "RCT Trial Site",
      detail: "PI: Dr Robert Duncan Hite, Chairman of Critical Care",
    },
    {
      name: "Baxter",
      role: "$1M In-Kind Sponsorship",
      detail: "Expanding STRIVE across Starling hemodynamic monitoring platform",
    },
    {
      name: "Philips",
      role: "Distribution Partnership",
      detail: "Advanced discussions. ~85% of patient monitoring market.",
    },
    {
      name: "Mayo Clinic",
      role: "Distribution Partnership",
      detail: "Negotiating post-FDA distribution into partner hospitals, 10-35% royalties",
    },
    {
      name: "Northwestern",
      role: "Use Case Expansion",
      detail: "Building diabetes and heart failure applications",
    },
  ];

  return (
    <Section className="bg-gray-950/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">Strategic Partners</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            The biggest players in healthcare
            <br />
            are already betting on us.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          {partners.map((p, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-blue-500/30 transition-all h-full">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-bold text-lg">{p.name}</h4>
                  <span className="text-xs font-mono text-blue-400 px-2 py-1 bg-blue-500/10 rounded-full whitespace-nowrap">
                    {p.role}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{p.detail}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Clinical Champions callout */}
        <FadeIn delay={0.3}>
          <div className="mt-12 p-8 rounded-2xl bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
            <p className="text-gray-300 leading-relaxed">
              <span className="text-white font-bold">The people who write the global treatment guidelines</span>{" "}
              are now the people validating our tool. This includes the President of ESICM (10,000+
              members, 120+ countries), the first author of the Surviving Sepsis Campaign guidelines,
              and the Chair of the Committee on Critical Care Medicine at the ASA (60,000+ members).
            </p>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* =============================================
   PLATFORM EXPANSION
   ============================================= */
function Platform() {
  return (
    <Section>
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">Platform</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Critical care is the beachhead.
            <br />
            <span className="gradient-text">Same architecture, every department.</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mb-16">
            The agent architecture is domain-agnostic. Wherever you have continuous patient data
            and dynamic treatment decisions, the same system works. If it works in the hardest
            environment in medicine, it works everywhere.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            { name: "Sepsis", status: "Active", color: "green", detail: "First use case. RCT underway." },
            { name: "Heart Failure", status: "Building", color: "blue", detail: "With Harvard & Unity Health Toronto" },
            { name: "Diabetes", status: "Exploring", color: "yellow", detail: "Insulin titration with Northwestern" },
            { name: "Surgery +", status: "Roadmap", color: "gray", detail: "Same architecture, larger TAM" },
          ].map((uc, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="p-6 rounded-xl bg-gray-900/50 border border-gray-800 text-center">
                <div
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-mono mb-4 ${
                    uc.color === "green"
                      ? "bg-green-500/10 text-green-400"
                      : uc.color === "blue"
                      ? "bg-blue-500/10 text-blue-400"
                      : uc.color === "yellow"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-gray-800 text-gray-500"
                  }`}
                >
                  {uc.status}
                </div>
                <h4 className="text-white font-bold text-xl mb-2">{uc.name}</h4>
                <p className="text-gray-500 text-sm">{uc.detail}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <div className="mt-12 text-center">
            <p className="text-gray-400">
              First use case alone:{" "}
              <span className="text-white font-bold text-2xl">$100M+ ARR</span>
              <span className="text-gray-500 text-sm ml-2">
                (~6,000 US ICUs x $175K ACV x 10% penetration)
              </span>
            </p>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* =============================================
   TEAM
   ============================================= */
function TeamSection() {
  const team = [
    {
      initials: "EC",
      name: "Emily Chan",
      role: "CEO",
      bio: "Deployed >$1B in healthcare investments at Goldman Sachs and Apollo. Built regulated healthcare systems with the UN Secretary-General. Cambridge + Oxford law. Three-time sepsis survivor.",
    },
    {
      initials: "MK",
      name: "Matthieu Komorowski, MD PhD",
      role: "Chief Medical Officer",
      bio: "Invented RL in medicine. Top 0.8% most cited scientists globally. 20+ years ICU physician. PhD ML (MIT & Imperial). ESA astronaut finalist (23,000+ candidates).",
    },
    {
      initials: "AD",
      name: "Alon Dagan, MD",
      role: "Head of Clinical Validation",
      bio: "Former Associate Professor of Emergency Medicine, Harvard. 15+ years practising ED physician. Leading trial execution and use case expansion.",
    },
  ];

  return (
    <Section className="bg-gray-950/50">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">Team</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            7 people. 4 PhDs. 5 MDs.
            <br />
            17,000+ citations.
          </h2>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {team.map((t, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 h-full">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-400/20 flex items-center justify-center mb-4">
                  <span className="text-xl font-bold text-blue-400">{t.initials}</span>
                </div>
                <h4 className="text-white font-bold text-lg">{t.name}</h4>
                <p className="text-blue-400 text-sm font-mono mb-3">{t.role}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{t.bio}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={0.3}>
          <p className="text-center text-gray-500 mt-8 text-sm">
            Advisors from DeepMind, OpenAI, Moderna, Mount Sinai. Viz.ai founder ($1.2B valuation, first FDA-cleared SaMD).
          </p>
        </FadeIn>
      </div>
    </Section>
  );
}

/* =============================================
   INVESTMENT SECTION
   ============================================= */
function Investment() {
  return (
    <Section id="investment">
      <div className="max-w-4xl mx-auto text-center">
        <FadeIn>
          <span className="text-blue-400 font-mono text-sm uppercase tracking-wider">Investment</span>
          <h2 className="text-4xl md:text-5xl font-bold text-white mt-4 mb-6">
            Pre-publication. Pre-trial.
            <br />
            <span className="gradient-text">Pre-competitive pricing.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="p-8 rounded-2xl bg-gray-900/50 border border-gray-800 mb-8">
            <div className="grid md:grid-cols-3 gap-8 text-left">
              <div>
                <p className="text-gray-500 text-sm font-mono mb-2">Raised to date</p>
                <p className="text-3xl font-bold text-white">$3.5M</p>
                <p className="text-gray-400 text-sm mt-1">Pre-seed closed June 2025</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-mono mb-2">Runway</p>
                <p className="text-3xl font-bold text-green-400">18 months</p>
                <p className="text-gray-400 text-sm mt-1">Including $400K Innovate UK grant</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm font-mono mb-2">Next round</p>
                <p className="text-3xl font-bold text-blue-400">$5-6M</p>
                <p className="text-gray-400 text-sm mt-1">Trial + GTM + use case expansion</p>
              </div>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20">
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              We&apos;re not raising out of necessity. But the six months after publication and
              regulatory clearance land is when we need to be moving fastest — scaling the trial,
              activating distribution, expanding to heart failure. We&apos;d rather enter that window
              fully capitalised than spend it fundraising.
            </p>
            <p className="text-white font-semibold text-xl">
              The terms today reflect where we are — pre-publication, pre-trial.
              <br />
              After those land, the price will look very different.
            </p>
          </div>
        </FadeIn>
      </div>
    </Section>
  );
}

/* =============================================
   CLOSE
   ============================================= */
function Close() {
  return (
    <section className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
      <div className="absolute bottom-0 left-0 right-0 opacity-20">
        <ECGLine color="#3b82f6" height={60} speed={2} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <FadeIn>
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            When every hospital needs AI
            <br />
            to guide treatment decisions,
            <br />
            <span className="gradient-text">they&apos;ll need STRIVE.</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            We&apos;re selectively exploring co-investment ahead of catalysts that will reprice the
            company. Happy to set up a deeper session with our co-founder Matthieu.
          </p>
        </FadeIn>

        <FadeIn delay={0.4}>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:emily@strivehealth.ai"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Get in touch
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.5}>
          <p className="text-gray-600 text-sm mt-12">
            STRIVE Health | Confidential
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

/* =============================================
   MAIN PAGE
   ============================================= */
export default function Home() {
  return (
    <main>
      <Nav />
      <Hero />
      <div className="section-divider" />
      <Problem />
      <div className="section-divider" />
      <Technology />
      <div className="section-divider" />
      <DemoSection />
      <div className="section-divider" />
      <Evidence />
      <div className="section-divider" />
      <Catalysts />
      <div className="section-divider" />
      <Partnerships />
      <div className="section-divider" />
      <Platform />
      <div className="section-divider" />
      <TeamSection />
      <div className="section-divider" />
      <Investment />
      <div className="section-divider" />
      <Close />
    </main>
  );
}
