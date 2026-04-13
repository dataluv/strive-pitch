"use client";

import { useState, useEffect, useRef, useMemo } from "react";

/* ============================================================
   PATIENT DATABASE
   ============================================================ */

interface Patient {
  id: string;
  age: number;
  sex: "M" | "F";
  daysInHospital: number;
  hr: number;
  sbp: number;
  dbp: number;
  map: number;
  lactate: number;
  temp: number;
  wbc: number;
  creatinine: number;
  urineOutput: string;
  crystalloids: number;
  fluidBalance: number;
  comorbidities: string[];
  sepsisSource: string;
  sofa: number;
  interventions: { name: string; active: boolean }[];
  vasoactive: string | null;
  recommendation: {
    fluidBolus: "give" | "withhold";
    bolusExpectedBenefit: number;
    noBolusExpectedBenefit: number;
    vasopressor: string | null;
    mapTarget: string;
    rationale: string;
  };
  similarCount: number;
  similarPatients: number;
  matchQuality: "High" | "Medium" | "Low";
  riskScore: number;
  sepsisOnsetHour: number;
}

const PATIENTS: Patient[] = [
  {
    id: "1943127_S76",
    age: 91,
    sex: "F",
    daysInHospital: 1,
    hr: 90,
    sbp: 98,
    dbp: 54,
    map: 63,
    lactate: 2.3,
    temp: 38.4,
    wbc: 14.2,
    creatinine: 1.8,
    urineOutput: "0 / 25 / 17 mL",
    crystalloids: 100,
    fluidBalance: -2762,
    comorbidities: ["Congestive heart failure"],
    sepsisSource: "Urinary tract",
    sofa: 8,
    interventions: [
      { name: "Mechanical ventilation", active: false },
      { name: "Vasopressors", active: false },
      { name: "Circulatory support", active: false },
      { name: "CRRT", active: false },
    ],
    vasoactive: null,
    recommendation: {
      fluidBolus: "withhold",
      bolusExpectedBenefit: 73.4,
      noBolusExpectedBenefit: 78.2,
      vasopressor: null,
      mapTarget: "70-75",
      rationale:
        "Patient has negative fluid balance and congestive heart failure. Among 500 similar decisions from 89 patients, withholding fluid bolus was associated with higher expected benefit. MAP target 70-75 mmHg achievable with current trajectory.",
    },
    similarCount: 500,
    similarPatients: 89,
    matchQuality: "High",
    riskScore: 34,
    sepsisOnsetHour: 8,
  },
  {
    id: "2847291_S12",
    age: 67,
    sex: "M",
    daysInHospital: 3,
    hr: 118,
    sbp: 82,
    dbp: 48,
    map: 55,
    lactate: 5.1,
    temp: 39.6,
    wbc: 22.8,
    creatinine: 2.9,
    urineOutput: "0 / 0 / 10 mL",
    crystalloids: 2500,
    fluidBalance: 1840,
    comorbidities: ["Type 2 diabetes", "Chronic kidney disease Stage III"],
    sepsisSource: "Pneumonia",
    sofa: 12,
    interventions: [
      { name: "Mechanical ventilation", active: true },
      { name: "Vasopressors", active: true },
      { name: "Circulatory support", active: false },
      { name: "CRRT", active: false },
    ],
    vasoactive: "Norepinephrine 0.12 mcg/kg/min",
    recommendation: {
      fluidBolus: "give",
      bolusExpectedBenefit: 81.7,
      noBolusExpectedBenefit: 64.3,
      vasopressor: "Increase norepinephrine to 0.18 mcg/kg/min",
      mapTarget: "65-70",
      rationale:
        "MAP critically low at 55 mmHg despite vasopressors. 250 mL crystalloid bolus recommended based on 342 similar trajectories. Consider vasopressor dose escalation if MAP remains <65 after 30 min.",
    },
    similarCount: 342,
    similarPatients: 67,
    matchQuality: "High",
    riskScore: 72,
    sepsisOnsetHour: 4,
  },
  {
    id: "3019284_S23",
    age: 54,
    sex: "F",
    daysInHospital: 1,
    hr: 102,
    sbp: 108,
    dbp: 62,
    map: 72,
    lactate: 3.8,
    temp: 38.9,
    wbc: 16.5,
    creatinine: 1.2,
    urineOutput: "30 / 45 / 25 mL",
    crystalloids: 500,
    fluidBalance: -420,
    comorbidities: ["Hypertension"],
    sepsisSource: "Abdominal — cholangitis",
    sofa: 5,
    interventions: [
      { name: "Mechanical ventilation", active: false },
      { name: "Vasopressors", active: false },
      { name: "Circulatory support", active: false },
      { name: "CRRT", active: false },
    ],
    vasoactive: null,
    recommendation: {
      fluidBolus: "give",
      bolusExpectedBenefit: 82.1,
      noBolusExpectedBenefit: 71.4,
      vasopressor: null,
      mapTarget: "75-80",
      rationale:
        "Early sepsis with rising lactate but preserved MAP. 250 mL bolus recommended. 478 similar cases show fluid-responsive pattern at this stage. Source control (ERCP) is priority.",
    },
    similarCount: 478,
    similarPatients: 102,
    matchQuality: "High",
    riskScore: 28,
    sepsisOnsetHour: 6,
  },
  {
    id: "4182736_S41",
    age: 78,
    sex: "M",
    daysInHospital: 5,
    hr: 76,
    sbp: 132,
    dbp: 74,
    map: 88,
    lactate: 1.1,
    temp: 37.2,
    wbc: 9.8,
    creatinine: 1.4,
    urineOutput: "60 / 55 / 70 mL",
    crystalloids: 0,
    fluidBalance: -180,
    comorbidities: ["Atrial fibrillation", "COPD"],
    sepsisSource: "Skin/soft tissue — cellulitis",
    sofa: 2,
    interventions: [
      { name: "Mechanical ventilation", active: false },
      { name: "Vasopressors", active: false },
      { name: "Circulatory support", active: false },
      { name: "CRRT", active: false },
    ],
    vasoactive: null,
    recommendation: {
      fluidBolus: "withhold",
      bolusExpectedBenefit: 65.2,
      noBolusExpectedBenefit: 88.9,
      vasopressor: null,
      mapTarget: "80-90",
      rationale:
        "Patient recovering. Haemodynamics stable, lactate normalising. No fluid or vasopressor intervention indicated. Continue current antibiotic regimen and monitor for 24h before step-down.",
    },
    similarCount: 621,
    similarPatients: 134,
    matchQuality: "High",
    riskScore: 8,
    sepsisOnsetHour: 2,
  },
];

