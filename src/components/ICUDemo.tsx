"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import ECGLine from "./ECGLine";

interface VitalSign {
  label: string;
  value: number;
  unit: string;
  color: string;
  min: number;
  max: number;
  target: number;
  critical?: boolean;
}

const INITIAL_VITALS: VitalSign[] = [
  { label: "Heart Rate", value: 112, unit: "bpm", color: "#10b981", min: 60, max: 150, target: 85 },
  { label: "MAP", value: 58, unit: "mmHg", color: "#ef4444", min: 40, max: 120, target: 72, critical: true },
  { label: "SpO2", value: 91, unit: "%", color: "#3b82f6", min: 80, max: 100, target: 96 },
  { label: "Temp", value: 39.2, unit: "°C", color: "#f59e0b", min: 35, max: 42, target: 37 },
  { label: "Lactate", value: 4.8, unit: "mmol/L", color: "#a855f7", min: 0, max: 10, target: 1.5, critical: true },
  { label: "WBC", value: 18.2, unit: "K/μL", color: "#ec4899", min: 4, max: 25, target: 8 },
];

interface Recommendation {
  action: string;
  detail: string;
  confidence: number;
  impact: string;
}

const RECOMMENDATIONS: Recommendation[] = [
  {
    action: "Administer 250 mL IV crystalloid bolus",
    detail: "MAP below target. Based on 12,847 similar patient trajectories, a 250 mL bolus over 30 min is associated with improved hemodynamic stability.",
    confidence: 0.87,
    impact: "Expected MAP increase: +8-12 mmHg within 45 min",
  },
  {
    action: "Initiate norepinephrine at 0.05 mcg/kg/min",
    detail: "If MAP remains <65 mmHg after fluid bolus. 73% of similar patients required vasopressor support within 2 hours.",
    confidence: 0.73,
    impact: "Expected MAP stabilisation above 65 mmHg",
  },
  {
    action: "Obtain blood cultures and start empiric antibiotics",
    detail: "Elevated lactate + temperature + WBC pattern consistent with sepsis. Each hour delay in antibiotics associated with 7.6% mortality increase.",
    confidence: 0.92,
    impact: "Mortality risk reduction: 31% with timely treatment",
  },
];

