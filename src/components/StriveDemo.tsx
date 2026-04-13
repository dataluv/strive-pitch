"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ============================================================
   DATA — realistic simulated patient
   ============================================================ */

interface VitalPoint {
  time: string;
  map: number;
  sbp: number;
  dbp: number;
  hr: number;
  phenylephrine: number;
  fluidBolus: number;
}

function generateVitals(): VitalPoint[] {
  const points: VitalPoint[] = [];
  const startHour = 7;
  const sepsisOnsetIndex = 8;

  for (let i = 0; i < 24; i++) {
    const hour = (startHour + i) % 24;
    const label = `${hour.toString().padStart(2, "0")}:00`;

    const preSepsis = i < sepsisOnsetIndex;
    const map = preSepsis
      ? 75 + Math.random() * 10
      : Math.max(50, 68 - (i - sepsisOnsetIndex) * 1.5 + Math.random() * 8);
    const sbp = map * 1.5 + Math.random() * 10;
    const dbp = map * 0.75 + Math.random() * 5;
    const hr = preSepsis
      ? 78 + Math.random() * 8
      : 85 + (i - sepsisOnsetIndex) * 2 + Math.random() * 10;

    points.push({
      time: label,
      map: Math.round(map),
      sbp: Math.round(sbp),
      dbp: Math.round(dbp),
      hr: Math.round(hr),
      phenylephrine: preSepsis ? 0 : i > sepsisOnsetIndex + 4 ? Math.round(Math.random() * 30) : 0,
      fluidBolus: !preSepsis && (i === sepsisOnsetIndex + 1 || i === sepsisOnsetIndex + 5) ? 250 : 0,
    });
  }
  return points;
}

interface SimilarDecision {
  id: string;
  age: number;
  sex: string;
  mapRange: string;
  outcome: string;
  match: number;
}

const SIMILAR_DECISIONS: SimilarDecision[] = [
  { id: "#2847291_S12", age: 87, sex: "M", mapRange: "58-65", outcome: "Survived", match: 94 },
  { id: "#1938472_S45", age: 79, sex: "F", mapRange: "55-62", outcome: "Survived", match: 91 },
  { id: "#3019284_S23", age: 93, sex: "F", mapRange: "60-68", outcome: "Survived", match: 89 },
  { id: "#2756183_S67", age: 84, sex: "M", mapRange: "52-61", outcome: "Survived", match: 87 },
  { id: "#1847562_S89", age: 76, sex: "F", mapRange: "57-64", outcome: "Survived", match: 85 },
  { id: "#2938471_S34", age: 91, sex: "M", mapRange: "54-60", outcome: "Deceased", match: 83 },
];

/* Expected benefit data for the bar chart */
const MAP_RANGES = [
  { range: "<55", benefit: 59.2, n: 42, color: "#4299e1" },
  { range: "55-60", benefit: 67.8, n: 78, color: "#4299e1" },
  { range: "60-65", benefit: 74.1, n: 134, color: "#4299e1" },
  { range: "[70-75]", benefit: 78.2, n: 156, color: "#48bb78", highlight: true },
  { range: "75-80", benefit: 72.4, n: 98, color: "#4299e1" },
  { range: ">80", benefit: 64.3, n: 45, color: "#4299e1" },
];

/* ============================================================
   MINI CHART — canvas-based vitals chart
   ============================================================ */