/* ============================================================
   GENERATE VITALS TIME SERIES
   ============================================================ */

interface VitalPoint {
  time: string;
  map: number;
  sbp: number;
  dbp: number;
  hr: number;
}

function generateVitals(patient: Patient): VitalPoint[] {
  const points: VitalPoint[] = [];
  const seed = patient.id.charCodeAt(0) + patient.age;
  let rng = seed;
  const rand = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };

  for (let i = 0; i < 24; i++) {
    const hour = (7 + i) % 24;
    const label = `${hour.toString().padStart(2, "0")}:00`;
    const preSepsis = i < patient.sepsisOnsetHour;
    const afterRecovery = i > patient.sepsisOnsetHour + 12;

    let map: number, hr: number;
    if (preSepsis) {
      map = patient.map + 15 + rand() * 8;
      hr = patient.hr - 15 + rand() * 6;
    } else if (afterRecovery) {
      map = patient.map + 5 + rand() * 10;
      hr = patient.hr - 5 + rand() * 8;
    } else {
      const severity = Math.min(1, (i - patient.sepsisOnsetHour) / 8);
      map = patient.map + 10 * (1 - severity) + rand() * 8 - 4;
      hr = patient.hr + 15 * severity + rand() * 10 - 5;
    }

    points.push({
      time: label,
      map: Math.round(map),
      sbp: Math.round(map * 1.45 + rand() * 8),
      dbp: Math.round(map * 0.78 + rand() * 4),
      hr: Math.round(hr),
    });
  }
  return points;
}

/* ============================================================
   MAP BENEFIT DATA
   ============================================================ */