export default function ICUDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-200px" });
  const [phase, setPhase] = useState<"monitoring" | "analyzing" | "recommending">("monitoring");
  const [vitals, setVitals] = useState(INITIAL_VITALS);
  const [activeRec, setActiveRec] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!isInView || started) return;
    setStarted(true);

    // Phase 1: monitoring vitals (fluctuating)
    const vitalInterval = setInterval(() => {
      setVitals((prev) =>
        prev.map((v) => ({
          ...v,
          value: Math.round((v.value + (Math.random() - 0.48) * (v.max - v.min) * 0.02) * 10) / 10,
        }))
      );
    }, 800);

    // Phase transitions
    setTimeout(() => setPhase("analyzing"), 2500);
    setTimeout(() => setPhase("recommending"), 4500);

    return () => clearInterval(vitalInterval);
  }, [isInView, started]);

  return (
    <div ref={ref} className="w-full max-w-5xl mx-auto">
      {/* Monitor Frame */}
      <div className="bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden shadow-2xl">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-900/80 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-mono text-gray-400">StriveMAP v2.1</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
            <span>Patient ID: ••••4827</span>
            <span>ICU Bed 12</span>
            <span>Sepsis Protocol Active</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-mono px-2 py-1 rounded ${
              phase === "recommending" ? "bg-green-500/20 text-green-400" :
              phase === "analyzing" ? "bg-blue-500/20 text-blue-400" :
              "bg-gray-700 text-gray-400"
            }`}>
              {phase === "monitoring" ? "MONITORING" :
               phase === "analyzing" ? "ANALYZING..." :
               "RECOMMENDATION READY"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          {/* Vitals Panel */}
          <div className="lg:col-span-2 p-4 border-r border-gray-800">
            <div className="text-xs font-mono text-gray-500 mb-3 uppercase tracking-wider">
              Live Patient Vitals — 50+ variables synthesised
            </div>

            {/* ECG Trace */}
            <div className="mb-4 border border-gray-800 rounded-lg p-2 bg-gray-950">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-green-400">ECG Lead II</span>
                <span className="text-xs font-mono text-green-400">{vitals[0].value} bpm</span>
              </div>
              <ECGLine color="#10b981" height={50} speed={3} />
            </div>

            {/* Vital Signs Grid */}
            <div className="grid grid-cols-2 gap-2">
              {vitals.map((vital) => (
                <motion.div
                  key={vital.label}
                  className={`p-3 rounded-lg border ${
                    vital.critical
                      ? "border-red-500/50 bg-red-500/5"
                      : "border-gray-800 bg-gray-900/50"
                  }`}
                  animate={vital.critical ? { borderColor: ["rgba(239,68,68,0.3)", "rgba(239,68,68,0.7)", "rgba(239,68,68,0.3)"] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <div className="text-xs text-gray-500 mb-1">{vital.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-mono font-bold" style={{ color: vital.color }}>
                      {vital.value}
                    </span>
                    <span className="text-xs text-gray-500">{vital.unit}</span>
                  </div>
                  {vital.critical && (
                    <div className="text-xs text-red-400 mt-1 font-mono">
                      !! BELOW TARGET
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Variables indicator */}
            <div className="mt-3 text-xs text-gray-600 font-mono text-center">
              + 44 additional variables analysed in real-time
            </div>
          </div>

          {/* AI Decision Panel */}
          <div className="lg:col-span-3 p-4">
            <AnimatePresence mode="wait">
              {phase === "monitoring" && (
                <motion.div
                  key="monitoring"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-gray-500"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-gray-700 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <p className="text-sm font-mono">Ingesting patient data stream...</p>
                  <p className="text-xs text-gray-600 mt-2">Searching across 5M hours of ICU outcomes</p>
                </motion.div>
              )}

              {phase === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center"
                >
                  <div className="relative w-24 h-24 mb-6">
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-500/30"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-2 rounded-full border-2 border-blue-400/50"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.2, 0.7] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                    <div className="absolute inset-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-sm font-mono text-blue-400">Matching to similar patient trajectories...</p>
                  <div className="mt-4 w-64 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-mono">
                    Evaluating 12,847 similar cases from 60,000+ patients
                  </p>
                </motion.div>
              )}

              {phase === "recommending" && (
                <motion.div
                  key="recommending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-mono text-green-400 uppercase tracking-wider">
                      Treatment Recommendations — Personalised
                    </span>
                  </div>

                  <div className="space-y-3">
                    {RECOMMENDATIONS.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.4, duration: 0.5 }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          activeRec === i
                            ? "border-blue-500/50 bg-blue-500/10"
                            : "border-gray-800 bg-gray-900/50 hover:border-gray-700"
                        }`}
                        onClick={() => setActiveRec(i)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              i === 0 ? "bg-red-500/20 text-red-400" :
                              i === 1 ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-green-500/20 text-green-400"
                            }`}>
                              {i + 1}
                            </div>
                            <span className="text-sm font-semibold text-white">
                              {rec.action}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-blue-400 whitespace-nowrap ml-2">
                            {Math.round(rec.confidence * 100)}% confidence
                          </span>
                        </div>

                        <AnimatePresence>
                          {activeRec === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                {rec.detail}
                              </p>
                              <div className="mt-2 px-3 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                                <p className="text-xs text-green-400 font-mono">
                                  {rec.impact}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="mt-4 p-3 rounded-lg bg-gray-900/80 border border-gray-800"
                  >
                    <p className="text-xs text-gray-500 text-center font-mono">
                      Clinician reviews and applies. AI assists, human decides.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