function VitalsChart({
  data,
  timeRange,
  sepsisIndex,
}: {
  data: VitalPoint[];
  timeRange: number;
  sepsisIndex: number;
}) {
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

    const sliced = data.slice(0, timeRange);
    const padL = 45;
    const padR = 15;
    const padT = 30;
    const padB = 35;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padT + (chartH / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px system-ui";
    ctx.textAlign = "right";
    const yMax = 140;
    const yMin = 40;
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) / 5) * i;
      const y = padT + (chartH / 5) * i;
      ctx.fillText(Math.round(val).toString(), padL - 5, y + 3);
    }

    // X-axis labels
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(sliced.length / 8));
    for (let i = 0; i < sliced.length; i += step) {
      const x = padL + (chartW / (sliced.length - 1)) * i;
      ctx.fillText(sliced[i].time, x, h - 8);
    }

    // Sepsis onset line
    if (sepsisIndex < sliced.length) {
      const sx = padL + (chartW / (sliced.length - 1)) * sepsisIndex;
      ctx.strokeStyle = "#e53e3e";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, padT);
      ctx.lineTo(sx, padT + chartH);
      ctx.stroke();
      ctx.setLineDash([]);
      // Label
      ctx.fillStyle = "#e53e3e";
      ctx.font = "bold 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Onset of Sepsis", sx, padT - 8);
    }

    const toY = (val: number) => padT + ((yMax - val) / (yMax - yMin)) * chartH;
    const toX = (i: number) => padL + (chartW / (sliced.length - 1)) * i;

    // Draw line helper
    const drawLine = (
      key: keyof VitalPoint,
      color: string,
      lineWidth: number,
      dashed = false
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (dashed) ctx.setLineDash([3, 3]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      for (let i = 0; i < sliced.length; i++) {
        const x = toX(i);
        const y = toY(sliced[i][key] as number);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    // Draw dots helper
    const drawDots = (key: keyof VitalPoint, color: string, size: number) => {
      ctx.fillStyle = color;
      for (let i = 0; i < sliced.length; i++) {
        const x = toX(i);
        const y = toY(sliced[i][key] as number);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // SBP/DBP shaded region
    ctx.fillStyle = "rgba(66, 153, 225, 0.08)";
    ctx.beginPath();
    for (let i = 0; i < sliced.length; i++) {
      const x = toX(i);
      const y = toY(sliced[i].sbp);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = sliced.length - 1; i >= 0; i--) {
      const x = toX(i);
      const y = toY(sliced[i].dbp);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Lines
    drawLine("sbp", "#90cdf4", 1, true);
    drawLine("dbp", "#90cdf4", 1, true);
    drawLine("map", "#e53e3e", 2);
    drawDots("map", "#e53e3e", 3);
    drawLine("hr", "#38a169", 1.5);
    drawDots("hr", "#38a169", 2);

    // Fluid bolus markers
    ctx.fillStyle = "#805ad5";
    for (let i = 0; i < sliced.length; i++) {
      if (sliced[i].fluidBolus > 0) {
        const x = toX(i);
        ctx.beginPath();
        ctx.moveTo(x, padT + chartH);
        ctx.lineTo(x - 5, padT + chartH + 10);
        ctx.lineTo(x + 5, padT + chartH + 10);
        ctx.closePath();
        ctx.fill();
      }
    }
  }, [data, timeRange, sepsisIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full"
      style={{ height: 280 }}
    />
  );
}

/* ============================================================
   BENEFIT BAR CHART
   ============================================================ */

function BenefitChart() {
  return (
    <div className="flex items-end gap-2 h-44 px-4">
      {MAP_RANGES.map((d) => {
        const barHeight = (d.benefit / 100) * 140;
        return (
          <div key={d.range} className="flex-1 flex flex-col items-center">
            {/* Error bar */}
            <div className="relative flex flex-col items-center" style={{ height: 150 }}>
              <div
                className="absolute bottom-0 w-full rounded-t-sm transition-all duration-500"
                style={{
                  height: barHeight,
                  backgroundColor: d.highlight ? "#48bb78" : "#4299e1",
                  opacity: d.highlight ? 1 : 0.7,
                }}
              />
              {/* Error whisker */}
              <div
                className="absolute w-px bg-gray-600"
                style={{
                  bottom: barHeight - 5,
                  height: 20,
                  left: "50%",
                }}
              />
              <div
                className="absolute bg-gray-600"
                style={{
                  bottom: barHeight + 12,
                  height: 1,
                  width: 8,
                  left: "calc(50% - 4px)",
                }}
              />
              <div
                className="absolute bg-gray-600"
                style={{
                  bottom: barHeight - 8,
                  height: 1,
                  width: 8,
                  left: "calc(50% - 4px)",
                }}
              />
              {/* Value label */}
              <div
                className="absolute text-[10px] font-semibold text-gray-700"
                style={{ bottom: barHeight + 18 }}
              >
                {d.benefit.toFixed(1)}
              </div>
            </div>
            <div
              className={`text-[10px] mt-1 ${
                d.highlight ? "font-bold text-green-700 bg-green-50 px-1 rounded" : "text-gray-500"
              }`}
            >
              {d.range}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   MAIN STRIVE DEMO
   ============================================================ */

export default function StriveDemo() {
  const [vitals] = useState(() => generateVitals());
  const [timeRange, setTimeRange] = useState<6 | 12 | 24>(24);
  const [activeTab, setActiveTab] = useState<"patient" | "cohort">("patient");
  const [relativeScale, setRelativeScale] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  // Animate current vitals
  const [currentHR, setCurrentHR] = useState(90);
  const [currentMAP, setCurrentMAP] = useState(63);
  const [currentLactate, setCurrentLactate] = useState(2.3);

  useEffect(() => {
    const iv = setInterval(() => {
      setCurrentHR((p) => Math.round(p + (Math.random() - 0.45) * 2));
      setCurrentMAP((p) => Math.round((p + (Math.random() - 0.48) * 1.5) * 10) / 10);
      setCurrentLactate((p) => Math.round((p + (Math.random() - 0.5) * 0.1) * 10) / 10);
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  const sepsisIndex = 8;
  const displayData = vitals.slice(0, timeRange);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a1f36] flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-[#1a1f36] text-lg tracking-tight">Strive</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span>Patient Row ID</span>
          <span className="font-mono font-semibold text-gray-800">19a3127_S76</span>
          <div className="w-px h-5 bg-gray-200" />
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="px-4 py-1.5 bg-[#00B894] text-white text-xs font-semibold rounded-md hover:bg-[#00a383] transition-colors"
          >
            Search Patient
          </button>
        </div>
      </header>

      <div className="flex">
        {/* ============================================
            LEFT SIDEBAR
           ============================================ */}
        <aside className="w-80 bg-white border-r border-gray-200 min-h-[calc(100vh-57px)] flex flex-col">
          {/* Similar decisions */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-900">Similar decisions</h3>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                High Match
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              500 decisions from 89 different patients
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-[#00B894] h-1.5 rounded-full" style={{ width: "85%" }} />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">500+ of 500 decisions found</p>
          </div>

          {/* Patient info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500">ID #1943127_S76 &bull;</p>
                <p className="text-sm font-semibold text-gray-900">91 Years &bull; F</p>
                <p className="text-xs text-gray-400">1 day in hospital</p>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Current Observations and Interventions
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Heart Rate</span>
                <span className="font-mono font-semibold text-gray-800">{currentHR} bpm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">BP</span>
                <span className="font-mono font-semibold text-gray-800">
                  98/54 ({currentMAP}) mmHg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lactate</span>
                <span className="font-mono font-semibold text-gray-800">{currentLactate} mmol/L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Urine Output (last 3h)</span>
                <span className="font-mono text-gray-600">0 mL / 25 mL / 17 mL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Crystalloids</span>
                <span className="font-mono text-gray-600">100 mL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fluid Balance (last 24h)</span>
                <span className="font-mono text-red-600 font-semibold">-2762 mL</span>
              </div>
            </div>
          </div>

          {/* Vasoactive Agents */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Vasoactive Agents
            </h4>
            <p className="text-xs text-gray-400 italic">No vasoactive agents</p>
          </div>

          {/* Current Interventions */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Current Interventions
            </h4>
            <div className="space-y-2">
              {[
                "Mechanical ventilation",
                "Vasopressors",
                "Circulatory support",
                "CRRT",
              ].map((item) => (
                <div key={item} className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">{item}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">
                    Inactive
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comorbidities */}
          <div className="p-4">
            <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Key comorbidities
            </h4>
            <p className="text-xs text-gray-600">Congestive heart failure</p>
          </div>
        </aside>

        {/* ============================================
            MAIN CONTENT
           ============================================ */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Haemodynamics Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                Patient Haemodynamics During Hospital Stay
              </h2>
              <div className="flex items-center gap-1">
                {([6, 12, 24] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeRange(t)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      timeRange === t
                        ? "bg-[#1a1f36] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {t}h
                  </button>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mb-3 text-[11px] text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-red-500 rounded" />
                <span>MAP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-purple-500 rounded" />
                <span>Phenylephrine (mcg/kg/min)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-blue-400 rounded" />
                <span>Fluid Bolus (q250 mL)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-blue-300 rounded" style={{ borderTop: "1px dashed" }} />
                <span>SBP/DBP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-green-500 rounded" />
                <span>Heart Rate</span>
              </div>
            </div>

            <VitalsChart data={vitals} timeRange={timeRange} sepsisIndex={sepsisIndex} />
          </div>

          {/* Expected Benefit Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-1">
              Expected Benefit – Mean Arterial Pressure &amp; Fluid Bolus
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Mean Arterial Pressure observed in similar patients
            </p>

            {/* Legend for chart */}
            <div className="flex items-center gap-4 mb-3 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-green-500" />
                <span>greatest Expected Benefit seen in at least 10% of the decisions</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-blue-400 opacity-70" />
                <span>a sufficient number of decisions supporting MAP range</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-300" />
                <span>not enough decisions to support left MAP range</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2 text-[10px] text-gray-500">
              <span>Expected Benefit</span>
            </div>
            <BenefitChart />
            <div className="text-center text-[10px] text-gray-400 mt-1">MAP (mmHg)</div>
          </div>

          {/* Fluid Bolus Analysis */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Fluid Bolus Analysis of similar decisions
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {/* Summary */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Highest Expected Benefit</p>
                  <p className="text-lg font-bold text-red-600">Do not give a bolus</p>
                </div>
              </div>

              {/* Treatment Expected Benefit */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Treatment Expected Benefit
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Significance</span>
                    <div className="flex gap-0.5">
                      <div className="w-1.5 h-4 bg-yellow-400 rounded-sm" />
                      <div className="w-1.5 h-4 bg-yellow-400 rounded-sm" />
                      <div className="w-1.5 h-4 bg-gray-200 rounded-sm" />
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 mb-3">value analysis</p>

                {/* Horizontal bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Had a fluid bolus</span>
                      <span className="text-xs font-semibold text-gray-700">
                        Expected Benefit: 73.4
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-blue-400 h-3 rounded-full transition-all duration-700"
                        style={{ width: "73.4%" }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600 font-semibold">No fluid bolus</span>
                      <span className="text-xs font-bold text-green-600">
                        Expected Benefit: 78.2
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-700"
                        style={{ width: "78.2%" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Relative Scale toggle */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => setRelativeScale(!relativeScale)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      relativeScale ? "bg-[#00B894]" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        relativeScale ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-xs text-gray-500">Relative Scale</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs at bottom */}
          <div className="mt-6 flex items-center gap-0 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("patient")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "patient"
                  ? "border-[#00B894] text-[#00B894]"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              Patient and cohort analysis
            </button>
          </div>

          {/* Footer disclaimer */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
            <p className="text-[10px] text-yellow-700">
              Clinicians should exercise their own clinical judgement as to the information that is
              provided.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
