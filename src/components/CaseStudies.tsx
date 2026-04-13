"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

/* ================================================================
   TYPES
   ================================================================ */

type CaseTab = "clinical-before" | "clinical-after" | "compliance-before" | "compliance-after";

interface Step {
  title: string;
  duration: number;
}

/* ================================================================
   CASE 1: CLINICAL — BEFORE (Traditional ICU Workflow)
   ================================================================ */

function ClinicalBefore({ step, progress }: { step: number; progress: number }) {
  return (
    <div className="h-full flex flex-col justify-center px-12 py-8">
      {step === 0 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold font-mono">06:14 AM</div>
            <div className="text-sm text-gray-500 font-medium">ICU Shift Handoff — Dr. Sarah Chen, Attending</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Patient #4782 — 78y Male, Septic Shock</h2>
          <p className="text-sm text-gray-500 mb-6">The doctor begins her shift by hunting for information across fragmented systems.</p>

          {/* Fragmented systems */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { name: "Epic EHR", status: "Logged in", color: "blue", delay: "0.2s" },
              { name: "Philips Monitor", status: "Bedside only", color: "purple", delay: "0.4s" },
              { name: "Lab System (Cerner)", status: "Separate login", color: "amber", delay: "0.6s" },
              { name: "PACS Imaging", status: "Loading...", color: "red", delay: "0.8s" },
              { name: "Pharmacy (Pyxis)", status: "Walk to station", color: "green", delay: "1.0s" },
              { name: "Nursing Notes", status: "Paper chart", color: "gray", delay: "1.2s" },
            ].map((sys) => (
              <div
                key={sys.name}
                className={`bg-white border border-gray-200 rounded-xl p-4 opacity-0`}
                style={{ animation: `slideUp 0.5s ease-out ${sys.delay} forwards` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">{sys.name}</span>
                  <span className={`w-2 h-2 rounded-full bg-${sys.color}-400`} />
                </div>
                <span className="text-xs text-gray-400">{sys.status}</span>
              </div>
            ))}
          </div>

          {progress > 0.5 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slideUp">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-red-600 text-lg">⏱</span>
                <span className="text-sm font-bold text-red-800">35 minutes spent gathering baseline data</span>
              </div>
              <p className="text-xs text-red-600">Dr. Chen logs into 6 different systems, walks to bedside for monitor readings, and manually correlates data from overnight nursing notes.</p>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-bold font-mono">HOUR 15</div>
            <div className="text-sm text-red-600 font-semibold">MAP drops to 58 mmHg — Crisis Point</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">The Decision: What does the doctor see?</h2>

          {/* Scattered information */}
          <div className="space-y-3 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Bedside Monitor (Philips)</div>
              <div className="flex gap-6">
                <div><span className="text-xs text-gray-500">MAP</span><div className="text-2xl font-bold text-red-600 font-mono">58</div></div>
                <div><span className="text-xs text-gray-500">HR</span><div className="text-2xl font-bold text-amber-600 font-mono">125</div></div>
                <div><span className="text-xs text-gray-500">SpO2</span><div className="text-2xl font-bold text-red-600 font-mono">88%</div></div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Lab Results (from 4 hours ago)</div>
              <p className="text-sm text-gray-600">Lactate 4.8 mmol/L ↑ | Creatinine 2.1 ↑ | WBC 18.2 ↑</p>
              <p className="text-[10px] text-amber-600 mt-1">⚠ Results are 4 hours old — no real-time integration</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Clinical Guideline Reference</div>
              <p className="text-sm text-gray-600">Surviving Sepsis Campaign: &quot;Administer 30mL/kg crystalloid within 3 hours of sepsis recognition&quot;</p>
              <p className="text-[10px] text-gray-400 mt-1">Generic guideline — does not account for CHF (EF 32%), CKD, or patient-specific trajectory</p>
            </div>
          </div>

          {progress > 0.5 && (
            <div className="bg-white border-2 border-gray-300 rounded-xl p-5 animate-slideUp">
              <div className="text-sm font-bold text-gray-900 mb-1">Doctor&apos;s Decision (based on available information):</div>
              <div className="text-lg font-bold text-blue-700">Administer 1.5L Crystalloid Bolus</div>
              <p className="text-xs text-gray-500 mt-2">Standard protocol. Dr. Chen has no way to know that 500 similar patients with CHF + sepsis had worse outcomes with fluid bolus. That data exists — but it&apos;s locked in 15 different systems across 6 hospitals.</p>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-bold font-mono">OUTCOME</div>
            <div className="text-sm text-gray-600 font-semibold">What happened next</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">The patient did not survive.</h2>

          {/* Timeline */}
          <div className="relative pl-7 mb-8">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-red-200" />
            {[
              { time: "Hour 15", event: "1.5L crystalloids administered per protocol", icon: "💧" },
              { time: "Hour 18", event: "MAP drops to 52. Additional fluids ordered.", icon: "📉" },
              { time: "Hour 24", event: "Pulmonary edema develops. Emergency intubation.", icon: "🫁" },
              { time: "Day 3", event: "Multi-organ dysfunction. Renal replacement initiated.", icon: "⚠️" },
              { time: "Day 6", event: "Refractory shock. Patient deceased.", icon: "🖤" },
            ].map((evt, i) => {
              const visible = progress > (i / 5) * 0.8;
              return visible ? (
                <div key={i} className="relative pb-5 pl-5 animate-slideUp" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-red-400 border-2 border-white" />
                  <div className="text-xs font-bold text-red-600 font-mono">{evt.time}</div>
                  <div className={`text-sm ${i === 4 ? "font-bold text-red-900" : "text-gray-600"}`}>{evt.icon} {evt.event}</div>
                </div>
              ) : null;
            })}
          </div>

          {progress > 0.7 && (
            <div className="grid grid-cols-3 gap-4 animate-slideUp">
              <div className="bg-red-50 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-red-600 font-mono">15+</div>
                <div className="text-xs text-red-700 mt-1">fragmented data systems</div>
              </div>
              <div className="bg-red-50 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-red-600 font-mono">35 min</div>
                <div className="text-xs text-red-700 mt-1">to gather baseline data</div>
              </div>
              <div className="bg-red-50 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-red-600 font-mono">0</div>
                <div className="text-xs text-red-700 mt-1">similar cases referenced</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CASE 2: CLINICAL — AFTER (STRIVE Platform)
   ================================================================ */

function ClinicalAfter({ step, progress }: { step: number; progress: number }) {
  return (
    <div className="h-full flex flex-col justify-center px-12 py-8">
      {step === 0 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-[#00B894]/10 text-[#00B894] rounded-lg text-sm font-bold font-mono">06:14 AM</div>
            <div className="text-sm text-gray-500 font-medium">ICU Shift Handoff — Dr. Sarah Chen, Attending</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Same Patient. Same Moment. Different Tools.</h2>
          <p className="text-sm text-gray-500 mb-6">Dr. Chen opens StriveMAP — one platform, all data, real-time.</p>

          {/* Unified platform mockup */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
            {/* Platform header */}
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-3 flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#00B894] flex items-center justify-center">
                <span className="text-white font-black text-[9px]">S</span>
              </div>
              <span className="text-sm font-bold text-gray-900">StriveMAP</span>
              <div className="flex gap-1 ml-auto">
                {["Clinical Overview", "Labs", "Antibiotics", "ICU Overview"].map(t => (
                  <span key={t} className="text-[10px] px-2 py-1 bg-gray-100 rounded text-gray-500">{t}</span>
                ))}
              </div>
            </div>

            {/* Content preview */}
            <div className="p-5 flex gap-4">
              {/* Patient panel */}
              <div className="w-44 shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-700">JD</div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Patient #4782</div>
                    <div className="text-[10px] text-gray-400">78y M • ICU 12</div>
                  </div>
                </div>
                <div className="space-y-1.5 text-[10px]">
                  {[
                    { label: "MAP", value: "71 mmHg", color: "text-green-600" },
                    { label: "HR", value: "102 bpm", color: "text-amber-600" },
                    { label: "Lactate", value: "2.1", color: "text-amber-600" },
                    { label: "SOFA", value: "8/24", color: "text-red-600" },
                    { label: "Risk", value: "34%", color: "text-red-600" },
                  ].map(v => (
                    <div key={v.label} className="flex justify-between">
                      <span className="text-gray-500">{v.label}</span>
                      <span className={`font-mono font-bold ${v.color}`}>{v.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vitals chart placeholder */}
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-700 mb-2">Patient Haemodynamics — 24h</div>
                <div className="h-24 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-gray-100 flex items-center justify-center">
                  <svg className="w-full h-16 px-4" viewBox="0 0 400 60">
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2" points="0,30 40,28 80,32 120,30 140,22 160,45 170,10 180,50 190,25 200,30 240,28 280,35 320,30 360,32 400,30" />
                    <line x1="140" y1="0" x2="140" y2="60" stroke="#ef4444" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
                    <text x="145" y="10" fill="#ef4444" fontSize="7" fontFamily="monospace">Sepsis onset</text>
                  </svg>
                </div>
              </div>

              {/* Agent panel */}
              <div className="w-40 shrink-0 bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-4 h-4 rounded bg-[#00B894] flex items-center justify-center"><span className="text-white text-[7px] font-bold">S</span></div>
                  <span className="text-[10px] font-bold text-gray-700">Agent</span>
                </div>
                <div className="text-[9px] text-gray-500 bg-white rounded p-2 border border-gray-100 leading-relaxed">
                  Analysing 5,247 data points from 15 systems in real-time. SOFA 8 — elevated risk. Monitoring...
                </div>
              </div>
            </div>
          </div>

          {progress > 0.5 && (
            <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4 animate-slideUp">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-green-600 text-lg">⚡</span>
                <span className="text-sm font-bold text-green-800">2 minutes — full patient context loaded</span>
              </div>
              <p className="text-xs text-green-600">All 15 data sources unified. Real-time vitals. Lab trends. RL-powered risk scoring. No system hopping.</p>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold font-mono">HOUR 15</div>
            <div className="text-sm text-indigo-600 font-semibold">STRIVE RL Engine activates before the crisis</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">The Same Decision — But Now With Intelligence</h2>

          {/* STRIVE recommendation panel */}
          <div className="bg-white border border-indigo-200 rounded-2xl shadow-lg overflow-hidden mb-5">
            <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#00B894] flex items-center justify-center"><span className="text-white font-bold text-[8px]">S</span></div>
                <span className="text-sm font-bold text-gray-900">StriveMAP Decision Analysis</span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-semibold ml-auto">INTERVENTION REQUIRED</span>
              </div>
            </div>

            <div className="p-5">
              {/* Similar patients */}
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1.5">Similar Patient Trajectories Found</div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${Math.min(100, progress * 200)}%`, transition: "width 1s" }} />
                  </div>
                  <span className="text-sm font-bold text-gray-900 font-mono">500 decisions from 151 patients</span>
                </div>
              </div>

              {/* Expected benefit comparison */}
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">No Bolus (Recommended)</div>
                  <div className="text-4xl font-black text-green-600 font-mono mt-1">78.2</div>
                  <div className="text-xs text-green-700">Expected Benefit</div>
                </div>
                <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold">Fluid Bolus</div>
                  <div className="text-4xl font-black text-red-500 font-mono mt-1">52.1</div>
                  <div className="text-xs text-red-600">Expected Benefit</div>
                </div>
              </div>

              {/* Recommendation */}
              {progress > 0.4 && (
                <div className="bg-gradient-to-r from-[#00B894] to-emerald-500 rounded-xl p-4 text-white animate-slideUp">
                  <div className="text-[10px] font-semibold uppercase tracking-wider opacity-80 mb-1">RL Policy Recommendation</div>
                  <div className="text-lg font-bold">WITHHOLD fluid bolus. Start low-dose vasopressor.</div>
                  <div className="text-xs opacity-85 mt-1">Target MAP 65–70 mmHg (personalised). Fluid overload probability 78% given CHF. [Confidence: 94%]</div>
                </div>
              )}
            </div>
          </div>

          {progress > 0.6 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 animate-slideUp">
              <p className="text-xs text-indigo-700">
                <strong>Key difference:</strong> The RL model analysed 500 similar decisions from patients with CHF + sepsis across 6 hospitals. It learned that aggressive fluids in this phenotype leads to worse outcomes. No human could cross-reference this in real-time.
              </p>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold font-mono">OUTCOME</div>
            <div className="text-sm text-green-600 font-semibold">With STRIVE — patient survives</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Same patient. Same hospital. Different outcome.</h2>

          {/* Green timeline */}
          <div className="relative pl-7 mb-8">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-green-200" />
            {[
              { time: "Hour 15", event: "STRIVE recommends withholding fluids, starting vasopressor", icon: "🤖" },
              { time: "Hour 18", event: "MAP stabilises at 66 mmHg. No fluid overload.", icon: "📈" },
              { time: "Hour 24", event: "Lactate trending down. Organ function recovering.", icon: "✅" },
              { time: "Day 4", event: "Vasopressor weaned off. Patient extubated.", icon: "🫁" },
              { time: "Day 8", event: "Patient discharged home. Full recovery.", icon: "🏠" },
            ].map((evt, i) => {
              const visible = progress > (i / 5) * 0.8;
              return visible ? (
                <div key={i} className="relative pb-5 pl-5 animate-slideUp" style={{ animationDelay: `${i * 0.15}s` }}>
                  <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                  <div className="text-xs font-bold text-green-600 font-mono">{evt.time}</div>
                  <div className={`text-sm ${i === 4 ? "font-bold text-green-800" : "text-gray-600"}`}>{evt.icon} {evt.event}</div>
                </div>
              ) : null;
            })}
          </div>

          {progress > 0.7 && (
            <div className="grid grid-cols-3 gap-4 animate-slideUp">
              <div className="bg-green-50 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-green-600 font-mono">2 min</div>
                <div className="text-xs text-green-700 mt-1">full context loaded</div>
              </div>
              <div className="bg-green-50 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-green-600 font-mono">500</div>
                <div className="text-xs text-green-700 mt-1">similar cases referenced</div>
              </div>
              <div className="bg-green-50 rounded-xl p-5 text-center">
                <div className="text-3xl font-black text-green-600 font-mono">41%</div>
                <div className="text-xs text-green-700 mt-1">mortality reduction</div>
              </div>
            </div>
          )}

          {progress > 0.85 && (
            <div className="mt-5 flex gap-3 animate-slideUp">
              <Link href="/platform" className="inline-flex items-center gap-2 bg-[#00B894] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#00a383] transition-colors">
                See This Live in the Platform →
              </Link>
              <Link href="/agent" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                Try the Agent
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CASE 3: COMPLIANCE — BEFORE (Manual Compliance)
   ================================================================ */

function ComplianceBefore({ step, progress }: { step: number; progress: number }) {
  return (
    <div className="h-full flex flex-col justify-center px-12 py-8">
      {step === 0 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold">SCENARIO</div>
            <div className="text-sm text-gray-500 font-medium">NHS Royal Free Hospital, London — Dr. Patel wants to use AI</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">How AI Tools Currently Work in Hospitals</h2>
          <p className="text-sm text-gray-500 mb-6">A clinician wants to use AI for clinical decision support. Here&apos;s what happens.</p>

          {/* The nightmare flow */}
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-red-500 text-lg">❌</span>
                <span className="text-sm font-bold text-gray-900">Option A: Use ChatGPT / Claude</span>
              </div>
              <div className="ml-7 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center text-[9px] text-red-600 font-bold">✗</span>
                  <span>Patient data sent to US servers — <strong>violates UK GDPR Art. 44</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center text-[9px] text-red-600 font-bold">✗</span>
                  <span>No NHS DTAC compliance — <strong>not approved by Trust</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center text-[9px] text-red-600 font-bold">✗</span>
                  <span>No medical device certification — <strong>illegal for clinical decisions</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center text-[9px] text-red-600 font-bold">✗</span>
                  <span>Non-deterministic outputs — <strong>fails DCB0129 clinical safety</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded bg-red-100 flex items-center justify-center text-[9px] text-red-600 font-bold">✗</span>
                  <span>No Caldicott Guardian oversight — <strong>data governance violation</strong></span>
                </div>
              </div>
            </div>

            {progress > 0.3 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 animate-slideUp">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-amber-500 text-lg">⚠️</span>
                  <span className="text-sm font-bold text-gray-900">Option B: Build internal AI tool</span>
                </div>
                <div className="ml-7 space-y-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2"><span className="text-amber-500">→</span> 18-24 months to build</div>
                  <div className="flex items-center gap-2"><span className="text-amber-500">→</span> £2M+ development cost</div>
                  <div className="flex items-center gap-2"><span className="text-amber-500">→</span> Need clinical safety officer, DPO, Caldicott Guardian approval</div>
                  <div className="flex items-center gap-2"><span className="text-amber-500">→</span> MHRA medical device classification — 12-18 month process</div>
                  <div className="flex items-center gap-2"><span className="text-amber-500">→</span> No cross-hospital learning (data silo)</div>
                </div>
              </div>
            )}

            {progress > 0.6 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 animate-slideUp">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-400 text-lg">📋</span>
                  <span className="text-sm font-bold text-gray-900">Option C: Do nothing (current reality)</span>
                </div>
                <p className="ml-7 text-xs text-gray-500">Most hospitals choose this. Clinicians rely on guidelines, experience, and fragmented data. Patients receive suboptimal care.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold">AUDIT CHAOS</div>
            <div className="text-sm text-gray-500 font-medium">What compliance looks like without purpose-built infrastructure</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Manual Compliance = Paper Trail Nightmare</h2>

          {/* Compliance chaos */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { title: "Consent Forms", desc: "Paper-based. Stored in filing cabinets. Takes 20 min to locate specific patient consent.", icon: "📄", delay: "0.1s" },
              { title: "Access Logs", desc: "Spreadsheet-based. Updated monthly. No real-time tracking of who accessed what.", icon: "📊", delay: "0.2s" },
              { title: "DPIA Reviews", desc: "Annual PDF document. 60+ pages. Often outdated by the time it's approved.", icon: "📋", delay: "0.3s" },
              { title: "Audit Trail", desc: "Non-existent for clinical decisions. No record of why treatment X was chosen over Y.", icon: "🔍", delay: "0.4s" },
              { title: "Cross-Border Data", desc: "No framework for multi-jurisdictional compliance. US/UK/EU data treated the same.", icon: "🌍", delay: "0.5s" },
              { title: "Incident Response", desc: "Manual notification process. Average breach detection: 197 days (IBM 2025).", icon: "🚨", delay: "0.6s" },
            ].map(item => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-4 opacity-0" style={{ animation: `slideUp 0.5s ease-out ${item.delay} forwards` }}>
                <div className="text-lg mb-1">{item.icon}</div>
                <div className="text-sm font-bold text-gray-900 mb-1">{item.title}</div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>

          {progress > 0.6 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 animate-slideUp">
              <div className="text-sm font-bold text-red-800 mb-1">The Cost of Non-Compliance</div>
              <div className="flex gap-4 mt-2">
                <div className="text-center">
                  <div className="text-2xl font-black text-red-600 font-mono">£17.5M</div>
                  <div className="text-[10px] text-red-700">avg UK GDPR fine</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-red-600 font-mono">197 days</div>
                  <div className="text-[10px] text-red-700">avg breach detection</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-black text-red-600 font-mono">$10.9M</div>
                  <div className="text-[10px] text-red-700">avg healthcare breach cost</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-gray-800 text-white rounded-lg text-sm font-bold">RESULT</div>
            <div className="text-sm text-gray-600 font-semibold">Hospitals choose to do nothing</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">The compliance burden blocks AI adoption entirely.</h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="flex gap-8 items-center">
              <div className="flex-1">
                <div className="text-5xl font-black text-gray-300 font-mono mb-2">0%</div>
                <div className="text-sm text-gray-600">of NHS hospitals use AI for real-time clinical decisions</div>
                <p className="text-xs text-gray-400 mt-2">Not because the technology doesn&apos;t exist — because the compliance infrastructure to deploy it safely doesn&apos;t exist.</p>
              </div>
              <div className="w-px h-24 bg-gray-200" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-red-500">✗</span> Can&apos;t use cloud AI (data sovereignty)
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-red-500">✗</span> Can&apos;t build internally (cost, time, expertise)
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-red-500">✗</span> Can&apos;t navigate multi-jurisdiction rules
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-red-500">✗</span> Can&apos;t create compliant audit trails
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-red-500">✗</span> Patients receive care based on 1990s workflows
                </div>
              </div>
            </div>
          </div>

          {progress > 0.5 && (
            <div className="bg-gray-100 rounded-xl p-5 animate-slideUp text-center">
              <p className="text-lg font-bold text-gray-800 mb-1">This is the gap STRIVE fills.</p>
              <p className="text-sm text-gray-500">Purpose-built compliance infrastructure that makes regulated AI possible.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   CASE 4: COMPLIANCE — AFTER (STRIVE Compliance)
   ================================================================ */

function ComplianceAfter({ step, progress }: { step: number; progress: number }) {
  const [consentAnimStep, setConsentAnimStep] = useState(0);

  useEffect(() => {
    if (step === 1) {
      const timers = [
        setTimeout(() => setConsentAnimStep(1), 500),
        setTimeout(() => setConsentAnimStep(2), 1200),
        setTimeout(() => setConsentAnimStep(3), 1800),
        setTimeout(() => setConsentAnimStep(4), 2500),
      ];
      return () => timers.forEach(clearTimeout);
    }
    setConsentAnimStep(0);
  }, [step]);

  return (
    <div className="h-full flex flex-col justify-center px-12 py-8">
      {step === 0 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-[#00B894]/10 text-[#00B894] rounded-lg text-sm font-bold">SAME SCENARIO</div>
            <div className="text-sm text-gray-500 font-medium">NHS Royal Free Hospital — Dr. Patel wants to use AI</div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">With STRIVE: Compliance Is Built In</h2>
          <p className="text-sm text-gray-500 mb-6">Dr. Patel opens StriveMAP. Compliance happens automatically, per jurisdiction.</p>

          {/* Auto-detected compliance */}
          <div className="bg-white border border-[#00B894]/30 rounded-2xl shadow-lg overflow-hidden mb-5">
            <div className="bg-[#00B894]/5 px-5 py-3 border-b border-[#00B894]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#00B894] flex items-center justify-center"><span className="text-white font-bold text-[8px]">S</span></div>
                  <span className="text-sm font-bold text-gray-900">Jurisdiction Auto-Detected</span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">🇬🇧 United Kingdom</span>
              </div>
            </div>

            <div className="p-5 grid grid-cols-3 gap-3">
              {[
                { reg: "UK GDPR", status: "✓ Compliant", color: "green" },
                { reg: "NHS DTAC", status: "✓ Certified", color: "green" },
                { reg: "DCB0129", status: "✓ Safety Case Filed", color: "green" },
                { reg: "Cyber Essentials+", status: "✓ Certified", color: "green" },
                { reg: "UKCA Mark (IIb)", status: "⋯ In Progress", color: "amber" },
                { reg: "DSPT", status: "✓ Annual Submission", color: "green" },
              ].map(r => (
                <div key={r.reg} className={`bg-${r.color}-50 border border-${r.color}-200 rounded-lg p-3 text-center`}>
                  <div className="text-xs font-bold text-gray-900">{r.reg}</div>
                  <div className={`text-[10px] text-${r.color}-700 font-semibold mt-0.5`}>{r.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison */}
          {progress > 0.4 && (
            <div className="flex gap-4 animate-slideUp">
              <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="text-xs text-green-700 font-bold mb-2">STRIVE at Royal Free</div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> On-premise in NHS Trust data centre</div>
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Data never leaves UK sovereign territory</div>
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> NHS Smartcard authentication</div>
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Caldicott Guardian approved</div>
                  <div className="flex items-center gap-2"><span className="text-green-500">✓</span> Immutable audit trail (21 CFR 11)</div>
                </div>
              </div>
              <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="text-xs text-red-700 font-bold mb-2">ChatGPT / Claude at Royal Free</div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex items-center gap-2"><span className="text-red-500">✗</span> Cloud-hosted, US data centres</div>
                  <div className="flex items-center gap-2"><span className="text-red-500">✗</span> Data leaves UK — GDPR violation</div>
                  <div className="flex items-center gap-2"><span className="text-red-500">✗</span> Email/password auth — no NHS integration</div>
                  <div className="flex items-center gap-2"><span className="text-red-500">✗</span> No Caldicott framework</div>
                  <div className="flex items-center gap-2"><span className="text-red-500">✗</span> No clinical decision audit trail</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-bold">CONSENT FLOW</div>
            <div className="text-sm text-gray-500 font-medium">Watch the permission system in action</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Compliant Data Access — In 3 Seconds</h2>

          {/* Animated consent modal */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden max-w-lg mx-auto">
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Data Access Authorization</div>
                  <div className="text-[10px] text-gray-500">UK Data Protection Act 2018 — NHS Royal Free</div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-2">
              {[
                { id: 1, label: "Vital Signs Access", category: "Patient Data", required: true },
                { id: 2, label: "Laboratory Results", category: "Patient Data", required: true },
                { id: 3, label: "RL Treatment Recommendation", category: "AI/RL Model", required: true },
                { id: 4, label: "Caldicott Guardian Approval", category: "Compliance", required: true },
                { id: 5, label: "DSPT Compliance Check", category: "Compliance", required: true },
              ].map(perm => {
                const checked = consentAnimStep >= 4 || (consentAnimStep >= perm.id);
                return (
                  <div key={perm.id} className={`flex items-center gap-3 p-2 rounded-lg border transition-all duration-300 ${checked ? "border-[#00B894] bg-[#00B894]/5" : "border-gray-200"}`}>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-300 ${checked ? "border-[#00B894] bg-[#00B894]" : "border-gray-300"}`}>
                      {checked && <span className="text-white text-[9px]">✓</span>}
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-gray-900">{perm.label}</span>
                      <span className="text-[9px] text-gray-400 ml-2">{perm.category}</span>
                    </div>
                    {perm.required && <span className="text-[8px] px-1 bg-red-100 text-red-600 rounded font-semibold">REQUIRED</span>}
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <span className="text-[9px] text-gray-400">🔒 Immutable audit trail • On-premise</span>
              <div className="flex gap-2">
                {consentAnimStep < 4 && (
                  <button className="px-3 py-1.5 bg-[#00B894] text-white text-xs font-semibold rounded-lg animate-pulse">
                    Grant All Permissions
                  </button>
                )}
                {consentAnimStep >= 4 && (
                  <div className="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                    <span>✓</span> Access Authorized
                  </div>
                )}
              </div>
            </div>
          </div>

          {consentAnimStep >= 4 && progress > 0.5 && (
            <div className="mt-5 max-w-lg mx-auto bg-gray-900 rounded-lg p-3 font-mono text-[9px] text-green-400 leading-relaxed animate-slideUp">
              <p className="text-gray-500 mb-1">// Audit trail — immutable, tamper-evident</p>
              <p>[2026-04-13T06:14:02Z] AUTH user=dr.patel method=nhs_smartcard role=consultant session=7f2a..b1c4</p>
              <p>[2026-04-13T06:14:02Z] CONSENT all_permissions=GRANTED jurisdiction=UK caldicott=APPROVED</p>
              <p>[2026-04-13T06:14:03Z] ACCESS patient=PTN-0109 scope=vitals,labs,rl_model rbac=AUTHORIZED</p>
              <p className="text-amber-400">[2026-04-13T06:14:03Z] COMPLIANCE uk_gdpr=PASS dcb0129=PASS dspt=PASS data_egress=NONE</p>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="animate-slideUp">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-bold">RESULT</div>
            <div className="text-sm text-green-600 font-semibold">STRIVE makes regulated AI deployment possible</div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">Compliance as a feature, not a blocker.</h2>

          {/* Multi-jurisdiction showcase */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              {
                flag: "🇺🇸", region: "United States",
                hospital: "Cleveland Clinic",
                regs: ["HIPAA", "SOC 2", "FDA 510(k)", "HITRUST", "21 CFR Part 11"],
                deploy: "On-premise (hospital DC)",
                auth: "SAML SSO",
              },
              {
                flag: "🇬🇧", region: "United Kingdom",
                hospital: "NHS Royal Free",
                regs: ["UK GDPR", "NHS DTAC", "DCB0129", "UKCA Mark", "Cyber Essentials+"],
                deploy: "On-premise (NHS Trust / HSCN)",
                auth: "NHS Smartcard",
              },
              {
                flag: "🇪🇺", region: "European Union",
                hospital: "Charité Berlin",
                regs: ["EU GDPR", "CE Mark IIb", "ISO 13485", "EU AI Act", "Gematik"],
                deploy: "On-premise (Rechenzentrum)",
                auth: "Heilberufeausweis (HBA)",
              },
            ].map(j => (
              <div key={j.region} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-2xl mb-1">{j.flag}</div>
                <div className="text-sm font-bold text-gray-900 mb-0.5">{j.region}</div>
                <div className="text-[10px] text-gray-400 mb-3">{j.hospital}</div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {j.regs.map(r => (
                    <span key={r} className="text-[9px] px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded font-medium">✓ {r}</span>
                  ))}
                </div>
                <div className="text-[10px] text-gray-500">
                  <div>🏥 {j.deploy}</div>
                  <div>🔐 {j.auth}</div>
                </div>
              </div>
            ))}
          </div>

          {progress > 0.4 && (
            <div className="bg-gradient-to-r from-[#00B894] to-emerald-500 rounded-xl p-5 text-white animate-slideUp mb-5">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-80 mb-2">The STRIVE Advantage</div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-black font-mono">3 sec</div>
                  <div className="text-xs opacity-80 mt-1">consent to access</div>
                </div>
                <div>
                  <div className="text-3xl font-black font-mono">100%</div>
                  <div className="text-xs opacity-80 mt-1">audit trail coverage</div>
                </div>
                <div>
                  <div className="text-3xl font-black font-mono">3</div>
                  <div className="text-xs opacity-80 mt-1">jurisdictions supported</div>
                </div>
              </div>
            </div>
          )}

          {progress > 0.7 && (
            <div className="flex gap-3 animate-slideUp">
              <Link href="/platform" className="inline-flex items-center gap-2 bg-[#00B894] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#00a383] transition-colors">
                See Compliance Tab Live →
              </Link>
              <Link href="/agent" className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">
                Try Consent Flow in Agent
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   STEP CONFIG PER TAB
   ================================================================ */

const TAB_STEPS: Record<CaseTab, Step[]> = {
  "clinical-before": [
    { title: "Data Fragmentation", duration: 8 },
    { title: "The Crisis Decision", duration: 8 },
    { title: "The Outcome", duration: 8 },
  ],
  "clinical-after": [
    { title: "Unified Platform", duration: 8 },
    { title: "RL-Powered Decision", duration: 8 },
    { title: "The Outcome", duration: 8 },
  ],
  "compliance-before": [
    { title: "The AI Problem", duration: 8 },
    { title: "Compliance Chaos", duration: 8 },
    { title: "The Result", duration: 8 },
  ],
  "compliance-after": [
    { title: "Auto-Detection", duration: 8 },
    { title: "Consent Flow", duration: 8 },
    { title: "Multi-Jurisdiction", duration: 8 },
  ],
};

const TAB_META: Record<CaseTab, { label: string; sublabel: string; icon: string; color: string; beforeAfter: "before" | "after" }> = {
  "clinical-before": { label: "Clinical — Before", sublabel: "Traditional ICU Workflow", icon: "📋", color: "gray", beforeAfter: "before" },
  "clinical-after": { label: "Clinical — After", sublabel: "With STRIVE Platform", icon: "🤖", color: "green", beforeAfter: "after" },
  "compliance-before": { label: "Compliance — Before", sublabel: "Manual Data Protection", icon: "📄", color: "gray", beforeAfter: "before" },
  "compliance-after": { label: "Compliance — After", sublabel: "STRIVE Built-In Compliance", icon: "🛡️", color: "green", beforeAfter: "after" },
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function CaseStudies() {
  const [activeTab, setActiveTab] = useState<CaseTab>("clinical-before");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = TAB_STEPS[activeTab];
  const meta = TAB_META[activeTab];

  // Reset on tab change
  useEffect(() => {
    setCurrentStep(0);
    setStepProgress(0);
    setIsPlaying(true);
  }, [activeTab]);

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;
    const duration = steps[currentStep].duration * 1000;
    const tick = 50;

    const timer = setInterval(() => {
      setStepProgress(prev => {
        const next = prev + tick / duration;
        if (next >= 1 && currentStep < steps.length - 1) {
          setCurrentStep(s => s + 1);
          return 0;
        }
        return Math.min(next, 1);
      });
    }, tick);

    return () => clearInterval(timer);
  }, [isPlaying, currentStep, steps]);

  const goToStep = useCallback((idx: number) => {
    setCurrentStep(idx);
    setStepProgress(0);
  }, []);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentStep < steps.length - 1) goToStep(currentStep + 1);
      else if (e.key === "ArrowLeft" && currentStep > 0) goToStep(currentStep - 1);
      else if (e.key === " ") { e.preventDefault(); setIsPlaying(p => !p); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentStep, steps.length, goToStep]);

  // Render scene
  const renderScene = () => {
    switch (activeTab) {
      case "clinical-before": return <ClinicalBefore step={currentStep} progress={stepProgress} />;
      case "clinical-after": return <ClinicalAfter step={currentStep} progress={stepProgress} />;
      case "compliance-before": return <ComplianceBefore step={currentStep} progress={stepProgress} />;
      case "compliance-after": return <ComplianceAfter step={currentStep} progress={stepProgress} />;
    }
  };

  const overallProgress = (currentStep + stepProgress) / steps.length;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* CSS */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.5s ease-out both; }
      `}</style>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full transition-all duration-150 ease-linear"
          style={{
            width: `${overallProgress * 100}%`,
            background: meta.beforeAfter === "before" ? "#6b7280" : "#00B894",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center px-6 py-2.5 gap-6">
          {/* Logo */}
          <Link href="/" className="text-lg font-extrabold text-[#00B894] tracking-tight" style={{ textDecoration: "none" }}>
            STRIVE
          </Link>

          {/* Tab selector */}
          <div className="flex gap-1 bg-gray-100 p-0.5 rounded-xl">
            {(Object.entries(TAB_META) as [CaseTab, typeof TAB_META[CaseTab]][]).map(([key, m]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeTab === key
                    ? m.beforeAfter === "before"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "bg-[#00B894] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 ml-4">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => goToStep(i)}
                className="flex items-center gap-1.5"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  i === currentStep
                    ? meta.beforeAfter === "before" ? "bg-gray-800 text-white" : "bg-[#00B894] text-white"
                    : i < currentStep ? "bg-gray-200 text-gray-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden lg:inline ${i === currentStep ? "text-gray-900" : "text-gray-400"}`}>
                  {s.title}
                </span>
              </button>
            ))}
          </div>

          {/* Controls */}
          <button
            onClick={() => setIsPlaying(p => !p)}
            className="ml-auto px-3 py-1 border border-gray-200 rounded-lg text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isPlaying ? "⏸ Pause" : "▶ Play"}
          </button>

          {/* Nav */}
          <div className="flex items-center gap-3">
            <Link href="/platform" className="text-xs text-gray-500 hover:text-gray-900 transition-colors" style={{ textDecoration: "none" }}>Platform</Link>
            <Link href="/agent" className="text-xs text-gray-500 hover:text-gray-900 transition-colors" style={{ textDecoration: "none" }}>Agent</Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Scene area */}
        <div
          className="flex-1 bg-gray-50 overflow-hidden relative"
          onClick={() => {
            if (currentStep < steps.length - 1) goToStep(currentStep + 1);
          }}
        >
          {renderScene()}

          {/* Click hint */}
          {currentStep < steps.length - 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-300">
              Click or → to advance • Space to {isPlaying ? "pause" : "play"}
            </div>
          )}
        </div>

        {/* Right sidebar — case context */}
        <aside className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-5 border-b border-gray-100">
            <div className="text-lg mb-1">{meta.icon}</div>
            <h3 className="text-sm font-bold text-gray-900">{meta.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{meta.sublabel}</p>
          </div>

          {/* Case context info */}
          <div className="p-5 flex-1">
            {(activeTab === "clinical-before" || activeTab === "clinical-after") && (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Patient</div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">ID:</span><span className="font-mono font-bold">#4782</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Age/Sex:</span><span className="font-bold">78y Male</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Diagnosis:</span><span className="font-bold">Septic Shock</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Key:</span><span className="font-bold text-red-600">CHF (EF 32%)</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">SOFA:</span><span className="font-bold">8 → 12</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Core Question</div>
                  <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3">
                    Should this patient with CHF + sepsis receive aggressive IV fluids per protocol — or does the data say otherwise?
                  </p>
                </div>
                {activeTab === "clinical-after" && (
                  <div>
                    <div className="text-[10px] font-bold text-[#00B894] uppercase tracking-wider mb-2">STRIVE Insight</div>
                    <p className="text-xs text-gray-600 bg-[#00B894]/5 border border-[#00B894]/20 rounded-lg p-3">
                      RL policy analyzed 500 similar decisions from patients with CHF + sepsis. Fluid bolus contraindicated. Mortality reduction: 41%.
                    </p>
                  </div>
                )}
              </div>
            )}

            {(activeTab === "compliance-before" || activeTab === "compliance-after") && (
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Scenario</div>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-gray-500">Hospital:</span><span className="font-bold">NHS Royal Free</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Location:</span><span className="font-bold">London, UK</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Doctor:</span><span className="font-bold">Dr. Patel</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Goal:</span><span className="font-bold">Use AI for decisions</span></div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Regulatory Landscape</div>
                  <div className="space-y-1.5">
                    {["UK GDPR", "NHS DTAC", "DCB0129", "UK DPA 2018", "Caldicott Principles"].map(r => (
                      <div key={r} className="flex items-center gap-2 text-xs text-gray-600">
                        <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "compliance-after" ? "bg-green-500" : "bg-red-400"}`} />
                        {r}
                      </div>
                    ))}
                  </div>
                </div>
                {activeTab === "compliance-after" && (
                  <div>
                    <div className="text-[10px] font-bold text-[#00B894] uppercase tracking-wider mb-2">STRIVE Approach</div>
                    <p className="text-xs text-gray-600 bg-[#00B894]/5 border border-[#00B894]/20 rounded-lg p-3">
                      Jurisdiction auto-detected. Compliance validated at login. Consent collected per regulation. Full audit trail. Zero data egress.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom CTA */}
          <div className="p-4 border-t border-gray-100">
            {meta.beforeAfter === "before" ? (
              <button
                onClick={() => setActiveTab(activeTab === "clinical-before" ? "clinical-after" : "compliance-after")}
                className="w-full py-2.5 bg-[#00B894] text-white text-sm font-semibold rounded-xl hover:bg-[#00a383] transition-colors"
              >
                See How STRIVE Fixes This →
              </button>
            ) : (
              <Link
                href="/platform"
                className="block w-full py-2.5 bg-[#00B894] text-white text-sm font-semibold rounded-xl text-center hover:bg-[#00a383] transition-colors"
                style={{ textDecoration: "none" }}
              >
                Try It Live in the Platform →
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