const MAP_RANGES = [
  { range: "<55", benefit: 59.2 },
  { range: "55-60", benefit: 67.8 },
  { range: "60-65", benefit: 74.1 },
  { range: "65-70", benefit: 76.5 },
  { range: "70-75", benefit: 78.2 },
  { range: "75-80", benefit: 72.4 },
  { range: ">80", benefit: 64.3 },
];

/* ============================================================
   VITALS CHART
   ============================================================ */

function VitalsChart({ data, sepsisIndex }: { data: VitalPoint[]; sepsisIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    const padL = 48, padR = 20, padT = 32, padB = 36;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    const yMax = 160, yMin = 30;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = padT + (chartH / 6) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }

    // Y labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 6; i++) {
      const val = yMax - ((yMax - yMin) / 6) * i;
      ctx.fillText(Math.round(val).toString(), padL - 8, padT + (chartH / 6) * i + 4);
    }

    // X labels
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(data.length / 10));
    ctx.fillStyle = "#94a3b8";
    for (let i = 0; i < data.length; i += step) {
      const x = padL + (chartW / (data.length - 1)) * i;
      ctx.fillText(data[i].time, x, h - 10);
    }

    const toY = (v: number) => padT + ((yMax - v) / (yMax - yMin)) * chartH;
    const toX = (i: number) => padL + (chartW / (data.length - 1)) * i;

    // Sepsis onset
    if (sepsisIndex < data.length) {
      const sx = toX(sepsisIndex);
      ctx.save();
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(sx, padT);
      ctx.lineTo(sx, padT + chartH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 11px -apple-system, system-ui, sans-serif";
      ctx.fillText("Onset of Sepsis", sx, padT - 10);
      ctx.restore();
    }

    // SBP/DBP fill
    ctx.fillStyle = "rgba(59, 130, 246, 0.06)";
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
      const x = toX(i);
      if (i === 0) ctx.moveTo(x, toY(data[i].sbp));
      else ctx.lineTo(x, toY(data[i].sbp));
    }
    for (let i = data.length - 1; i >= 0; i--) {
      ctx.lineTo(toX(i), toY(data[i].dbp));
    }
    ctx.closePath();
    ctx.fill();

    // Draw lines
    const drawLine = (key: keyof VitalPoint, color: string, width: number, dash = false) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash ? [4, 4] : []);
      ctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = toX(i);
        const y = toY(data[i][key] as number);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawDots = (key: keyof VitalPoint, color: string, r: number) => {
      ctx.fillStyle = color;
      for (let i = 0; i < data.length; i++) {
        ctx.beginPath();
        ctx.arc(toX(i), toY(data[i][key] as number), r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawLine("sbp", "#93c5fd", 1, true);
    drawLine("dbp", "#93c5fd", 1, true);
    drawLine("map", "#ef4444", 2.5);
    drawDots("map", "#ef4444", 3.5);
    drawLine("hr", "#22c55e", 2);
    drawDots("hr", "#22c55e", 2.5);
  }, [data, sepsisIndex]);

  return <canvas ref={canvasRef} className="w-full" style={{ height: 300 }} />;
}

/* ============================================================
   RISK GAUGE
   ============================================================ */

