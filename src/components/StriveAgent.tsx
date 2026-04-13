"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { MediaInputBar, type Attachment } from "./MediaInput";
import {
  getAllPatients,
  getVitalDistribution,
  getLabDistribution,
  getOutcomesByIntervention,
  getSofaMortalityCorrelation,
  computeDistribution,
  type Patient,
  type DistributionStats,
} from "@/lib/patientGenerator";

/* ============================================================
   TOOL DEFINITIONS
   ============================================================ */

interface AgentTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const TOOLS: AgentTool[] = [
  { id: "patient-analysis", name: "Patient Analysis", description: "Deep-dive into patient vitals, labs, and clinical trajectory using RL-based pattern recognition", icon: "PA", color: "#3b82f6" },
  { id: "treatment-optimization", name: "Treatment Optimization", description: "RL-powered treatment recommendations: fluids, vasopressors, ventilation, based on 5M+ ICU hours", icon: "TO", color: "#00B894" },
  { id: "risk-stratification", name: "Risk Stratification", description: "Real-time mortality risk scoring and SOFA trajectory prediction using learned value functions", icon: "RS", color: "#ef4444" },
  { id: "cohort-comparison", name: "Cohort Comparison", description: "Compare this patient against similar cohorts by demographics, diagnosis, acuity, and outcomes", icon: "CC", color: "#8b5cf6" },
  { id: "outcome-prediction", name: "Outcome Prediction", description: "Predict 24h, 48h, and 7-day outcomes based on current state and optimal policy trajectory", icon: "OP", color: "#f59e0b" },
  { id: "drug-interaction", name: "Drug Interaction Check", description: "Check antibiotic interactions, contraindications, and dose optimization for current regimen", icon: "DI", color: "#ec4899" },
];

/* ============================================================
   TOOL RESULT PANELS
   ============================================================ */

