"use client";

import { useState, useEffect, useCallback } from "react";
import AnimatedCounter from "./AnimatedCounter";

interface SlideProps {
  children: React.ReactNode;
  bg?: string;
}

function Slide({ children, bg = "bg-white" }: SlideProps) {
  return (
    <div className={`min-h-screen flex flex-col justify-center px-16 py-12 ${bg}`}>
      <div className="max-w-6xl mx-auto w-full">{children}</div>
    </div>
  );
}

/* ============================================================ */

function ROISlide() {
  const [beds, setBeds] = useState(50);
  const [occupancy, setOccupancy] = useState(85);
  const [costPerDay, setCostPerDay] = useState(5500);

  const occupancyRate = occupancy / 100;
  const patientDays = beds * occupancyRate * 365;
  const avgLOS = 5.5;
  const patientsPerYear = Math.round(patientDays / avgLOS);
  const sepsisCases = Math.round(patientsPerYear * 0.3);
  const livesSaved = Math.round(sepsisCases * 0.41);
  const losReduction = 0.18;
  const icuDaysSaved = Math.round(patientDays * losReduction);
  const annualSavings = icuDaysSaved * costPerDay;
  const striveCostPerBed = 15000;
  const striveTotalCost = beds * striveCostPerBed;
  const roiRatio = Math.round(annualSavings / striveTotalCost);

  const formatMoney = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  const tamData = [
    { label: "Critical Care", value: 10, status: "delivered" as const },
    { label: "Kidney Failure", value: 8, status: "building" as const },
    { label: "Surgery", value: 6, status: "building" as const },
    { label: "Antibiotics", value: 6, status: "building" as const },
    { label: "Diabetes", value: 20, status: "future" as const },
    { label: "Heart Failure", value: 12, status: "future" as const },
    { label: "Oncology", value: 15, status: "future" as const },
  ];
  const tamMax = Math.max(...tamData.map(d => d.value));

  return (
    <Slide>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Hospital Economics
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-8">
          ROI Calculator &amp; Market Sizing
        </h2>

        <div className="grid grid-cols-2 gap-8">
          {/* Left: Calculator */}
          <div>
            <h3 className="text-lg font-bold text-[#1a1f36] mb-4">Estimate impact at your facility</h3>
            <div className="space-y-5 mb-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Number of ICU Beds</label>
                  <span className="text-sm font-bold font-mono text-[#00B894]">{beds}</span>
                </div>
                <input type="range" min={10} max={500} value={beds} onChange={e => setBeds(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B894]" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>10</span><span>500</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Average ICU Occupancy</label>
                  <span className="text-sm font-bold font-mono text-[#00B894]">{occupancy}%</span>
                </div>
                <input type="range" min={50} max={100} value={occupancy} onChange={e => setOccupancy(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B894]" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>50%</span><span>100%</span></div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Average Cost per ICU Day</label>
                  <span className="text-sm font-bold font-mono text-[#00B894]">${costPerDay.toLocaleString()}</span>
                </div>
                <input type="range" min={3000} max={10000} step={100} value={costPerDay} onChange={e => setCostPerDay(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#00B894]" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>$3,000</span><span>$10,000</span></div>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#00B894]/10 border border-[#00B894]/30 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#00B894] uppercase font-semibold mb-1">Lives Saved / Year</p>
                <p className="text-2xl font-bold font-mono text-[#00B894]">{livesSaved.toLocaleString()}</p>
              </div>
              <div className="bg-[#00B894]/10 border border-[#00B894]/30 rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#00B894] uppercase font-semibold mb-1">Annual Cost Savings</p>
                <p className="text-2xl font-bold font-mono text-[#00B894]">{formatMoney(annualSavings)}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">ICU Days Saved</p>
                <p className="text-lg font-bold font-mono text-gray-900">{icuDaysSaved.toLocaleString()}</p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                <p className="text-[10px] text-indigo-500 uppercase font-semibold mb-1">ROI</p>
                <p className="text-lg font-bold font-mono text-indigo-600">{roiRatio}:1</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Sepsis Cases / Yr</p>
                <p className="text-lg font-bold font-mono text-gray-900">{sepsisCases.toLocaleString()}</p>
              </div>
            </div>
            <p className="text-[10px] text-gray-400">Based on peer-reviewed evidence: 41% mortality reduction, 18% LOS reduction (p&lt;0.0001, 95% CI).</p>
          </div>

          {/* Right: TAM */}
          <div>
            <h3 className="text-lg font-bold text-[#1a1f36] mb-4">Total Addressable Market</h3>
            <div className="space-y-3 mb-6">
              {tamData.map(d => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium text-gray-700 text-right">{d.label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`h-6 rounded-full flex items-center px-2.5 transition-all ${
                        d.status === "delivered" ? "bg-[#00B894]" :
                        d.status === "building" ? "bg-indigo-400" : "bg-gray-300"
                      }`}
                      style={{ width: `${(d.value / tamMax) * 100}%` }}
                    >
                      <span className="text-[11px] font-bold text-white">${d.value}B</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-semibold uppercase w-14 ${
                    d.status === "delivered" ? "text-[#00B894]" :
                    d.status === "building" ? "text-indigo-500" : "text-gray-400"
                  }`}>
                    {d.status === "delivered" ? "Delivered" : d.status === "building" ? "Building" : "Future"}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-center">
              <p className="text-xs text-indigo-400 uppercase font-semibold mb-1">Total Addressable Market</p>
              <p className="text-4xl font-bold font-mono text-indigo-600">$77B+</p>
              <p className="text-xs text-indigo-400 mt-1">AI clinical decision support across all target verticals</p>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  );
}

export default function PitchDeck({ onShowDemo }: { onShowDemo: () => void }) {
  const [slide, setSlide] = useState(0);

  const TOTAL_SLIDES = 13;

  const next = useCallback(() => setSlide((s) => Math.min(s + 1, TOTAL_SLIDES - 1)), []);
  const prev = useCallback(() => setSlide((s) => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
      if (e.key === "d" || e.key === "D") {
        onShowDemo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev, onShowDemo]);

  const slides = [
    /* 0 — TITLE */
    <Slide key={0} bg="bg-[#1a1f36]">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#00B894] to-[#00cec9] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <span className="text-white font-bold text-4xl tracking-tight">STRIVE</span>
        </div>
        <h1 className="text-6xl md:text-7xl font-bold text-white leading-tight mb-8">
          The decision infrastructure
          <br />
          <span className="text-[#00B894]">for medicine</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
          Autonomous AI agents that integrate into hospital EHRs and guide
          treatment decisions in real-time
        </p>
        <p className="text-sm text-gray-600">Confidential | April 2026</p>
      </div>
    </Slide>,

    /* 1 — THESIS */
    <Slide key={1} bg="bg-[#1a1f36]">
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          The Thesis
        </p>
        <h2 className="text-5xl font-bold text-white leading-tight mb-10">
          Three things are happening
          <br />
          simultaneously.
        </h2>
        <div className="grid grid-cols-3 gap-8">
          {[
            {
              num: "1",
              title: "Massive open category",
              desc: "A space worth tens of billions, structurally unsuitable for incumbents. Google, Epic, and IBM have tried and failed.",
            },
            {
              num: "2",
              title: "Only team that can solve it",
              desc: "Our co-founder invented the ML advancement that makes this possible. Top 0.8% cited scientists globally.",
            },
            {
              num: "3",
              title: "Inflection point now",
              desc: "Cleveland Clinic and Harvard are treating ICU patients with our system. World's first RCT of actionable AI in critical care.",
            },
          ].map((item) => (
            <div key={item.num} className="bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-[#00B894] flex items-center justify-center text-white font-bold mb-4">
                {item.num}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Slide>,

    /* 2 — THE BELIEF */
    <Slide key={2}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          The Belief
        </p>
        <h2 className="text-5xl font-bold text-[#1a1f36] leading-tight mb-8">
          Within 5 years, every hospital will use
          <br />
          AI to guide treatment decisions.
        </h2>
        <p className="text-2xl text-gray-500 max-w-3xl mb-12">
          Hospitals spend <span className="text-[#1a1f36] font-bold">$50B+/year</span> on
          monitoring infrastructure. The data is there. The intelligence layer is missing.
        </p>
        <div className="bg-gray-50 rounded-2xl p-8 max-w-3xl border border-gray-100">
          <p className="text-lg text-gray-600 leading-relaxed">
            No decision layer exists that turns continuous patient data into a live stream of
            treatment recommendations adapting to evolving physiology.{" "}
            <span className="text-[#1a1f36] font-bold">That&apos;s what we&apos;re building.</span>
          </p>
        </div>
      </div>
    </Slide>,

    /* 3 — WHY INCUMBENTS CAN'T */
    <Slide key={3}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Why No One Has Solved It
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-10">
          This category requires a purpose-built company.
        </h2>
        <div className="grid grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-red-50 border border-red-100">
            <h3 className="text-lg font-bold text-red-900 mb-3">Big Tech can&apos;t</h3>
            <p className="text-sm text-red-800 leading-relaxed">
              Hospitals will never give Google or Anthropic live access to patient vitals for
              treatment decisions. Trust and regulatory barriers are too high.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-yellow-50 border border-yellow-100">
            <h3 className="text-lg font-bold text-yellow-900 mb-3">EHR companies won&apos;t</h3>
            <p className="text-sm text-yellow-800 leading-relaxed">
              Epic is built to distribute tools, not tell a doctor what to do. When a recommendation
              harms a patient, their entire franchise is at risk. They&apos;ll buy this, not build it.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-green-50 border border-green-100">
            <h3 className="text-lg font-bold text-green-900 mb-3">STRIVE is purpose-built</h3>
            <p className="text-sm text-green-800 leading-relaxed">
              Clinician-trusted, regulatory-cleared, built solely for real-time clinical intelligence.
              The category is open and we&apos;re building the defining company.
            </p>
          </div>
        </div>
      </div>
    </Slide>,

    /* 4 — TECHNOLOGY: RL vs LLM */
    <Slide key={4}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          The Technology
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-3">
          Not an LLM. <span className="text-[#00B894]">Reinforcement learning.</span>
        </h2>
        <p className="text-xl text-gray-500 mb-10 max-w-3xl">
          Most &ldquo;clinical AI agents&rdquo; are LLM wrappers — they generate text.
          Our agent generates <span className="text-[#1a1f36] font-bold">treatment decisions.</span>
        </p>
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-400 font-mono uppercase mb-3">Competitors</p>
            <h3 className="text-xl font-bold text-gray-400 mb-4">LLM-based &ldquo;agents&rdquo;</h3>
            <ul className="space-y-2 text-gray-500 text-sm">
              <li>&mdash; Pattern-matching on text</li>
              <li>&mdash; Summarises notes, triages patients</li>
              <li>&mdash; Static output — no temporal reasoning</li>
              <li>&mdash; Cannot optimise sequential decisions</li>
            </ul>
          </div>
          <div className="p-6 rounded-xl bg-[#1a1f36] border-2 border-[#00B894]">
            <p className="text-xs text-[#00B894] font-mono uppercase mb-3">STRIVE</p>
            <h3 className="text-xl font-bold text-white mb-4">Reinforcement Learning</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-[#00B894]">&#10003;</span> Same algorithm class behind AlphaGo
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00B894]">&#10003;</span> Optimises sequences of decisions over time
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00B894]">&#10003;</span> Adapts to live, evolving physiology
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#00B894]">&#10003;</span> Generates treatment decisions, not text
              </li>
            </ul>
          </div>
        </div>
        {/* Founder callout */}
        <div className="p-5 rounded-xl bg-[#00B894]/5 border border-[#00B894]/20 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-[#00B894]/10 flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-[#00B894]">MK</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a1f36]">
              Matthieu Komorowski, MD PhD — Co-founder &amp; CMO
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-semibold text-[#1a1f36]">Invented</span> RL in medicine. Top 0.8% cited
              scientists globally. 2018 <em>Nature Medicine</em> paper: 1,500+ citations, replicated 50+ times.
              20+ years ICU physician. PhD ML (MIT &amp; Imperial).
            </p>
          </div>
        </div>
      </div>
    </Slide>,

    /* 5 — PRODUCT DEMO SLIDE */
    <Slide key={5} bg="bg-[#1a1f36]">
      <div className="text-center">
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          The Product
        </p>
        <h2 className="text-5xl font-bold text-white mb-6">
          See what the clinician sees.
        </h2>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          StriveMAP integrates into the EHR, synthesises 50+ variables in real-time,
          and produces personalised treatment recommendations at the bedside.
        </p>
        <button
          onClick={onShowDemo}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#00B894] text-white text-lg font-bold rounded-xl hover:bg-[#00a383] transition-all shadow-lg shadow-[#00B894]/25"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Launch Live Demo
        </button>
        <p className="text-sm text-gray-600 mt-4">
          Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs">D</kbd> to toggle demo at any time
        </p>
      </div>
    </Slide>,

    /* 6 — EVIDENCE */
    <Slide key={6}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Clinical Evidence — Sepsis (Use Case #1)
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-2">
          #1 cause of death in hospitals. $100B impact/year.
        </h2>
        <p className="text-lg text-gray-500 mb-10">
          Peer-reviewed. Award-winning. Consistent across US and European datasets.
        </p>
        <div className="grid grid-cols-4 gap-6 mb-10">
          {[
            { val: "41%", label: "Mortality reduction", sub: "vs. standard care", color: "text-green-600" },
            { val: "18%", label: "Shorter ICU stay", sub: "Reduced length of stay", color: "text-blue-600" },
            { val: "97%", label: "Clinician adoption", sub: "76/78 would use daily", color: "text-purple-600" },
            { val: "10-14x", label: "Hospital ROI", sub: "1-day savings ~$10K", color: "text-yellow-600" },
          ].map((s) => (
            <div key={s.label} className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100">
              <p className={`text-4xl font-bold ${s.color} mb-2`}>{s.val}</p>
              <p className="text-sm font-semibold text-gray-800">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex-1 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
            <p className="text-sm font-bold text-yellow-900">&#127942; Star Research Award — SCCM 2026</p>
            <p className="text-xs text-yellow-700 mt-1">World&apos;s largest critical care congress. 6,000+ attendees.</p>
          </div>
          <div className="flex-1 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-sm font-bold text-blue-900">Tier 1 journal publication in final stages</p>
            <p className="text-xs text-blue-700 mt-1">35,000+ patients. 1.7M ICU hours. Two independent datasets.</p>
          </div>
        </div>
      </div>
    </Slide>,

    /* 7 — CATALYSTS */
    <Slide key={7}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Near-Term Catalysts
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-10">
          Three milestones that each independently
          <br />
          derisk the company.
        </h2>
        <div className="space-y-6">
          {[
            {
              date: "Q2-Q3 2026",
              title: "CE Mark — European regulatory clearance",
              desc: "ISO 13485, ISO 27001, QMS, clinical evaluation complete. Approaching formal submission.",
              active: true,
            },
            {
              date: "Summer 2026",
              title: "Tier 1 journal publication",
              desc: "Full debut of STRIVE\u2019s system with complete data validation suite.",
              active: true,
            },
            {
              date: "Summer 2026 \u2192 Q4 2027",
              title: "World\u2019s first RCT of actionable AI in critical care",
              desc: "Cleveland Clinic, Harvard, UC Health. 200 ICU patients. If confirmed \u2192 unlocks >$100M ARR.",
              active: false,
            },
            {
              date: "Q4 2026",
              title: "FDA 510(k) clearance",
              desc: "Risk classification alignment confirmed. Expected within 6 months.",
              active: false,
            },
          ].map((m, i) => (
            <div key={i} className="flex items-start gap-5">
              <div className="flex flex-col items-center">
                <div
                  className={`w-4 h-4 rounded-full ${
                    m.active ? "bg-[#00B894] shadow-lg shadow-[#00B894]/30" : "bg-gray-300"
                  }`}
                />
                {i < 3 && <div className="w-px h-12 bg-gray-200 mt-1" />}
              </div>
              <div>
                <p className="text-xs font-mono text-[#00B894] mb-1">{m.date}</p>
                <h3 className="text-lg font-bold text-[#1a1f36]">{m.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Slide>,

    /* 8 — PARTNERSHIPS */
    <Slide key={8}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Strategic Partners
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-10">
          The biggest players in healthcare
          <br />
          are already betting on us.
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { name: "Cleveland Clinic", role: "RCT Site", detail: "PI: Dr Abhijit Duggal" },
            { name: "Harvard", role: "RCT Site", detail: "PI: Dr Nathan Shapiro + heart failure expansion" },
            { name: "UC Health", role: "RCT Site", detail: "PI: Dr Robert Duncan Hite" },
            { name: "Baxter", role: "$1M In-Kind", detail: "Expanding across Starling monitoring platform" },
            { name: "Philips", role: "Distribution", detail: "~85% of patient monitoring market" },
            { name: "Mayo Clinic", role: "Distribution", detail: "Post-FDA deployment, 10-35% royalties" },
          ].map((p) => (
            <div key={p.name} className="p-5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-[#1a1f36]">{p.name}</h4>
                <span className="text-[10px] font-semibold text-[#00B894] bg-[#00B894]/10 px-2 py-0.5 rounded-full">
                  {p.role}
                </span>
              </div>
              <p className="text-xs text-gray-500">{p.detail}</p>
            </div>
          ))}
        </div>
        <div className="p-5 bg-[#00B894]/5 rounded-xl border border-[#00B894]/15">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-[#1a1f36]">The people who write the global treatment guidelines</span>{" "}
            are now the people validating our tool — including the President of ESICM (10,000+ members),
            first author of the Surviving Sepsis Campaign, and the Chair of Critical Care at the ASA (60,000+ members).
          </p>
        </div>
      </div>
    </Slide>,

    /* 9 — PLATFORM */
    <Slide key={9}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Platform Expansion
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-3">
          Critical care is the beachhead.
        </h2>
        <p className="text-xl text-gray-500 mb-10">
          Domain-agnostic architecture. Same engine, every department. If it works in the
          hardest environment in medicine, it works everywhere.
        </p>
        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            { name: "Sepsis", status: "RCT Active", color: "bg-green-100 text-green-700 border-green-200" },
            { name: "Heart Failure", status: "Building", color: "bg-blue-100 text-blue-700 border-blue-200" },
            { name: "Diabetes", status: "Exploring", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
            { name: "Surgery +", status: "Roadmap", color: "bg-gray-100 text-gray-500 border-gray-200" },
          ].map((uc) => (
            <div key={uc.name} className={`p-5 rounded-xl border text-center ${uc.color}`}>
              <p className="text-2xl font-bold mb-2">{uc.name}</p>
              <p className="text-xs font-semibold">{uc.status}</p>
            </div>
          ))}
        </div>
        <div className="text-center">
          <p className="text-gray-500">
            First use case alone:{" "}
            <span className="text-[#1a1f36] font-bold text-3xl">$100M+ ARR</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ~6,000 US ICUs &times; $175K ACV &times; 10% penetration
          </p>
        </div>
      </div>
    </Slide>,

    /* 10 — ROI CALCULATOR & TAM */
    <ROISlide key={10} />,

    /* 11 — TEAM */
    <Slide key={11}>
      <div>
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Team
        </p>
        <h2 className="text-4xl font-bold text-[#1a1f36] mb-10">
          7 people. 4 PhDs. 5 MDs. 17,000+ citations.
        </h2>
        <div className="grid grid-cols-3 gap-6 mb-8">
          {[
            {
              init: "EC",
              name: "Emily Chan",
              role: "CEO",
              bio: ">$1B healthcare investments at Goldman Sachs & Apollo. Regulated healthcare systems for the UN. Cambridge + Oxford law. Three-time sepsis survivor.",
            },
            {
              init: "MK",
              name: "Matthieu Komorowski, MD PhD",
              role: "CMO",
              bio: "Invented RL in medicine. Top 0.8% cited scientists. 20+ years ICU physician. PhD ML (MIT & Imperial). ESA astronaut finalist.",
            },
            {
              init: "AD",
              name: "Alon Dagan, MD",
              role: "Head of Clinical Validation",
              bio: "Former Assoc. Professor, Emergency Medicine, Harvard. 15+ years practising ED physician. Leading trial execution.",
            },
          ].map((t) => (
            <div key={t.name} className="p-6 rounded-xl bg-gray-50 border border-gray-100">
              <div className="w-12 h-12 rounded-full bg-[#1a1f36] flex items-center justify-center text-white font-bold mb-3">
                {t.init}
              </div>
              <p className="font-bold text-[#1a1f36]">{t.name}</p>
              <p className="text-xs text-[#00B894] font-mono mb-2">{t.role}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{t.bio}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center">
          + 3 ML PhDs (Imperial). Advisors from DeepMind, OpenAI, Moderna, Mount Sinai. Viz.ai founder ($1.2B, first FDA-cleared SaMD).
        </p>
      </div>
    </Slide>,

    /* 12 — INVESTMENT + CLOSE */
    <Slide key={12} bg="bg-[#1a1f36]">
      <div className="text-center">
        <p className="text-[#00B894] font-mono text-sm uppercase tracking-wider mb-4">
          Investment
        </p>
        <h2 className="text-5xl font-bold text-white mb-10">
          Pre-publication. Pre-trial.
          <br />
          <span className="text-[#00B894]">Pre-competitive pricing.</span>
        </h2>

        <div className="grid grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-gray-500 text-xs font-mono mb-2">Raised to date</p>
            <p className="text-3xl font-bold text-white">$3.5M</p>
            <p className="text-xs text-gray-500 mt-1">Pre-seed, June 2025</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-gray-500 text-xs font-mono mb-2">Runway</p>
            <p className="text-3xl font-bold text-[#00B894]">18 months</p>
            <p className="text-xs text-gray-500 mt-1">+ $400K Innovate UK grant</p>
          </div>
          <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
            <p className="text-gray-500 text-xs font-mono mb-2">Next round</p>
            <p className="text-3xl font-bold text-blue-400">$5-6M</p>
            <p className="text-xs text-gray-500 mt-1">Trial + GTM + expansion</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <p className="text-lg text-gray-300 leading-relaxed mb-6">
            Not raising out of necessity. The six months after catalysts land is when we need to
            move fastest. We&apos;d rather enter that window fully capitalised.
          </p>
          <p className="text-xl text-white font-bold">
            The terms today reflect pre-publication, pre-trial.
            <br />
            After those land, the price will look very different.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00B894] to-[#00cec9] flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-white font-bold text-2xl">STRIVE</span>
        </div>
        <p className="text-gray-600 text-sm">
          Happy to set up a deeper session with Matthieu. Would love to hear your thoughts.
        </p>
      </div>
    </Slide>,
  ];

  return (
    <div className="relative">
      {/* Current slide */}
      {slides[slide]}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-t border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={prev}
            disabled={slide === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm text-gray-500 font-mono">
            {slide + 1} / {TOTAL_SLIDES}
          </span>
          <button
            onClick={next}
            disabled={slide === TOTAL_SLIDES - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === slide ? "bg-[#00B894] w-6" : "bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">&larr; &rarr;</kbd>
          <span>navigate</span>
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">D</kbd>
          <span>demo</span>
        </div>
      </div>
    </div>
  );
}