function RiskGauge({ score }: { score: number }) {
  const color =
    score > 60 ? "#ef4444" : score > 30 ? "#f59e0b" : "#22c55e";
  const label = score > 60 ? "HIGH" : score > 30 ? "MODERATE" : "LOW";

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>
            {score}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider">Mortality Risk</p>
        <p className="text-sm font-bold" style={{ color }}>
          {label}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN DEMO
   ============================================================ */

export default function StriveDemo() {
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(0);
  const [timeRange, setTimeRange] = useState<6 | 12 | 24>(24);
  const [showPatientList, setShowPatientList] = useState(false);
  const [showCohort, setShowCohort] = useState(false);
  const [relativeScale, setRelativeScale] = useState(true);
  const [activeAnalysis, setActiveAnalysis] = useState<"fluid" | "vasopressor" | "antibiotics">(
    "fluid"
  );
  const [liveTime, setLiveTime] = useState(new Date());

  const patient = PATIENTS[selectedPatientIdx];
  const vitals = useMemo(() => generateVitals(patient), [patient]);

  // Live clock + vitals jitter
  const [jitterHR, setJitterHR] = useState(0);
  const [jitterMAP, setJitterMAP] = useState(0);
  const [jitterLactate, setJitterLactate] = useState(0);
  const [jitterTemp, setJitterTemp] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setLiveTime(new Date());
      setJitterHR(Math.round((Math.random() - 0.5) * 4));
      setJitterMAP(Math.round((Math.random() - 0.5) * 3));
      setJitterLactate(Math.round((Math.random() - 0.5) * 0.3 * 10) / 10);
      setJitterTemp(Math.round((Math.random() - 0.5) * 0.2 * 10) / 10);
    }, 2500);
    return () => clearInterval(iv);
  }, []);

  const liveHR = patient.hr + jitterHR;
  const liveMAP = patient.map + jitterMAP;
  const liveLactate = Math.max(0.5, patient.lactate + jitterLactate);
  const liveTemp = patient.temp + jitterTemp;
  const bestRange = patient.recommendation.mapTarget;

  return (
    <div className="h-screen flex flex-col bg-[#0f1117] text-white overflow-hidden">
      {/* ═══════════════ TOP BAR ═══════════════ */}
      <header className="h-12 bg-[#161822] border-b border-[#2a2d3a] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#00B894] flex items-center justify-center">
              <span className="text-white font-black text-[10px]">S</span>
            </div>
            <span className="font-bold text-sm tracking-tight">StriveMAP</span>
            <span className="text-[10px] text-gray-500 font-mono ml-1">v2.4.1</span>
          </div>
          <div className="w-px h-5 bg-[#2a2d3a]" />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00B894] animate-pulse" />
            <span className="text-[10px] text-[#00B894] font-mono">LIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] text-gray-500 font-mono">
            {liveTime.toLocaleTimeString()} UTC
          </span>
          <div className="w-px h-5 bg-[#2a2d3a]" />
          <span className="text-[11px] text-gray-400">ICU — Bed 12</span>
          <div className="w-px h-5 bg-[#2a2d3a]" />
          <div className="relative">
            <button
              onClick={() => setShowPatientList(!showPatientList)}
              className="flex items-center gap-2 px-3 py-1 bg-[#00B894] rounded text-xs font-semibold hover:bg-[#00a383] transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Select Patient
            </button>
            {showPatientList && (
              <div className="absolute right-0 top-8 w-80 bg-[#1e2030] border border-[#2a2d3a] rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-[#2a2d3a]">
                  <input
                    type="text"
                    placeholder="Search by ID, age, condition..."
                    className="w-full bg-[#161822] border border-[#2a2d3a] rounded px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#00B894]"
                  />
                </div>
                {PATIENTS.map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPatientIdx(i);
                      setShowPatientList(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-[#252840] transition-colors border-b border-[#2a2d3a] last:border-b-0 ${
                      i === selectedPatientIdx ? "bg-[#00B894]/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-semibold text-white">#{p.id}</span>
                        <span className="text-gray-500 ml-2">
                          {p.age}y {p.sex} — Day {p.daysInHospital}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">{p.sepsisSource}</span>
                        <div
                          className={`w-2 h-2 rounded-full ${
                            p.riskScore > 60
                              ? "bg-red-500"
                              : p.riskScore > 30
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
        <aside className="w-72 bg-[#161822] border-r border-[#2a2d3a] flex flex-col overflow-y-auto">
          {/* Patient header */}
          <div className="p-4 border-b border-[#2a2d3a]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#252840] flex items-center justify-center">
                  <span className="text-xs font-bold text-[#00B894]">
                    {patient.sex}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-400">#{patient.id}</p>
                  <p className="text-sm font-semibold">
                    {patient.age}y {patient.sex} — Day {patient.daysInHospital}
                  </p>
                </div>
              </div>
              <div
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  patient.sofa > 10
                    ? "bg-red-500/20 text-red-400"
                    : patient.sofa > 6
                    ? "bg-yellow-500/20 text-yellow-400"
                    : "bg-green-500/20 text-green-400"
                }`}
              >
                SOFA {patient.sofa}
              </div>
            </div>
            <RiskGauge score={patient.riskScore} />
          </div>

          {/* Similar decisions */}
          <div className="p-4 border-b border-[#2a2d3a]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Similar Decisions
              </h3>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  patient.matchQuality === "High"
                    ? "bg-[#00B894]/20 text-[#00B894]"
                    : "bg-yellow-500/20 text-yellow-400"
                }`}
              >
                {patient.matchQuality} Match
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {patient.similarCount} decisions from {patient.similarPatients} patients
            </p>
            <div className="w-full bg-[#252840] rounded-full h-1.5 mt-2">
              <div
                className="bg-[#00B894] h-1.5 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (patient.similarCount / 600) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Live vitals */}
          <div className="p-4 border-b border-[#2a2d3a]">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Live Observations
            </h3>
            <div className="space-y-2">
              {[
                {
                  label: "Heart Rate",
                  value: `${liveHR} bpm`,
                  critical: liveHR > 110,
                },
                {
                  label: "MAP",
                  value: `${liveMAP} mmHg`,
                  critical: liveMAP < 65,
                },
                {
                  label: "BP",
                  value: `${patient.sbp}/${patient.dbp} mmHg`,
                  critical: false,
                },
                {
                  label: "Lactate",
                  value: `${liveLactate.toFixed(1)} mmol/L`,
                  critical: liveLactate > 4,
                },
                {
                  label: "Temperature",
                  value: `${liveTemp.toFixed(1)} °C`,
                  critical: liveTemp > 38.5,
                },
                { label: "WBC", value: `${patient.wbc} K/μL`, critical: patient.wbc > 15 },
                {
                  label: "Creatinine",
                  value: `${patient.creatinine} mg/dL`,
                  critical: patient.creatinine > 2,
                },
                { label: "Urine Output (3h)", value: patient.urineOutput, critical: false },
                {
                  label: "Fluid Balance (24h)",
                  value: `${patient.fluidBalance > 0 ? "+" : ""}${patient.fluidBalance} mL`,
                  critical: Math.abs(patient.fluidBalance) > 2000,
                },
              ].map((v) => (
                <div key={v.label} className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{v.label}</span>
                  <span
                    className={`font-mono font-semibold ${
                      v.critical ? "text-red-400" : "text-white"
                    }`}
                  >
                    {v.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interventions */}
          <div className="p-4 border-b border-[#2a2d3a]">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Interventions
            </h3>
            <div className="space-y-2">
              {patient.interventions.map((int) => (
                <div key={int.name} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{int.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      int.active
                        ? "bg-[#00B894]/20 text-[#00B894]"
                        : "bg-[#252840] text-gray-600"
                    }`}
                  >
                    {int.active ? "Active" : "Off"}
                  </span>
                </div>
              ))}
            </div>
            {patient.vasoactive && (
              <div className="mt-3 p-2 bg-yellow-500/10 rounded border border-yellow-500/20">
                <p className="text-[10px] text-yellow-400 font-semibold">Vasoactive Agent</p>
                <p className="text-xs text-yellow-300">{patient.vasoactive}</p>
              </div>
            )}
          </div>

          {/* Comorbidities + source */}
          <div className="p-4">
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sepsis Source
            </h3>
            <p className="text-xs text-white mb-3">{patient.sepsisSource}</p>
            <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Comorbidities
            </h3>
            {patient.comorbidities.map((c) => (
              <p key={c} className="text-xs text-gray-400">
                {c}
              </p>
            ))}
          </div>
        </aside>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <main className="flex-1 flex flex-col overflow-y-auto p-5 gap-5">
          {/* Row 1: Vitals Chart */}
          <div className="bg-[#161822] rounded-xl border border-[#2a2d3a] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold">Patient Haemodynamics</h2>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Continuous monitoring — {vitals.length} data points
                </p>
              </div>
              <div className="flex items-center gap-1">
                {([6, 12, 24] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 text-[11px] font-semibold rounded transition-colors ${
                      timeRange === t
                        ? "bg-[#00B894] text-white"
                        : "bg-[#252840] text-gray-400 hover:bg-[#2a2d3a]"
                    }`}
                  >
                    {t}h
                  </button>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-5 mb-3 text-[10px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 bg-red-500 rounded" />
                MAP
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 bg-blue-400 rounded opacity-50" />
                SBP/DBP
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 bg-green-500 rounded" />
                Heart Rate
              </div>
            </div>
            <VitalsChart
              data={vitals.slice(0, timeRange)}
              sepsisIndex={patient.sepsisOnsetHour}
            />
          </div>

          {/* Row 2: AI Recommendation + Analysis */}
          <div className="grid grid-cols-5 gap-5">
            {/* AI Recommendation — left 3 cols */}
            <div className="col-span-3 bg-[#161822] rounded-xl border border-[#2a2d3a] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded bg-[#00B894]/20 flex items-center justify-center">
                  <svg className="w-3 h-3 text-[#00B894]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold">AI Treatment Recommendation</h2>
                <span className="text-[10px] text-[#00B894] font-mono ml-auto">
                  Updated {Math.floor(Math.random() * 5) + 1}s ago
                </span>
              </div>

              {/* Analysis tabs */}
              <div className="flex gap-1 mb-4">
                {(
                  [
                    ["fluid", "Fluid Management"],
                    ["vasopressor", "Vasopressors"],
                    ["antibiotics", "Antibiotics"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setActiveAnalysis(key)}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded transition-colors ${
                      activeAnalysis === key
                        ? "bg-[#00B894] text-white"
                        : "bg-[#252840] text-gray-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {activeAnalysis === "fluid" && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div
                      className={`p-4 rounded-lg border ${
                        patient.recommendation.fluidBolus === "give"
                          ? "bg-blue-500/10 border-blue-500/30"
                          : "bg-[#1e2030] border-[#2a2d3a]"
                      }`}
                    >
                      <p className="text-[10px] text-gray-400 mb-1">Give fluid bolus</p>
                      <p className="text-2xl font-bold text-blue-400">
                        {patient.recommendation.bolusExpectedBenefit}
                      </p>
                      <p className="text-[10px] text-gray-500">Expected Benefit</p>
                    </div>
                    <div
                      className={`p-4 rounded-lg border ${
                        patient.recommendation.fluidBolus === "withhold"
                          ? "bg-[#00B894]/10 border-[#00B894]/30"
                          : "bg-[#1e2030] border-[#2a2d3a]"
                      }`}
                    >
                      <p className="text-[10px] text-gray-400 mb-1">Withhold fluid bolus</p>
                      <p className="text-2xl font-bold text-[#00B894]">
                        {patient.recommendation.noBolusExpectedBenefit}
                      </p>
                      <p className="text-[10px] text-gray-500">Expected Benefit</p>
                    </div>
                  </div>

                  <div className="p-3 bg-[#1e2030] rounded-lg border border-[#2a2d3a] mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">
                        Recommendation
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          patient.recommendation.fluidBolus === "give"
                            ? "text-blue-400"
                            : "text-[#00B894]"
                        }`}
                      >
                        {patient.recommendation.fluidBolus === "give"
                          ? "Administer 250 mL crystalloid bolus"
                          : "Do not give a bolus"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {patient.recommendation.rationale}
                    </p>
                  </div>

                  {/* Horizontal benefit bars */}
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500">Had a fluid bolus</span>
                        <span className="text-blue-400 font-mono">
                          {patient.recommendation.bolusExpectedBenefit}
                        </span>
                      </div>
                      <div className="w-full bg-[#252840] rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${patient.recommendation.bolusExpectedBenefit}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-500">No fluid bolus</span>
                        <span className="text-[#00B894] font-mono">
                          {patient.recommendation.noBolusExpectedBenefit}
                        </span>
                      </div>
                      <div className="w-full bg-[#252840] rounded-full h-2">
                        <div
                          className="bg-[#00B894] h-2 rounded-full transition-all duration-700"
                          style={{
                            width: `${patient.recommendation.noBolusExpectedBenefit}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeAnalysis === "vasopressor" && (
                <div>
                  <div className="p-4 rounded-lg bg-[#1e2030] border border-[#2a2d3a] mb-4">
                    <p className="text-[10px] text-gray-500 mb-1">Current Status</p>
                    <p className="text-sm font-semibold">
                      {patient.vasoactive || "No vasopressors active"}
                    </p>
                  </div>
                  <div className="p-3 bg-[#1e2030] rounded-lg border border-[#2a2d3a]">
                    <p className="text-[10px] text-gray-500 mb-1">Recommendation</p>
                    <p className="text-sm font-semibold text-[#00B894]">
                      {patient.recommendation.vasopressor ||
                        "No vasopressor initiation recommended at this time"}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-2">
                      MAP target: {patient.recommendation.mapTarget} mmHg based on{" "}
                      {patient.similarCount} similar decision trajectories.
                    </p>
                  </div>
                </div>
              )}

              {activeAnalysis === "antibiotics" && (
                <div>
                  <div className="p-4 rounded-lg bg-[#1e2030] border border-[#2a2d3a] mb-4">
                    <p className="text-[10px] text-gray-500 mb-1">Sepsis Source</p>
                    <p className="text-sm font-semibold">{patient.sepsisSource}</p>
                  </div>
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-[10px] text-yellow-400 font-semibold mb-1">
                      Time-Critical Alert
                    </p>
                    <p className="text-xs text-yellow-300">
                      Each hour delay in appropriate antibiotics is associated with 7.6% increase in
                      mortality. Ensure blood cultures obtained and empiric antibiotics administered
                      within 1 hour of sepsis recognition.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right 2 cols — MAP Target + Stats */}
            <div className="col-span-2 flex flex-col gap-5">
              {/* MAP Target Analysis */}
              <div className="bg-[#161822] rounded-xl border border-[#2a2d3a] p-5 flex-1">
                <h3 className="text-sm font-bold mb-1">MAP Target Analysis</h3>
                <p className="text-[10px] text-gray-500 mb-4">
                  Expected Benefit by MAP range (mmHg)
                </p>
                <div className="flex items-end gap-1 h-28 mb-2">
                  {MAP_RANGES.map((d) => {
                    const isTarget = d.range === bestRange || d.range === `[${bestRange}]`;
                    const barH = (d.benefit / 100) * 100;
                    return (
                      <div
                        key={d.range}
                        className="flex-1 flex flex-col items-center justify-end"
                      >
                        <span className="text-[9px] text-gray-500 mb-1">
                          {d.benefit.toFixed(0)}
                        </span>
                        <div
                          className="w-full rounded-t transition-all"
                          style={{
                            height: barH,
                            backgroundColor: isTarget ? "#00B894" : "#3b82f6",
                            opacity: isTarget ? 1 : 0.5,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1">
                  {MAP_RANGES.map((d) => (
                    <div
                      key={d.range}
                      className="flex-1 text-center text-[8px] text-gray-600"
                    >
                      {d.range}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-[#161822] rounded-xl border border-[#2a2d3a] p-5">
                <h3 className="text-sm font-bold mb-3">Model Performance</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#1e2030] rounded-lg">
                    <p className="text-[10px] text-gray-500">Training Data</p>
                    <p className="text-lg font-bold text-white">5M</p>
                    <p className="text-[10px] text-gray-500">ICU hours</p>
                  </div>
                  <div className="p-3 bg-[#1e2030] rounded-lg">
                    <p className="text-[10px] text-gray-500">Patient Cohort</p>
                    <p className="text-lg font-bold text-white">60K+</p>
                    <p className="text-[10px] text-gray-500">patients</p>
                  </div>
                  <div className="p-3 bg-[#1e2030] rounded-lg">
                    <p className="text-[10px] text-gray-500">Mortality Reduction</p>
                    <p className="text-lg font-bold text-[#00B894]">41%</p>
                    <p className="text-[10px] text-gray-500">vs. standard</p>
                  </div>
                  <div className="p-3 bg-[#1e2030] rounded-lg">
                    <p className="text-[10px] text-gray-500">LOS Reduction</p>
                    <p className="text-lg font-bold text-blue-400">18%</p>
                    <p className="text-[10px] text-gray-500">ICU days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[10px] text-gray-600 px-1 pb-2">
            <span>
              Clinicians should exercise their own clinical judgement. AI assists, human decides.
            </span>
            <span className="font-mono">
              StriveMAP &copy; 2026 STRIVE Health — Trained on {patient.similarCount} similar
              decisions
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