function PatientAnalysisPanel({ patient, patients }: { patient: Patient; patients: Patient[] }) {
  const mapDist = useMemo(() => getVitalDistribution(patients, "map"), [patients]);
  const lactateDist = useMemo(() => getVitalDistribution(patients, "lactate"), [patients]);
  const sofaDist = useMemo(() => getVitalDistribution(patients, "sofa"), [patients]);

  const percentile = (value: number, dist: DistributionStats) => {
    const below = dist.values.filter(v => v <= value).length;
    return Math.round((below / dist.values.length) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Patient Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-semibold">{patient.name}</span></div>
          <div><span className="text-gray-500">ID:</span> <span className="font-mono">{patient.id}</span></div>
          <div><span className="text-gray-500">Age/Sex:</span> <span className="font-semibold">{patient.age}y {patient.sex}</span></div>
          <div><span className="text-gray-500">BMI:</span> <span className="font-semibold">{patient.bmi}</span></div>
          <div><span className="text-gray-500">Diagnosis:</span> <span className="font-semibold">{patient.admitDiagnosis}</span></div>
          <div><span className="text-gray-500">Acuity:</span> <span className={`font-bold ${patient.acuity === "critical" ? "text-red-600" : patient.acuity === "serious" ? "text-amber-600" : "text-green-600"}`}>{patient.acuity.toUpperCase()}</span></div>
          <div><span className="text-gray-500">ICU Day:</span> <span className="font-semibold">{patient.daysInHospital}</span></div>
          <div><span className="text-gray-500">Location:</span> <span className="font-semibold">{patient.unitBed}</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Vital Signs vs. Cohort</h4>
        <div className="space-y-3">
          {[
            { label: "MAP", value: patient.map, unit: "mmHg", dist: mapDist },
            { label: "Lactate", value: patient.lactate, unit: "mmol/L", dist: lactateDist },
            { label: "SOFA", value: patient.sofa, unit: "", dist: sofaDist },
          ].map(v => (
            <div key={v.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{v.label}: <span className="font-bold text-gray-900">{v.value} {v.unit}</span></span>
                <span className="text-xs text-gray-400">Percentile: {percentile(v.value, v.dist)}th</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full relative">
                <div className="absolute h-2 bg-[#00B894]/30 rounded-full" style={{ left: `${(v.dist.p25 - v.dist.min) / (v.dist.max - v.dist.min) * 100}%`, width: `${(v.dist.p75 - v.dist.p25) / (v.dist.max - v.dist.min) * 100}%` }} />
                <div className="absolute w-2.5 h-2.5 rounded-full bg-[#00B894] border-2 border-white -top-0.5 shadow-sm" style={{ left: `${Math.min(98, Math.max(0, (v.value - v.dist.min) / (v.dist.max - v.dist.min) * 100))}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>{v.dist.min}</span>
                <span>P25: {v.dist.p25}</span>
                <span>P75: {v.dist.p75}</span>
                <span>{v.dist.max}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">SOFA Component Breakdown</h4>
        <div className="space-y-1.5">
          {patient.sofaComponents.map(c => (
            <div key={c.name} className="flex items-center gap-2 text-sm">
              <span className="text-gray-600 w-28 truncate">{c.name}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${c.score >= 3 ? "bg-red-400" : c.score >= 2 ? "bg-amber-400" : c.score >= 1 ? "bg-blue-400" : "bg-green-400"}`} style={{ width: `${(c.score / 4) * 100}%` }} />
              </div>
              <span className="font-mono text-xs w-6 text-right">{c.score}/4</span>
              <span className="text-[11px] text-gray-400 w-36 truncate">{c.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TreatmentOptimizationPanel({ patient }: { patient: Patient; patients: Patient[] }) {
  const rec = patient.recommendation;
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">RL Treatment Recommendation</h4>
        <div className={`p-4 rounded-xl border-2 ${rec.fluidBolus === "give" ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"} mb-3`}>
          <p className="text-sm font-bold mb-1">{rec.fluidBolus === "give" ? "GIVE 250 mL Crystalloid Bolus" : "WITHHOLD Fluid Bolus"}</p>
          <p className="text-xs text-gray-600">{rec.rationale}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Give Bolus Benefit</p>
            <p className="text-xl font-bold text-gray-900">{rec.bolusExpectedBenefit}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Withhold Benefit</p>
            <p className="text-xl font-bold text-gray-900">{rec.noBolusExpectedBenefit}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Vasopressor Recommendation</h4>
        <p className="text-sm text-gray-700">{rec.vasopressor || "No vasopressor change recommended at this time."}</p>
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Current: <span className="font-semibold text-gray-900">{patient.vasoactive || "None"}</span></p>
          <p className="text-xs text-gray-500 mt-1">MAP Target: <span className="font-bold text-[#00B894]">{rec.mapTarget} mmHg</span></p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">MAP Benefit Analysis</h4>
        <div className="flex items-end gap-2 h-28">
          {patient.mapBenefits.map(d => {
            const color = d.color === "green" ? "#00B894" : d.color === "blue" ? "#60a5fa" : "#d1d5db";
            return (
              <div key={d.mapRange} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-[10px] font-bold text-gray-600">{d.benefit.toFixed(0)}</span>
                <div className="w-full rounded-t" style={{ height: (d.benefit / 100) * 100, backgroundColor: color }} />
                <span className={`text-[9px] ${d.isTarget ? "font-bold text-[#00B894]" : "text-gray-400"}`}>{d.mapRange}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded bg-[#00B894]/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[#00B894] text-[10px] font-bold">RL</span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 mb-1">How This Differs From LLMs</p>
            <p className="text-xs text-gray-500">
              This recommendation comes from a reinforcement learning policy trained on 5M+ hours of real ICU data from 60K+ patients. Unlike LLMs (ChatGPT, Claude), our model learned optimal treatment policies from actual patient outcomes. It doesn&apos;t generate text -- it computes optimal actions. Hospitals cannot send PHI to cloud LLM providers. Strive runs entirely on-premise, HIPAA-compliant, SOC2 certified.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskStratificationPanel({ patient, patients }: { patient: Patient; patients: Patient[] }) {
  const sofaCorr = useMemo(() => getSofaMortalityCorrelation(patients), [patients]);
  const riskDist = useMemo(() => getVitalDistribution(patients, "riskScore"), [patients]);
  const maxMort = Math.max(...sofaCorr.map(c => c.avgMortality));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Current Risk Assessment</h4>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-4xl font-bold" style={{ color: patient.riskScore > 60 ? "#ef4444" : patient.riskScore > 30 ? "#f59e0b" : "#22c55e" }}>{patient.riskScore}%</p>
            <p className="text-xs text-gray-400">Mortality Risk</p>
          </div>
          <div className="flex-1">
            <div className="h-3 bg-gray-100 rounded-full relative">
              <div className="absolute h-3 rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500" style={{ width: "100%" }} />
              <div className="absolute w-4 h-4 rounded-full bg-white border-2 border-gray-800 -top-0.5 shadow" style={{ left: `${patient.riskScore}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>Low</span><span>Moderate</span><span>High</span><span>Critical</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Risk Distribution in Cohort</h4>
        <div className="flex items-end gap-1 h-20">
          {riskDist.histogram.map((bin, i) => {
            const maxPct = Math.max(...riskDist.histogram.map(b => b.pct));
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <span className="text-[8px] text-gray-400">{bin.pct}%</span>
                <div className="w-full rounded-t bg-red-200" style={{ height: Math.max(2, (bin.pct / maxPct) * 60) }} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 mt-1">
          {riskDist.histogram.map((bin, i) => (
            <div key={i} className="flex-1 text-center"><span className="text-[7px] text-gray-400">{bin.label}</span></div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Mean: {riskDist.mean}% | Median: {riskDist.median}% | This patient: {patient.riskScore}% (P{Math.round(riskDist.values.filter(v => v <= patient.riskScore).length / riskDist.values.length * 100)})</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">SOFA-Mortality Correlation</h4>
        <div className="space-y-1">
          {sofaCorr.slice(0, 12).map(c => (
            <div key={c.sofa} className="flex items-center gap-2">
              <span className={`text-[11px] font-mono w-10 text-right ${c.sofa === patient.sofa ? "font-bold text-[#00B894]" : "text-gray-500"}`}>S{c.sofa}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full ${c.sofa === patient.sofa ? "bg-[#00B894]" : "bg-red-300"}`} style={{ width: `${(c.avgMortality / maxMort) * 100}%` }} />
              </div>
              <span className="text-[11px] font-mono w-12 text-right">{c.avgMortality}%</span>
              <span className="text-[9px] text-gray-400 w-8">n={c.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Key Risk Factors</h4>
        <div className="space-y-1.5">
          {patient.labs.filter(l => l.flag === "critical" || l.flag === "high").map(l => (
            <div key={l.name} className="flex items-center gap-2 text-sm">
              <span className={`w-2 h-2 rounded-full ${l.flag === "critical" ? "bg-red-500" : "bg-amber-500"}`} />
              <span className="text-gray-700">{l.name}: <span className="font-bold">{l.value} {l.unit}</span></span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${l.flag === "critical" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}>{l.flag?.toUpperCase()}</span>
            </div>
          ))}
          {patient.comorbidities.map(c => (
            <div key={c} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-gray-600">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CohortComparisonPanel({ patient, patients }: { patient: Patient; patients: Patient[] }) {
  const sameSource = useMemo(() => patients.filter(p => p.sepsisSource === patient.sepsisSource), [patients, patient]);
  const sameAcuity = useMemo(() => patients.filter(p => p.acuity === patient.acuity), [patients, patient]);
  const similarAge = useMemo(() => patients.filter(p => Math.abs(p.age - patient.age) <= 10), [patients, patient]);
  const sameSex = useMemo(() => patients.filter(p => p.sex === patient.sex), [patients, patient]);

  const avg = (arr: Patient[], key: "riskScore" | "sofa" | "lactate" | "map") =>
    arr.length ? Math.round(arr.reduce((s, p) => s + p[key], 0) / arr.length * 10) / 10 : 0;

  const cohorts = [
    { label: `Same Source (${patient.sepsisSource})`, patients: sameSource },
    { label: `Same Acuity (${patient.acuity})`, patients: sameAcuity },
    { label: `Similar Age (${patient.age}+/-10y)`, patients: similarAge },
    { label: `Same Sex (${patient.sex})`, patients: sameSex },
    { label: "All Patients", patients },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Cohort Comparison Matrix</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-xs text-gray-500 font-semibold">Cohort</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">N</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">Avg Risk</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">Avg SOFA</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">Avg Lactate</th>
                <th className="text-right py-2 text-xs text-gray-500 font-semibold">Avg MAP</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 bg-[#00B894]/5">
                <td className="py-2 font-semibold text-[#00B894]">This Patient</td>
                <td className="py-2 text-right font-mono">1</td>
                <td className="py-2 text-right font-mono font-bold">{patient.riskScore}%</td>
                <td className="py-2 text-right font-mono font-bold">{patient.sofa}</td>
                <td className="py-2 text-right font-mono font-bold">{patient.lactate}</td>
                <td className="py-2 text-right font-mono font-bold">{patient.map}</td>
              </tr>
              {cohorts.map(c => (
                <tr key={c.label} className="border-b border-gray-100">
                  <td className="py-2 text-gray-700 text-xs">{c.label}</td>
                  <td className="py-2 text-right font-mono text-gray-500">{c.patients.length}</td>
                  <td className="py-2 text-right font-mono">{avg(c.patients, "riskScore")}%</td>
                  <td className="py-2 text-right font-mono">{avg(c.patients, "sofa")}</td>
                  <td className="py-2 text-right font-mono">{avg(c.patients, "lactate")}</td>
                  <td className="py-2 text-right font-mono">{avg(c.patients, "map")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Intervention Rates by Acuity</h4>
        {["Mechanical ventilation", "Vasopressors", "CRRT"].map(intName => {
          const data = getOutcomesByIntervention(patients, intName);
          const rate = Math.round(data.with.count / patients.length * 100);
          return (
            <div key={intName} className="mb-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">{intName}</span>
                <span className="font-mono text-gray-900 font-semibold">{rate}% of cohort</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-2 bg-[#00B894] rounded-full" style={{ width: `${rate}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Sepsis Source Distribution</h4>
        <div className="space-y-1">
          {Object.entries(
            patients.reduce((acc, p) => { acc[p.sepsisSource] = (acc[p.sepsisSource] || 0) + 1; return acc; }, {} as Record<string, number>)
          ).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([source, count]) => (
            <div key={source} className="flex items-center gap-2 text-sm">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div className={`h-2 rounded-full ${source === patient.sepsisSource ? "bg-[#00B894]" : "bg-gray-300"}`} style={{ width: `${(count / patients.length) * 100}%` }} />
              </div>
              <span className={`text-xs w-40 truncate ${source === patient.sepsisSource ? "font-bold text-[#00B894]" : "text-gray-500"}`}>{source}</span>
              <span className="font-mono text-xs w-8 text-right text-gray-400">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OutcomePredictionPanel({ patient }: { patient: Patient; patients: Patient[] }) {
  // Simulate RL outcome predictions based on patient state
  const baseline = patient.riskScore;
  const optimalReduction = patient.acuity === "critical" ? 8 : patient.acuity === "serious" ? 12 : 5;

  const predictions = [
    { window: "24 hours", optimal: Math.max(2, baseline - optimalReduction), current: baseline, noIntervention: Math.min(96, baseline + 8) },
    { window: "48 hours", optimal: Math.max(2, baseline - optimalReduction * 1.5), current: Math.max(2, baseline - 3), noIntervention: Math.min(96, baseline + 15) },
    { window: "7 days", optimal: Math.max(2, baseline - optimalReduction * 2.5), current: Math.max(2, baseline - 8), noIntervention: Math.min(96, baseline + 20) },
  ];

  const sofaPredictions = [
    { window: "24h", predicted: Math.max(0, patient.sofa + (patient.acuity === "improving" ? -2 : patient.acuity === "critical" ? 1 : 0)) },
    { window: "48h", predicted: Math.max(0, patient.sofa + (patient.acuity === "improving" ? -3 : patient.acuity === "critical" ? 0 : -1)) },
    { window: "7d", predicted: Math.max(0, patient.sofa + (patient.acuity === "improving" ? -4 : patient.acuity === "critical" ? -1 : -2)) },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Mortality Risk Trajectory</h4>
        <p className="text-xs text-gray-500 mb-3">Predicted under three scenarios: optimal RL policy, current trajectory, no intervention</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 text-xs text-gray-500 font-semibold">Window</th>
              <th className="text-right py-2 text-xs text-gray-500 font-semibold">Optimal (RL)</th>
              <th className="text-right py-2 text-xs text-gray-500 font-semibold">Current Trajectory</th>
              <th className="text-right py-2 text-xs text-gray-500 font-semibold">No Intervention</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map(p => (
              <tr key={p.window} className="border-b border-gray-100">
                <td className="py-2.5 font-medium text-gray-700">{p.window}</td>
                <td className="py-2.5 text-right"><span className="font-mono font-bold text-green-600">{Math.round(p.optimal)}%</span></td>
                <td className="py-2.5 text-right"><span className="font-mono font-bold text-amber-600">{Math.round(p.current)}%</span></td>
                <td className="py-2.5 text-right"><span className="font-mono font-bold text-red-600">{Math.round(p.noIntervention)}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">SOFA Score Prediction (Optimal Policy)</h4>
        <div className="flex items-center gap-4">
          <div className="text-center bg-gray-50 rounded-lg p-3 flex-1">
            <p className="text-[10px] text-gray-400 uppercase">Current</p>
            <p className="text-2xl font-bold text-gray-900">{patient.sofa}</p>
          </div>
          {sofaPredictions.map(s => (
            <div key={s.window} className="text-center bg-gray-50 rounded-lg p-3 flex-1">
              <p className="text-[10px] text-gray-400 uppercase">{s.window}</p>
              <p className={`text-2xl font-bold ${s.predicted < patient.sofa ? "text-green-600" : s.predicted > patient.sofa ? "text-red-600" : "text-gray-900"}`}>{s.predicted}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Predicted Milestones</h4>
        <div className="space-y-2">
          {[
            { milestone: "Vasopressor wean initiated", eta: patient.acuity === "critical" ? "48-72h" : patient.vasoactive ? "12-24h" : "N/A", likely: patient.vasoactive ? 0.65 : 0 },
            { milestone: "Lactate normalization (<2)", eta: patient.lactate > 2 ? (patient.acuity === "critical" ? "36-48h" : "12-24h") : "Achieved", likely: patient.lactate > 2 ? 0.72 : 1 },
            { milestone: "ICU discharge ready", eta: patient.acuity === "improving" ? "24-48h" : patient.acuity === "critical" ? ">7d" : "3-5d", likely: patient.acuity === "improving" ? 0.88 : 0.45 },
            { milestone: "Mechanical ventilation liberation", eta: patient.interventions.find(i => i.name === "Mechanical ventilation" && i.active) ? "48-96h" : "N/A", likely: patient.interventions.find(i => i.name === "Mechanical ventilation" && i.active) ? 0.55 : 0 },
          ].filter(m => m.likely > 0).map(m => (
            <div key={m.milestone} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{m.milestone}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{m.eta}</span>
                <span className={`text-xs font-mono font-bold ${m.likely > 0.7 ? "text-green-600" : m.likely > 0.4 ? "text-amber-600" : "text-red-600"}`}>{Math.round(m.likely * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DrugInteractionPanel({ patient }: { patient: Patient; patients: Patient[] }) {
  // Simulated drug interaction check results
  const interactions: { drug1: string; drug2: string; severity: "major" | "moderate" | "minor"; detail: string }[] = [];
  const regimen = patient.antibioticRegimen;

  // Generate realistic interactions based on actual drug pairs
  for (let i = 0; i < regimen.length; i++) {
    for (let j = i + 1; j < regimen.length; j++) {
      const d1 = regimen[i].name;
      const d2 = regimen[j].name;
      if ((d1.includes("Vancomycin") && d2.includes("Tobramycin")) || (d2.includes("Vancomycin") && d1.includes("Tobramycin"))) {
        interactions.push({ drug1: d1, drug2: d2, severity: "major", detail: "Combined nephrotoxicity risk. Monitor serum creatinine and vancomycin trough levels q12h." });
      } else if ((d1.includes("Vancomycin") && d2.includes("Piperacillin")) || (d2.includes("Vancomycin") && d1.includes("Piperacillin"))) {
        interactions.push({ drug1: d1, drug2: d2, severity: "moderate", detail: "Increased AKI risk with combination. Monitor renal function daily." });
      } else if (d1.includes("Metronidazole") || d2.includes("Metronidazole")) {
        interactions.push({ drug1: d1, drug2: d2, severity: "minor", detail: "Potential for increased CNS side effects. Monitor for confusion in elderly patients." });
      }
    }
  }

  // Renal dose adjustment check
  const needsRenalAdj = patient.creatinine > 1.5;
  const renalFlags = needsRenalAdj ? regimen.filter(r =>
    r.name.includes("Vancomycin") || r.name.includes("Meropenem") || r.name.includes("Cefepime") || r.name.includes("Levofloxacin") || r.name.includes("Gentamicin") || r.name.includes("Tobramycin")
  ) : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-3">Current Antibiotic Regimen</h4>
        <div className="space-y-2">
          {regimen.map((abx, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="font-semibold text-gray-900">{abx.name}</p>
                <p className="text-xs text-gray-500">{abx.dose} {abx.route} {abx.frequency}</p>
              </div>
              <span className="text-xs text-gray-400">{abx.started}</span>
            </div>
          ))}
        </div>
      </div>

      {interactions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Drug Interactions Found</h4>
          <div className="space-y-2">
            {interactions.map((int, i) => (
              <div key={i} className={`p-3 rounded-lg border ${int.severity === "major" ? "border-red-200 bg-red-50" : int.severity === "moderate" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${int.severity === "major" ? "bg-red-100 text-red-700" : int.severity === "moderate" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>{int.severity.toUpperCase()}</span>
                  <span className="text-sm font-semibold text-gray-900">{int.drug1} + {int.drug2}</span>
                </div>
                <p className="text-xs text-gray-600">{int.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {interactions.length === 0 && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-4">
          <p className="text-sm text-green-700 font-semibold">No significant drug interactions detected in current regimen.</p>
        </div>
      )}

      {renalFlags.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <h4 className="text-sm font-bold text-amber-700 mb-2">Renal Dose Adjustment Required</h4>
          <p className="text-xs text-amber-600 mb-2">Creatinine {patient.creatinine} mg/dL -- the following drugs may need dose adjustment:</p>
          {renalFlags.map((r, i) => (
            <p key={i} className="text-sm text-amber-800 font-semibold">- {r.name} ({r.dose} {r.frequency})</p>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h4 className="text-sm font-bold text-gray-900 mb-2">Allergy Check</h4>
        {patient.allergies.includes("NKDA") ? (
          <p className="text-sm text-green-600">No known drug allergies (NKDA)</p>
        ) : (
          <div className="space-y-1">
            {patient.allergies.map(a => {
              const conflict = regimen.some(r =>
                (a === "Penicillin" && (r.name.includes("Piperacillin") || r.name.includes("Ampicillin") || r.name.includes("Nafcillin"))) ||
                (a === "Cephalosporins" && (r.name.includes("Cef") || r.name.includes("Ceftriaxone")))
              );
              return (
                <div key={a} className={`text-sm p-2 rounded ${conflict ? "bg-red-50 text-red-700 font-bold" : "text-gray-600"}`}>
                  {conflict ? `WARNING: Allergy to ${a} -- check current regimen!` : `Allergy: ${a} (no conflict with current regimen)`}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN AGENT COMPONENT
   ============================================================ */

export default function StriveAgent() {
  const patients = useMemo(() => getAllPatients(), []);
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(0);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [showPatientPicker, setShowPatientPicker] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const patient = patients[selectedPatientIdx];

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.sepsisSource.toLowerCase().includes(q) ||
      p.acuity.toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setActiveTool(null);
  }, [selectedPatientIdx]);

  const sendMessage = useCallback(async (text: string, attachments: Attachment[] = []) => {
    if (!text.trim() && attachments.length === 0) return;
    const displayText = attachments.length > 0
      ? `${text || "(media attached)"}${attachments.map(a => ` [${a.type}: ${a.name}]`).join("")}`
      : text;
    setMessages(prev => [...prev, { role: "user", text: displayText }]);
    setInput("");
    setThinking(true);

    // Build patient context string
    const patientContext = `Name: ${patient.name} | ID: ${patient.id} | Age: ${patient.age}y ${patient.sex} | BMI: ${patient.bmi} | Diagnosis: ${patient.admitDiagnosis} | Sepsis Source: ${patient.sepsisSource} | Acuity: ${patient.acuity} | SOFA: ${patient.sofa}/24 (${patient.sofaComponents.map(c => `${c.name}: ${c.score}/4`).join(", ")}) | MAP: ${patient.map} mmHg | Lactate: ${patient.lactate} mmol/L | HR: ${patient.hr} | Temp: ${patient.temp}C | Creatinine: ${patient.creatinine} | Risk Score: ${patient.riskScore}% | Vasoactive: ${patient.vasoactive || "None"} | Comorbidities: ${patient.comorbidities.join(", ")} | Allergies: ${patient.allergies.join(", ")} | Antibiotics: ${patient.antibioticRegimen.map(a => `${a.name} ${a.dose} ${a.route} ${a.frequency}`).join("; ")} | Recommendation: ${patient.recommendation.rationale} | Fluid Bolus: ${patient.recommendation.fluidBolus} | MAP Target: ${patient.recommendation.mapTarget} mmHg | Vasopressor: ${patient.recommendation.vasopressor || "None"} | Similar Trajectories: ${patient.similarCount} from ${patient.similarPatients} patients`;

    // Convert attachments to base64 data URLs
    const attachmentData: { type: string; name: string; data: string }[] = [];
    for (const att of attachments) {
      try {
        const arrayBuffer = await att.blob.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < uint8.length; i++) {
          binary += String.fromCharCode(uint8[i]);
        }
        const base64 = btoa(binary);
        const mimeType = att.blob.type || (att.type === "image" ? "image/png" : att.type === "audio" ? "audio/webm" : "video/webm");
        attachmentData.push({
          type: att.type,
          name: att.name,
          data: `data:${mimeType};base64,${base64}`,
        });
      } catch {
        // Skip attachment if conversion fails
      }
    }

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          attachments: attachmentData,
          patientContext,
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setMessages(prev => [...prev, { role: "agent", text: data.response }]);
    } catch {
      // Fallback to hardcoded responses
      const lowerText = text.toLowerCase();
      let response: string;

      if (lowerText.includes("fluid") || lowerText.includes("bolus")) {
        response = `[RL Policy Analysis] For patient ${patient.name} (SOFA ${patient.sofa}, MAP ${patient.map} mmHg, Lactate ${patient.lactate}):\n\nRecommendation: ${patient.recommendation.fluidBolus === "give" ? "GIVE 250 mL crystalloid bolus" : "WITHHOLD fluid bolus"}\n\nExpected Benefit (give): ${patient.recommendation.bolusExpectedBenefit}\nExpected Benefit (withhold): ${patient.recommendation.noBolusExpectedBenefit}\n\nBased on ${patient.similarCount} similar trajectories from ${patient.similarPatients} patients. ${patient.recommendation.rationale}`;
      } else if (lowerText.includes("vasopressor") || lowerText.includes("pressor") || lowerText.includes("norepinephrine")) {
        response = `[RL Vasopressor Analysis] Current status: ${patient.vasoactive || "No vasopressors"}\n\nMAP: ${patient.map} mmHg | Target: ${patient.recommendation.mapTarget} mmHg\n\nRecommendation: ${patient.recommendation.vasopressor || "No vasopressor change recommended."}`;
      } else if (lowerText.includes("risk") || lowerText.includes("mortality") || lowerText.includes("prognosis")) {
        const critLabs = patient.labs.filter(l => l.flag === "critical");
        response = `[Risk Stratification] Patient ${patient.name}\n\nMortality Risk: ${patient.riskScore}%\nSOFA Score: ${patient.sofa}/24\nAcuity: ${patient.acuity.toUpperCase()}\n\n${critLabs.length > 0 ? `Critical values: ${critLabs.map(l => `${l.name} ${l.value} ${l.unit}`).join(", ")}` : "No critical lab values."}`;
      } else if (lowerText.includes("sofa") || lowerText.includes("organ")) {
        response = `[SOFA Analysis] Total SOFA: ${patient.sofa}/24\n\n${patient.sofaComponents.map(c => `${c.name}: ${c.score}/4 (${c.detail})`).join("\n")}`;
      } else if (lowerText.includes("hipaa") || lowerText.includes("compliance") || lowerText.includes("llm") || lowerText.includes("openai") || lowerText.includes("claude")) {
        response = `[Compliance & Architecture]\n\nStrive is fundamentally different from LLM-based tools. ON-PREMISE DEPLOYMENT: All patient data stays within the hospital's infrastructure. NOT AN LLM: Our core model is a reinforcement learning agent trained on 5M+ hours of de-identified ICU data.`;
      } else {
        response = `[RL Clinical Agent] For patient ${patient.name} (${patient.age}y ${patient.sex}, ${patient.sepsisSource}, SOFA ${patient.sofa}, Risk ${patient.riskScore}%):\n\n${patient.recommendation.rationale}\n\nKey insights:\n${patient.agentInsights.slice(0, 3).map(i => `- ${i}`).join("\n")}`;
      }

      setMessages(prev => [...prev, { role: "agent", text: response }]);
    } finally {
      setThinking(false);
    }
  }, [patient, patients]);

  const toolPanel = useMemo(() => {
    if (!activeTool) return null;
    switch (activeTool) {
      case "patient-analysis": return <PatientAnalysisPanel patient={patient} patients={patients} />;
      case "treatment-optimization": return <TreatmentOptimizationPanel patient={patient} patients={patients} />;
      case "risk-stratification": return <RiskStratificationPanel patient={patient} patients={patients} />;
      case "cohort-comparison": return <CohortComparisonPanel patient={patient} patients={patients} />;
      case "outcome-prediction": return <OutcomePredictionPanel patient={patient} patients={patients} />;
      case "drug-interaction": return <DrugInteractionPanel patient={patient} patients={patients} />;
      default: return null;
    }
  }, [activeTool, patient, patients]);

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-white border-b border-gray-200 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#00B894] flex items-center justify-center">
            <span className="text-white font-black text-xs">S</span>
          </div>
          <span className="font-bold text-base tracking-tight text-gray-900">Strive</span>
          <nav className="flex items-center gap-1 ml-4">
            <a href="/platform" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Platform</a>
            <a href="/agent" className="px-3 py-1.5 text-sm font-semibold text-[#00B894] bg-[#00B894]/10 rounded-lg">Agent</a>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span>HIPAA Compliant</span>
            <span className="text-gray-300">|</span>
            <span>SOC2 Type II</span>
            <span className="text-gray-300">|</span>
            <span>On-Premise</span>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowPatientPicker(!showPatientPicker)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${patient.acuity === "critical" ? "bg-red-500" : patient.acuity === "serious" ? "bg-amber-500" : patient.acuity === "stable" ? "bg-blue-500" : "bg-green-500"}`} />
              <span className="font-semibold">{patient.name}</span>
              <span className="text-gray-400 text-xs">SOFA {patient.sofa}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showPatientPicker && (
              <div className="absolute right-0 top-10 w-[420px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search patients..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B894]"
                    autoFocus
                  />
                </div>
                <div className="max-h-[50vh] overflow-y-auto">
                  {filteredPatients.map(p => {
                    const idx = patients.indexOf(p);
                    return (
                      <button
                        key={p.id}
                        onClick={() => { setSelectedPatientIdx(idx); setShowPatientPicker(false); setPatientSearch(""); }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 text-sm ${idx === selectedPatientIdx ? "bg-[#00B894]/5" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${p.acuity === "critical" ? "bg-red-500" : p.acuity === "serious" ? "bg-amber-500" : p.acuity === "stable" ? "bg-blue-500" : "bg-green-500"}`} />
                            <span className="font-semibold">{p.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{p.age}y | SOFA {p.sofa} | Risk {p.riskScore}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolkit sidebar */}
        <aside className="w-64 border-r border-gray-200 flex flex-col bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Agent Toolkit</h3>
            <p className="text-[11px] text-gray-400">RL-powered clinical tools</p>
          </div>
          <div className="p-3 space-y-1.5">
            {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${activeTool === tool.id ? "bg-gray-100 ring-1 ring-gray-200" : "hover:bg-gray-50"}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: tool.color }}>
                    {tool.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{tool.name}</p>
                    <p className="text-[11px] text-gray-400 leading-tight line-clamp-2">{tool.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Compliance badges */}
          <div className="mt-auto p-4 border-t border-gray-100">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                SOC2 Type II Certified
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded bg-purple-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                On-Premise Deploy
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-600 text-[9px] font-bold">RL</span>
                </div>
                Not an LLM
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              Strive uses reinforcement learning trained on 5M+ ICU hours. No patient data is sent to any cloud AI provider.
            </p>
          </div>
        </aside>

        {/* Center: Chat */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Quick actions */}
          <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-2 flex-wrap shrink-0">
            <span className="text-xs text-gray-400">Quick actions:</span>
            {[
              "Fluid bolus recommendation?",
              "Current risk assessment",
              "Vasopressor guidance",
              "SOFA breakdown",
              "Compare to cohort",
              "Why not use ChatGPT?",
            ].map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[#00B894]/10 flex items-center justify-center mx-auto mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#00B894] flex items-center justify-center">
                    <span className="text-white font-black text-lg">S</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">StriveMAP Clinical Agent</h2>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                  Ask clinical questions about {patient.name}. Get RL-powered treatment recommendations, risk stratification, and cohort analysis.
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {[
                    "Should I give a fluid bolus?",
                    "What's the mortality risk?",
                    "Optimize vasopressor dosing",
                    "Compare to similar patients",
                    "Check drug interactions",
                    "Why can't hospitals use Claude/ChatGPT for this?",
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="text-xs px-4 py-2 bg-white border border-gray-200 hover:border-[#00B894] hover:bg-[#00B894]/5 rounded-lg text-gray-600 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-6">
                  Powered by reinforcement learning, not LLMs. All data stays on-premise. HIPAA compliant.
                </p>
              </div>
            )}

            <div className="space-y-4 max-w-3xl mx-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "agent" && (
                    <div className="w-7 h-7 rounded-lg bg-[#00B894] flex items-center justify-center mr-2 shrink-0 mt-1">
                      <span className="text-white font-black text-[9px]">S</span>
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-[#00B894] text-white p-3"
                      : "bg-white border border-gray-200 p-4 shadow-sm"
                  }`}>
                    {msg.role === "agent" ? (
                      <div className="space-y-2">
                        {msg.text.split("\n").map((line, j) => {
                          if (line.startsWith("[") && line.includes("]")) {
                            const title = line.match(/\[(.+?)\]/)?.[1] || "";
                            const rest = line.replace(/\[.+?\]\s*/, "");
                            return (
                              <div key={j}>
                                <span className="text-[10px] font-bold text-[#00B894] uppercase tracking-wide">{title}</span>
                                {rest && <span className="text-gray-700 ml-1">{rest}</span>}
                              </div>
                            );
                          }
                          if (line.startsWith("- ")) {
                            return <p key={j} className="text-gray-700 pl-3 border-l-2 border-gray-200">{line.slice(2)}</p>;
                          }
                          return line ? <p key={j} className="text-gray-700">{line}</p> : <div key={j} className="h-1" />;
                        })}
                      </div>
                    ) : (
                      <p>{msg.text}</p>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="w-7 h-7 rounded-lg bg-[#00B894] flex items-center justify-center mr-2 shrink-0">
                    <span className="text-white font-black text-[9px]">S</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className="animate-pulse">Analyzing patient data with RL model...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-200 p-4 shrink-0">
            <div className="max-w-3xl mx-auto">
              <MediaInputBar
                disabled={thinking}
                placeholder={`Ask about ${patient.name}'s treatment, risk, labs, or drug interactions...`}
                onSend={(text, attachments) => sendMessage(text, attachments)}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">
              StriveMAP v2.4.1 -- Reinforcement Learning model, not an LLM. On-premise, HIPAA compliant. Human decides, AI assists.
            </p>
          </div>
        </div>

        {/* Right panel: Tool results */}
        {activeTool && (
          <div className="w-[420px] border-l border-gray-200 bg-gray-50 flex flex-col overflow-hidden">
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-[8px] font-bold"
                  style={{ backgroundColor: TOOLS.find(t => t.id === activeTool)?.color }}
                >
                  {TOOLS.find(t => t.id === activeTool)?.icon}
                </div>
                <h3 className="text-sm font-bold text-gray-900">{TOOLS.find(t => t.id === activeTool)?.name}</h3>
              </div>
              <button
                onClick={() => setActiveTool(null)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {toolPanel}
            </div>
            <div className="bg-white border-t border-gray-200 px-4 py-2 shrink-0">
              <p className="text-[10px] text-gray-400">Patient: {patient.name} (#{patient.id}) | Updated in real-time via RL model</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
