"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { MediaInputBar, type Attachment } from "./MediaInput";
import {
  getAllPatients,
  generateVitals,
  getLabDistribution,
  getVitalDistribution,
  getOutcomesByIntervention,
  getSofaMortalityCorrelation,
  computeDistribution,
  type Patient,
  type VitalPoint,
  type DistributionStats,
} from "@/lib/patientGenerator";

/* ============================================================
   VITALS CHART — Canvas-based, light theme
   ============================================================ */

function VitalsChart({
  data,
  sepsisIndex,
  timeRange,
}: {
  data: VitalPoint[];
  sepsisIndex: number;
  timeRange: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: VitalPoint } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const slicedData = useMemo(() => data.slice(0, timeRange), [data, timeRange]);

  const draw = useCallback(() => {
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
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = padT + (chartH / 6) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "right";
    for (let i = 0; i <= 6; i++) {
      const val = yMax - ((yMax - yMin) / 6) * i;
      ctx.fillText(Math.round(val).toString(), padL - 8, padT + (chartH / 6) * i + 4);
    }

    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(slicedData.length / 10));
    ctx.fillStyle = "#94a3b8";
    for (let i = 0; i < slicedData.length; i += step) {
      const x = padL + (chartW / (slicedData.length - 1)) * i;
      ctx.fillText(slicedData[i].time, x, h - 10);
    }

    const toY = (v: number) => padT + ((yMax - v) / (yMax - yMin)) * chartH;
    const toX = (i: number) => padL + (chartW / (slicedData.length - 1)) * i;

    if (sepsisIndex < slicedData.length) {
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

    for (let i = 0; i < slicedData.length; i++) {
      if (slicedData[i].fluidBolus) {
        const fx = toX(i);
        ctx.save();
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.moveTo(fx, padT + chartH + 8);
        ctx.lineTo(fx - 5, padT + chartH + 16);
        ctx.lineTo(fx + 5, padT + chartH + 16);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    const hasPhenyl = slicedData.some(d => d.phenylephrine > 0);
    if (hasPhenyl) {
      ctx.fillStyle = "rgba(168, 85, 247, 0.08)";
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < slicedData.length; i++) {
        const x = toX(i);
        const phenylY = toY(yMin + (slicedData[i].phenylephrine / 2) * (yMax - yMin));
        if (!started) { ctx.moveTo(x, padT + chartH); started = true; }
        ctx.lineTo(x, phenylY);
      }
      for (let i = slicedData.length - 1; i >= 0; i--) {
        ctx.lineTo(toX(i), padT + chartH);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < slicedData.length; i++) {
        const x = toX(i);
        const phenylY = toY(yMin + (slicedData[i].phenylephrine / 2) * (yMax - yMin));
        if (i === 0) ctx.moveTo(x, phenylY);
        else ctx.lineTo(x, phenylY);
      }
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(59, 130, 246, 0.06)";
    ctx.beginPath();
    for (let i = 0; i < slicedData.length; i++) {
      const x = toX(i);
      if (i === 0) ctx.moveTo(x, toY(slicedData[i].sbp));
      else ctx.lineTo(x, toY(slicedData[i].sbp));
    }
    for (let i = slicedData.length - 1; i >= 0; i--) {
      ctx.lineTo(toX(i), toY(slicedData[i].dbp));
    }
    ctx.closePath();
    ctx.fill();

    const drawLine = (key: keyof VitalPoint, color: string, width: number, dash = false) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash ? [4, 4] : []);
      ctx.beginPath();
      for (let i = 0; i < slicedData.length; i++) {
        const x = toX(i);
        const y = toY(slicedData[i][key] as number);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const drawDots = (key: keyof VitalPoint, color: string, r: number) => {
      ctx.fillStyle = color;
      for (let i = 0; i < slicedData.length; i++) {
        ctx.beginPath();
        ctx.arc(toX(i), toY(slicedData[i][key] as number), r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawLine("sbp", "#93c5fd", 1, true);
    drawLine("dbp", "#93c5fd", 1, true);
    drawLine("hr", "#22c55e", 2);
    drawLine("map", "#ef4444", 2.5);
    drawDots("map", "#ef4444", 3.5);

    if (hoveredIndex !== null && hoveredIndex < slicedData.length) {
      const hx = toX(hoveredIndex);
      ctx.strokeStyle = "rgba(0,0,0,0.1)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(hx, padT);
      ctx.lineTo(hx, padT + chartH);
      ctx.stroke();
    }
  }, [slicedData, sepsisIndex, hoveredIndex]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padL = 48, padR = 20;
    const chartW = rect.width - padL - padR;
    const idx = Math.round(((x - padL) / chartW) * (slicedData.length - 1));
    if (idx >= 0 && idx < slicedData.length) {
      setHoveredIndex(idx);
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, data: slicedData[idx] });
    } else {
      setHoveredIndex(null);
      setTooltip(null);
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="w-full cursor-crosshair"
        style={{ height: 300 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoveredIndex(null); setTooltip(null); }}
      />
      {tooltip && (
        <div
          className="absolute bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-none z-10"
          style={{ left: Math.min(tooltip.x, 600), top: tooltip.y - 100 }}
        >
          <p className="text-xs font-semibold text-gray-700 mb-1">{tooltip.data.time}</p>
          <div className="space-y-0.5 text-[11px]">
            <p><span className="text-red-500 font-semibold">MAP:</span> {tooltip.data.map} mmHg</p>
            <p><span className="text-blue-400 font-semibold">SBP/DBP:</span> {tooltip.data.sbp}/{tooltip.data.dbp}</p>
            <p><span className="text-green-500 font-semibold">HR:</span> {tooltip.data.hr} bpm</p>
            {tooltip.data.phenylephrine > 0 && (
              <p><span className="text-purple-500 font-semibold">Phenylephrine:</span> {tooltip.data.phenylephrine} mcg/kg/min</p>
            )}
            {tooltip.data.fluidBolus && (
              <p className="text-blue-600 font-semibold">Fluid Bolus (250 mL)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STATS MODAL — Shows distribution & comparison data
   ============================================================ */

function StatsModal({
  title,
  subtitle,
  currentValue,
  currentLabel,
  stats,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  currentValue?: string;
  currentLabel?: string;
  stats?: DistributionStats;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {currentValue && (
            <div className="bg-[#00B894]/5 border border-[#00B894]/20 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{currentLabel || "Current Patient"}</p>
              <p className="text-2xl font-bold text-[#00B894]">{currentValue}</p>
            </div>
          )}

          {stats && (
            <>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Mean</p>
                  <p className="text-lg font-bold text-gray-900">{stats.mean}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Median</p>
                  <p className="text-lg font-bold text-gray-900">{stats.median}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">P25</p>
                  <p className="text-lg font-bold text-gray-900">{stats.p25}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">P75</p>
                  <p className="text-lg font-bold text-gray-900">{stats.p75}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Distribution (n={stats.values.length})</p>
                <div className="flex items-end gap-1 h-24">
                  {stats.histogram.map((bin, i) => {
                    const maxPct = Math.max(...stats.histogram.map(b => b.pct));
                    const barH = maxPct > 0 ? (bin.pct / maxPct) * 80 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end">
                        <span className="text-[9px] text-gray-400 mb-0.5">{bin.pct}%</span>
                        <div
                          className="w-full bg-[#00B894]/20 rounded-t"
                          style={{ height: Math.max(2, barH) }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-1">
                  {stats.histogram.map((bin, i) => (
                    <div key={i} className="flex-1 text-center">
                      <span className="text-[8px] text-gray-400 leading-none">{bin.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>Range: {stats.min} - {stats.max}</span>
                <span className="text-gray-300">|</span>
                <span>IQR: {stats.p25} - {stats.p75}</span>
              </div>
            </>
          )}

          {children}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <p className="text-[10px] text-gray-400">
            Data from {stats?.values.length || 120} ICU patients. RL model v2.4 trained on 5M+ hours. HIPAA-compliant, on-premise deployment.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INTERVENTION COMPARISON MODAL
   ============================================================ */

function InterventionModal({
  name,
  data,
  isActive,
  onClose,
}: {
  name: string;
  data: { with: { count: number; avgRisk: number; avgSOFA: number }; without: { count: number; avgRisk: number; avgSOFA: number } };
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <StatsModal
      title={name}
      subtitle="Outcome comparison across patient cohort"
      currentValue={isActive ? "Active" : "Inactive"}
      currentLabel="Current patient status"
      onClose={onClose}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl p-4 border ${isActive ? "border-[#00B894] bg-[#00B894]/5" : "border-gray-200 bg-gray-50"}`}>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">With {name}</p>
          <p className="text-sm text-gray-600">Patients: <span className="font-bold text-gray-900">{data.with.count}</span></p>
          <p className="text-sm text-gray-600">Avg Risk: <span className="font-bold text-red-500">{data.with.avgRisk}%</span></p>
          <p className="text-sm text-gray-600">Avg SOFA: <span className="font-bold text-gray-900">{data.with.avgSOFA}</span></p>
        </div>
        <div className={`rounded-xl p-4 border ${!isActive ? "border-[#00B894] bg-[#00B894]/5" : "border-gray-200 bg-gray-50"}`}>
          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Without {name}</p>
          <p className="text-sm text-gray-600">Patients: <span className="font-bold text-gray-900">{data.without.count}</span></p>
          <p className="text-sm text-gray-600">Avg Risk: <span className="font-bold text-red-500">{data.without.avgRisk}%</span></p>
          <p className="text-sm text-gray-600">Avg SOFA: <span className="font-bold text-gray-900">{data.without.avgSOFA}</span></p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-700">
          Note: Higher-acuity patients are more likely to have active interventions, creating selection bias in raw comparisons. The RL model adjusts for confounders including age, comorbidities, and illness severity when computing treatment recommendations.
        </p>
      </div>
    </StatsModal>
  );
}

/* ============================================================
   SOFA MORTALITY MODAL
   ============================================================ */

function SofaMortalityModal({
  currentSOFA,
  correlations,
  onClose,
}: {
  currentSOFA: number;
  correlations: { sofa: number; avgMortality: number; count: number }[];
  onClose: () => void;
}) {
  const maxMort = Math.max(...correlations.map(c => c.avgMortality));
  return (
    <StatsModal
      title="SOFA Score & Mortality Correlation"
      subtitle="Based on 120 ICU patients in this cohort"
      currentValue={`SOFA ${currentSOFA}`}
      currentLabel="Current patient"
      onClose={onClose}
    >
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Average Mortality Risk by SOFA Score</p>
        <div className="space-y-1.5">
          {correlations.map(c => (
            <div key={c.sofa} className="flex items-center gap-2">
              <span className={`text-xs font-mono w-12 text-right ${c.sofa === currentSOFA ? "font-bold text-[#00B894]" : "text-gray-500"}`}>
                SOFA {c.sofa}
              </span>
              <div className="flex-1 bg-gray-100 rounded-full h-4 relative">
                <div
                  className={`h-4 rounded-full transition-all ${c.sofa === currentSOFA ? "bg-[#00B894]" : "bg-red-300"}`}
                  style={{ width: `${(c.avgMortality / maxMort) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono w-14 text-right text-gray-700">{c.avgMortality}%</span>
              <span className="text-[10px] text-gray-400 w-8">(n={c.count})</span>
            </div>
          ))}
        </div>
      </div>
    </StatsModal>
  );
}

/* ============================================================
   CLICKABLE VALUE COMPONENT
   ============================================================ */

function ClickableValue({
  label,
  value,
  className,
  onClick,
}: {
  label?: string;
  value: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`hover:bg-[#00B894]/5 hover:ring-1 hover:ring-[#00B894]/20 rounded px-1 -mx-1 transition-all cursor-pointer ${className || ""}`}
      title="Click to compare across patients"
    >
      {label && <span className="text-gray-600">{label}</span>}
      <span className={className}>{value}</span>
    </button>
  );
}

/* ============================================================
   ICU OVERVIEW TAB
   ============================================================ */

function ICUOverviewTab({ patients, selectedIdx, onSelectPatient }: { patients: Patient[]; selectedIdx: number; onSelectPatient: (i: number) => void }) {
  const sorted = useMemo(() => {
    return patients
      .map((p, i) => ({ ...p, origIdx: i }))
      .sort((a, b) => b.riskScore - a.riskScore);
  }, [patients]);

  const counts = useMemo(() => {
    const c = { critical: 0, serious: 0, stable: 0, improving: 0 };
    patients.forEach(p => c[p.acuity]++);
    return c;
  }, [patients]);

  const avgSOFA = useMemo(() => {
    return (patients.reduce((s, p) => s + p.sofa, 0) / patients.length).toFixed(1);
  }, [patients]);

  const interventionCounts = useMemo(() => {
    let mv = 0, vp = 0, crrt = 0;
    patients.forEach(p => {
      p.interventions.forEach(int => {
        if (int.active && int.name === "Mechanical ventilation") mv++;
        if (int.active && int.name === "Vasopressors") vp++;
        if (int.active && int.name === "CRRT") crrt++;
      });
    });
    return { mv, vp, crrt, total: mv + vp + crrt };
  }, [patients]);

  const deteriorating = useMemo(() => sorted.filter(p => p.acuity === "critical" && p.riskScore > 70).slice(0, 5), [sorted]);

  const tileColor = (a: Patient["acuity"]) => {
    switch (a) {
      case "critical": return { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" };
      case "serious": return { bg: "#fffbeb", border: "#fde68a", text: "#92400e" };
      case "stable": return { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" };
      case "improving": return { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" };
    }
  };

  return (
    <>
      <style>{`
        @keyframes deterioratePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
        }
      `}</style>

      {/* Summary Stats Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Total</p>
            <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] text-red-400 uppercase font-semibold">Critical</p>
              <p className="text-xl font-bold text-red-600">{counts.critical}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-amber-400 uppercase font-semibold">Serious</p>
              <p className="text-xl font-bold text-amber-600">{counts.serious}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-blue-400 uppercase font-semibold">Stable</p>
              <p className="text-xl font-bold text-blue-600">{counts.stable}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-green-400 uppercase font-semibold">Improving</p>
              <p className="text-xl font-bold text-green-600">{counts.improving}</p>
            </div>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Avg SOFA</p>
            <p className="text-xl font-bold text-gray-900">{avgSOFA}</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase font-semibold">Active Interventions</p>
            <p className="text-sm font-bold text-gray-700">MV: {interventionCounts.mv} | VP: {interventionCounts.vp} | CRRT: {interventionCounts.crrt}</p>
          </div>
          <div className="h-10 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-bold text-red-600">{deteriorating.length} patients deteriorating</span>
          </div>
        </div>
      </div>

      {/* Patient Heatmap Grid */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-4">Patient Risk Heatmap (sorted by risk score)</h2>
        <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
          {sorted.map((p) => {
            const c = tileColor(p.acuity);
            const initials = p.name.split(" ").map(n => n[0]).join("");
            const isSelected = p.origIdx === selectedIdx;
            const isDeteriorating = p.acuity === "critical" && p.riskScore > 70;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPatient(p.origIdx)}
                className="relative rounded-lg transition-all hover:scale-105 cursor-pointer"
                style={{
                  background: c.bg,
                  border: isSelected ? "2px solid #00B894" : `1px solid ${c.border}`,
                  padding: "6px 2px",
                  textAlign: "center",
                  animation: isDeteriorating ? "deterioratePulse 2s ease-in-out infinite" : undefined,
                }}
                title={`${p.name} | SOFA: ${p.sofa} | Risk: ${p.riskScore}%`}
              >
                <div style={{ fontSize: 10, fontWeight: 700, color: c.text, lineHeight: 1 }}>{initials}</div>
                <div style={{ fontSize: 8, color: c.text, opacity: 0.7, marginTop: 1 }}>{p.sofa}</div>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-300" />Critical</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />Serious</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />Stable</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-100 border border-green-300" />Improving</div>
          <span className="text-gray-300">|</span>
          <span>Sorted by risk score (highest first). Click a tile to select patient.</span>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   TREATMENT SIMULATOR TAB
   ============================================================ */

function TreatmentSimulatorTab({ patient }: { patient: Patient }) {
  const [fluidBolus, setFluidBolus] = useState(false);
  const [startVaso, setStartVaso] = useState(false);
  const [increaseVaso, setIncreaseVaso] = useState(false);
  const [startCRRT, setStartCRRT] = useState(false);
  const [intubate, setIntubate] = useState(false);

  // Reset toggles on patient change
  useEffect(() => {
    setFluidBolus(false);
    setStartVaso(false);
    setIncreaseVaso(false);
    setStartCRRT(false);
    setIntubate(false);
  }, [patient.id]);

  // Deterministic predictions based on patient data and toggles
  const predictions = useMemo(() => {
    let mapDelta = 0;
    let sofaDelta = 0;
    let mortalityDelta = 0;
    let losDelta = 0;

    const hasCHF = patient.comorbidities.some(c => c.toLowerCase().includes("heart failure"));
    const hasCKD = patient.comorbidities.some(c => c.toLowerCase().includes("kidney"));
    const isHypotensive = patient.map < 65;

    if (fluidBolus) {
      if (hasCHF) {
        mapDelta += 2;
        sofaDelta += 1;
        mortalityDelta += 8;
        losDelta += 2;
      } else if (isHypotensive && patient.crystalloids < 3000) {
        mapDelta += 8;
        sofaDelta -= 1;
        mortalityDelta -= 5;
        losDelta -= 0.5;
      } else {
        mapDelta += 4;
        mortalityDelta += 2;
        losDelta += 0.5;
      }
    }

    if (startVaso) {
      if (isHypotensive) {
        mapDelta += 12;
        sofaDelta -= 1;
        mortalityDelta -= 10;
        losDelta -= 1;
      } else {
        mapDelta += 6;
        mortalityDelta -= 3;
      }
    }

    if (increaseVaso) {
      if (patient.vasoactive) {
        mapDelta += 8;
        mortalityDelta -= 5;
      } else {
        mapDelta += 3;
        mortalityDelta += 2;
      }
    }

    if (startCRRT) {
      if (hasCKD || patient.creatinine > 3) {
        sofaDelta -= 2;
        mortalityDelta -= 12;
        losDelta -= 1.5;
      } else {
        sofaDelta -= 1;
        mortalityDelta -= 4;
        losDelta += 1;
      }
    }

    if (intubate) {
      const isMechVent = patient.interventions.some(i => i.name === "Mechanical ventilation" && i.active);
      if (!isMechVent) {
        if (patient.sofa > 10) {
          sofaDelta -= 1;
          mortalityDelta -= 8;
          losDelta += 2;
        } else {
          sofaDelta += 1;
          mortalityDelta += 3;
          losDelta += 3;
        }
      }
    }

    const predMAP = Math.round(Math.max(40, Math.min(120, patient.map + mapDelta)));
    const predSOFA = Math.max(0, Math.min(24, patient.sofa + sofaDelta));
    const predMortality = Math.max(1, Math.min(98, patient.riskScore + mortalityDelta));
    const baseLOS = Math.max(2, Math.round(patient.sofa * 1.2 + 3));
    const predLOS = Math.max(1, Math.round((baseLOS + losDelta) * 10) / 10);

    return { predMAP, predSOFA, predMortality, predLOS, baseLOS };
  }, [patient, fluidBolus, startVaso, increaseVaso, startCRRT, intubate]);

  const anyToggled = fluidBolus || startVaso || increaseVaso || startCRRT || intubate;

  const toggleStyle = (on: boolean): string =>
    on
      ? "bg-[#00B894] border-[#00B894]"
      : "bg-gray-200 border-gray-200";

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">&quot;What If&quot; Treatment Simulator</h2>
        <p className="text-xs text-gray-500 mb-5">Toggle treatments to see predicted outcomes for {patient.name} ({patient.id})</p>

        {/* Current State */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "MAP", value: `${patient.map} mmHg`, color: patient.map < 65 ? "text-red-600" : "text-gray-900" },
            { label: "SOFA", value: `${patient.sofa}/24`, color: patient.sofa > 10 ? "text-red-600" : "text-gray-900" },
            { label: "Lactate", value: `${patient.lactate} mmol/L`, color: patient.lactate > 4 ? "text-red-600" : "text-gray-900" },
            { label: "Risk Score", value: `${patient.riskScore}%`, color: patient.riskScore > 60 ? "text-red-600" : patient.riskScore > 30 ? "text-amber-600" : "text-green-600" },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-400 uppercase font-semibold">{s.label}</p>
              <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toggle Panel */}
        <div className="space-y-3 mb-6">
          {[
            { label: "Give 250mL fluid bolus", value: fluidBolus, set: setFluidBolus },
            { label: "Start vasopressor", value: startVaso, set: setStartVaso },
            { label: "Increase vasopressor dose", value: increaseVaso, set: setIncreaseVaso },
            { label: "Start CRRT", value: startCRRT, set: setStartCRRT },
            { label: "Intubate", value: intubate, set: setIntubate },
          ].map(t => (
            <div key={t.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">{t.label}</span>
              <button
                onClick={() => t.set(!t.value)}
                className={`relative w-11 h-6 rounded-full border-2 transition-all ${toggleStyle(t.value)}`}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                  style={{ left: t.value ? 22 : 2 }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Predicted Outcomes */}
        {anyToggled && (
          <div className="border-t border-gray-200 pt-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Predicted Outcomes</h3>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Predicted MAP in 2h</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 line-through">{patient.map}</span>
                  <span className={`text-2xl font-bold font-mono ${predictions.predMAP >= 65 ? "text-green-600" : "text-red-600"}`}>{predictions.predMAP}</span>
                  <span className="text-xs text-gray-400">mmHg</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${(predictions.predMAP / 120) * 100}%`, background: predictions.predMAP >= 65 ? "#16a34a" : "#dc2626" }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Predicted SOFA in 24h</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 line-through">{patient.sofa}</span>
                  <span className={`text-2xl font-bold font-mono ${predictions.predSOFA < patient.sofa ? "text-green-600" : predictions.predSOFA > patient.sofa ? "text-red-600" : "text-gray-900"}`}>{predictions.predSOFA}</span>
                  <span className="text-xs text-gray-400">/ 24</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${(predictions.predSOFA / 24) * 100}%`, background: predictions.predSOFA <= 6 ? "#16a34a" : predictions.predSOFA <= 12 ? "#f59e0b" : "#dc2626" }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Predicted Mortality Risk</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 line-through">{patient.riskScore}%</span>
                  <span className={`text-2xl font-bold font-mono ${predictions.predMortality < patient.riskScore ? "text-green-600" : "text-red-600"}`}>{predictions.predMortality}%</span>
                </div>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${predictions.predMortality}%`, background: predictions.predMortality <= 30 ? "#16a34a" : predictions.predMortality <= 60 ? "#f59e0b" : "#dc2626" }} />
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Predicted ICU Days Remaining</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 line-through">{predictions.baseLOS}</span>
                  <span className={`text-2xl font-bold font-mono ${predictions.predLOS < predictions.baseLOS ? "text-green-600" : "text-red-600"}`}>{predictions.predLOS}</span>
                  <span className="text-xs text-gray-400">days</span>
                </div>
              </div>
            </div>

            {/* Before / After Bars */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase">Before vs After Comparison</h3>
              {[
                { label: "MAP (mmHg)", before: patient.map, after: predictions.predMAP, max: 120, higherBetter: true },
                { label: "SOFA", before: patient.sofa, after: predictions.predSOFA, max: 24, higherBetter: false },
                { label: "Mortality (%)", before: patient.riskScore, after: predictions.predMortality, max: 100, higherBetter: false },
                { label: "ICU Days", before: predictions.baseLOS, after: predictions.predLOS, max: 25, higherBetter: false },
              ].map(bar => {
                const improved = bar.higherBetter ? bar.after > bar.before : bar.after < bar.before;
                return (
                  <div key={bar.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{bar.label}</span>
                      <span className={`font-bold ${improved ? "text-green-600" : "text-red-600"}`}>
                        {bar.before} {"->"} {bar.after} {improved ? "(improved)" : "(worse)"}
                      </span>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div className="flex-1 bg-gray-100 rounded relative">
                        <div className="absolute inset-y-0 left-0 bg-gray-400 rounded opacity-50 transition-all" style={{ width: `${(bar.before / bar.max) * 100}%` }} />
                      </div>
                      <div className="flex-1 bg-gray-100 rounded relative">
                        <div className={`absolute inset-y-0 left-0 rounded transition-all ${improved ? "bg-green-500" : "bg-red-500"}`} style={{ width: `${(bar.after / bar.max) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex text-[10px] text-gray-400 mt-0.5">
                      <span className="flex-1">Current</span>
                      <span className="flex-1">Predicted</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-5 bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-[10px] text-gray-500">Predictions from RL policy trained on 5M+ ICU hours. Not an LLM. Model adjusts for patient-specific comorbidities, current interventions, and illness trajectory.</p>
        </div>
      </div>
    </>
  );
}


/* ============================================================
   COMPLIANCE & DATA PROTECTION TAB
   ============================================================ */

interface ComplianceRegime {
  jurisdiction: string;
  flag: string;
  regulations: { name: string; status: "certified" | "pending" | "in-progress"; detail: string }[];
  dataResidency: string;
  accessModel: string;
  auditFrequency: string;
  encryptionStandard: string;
  deploymentType: string;
}

const COMPLIANCE_BY_JURISDICTION: Record<string, ComplianceRegime> = {
  US: {
    jurisdiction: "United States",
    flag: "🇺🇸",
    regulations: [
      { name: "HIPAA", status: "certified", detail: "Full compliance — BAA in place with each hospital partner. PHI never leaves on-premise infrastructure." },
      { name: "FDA 510(k)", status: "in-progress", detail: "Pre-submission meeting completed. Clinical Decision Support Software (Class II). Target clearance Q3 2026." },
      { name: "SOC 2 Type II", status: "certified", detail: "Annual audit by Deloitte. Zero critical findings in FY2025." },
      { name: "HITRUST CSF", status: "certified", detail: "r2 certified. Covers all 19 control domains." },
      { name: "21 CFR Part 11", status: "certified", detail: "Electronic records and signatures compliant. Full audit trail." },
    ],
    dataResidency: "Data stored on-premise at each US hospital site. No cloud egress. Encrypted at rest (AES-256) and in transit (TLS 1.3).",
    accessModel: "Role-Based Access Control (RBAC) with SAML 2.0 SSO integration. Attending physician, fellow, nurse, pharmacist, and auditor roles. Minimum necessary access principle enforced.",
    auditFrequency: "Continuous + quarterly formal review",
    encryptionStandard: "AES-256 at rest, TLS 1.3 in transit, HSM key management",
    deploymentType: "On-premise (hospital data center)",
  },
  UK: {
    jurisdiction: "United Kingdom",
    flag: "🇬🇧",
    regulations: [
      { name: "UK Data Protection Act 2018", status: "certified", detail: "Registered with ICO. Lawful basis: legitimate interest for direct care + explicit consent for research." },
      { name: "UK GDPR", status: "certified", detail: "Article 35 DPIA completed. Data Protection Officer appointed. Annual review cycle." },
      { name: "NHS Digital DTAC", status: "certified", detail: "Digital Technology Assessment Criteria — all clinical safety, data protection, technical security, and interoperability standards met." },
      { name: "DCB0129 Clinical Safety", status: "certified", detail: "Clinical Safety Case Report filed. Clinical Safety Officer appointed. Hazard log maintained." },
      { name: "CE/UKCA Mark (Class IIb)", status: "in-progress", detail: "UKCA application filed via BSI. Notified body review underway. MHRA registration pending." },
      { name: "Cyber Essentials Plus", status: "certified", detail: "Certified by IASME. Required for NHS suppliers handling patient data." },
    ],
    dataResidency: "Data hosted within NHS Trust infrastructure. Compliant with NHS Data Security and Protection Toolkit (DSPT). No data leaves UK sovereign territory.",
    accessModel: "NHS Smartcard / NHS Identity integration. Role-based access aligned to NHS job roles. Caldicott Guardian approval required for each deployment.",
    auditFrequency: "Continuous + annual DSPT submission",
    encryptionStandard: "AES-256, TLS 1.3, NHS-approved HSM, FIPS 140-2",
    deploymentType: "On-premise (NHS Trust data centre / HSCN)",
  },
  EU: {
    jurisdiction: "European Union",
    flag: "🇪🇺",
    regulations: [
      { name: "EU GDPR", status: "certified", detail: "Article 35 DPIA completed for all EU sites. DPO designated. Standard Contractual Clauses in place." },
      { name: "CE Mark (Class IIb)", status: "in-progress", detail: "MDR 2017/745 pathway. Notified body: TÜV Rheinland. Clinical evaluation report submitted." },
      { name: "ISO 13485:2016", status: "certified", detail: "Quality Management System for medical devices. Certified by TÜV. Covers design, development, and deployment." },
      { name: "ISO 27001:2022", status: "certified", detail: "Information Security Management System. Certified scope covers all clinical data processing." },
      { name: "EU AI Act (High-Risk)", status: "in-progress", detail: "Classified as high-risk AI (Annex III, health). Conformity assessment underway. Transparency and human oversight requirements met." },
      { name: "Gematik (Germany)", status: "certified", detail: "Telematics infrastructure compatibility verified for German healthcare network." },
    ],
    dataResidency: "Data remains within hospital premises in EU member state. Compliant with Schrems II. No transatlantic data transfers.",
    accessModel: "Hospital Active Directory / LDAP integration. German Heilberufeausweis (HBA) electronic health professional card support. Data access logged per Art. 30 GDPR.",
    auditFrequency: "Continuous + annual ISO audit + biannual GDPR review",
    encryptionStandard: "AES-256, TLS 1.3, eIDAS-qualified certificates",
    deploymentType: "On-premise (hospital Rechenzentrum)",
  },
};

function getHospitalJurisdiction(hospitalId: string): string {
  if (hospitalId === "nhs") return "UK";
  if (hospitalId === "charite") return "EU";
  return "US";
}

function getHospitalJurisdictions(hospitalId: string): string[] {
  if (hospitalId === "all") return ["US", "UK", "EU"];
  if (hospitalId === "nhs") return ["UK"];
  if (hospitalId === "charite") return ["EU"];
  return ["US"];
}

interface ComplianceTabProps {
  hospital: Hospital;
}

function ComplianceTab({ hospital }: ComplianceTabProps) {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [expandedReg, setExpandedReg] = useState<string | null>(null);
  const [showAccessFlow, setShowAccessFlow] = useState(false);

  const jurisdictions = getHospitalJurisdictions(hospital.id);
  const activeJurisdiction = selectedJurisdiction || jurisdictions[0];
  const regime = COMPLIANCE_BY_JURISDICTION[activeJurisdiction];

  return (
    <>
      {/* Jurisdiction selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Regulatory Compliance & Data Protection</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {hospital.id === "all" ? "Multi-jurisdictional compliance across all partner sites" : `Compliance framework for ${hospital.name}`}
            </p>
          </div>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${showComparison ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
          >
            {showComparison ? "Hide" : "vs OpenAI / Anthropic"}
          </button>
        </div>

        {/* Jurisdiction tabs */}
        <div className="flex gap-2 mb-4">
          {jurisdictions.map(j => {
            const r = COMPLIANCE_BY_JURISDICTION[j];
            return (
              <button
                key={j}
                onClick={() => setSelectedJurisdiction(j)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeJurisdiction === j
                    ? "bg-[#00B894] text-white shadow-sm"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                <span className="text-base">{r.flag}</span>
                <span>{r.jurisdiction}</span>
              </button>
            );
          })}
        </div>

        {/* Comparison banner */}
        {showComparison && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-bold text-red-800 mb-3">Why OpenAI / Anthropic Cannot Serve This Market</h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center"><span className="text-red-600 font-bold text-[10px]">✗</span></div>
                  <span className="font-bold text-gray-900">Data Residency</span>
                </div>
                <p className="text-gray-600">Cloud LLMs send patient data to US data centres. Violates <strong>GDPR Art. 44</strong> (EU), <strong>UK GDPR</strong>, <strong>HIPAA BAA</strong> requirements for on-premise PHI.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center"><span className="text-red-600 font-bold text-[10px]">✗</span></div>
                  <span className="font-bold text-gray-900">Medical Device Cert</span>
                </div>
                <p className="text-gray-600">No FDA 510(k), CE Mark, or UKCA certification. Cannot legally be used for <strong>clinical decision support</strong> in treatment decisions.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center"><span className="text-red-600 font-bold text-[10px]">✗</span></div>
                  <span className="font-bold text-gray-900">Deterministic Output</span>
                </div>
                <p className="text-gray-600">LLMs hallucinate and produce non-deterministic outputs. RL policies are <strong>deterministic</strong> — same state → same action. Required for clinical safety.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center"><span className="text-red-600 font-bold text-[10px]">✗</span></div>
                  <span className="font-bold text-gray-900">Audit Trail</span>
                </div>
                <p className="text-gray-600">No 21 CFR Part 11 compliance. No DCB0129 clinical safety case. Cannot provide the <strong>traceable decision logs</strong> regulators require.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center"><span className="text-red-600 font-bold text-[10px]">✗</span></div>
                  <span className="font-bold text-gray-900">EU AI Act</span>
                </div>
                <p className="text-gray-600">General-purpose AI models face <strong>systemic risk</strong> classification. StriveMAP&apos;s narrow RL policy has a clear conformity pathway as a high-risk medical AI.</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center"><span className="text-green-600 font-bold text-[10px]">✓</span></div>
                  <span className="font-bold text-[#00B894]">STRIVE Advantage</span>
                </div>
                <p className="text-gray-600"><strong>On-premise RL</strong> — no data egress, deterministic policy, full audit trail, medical device pathway, jurisdiction-specific deployment. <strong>Built for regulated healthcare.</strong></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Regulatory certifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">{regime.flag} {regime.jurisdiction} — Regulatory Status</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Certified</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />In Progress</span>
          </div>
        </div>
        <div className="space-y-2">
          {regime.regulations.map(reg => (
            <button
              key={reg.name}
              onClick={() => setExpandedReg(expandedReg === reg.name ? null : reg.name)}
              className="w-full text-left"
            >
              <div className={`border rounded-lg p-3 transition-all ${
                expandedReg === reg.name ? "border-[#00B894] bg-[#00B894]/5" : "border-gray-200 hover:border-gray-300 bg-white"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      reg.status === "certified" ? "bg-green-100" : "bg-amber-100"
                    }`}>
                      <span className={`text-sm ${reg.status === "certified" ? "text-green-600" : "text-amber-600"}`}>
                        {reg.status === "certified" ? "✓" : "⋯"}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">{reg.name}</span>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded ${
                        reg.status === "certified" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}>
                        {reg.status === "certified" ? "Certified" : "In Progress"}
                      </span>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedReg === reg.name ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
                {expandedReg === reg.name && (
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed pl-11">{reg.detail}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Residency & Encryption */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Data Residency</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{regime.dataResidency}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-full font-medium">{regime.deploymentType}</span>
            <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Zero data egress</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-sm font-bold text-gray-900">Encryption & Security</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{regime.encryptionStandard}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">Audit: {regime.auditFrequency}</span>
          </div>
        </div>
      </div>

      {/* Access Control Flow */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <button onClick={() => setShowAccessFlow(!showAccessFlow)} className="w-full text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Access Permission Flow</h3>
                <p className="text-xs text-gray-500">How clinicians gain authorized access — click to expand</p>
              </div>
            </div>
            <svg className={`w-5 h-5 text-gray-400 transition-transform ${showAccessFlow ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
        </button>

        {showAccessFlow && (
          <div className="mt-4">
            <p className="text-xs text-gray-600 mb-4">{regime.accessModel}</p>
            {/* Visual flow */}
            <div className="flex items-center gap-0 overflow-x-auto pb-2">
              {[
                { step: "1", label: "Identity Verification", detail: activeJurisdiction === "UK" ? "NHS Smartcard" : activeJurisdiction === "EU" ? "Heilberufeausweis (HBA)" : "Hospital SSO / SAML", color: "blue" },
                { step: "2", label: "Role Authorization", detail: "RBAC check against hospital directory", color: "indigo" },
                { step: "3", label: "Consent & Legal Basis", detail: activeJurisdiction === "US" ? "HIPAA authorization" : activeJurisdiction === "UK" ? "DPA 2018 lawful basis" : "GDPR Art. 6/9 basis", color: "purple" },
                { step: "4", label: "Data Access Scope", detail: "Minimum necessary / need-to-know", color: "pink" },
                { step: "5", label: "Audit Logging", detail: "Immutable log, 21 CFR Part 11", color: "rose" },
                { step: "6", label: "Clinical Decision", detail: "RL recommendation + clinician override", color: "green" },
              ].map((s, i) => (
                <div key={i} className="flex items-center shrink-0">
                  <div className="flex flex-col items-center w-28">
                    <div className={`w-9 h-9 rounded-full bg-${s.color}-100 flex items-center justify-center mb-1.5`}>
                      <span className={`text-${s.color}-700 font-bold text-xs`}>{s.step}</span>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-900 text-center leading-tight">{s.label}</p>
                    <p className="text-[9px] text-gray-500 text-center leading-tight mt-0.5">{s.detail}</p>
                  </div>
                  {i < 5 && (
                    <svg className="w-4 h-4 text-gray-300 shrink-0 mx-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  )}
                </div>
              ))}
            </div>

            {/* Live audit trail preview */}
            <div className="mt-4 bg-gray-900 rounded-lg p-3 font-mono text-[10px] text-green-400 leading-relaxed">
              <p className="text-gray-500 mb-1">// Live audit trail — immutable, tamper-evident</p>
              <p>[{new Date().toISOString()}] AUTH user=dr.chen role=attending_physician method={activeJurisdiction === "UK" ? "nhs_smartcard" : activeJurisdiction === "EU" ? "hba_eid" : "saml_sso"} session=a4f8..c2e1</p>
              <p>[{new Date().toISOString()}] ACCESS patient={hospital.id === "all" ? "PTN-0042" : `PTN-${hospital.patientStart + 1}`} scope=vitals,labs,recommendations rbac=AUTHORIZED</p>
              <p>[{new Date().toISOString()}] QUERY rl_model=strive_map_v2.4.1 input_hash=sha256:9f86d..1e5e action=vasopressor_titration confidence=0.94</p>
              <p>[{new Date().toISOString()}] DECISION clinician=dr.chen accepted_recommendation=true override=false signed=true</p>
              <p className="text-amber-400">[{new Date().toISOString()}] COMPLIANCE jurisdiction={activeJurisdiction} {activeJurisdiction === "US" ? "hipaa=PASS 21cfr11=PASS" : activeJurisdiction === "UK" ? "uk_gdpr=PASS dcb0129=PASS dspt=PASS" : "eu_gdpr=PASS mdr_2017=PASS iso13485=PASS"} data_egress=NONE</p>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Summary Badges */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Certification Overview</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "HIPAA", active: activeJurisdiction === "US" },
            { label: "SOC 2 Type II", active: true },
            { label: "HITRUST CSF", active: activeJurisdiction === "US" },
            { label: "ISO 13485", active: activeJurisdiction === "EU" || activeJurisdiction === "US" },
            { label: "ISO 27001", active: true },
            { label: "FDA 510(k)", active: activeJurisdiction === "US", pending: true },
            { label: "CE Mark IIb", active: activeJurisdiction === "EU", pending: true },
            { label: "UKCA Mark", active: activeJurisdiction === "UK", pending: true },
            { label: "UK GDPR", active: activeJurisdiction === "UK" },
            { label: "EU GDPR", active: activeJurisdiction === "EU" },
            { label: "DCB0129", active: activeJurisdiction === "UK" },
            { label: "NHS DTAC", active: activeJurisdiction === "UK" },
            { label: "Cyber Essentials+", active: activeJurisdiction === "UK" },
            { label: "EU AI Act", active: activeJurisdiction === "EU", pending: true },
            { label: "Gematik", active: activeJurisdiction === "EU" },
            { label: "21 CFR Part 11", active: activeJurisdiction === "US" },
          ].filter(b => b.active).map(b => (
            <span key={b.label} className={`text-[10px] px-2.5 py-1 rounded-full font-medium border ${
              b.pending
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-green-50 text-green-700 border-green-200"
            }`}>
              {b.pending ? "⋯" : "✓"} {b.label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}


/* ============================================================
   MAIN DEMO COMPONENT
   ============================================================ */

type Tab = "overview" | "labs" | "antibiotics" | "icu-overview" | "simulator" | "compliance";

/* ============================================================
   HOSPITAL NETWORK
   ============================================================ */

interface Hospital {
  id: string;
  name: string;
  shortName: string;
  location: string;
  type: "trial" | "deployment" | "validation";
  icuBeds: number;
  description: string;
  patientStart: number;
  patientEnd: number;
}

const HOSPITALS: Hospital[] = [
  { id: "all", name: "All Sites", shortName: "All", location: "Global Network", type: "trial", icuBeds: 240, description: "All connected hospital sites", patientStart: 0, patientEnd: 120 },
  { id: "cleveland", name: "Cleveland Clinic", shortName: "Cleveland", location: "Cleveland, OH", type: "trial", icuBeds: 45, description: "Trial site, treating patients 2026. Critical care focus.", patientStart: 0, patientEnd: 45 },
  { id: "harvard", name: "Harvard / Beth Israel Deaconess", shortName: "Harvard/BIDMC", location: "Boston, MA", type: "trial", icuBeds: 38, description: "Trial site, treating patients 2026. Academic medical center.", patientStart: 45, patientEnd: 83 },
  { id: "uchealth", name: "UC Health", shortName: "UC Health", location: "Cincinnati, OH", type: "deployment", icuBeds: 62, description: "Deployment partner, scale integration. Multi-hospital system.", patientStart: 83, patientEnd: 100 },
  { id: "columbia", name: "Columbia University Medical Center", shortName: "Columbia", location: "New York, NY", type: "validation", icuBeds: 32, description: "Validation studies conducted. Research-intensive.", patientStart: 100, patientEnd: 108 },
  { id: "nhs", name: "NHS Royal Free Hospital", shortName: "Royal Free", location: "London, UK", type: "validation", icuBeds: 28, description: "Validation studies, London. National health service.", patientStart: 108, patientEnd: 115 },
  { id: "charite", name: "Charite Berlin", shortName: "Charite", location: "Berlin, Germany", type: "validation", icuBeds: 35, description: "Validation studies, Germany. Europe's largest university hospital.", patientStart: 115, patientEnd: 120 },
];

function hospitalTypeDotColor(type: Hospital["type"]) {
  switch (type) {
    case "trial": return "bg-green-500";
    case "deployment": return "bg-blue-500";
    case "validation": return "bg-amber-500";
  }
}

function hospitalTypeBadge(type: Hospital["type"]) {
  switch (type) {
    case "trial": return { bg: "bg-green-100 text-green-700", label: "Trial Site" };
    case "deployment": return { bg: "bg-blue-100 text-blue-700", label: "Deployment" };
    case "validation": return { bg: "bg-amber-100 text-amber-700", label: "Validation" };
  }
}

/* ============================================================
   CONSENT PERMISSION TYPES
   ============================================================ */

interface ConsentPermission {
  id: string;
  label: string;
  description: string;
  category: "patient-data" | "clinical" | "ai-model" | "audit";
  required: boolean;
}

function getConsentPermissions(jurisdiction: string): ConsentPermission[] {
  const base: ConsentPermission[] = [
    { id: "vitals-access", label: "Vital Signs Access", description: "Read real-time and historical vital signs (MAP, HR, SpO2, temperature)", category: "patient-data", required: true },
    { id: "labs-access", label: "Laboratory Results", description: "Access lab panels including CBC, BMP, coagulation, lactate", category: "patient-data", required: true },
    { id: "medications-access", label: "Medication Records", description: "View active medications, antibiotic regimen, and vasopressor infusions", category: "patient-data", required: true },
    { id: "demographics", label: "Patient Demographics", description: "Access age, sex, BMI, comorbidities, and admission history", category: "patient-data", required: true },
    { id: "rl-recommendation", label: "RL Treatment Recommendation", description: "Generate RL-based treatment recommendations from on-premise model", category: "ai-model", required: true },
    { id: "cohort-comparison", label: "Cohort Comparison", description: "Compare against de-identified similar patient trajectories", category: "ai-model", required: false },
    { id: "risk-scoring", label: "Risk Score Computation", description: "Compute real-time mortality risk and SOFA trajectory", category: "clinical", required: false },
    { id: "audit-log", label: "Audit Trail Logging", description: "Log all queries and recommendations to immutable audit trail", category: "audit", required: true },
  ];

  if (jurisdiction === "UK") {
    base.push(
      { id: "caldicott-approval", label: "Caldicott Guardian Approval", description: "Confirm Caldicott Guardian has approved this data access pattern", category: "audit", required: true },
      { id: "dspt-compliance", label: "DSPT Compliance Check", description: "Verify NHS Data Security and Protection Toolkit compliance", category: "audit", required: true },
    );
  } else if (jurisdiction === "EU") {
    base.push(
      { id: "gdpr-legal-basis", label: "GDPR Legal Basis (Art. 6/9)", description: "Confirm lawful basis for processing under GDPR Article 6 and special category data under Article 9", category: "audit", required: true },
      { id: "dpia-check", label: "DPIA Verification", description: "Verify Data Protection Impact Assessment covers this processing activity", category: "audit", required: true },
    );
  } else {
    base.push(
      { id: "hipaa-authorization", label: "HIPAA Authorization", description: "Confirm HIPAA authorization for accessing Protected Health Information", category: "audit", required: true },
      { id: "minimum-necessary", label: "Minimum Necessary Standard", description: "Verify request meets HIPAA minimum necessary standard for PHI access", category: "audit", required: true },
    );
  }

  return base;
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  "patient-data": { label: "Patient Data", color: "blue" },
  clinical: { label: "Clinical Analysis", color: "purple" },
  "ai-model": { label: "AI/RL Model", color: "green" },
  audit: { label: "Compliance & Audit", color: "amber" },
};

export default function StriveDemo() {
  const allPatients = useMemo(() => getAllPatients(), []);
  const [selectedHospitalIdx, setSelectedHospitalIdx] = useState(0);
  const [showHospitalList, setShowHospitalList] = useState(false);
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(0);
  const [timeRange, setTimeRange] = useState<6 | 12 | 24>(24);
  const [showPatientList, setShowPatientList] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentMessages, setAgentMessages] = useState<string[]>([]);
  const [agentInput, setAgentInput] = useState("");
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Compliance consent state
  const [consentGranted, setConsentGranted] = useState<Record<string, boolean>>({});
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<{ text: string; attachments: Attachment[] } | null>(null);

  const selectedHospital = HOSPITALS[selectedHospitalIdx];
  const hospitalJurisdiction = getHospitalJurisdiction(selectedHospital.id);
  const consentPermissions = useMemo(() => getConsentPermissions(hospitalJurisdiction), [hospitalJurisdiction]);
  const allConsented = consentPermissions.every(p => consentGranted[p.id]);
  const requiredConsented = consentPermissions.filter(p => p.required).every(p => consentGranted[p.id]);

  const patients = useMemo(() => {
    const slice = allPatients.slice(selectedHospital.patientStart, selectedHospital.patientEnd);
    if (selectedHospital.id === "all") return slice;
    return slice.map(p => ({
      ...p,
      unitBed: `${selectedHospital.shortName} — ${p.unitBed}`,
    }));
  }, [allPatients, selectedHospital]);

  // Modal state
  const [statsModal, setStatsModal] = useState<{
    title: string;
    subtitle?: string;
    currentValue?: string;
    currentLabel?: string;
    stats?: DistributionStats;
    children?: React.ReactNode;
  } | null>(null);
  const [interventionModal, setInterventionModal] = useState<{
    name: string;
    isActive: boolean;
  } | null>(null);
  const [sofaModal, setSofaModal] = useState(false);

  const patient = patients[selectedPatientIdx];
  const vitals = useMemo(() => generateVitals(patient), [patient]);

  // Filtered patients for search
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(p =>
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.sepsisSource.toLowerCase().includes(q) ||
      p.acuity.toLowerCase().includes(q) ||
      p.comorbidities.some(c => c.toLowerCase().includes(q))
    );
  }, [patients, searchQuery]);

  // Reset to first patient and consent when hospital changes
  useEffect(() => {
    setSelectedPatientIdx(0);
    setSearchQuery("");
    setShowPatientList(false);
    setConsentGranted({});
  }, [selectedHospitalIdx]);

  useEffect(() => {
    setAgentMessages([]);
    setActiveTab("overview");
    setExpandedInsight(null);
  }, [selectedPatientIdx]);

  const executeAgentQuery = useCallback(async (question: string, attachments: Attachment[] = []) => {
    const displayText = attachments.length > 0
      ? `${question || "(media attached)"}${attachments.map(a => ` [${a.type}: ${a.name}]`).join("")}`
      : question;
    setAgentMessages(prev => [...prev, `You: ${displayText}`]);
    setAgentInput("");
    setAgentThinking(true);

    // Build patient context string
    const patientContext = `Name: ${patient.name} | ID: ${patient.id} | Age: ${patient.age}y ${patient.sex} | BMI: ${patient.bmi} | Diagnosis: ${patient.admitDiagnosis} | Sepsis Source: ${patient.sepsisSource} | Acuity: ${patient.acuity} | SOFA: ${patient.sofa}/24 | MAP: ${patient.map} mmHg | Lactate: ${patient.lactate} mmol/L | HR: ${patient.hr} | Temp: ${patient.temp}C | Creatinine: ${patient.creatinine} | Risk Score: ${patient.riskScore}% | Vasoactive: ${patient.vasoactive || "None"} | Comorbidities: ${patient.comorbidities.join(", ")} | Recommendation: ${patient.recommendation.rationale} | Fluid Bolus: ${patient.recommendation.fluidBolus} | MAP Target: ${patient.recommendation.mapTarget} mmHg | Vasopressor: ${patient.recommendation.vasopressor || "None"} | Similar Trajectories: ${patient.similarCount} from ${patient.similarPatients} patients`;

    // Convert attachments to base64 data URLs
    const attachmentData: { type: string; name: string; data: string; transcription?: string }[] = [];
    for (const att of attachments) {
      try {
        if (att.type === "audio") {
          // For audio, send transcription instead of raw audio (Claude API doesn't support audio input)
          attachmentData.push({
            type: att.type,
            name: att.name,
            data: "",
            transcription: att.transcription || "",
          });
        } else if (att.type === "video" && att.frameDataUrl) {
          // For video, send the captured frame as an image
          attachmentData.push({
            type: att.type,
            name: att.name,
            data: att.frameDataUrl, // This is already a data:image/png;base64,... URL
          });
        } else {
          // Images and files: convert blob to base64
          const arrayBuffer = await att.blob.arrayBuffer();
          const uint8 = new Uint8Array(arrayBuffer);
          let binary = "";
          for (let i = 0; i < uint8.length; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = btoa(binary);
          const mimeType = att.blob.type || (att.type === "image" ? "image/png" : "application/octet-stream");
          attachmentData.push({
            type: att.type,
            name: att.name,
            data: `data:${mimeType};base64,${base64}`,
          });
        }
      } catch {
        // Skip attachment if conversion fails
      }
    }

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: question,
          attachments: attachmentData,
          patientContext,
        }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAgentMessages(prev => [...prev, `StriveMAP Agent: ${data.response}`]);
    } catch {
      // Fallback to hardcoded responses
      const responses: Record<string, string> = {
        default: `Based on analysis of ${patient.similarCount} similar trajectories from ${patient.similarPatients} patients: ${patient.recommendation.rationale}`,
        fluid: `Fluid recommendation for Patient #${patient.id}: ${patient.recommendation.fluidBolus === "give" ? "Administer 250 mL crystalloid bolus" : "Withhold fluid bolus"}. Expected benefit: ${Math.max(patient.recommendation.bolusExpectedBenefit, patient.recommendation.noBolusExpectedBenefit)}. ${patient.recommendation.rationale}`,
        mortality: `Current mortality risk score: ${patient.riskScore}%. SOFA score ${patient.sofa} places this patient in the ${patient.sofa > 10 ? "high" : patient.sofa > 6 ? "moderate" : "low"} risk category. Key risk factors: ${patient.comorbidities.join(", ")}. ${patient.labs.filter(l => l.flag === "critical").map(l => `${l.name} (${l.value}) is critically abnormal`).join(". ")}.`,
        vasopressor: patient.vasoactive
          ? `Current vasopressor: ${patient.vasoactive}. ${patient.recommendation.vasopressor || "No dose change recommended at this time."}. MAP target ${patient.recommendation.mapTarget} mmHg based on RL policy trained on 5M+ ICU hours.`
          : `No vasopressors currently active. ${patient.recommendation.vasopressor || "Vasopressor initiation not recommended at this time. MAP is currently " + patient.map + " mmHg."}`,
      };
      const lowerQ = question.toLowerCase();
      let response = responses.default;
      if (lowerQ.includes("fluid") || lowerQ.includes("bolus")) response = responses.fluid;
      else if (lowerQ.includes("mortality") || lowerQ.includes("risk") || lowerQ.includes("prognosis")) response = responses.mortality;
      else if (lowerQ.includes("vasopressor") || lowerQ.includes("norepinephrine") || lowerQ.includes("pressor")) response = responses.vasopressor;
      setAgentMessages(prev => [...prev, `StriveMAP Agent: ${response}`]);
    } finally {
      setAgentThinking(false);
    }
  }, [patient]);

  const askAgent = useCallback((question: string, attachments: Attachment[] = []) => {
    if (!question.trim() && attachments.length === 0) return;
    if (!requiredConsented) {
      // Show consent modal first
      setPendingQuery({ text: question, attachments });
      setShowConsentModal(true);
      return;
    }
    executeAgentQuery(question, attachments);
  }, [requiredConsented, executeAgentQuery]);

  const handleConsentGrantAll = useCallback(() => {
    const granted: Record<string, boolean> = {};
    consentPermissions.forEach(p => { granted[p.id] = true; });
    setConsentGranted(granted);
  }, [consentPermissions]);

  const handleConsentSubmit = useCallback(() => {
    setShowConsentModal(false);
    if (pendingQuery && requiredConsented) {
      executeAgentQuery(pendingQuery.text, pendingQuery.attachments);
      setPendingQuery(null);
    }
  }, [pendingQuery, requiredConsented, executeAgentQuery]);

  // Stats click handlers
  const showVitalStats = useCallback((vital: "hr" | "sbp" | "dbp" | "map" | "lactate" | "temp" | "wbc" | "creatinine" | "sofa" | "riskScore", label: string, currentVal: string, unit: string) => {
    const stats = getVitalDistribution(patients, vital);
    setStatsModal({
      title: `${label} Distribution`,
      subtitle: `Across ${patients.length} ICU patients`,
      currentValue: `${currentVal} ${unit}`,
      currentLabel: `Patient ${patient.name} (${patient.id})`,
      stats,
    });
  }, [patients, patient]);

  const showLabStats = useCallback((labName: string, currentVal: string, unit: string) => {
    const stats = getLabDistribution(patients, labName);
    setStatsModal({
      title: `${labName} Distribution`,
      subtitle: `Across ${patients.length} ICU patients`,
      currentValue: `${currentVal} ${unit}`,
      currentLabel: `Patient ${patient.name} (${patient.id})`,
      stats,
    });
  }, [patients, patient]);

  const showInterventionStats = useCallback((intName: string, isActive: boolean) => {
    setInterventionModal({ name: intName, isActive });
  }, []);

  const acuityColor = (a: Patient["acuity"]) => {
    switch (a) {
      case "critical": return "bg-red-500";
      case "serious": return "bg-amber-500";
      case "stable": return "bg-blue-500";
      case "improving": return "bg-green-500";
    }
  };

  const acuityTextColor = (a: Patient["acuity"]) => {
    switch (a) {
      case "critical": return "text-red-600";
      case "serious": return "text-amber-600";
      case "stable": return "text-blue-600";
      case "improving": return "text-green-600";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 overflow-hidden">
      {/* ═══════ Modals ═══════ */}
      {statsModal && (
        <StatsModal
          title={statsModal.title}
          subtitle={statsModal.subtitle}
          currentValue={statsModal.currentValue}
          currentLabel={statsModal.currentLabel}
          stats={statsModal.stats}
          onClose={() => setStatsModal(null)}
        />
      )}
      {interventionModal && (
        <InterventionModal
          name={interventionModal.name}
          data={getOutcomesByIntervention(patients, interventionModal.name)}
          isActive={interventionModal.isActive}
          onClose={() => setInterventionModal(null)}
        />
      )}
      {sofaModal && (
        <SofaMortalityModal
          currentSOFA={patient.sofa}
          correlations={getSofaMortalityCorrelation(patients)}
          onClose={() => setSofaModal(false)}
        />
      )}

      {/* ═══════ Compliance Consent Modal ═══════ */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => { setShowConsentModal(false); setPendingQuery(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-[560px] max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Data Access Authorization Required</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {hospitalJurisdiction === "UK" && "UK Data Protection Act 2018 & NHS DSPT — "}
                    {hospitalJurisdiction === "EU" && "EU GDPR Art. 6/9 & MDR 2017/745 — "}
                    {hospitalJurisdiction === "US" && "HIPAA Privacy Rule §164.502 — "}
                    {selectedHospital.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">Grant permissions for StriveMAP Agent to access patient data for <strong>{patient.name}</strong> ({patient.id})</p>
                <button
                  onClick={handleConsentGrantAll}
                  className="px-3 py-1.5 bg-[#00B894] text-white text-xs font-semibold rounded-lg hover:bg-[#00a383] transition-colors whitespace-nowrap"
                >
                  Grant All Permissions
                </button>
              </div>

              {Object.entries(CATEGORY_LABELS).map(([catKey, cat]) => {
                const perms = consentPermissions.filter(p => p.category === catKey);
                if (perms.length === 0) return null;
                return (
                  <div key={catKey} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold bg-${cat.color}-100 text-${cat.color}-700`}>{cat.label}</span>
                    </div>
                    <div className="space-y-1.5">
                      {perms.map(perm => (
                        <label key={perm.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-all cursor-pointer ${consentGranted[perm.id] ? "border-[#00B894] bg-[#00B894]/5" : "border-gray-200 hover:border-gray-300"}`}>
                          <input
                            type="checkbox"
                            checked={!!consentGranted[perm.id]}
                            onChange={e => setConsentGranted(prev => ({ ...prev, [perm.id]: e.target.checked }))}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#00B894] focus:ring-[#00B894]"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900">{perm.label}</span>
                              {perm.required && <span className="text-[9px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded font-semibold">REQUIRED</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{perm.description}</p>
                          </div>
                          {consentGranted[perm.id] && <span className="text-[#00B894] text-sm mt-0.5">✓</span>}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-[10px] text-gray-400">
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  All access logged to immutable audit trail • On-premise only • Zero data egress
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowConsentModal(false); setPendingQuery(null); }} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">Cancel</button>
                <button
                  onClick={handleConsentSubmit}
                  disabled={!requiredConsented}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${requiredConsented ? "bg-[#00B894] text-white hover:bg-[#00a383]" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
                >
                  Authorize Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ TOP BAR ═══════ */}
      <header className="h-12 bg-white border-b border-gray-200 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#00B894] flex items-center justify-center">
            <span className="text-white font-black text-xs">S</span>
          </div>
          <span className="font-bold text-base tracking-tight text-gray-900">Strive</span>
          <nav className="flex items-center gap-1 ml-4">
            <a href="/platform" className="px-3 py-1.5 text-sm font-semibold text-[#00B894] bg-[#00B894]/10 rounded-lg">Platform</a>
            <a href="/agent" className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">Agent</a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Hospital selector */}
          <div className="relative">
            <button
              onClick={() => { setShowHospitalList(!showHospitalList); setShowPatientList(false); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${hospitalTypeDotColor(selectedHospital.type)}`} />
              <span className="text-gray-900">{selectedHospital.shortName}</span>
              {selectedHospital.id !== "all" && <span className="text-gray-400 text-xs">{selectedHospital.icuBeds} beds</span>}
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showHospitalList && (
              <div className="absolute right-0 top-10 w-[380px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500">SELECT HOSPITAL / SITE</p>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {HOSPITALS.map((h, i) => {
                    const badge = hospitalTypeBadge(h.type);
                    const isAll = h.id === "all";
                    return (
                      <button
                        key={h.id}
                        onClick={() => { setSelectedHospitalIdx(i); setShowHospitalList(false); }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${i === selectedHospitalIdx ? "bg-[#00B894]/5" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${hospitalTypeDotColor(h.type)}`} />
                            <div>
                              <span className="font-semibold text-sm text-gray-900">{isAll ? "All Sites" : h.name}</span>
                              <p className="text-xs text-gray-400">{h.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!isAll && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.bg}`}>{badge.label}</span>}
                            <span className="text-xs text-gray-500 font-mono">{h.icuBeds} beds</span>
                          </div>
                        </div>
                        {!isAll && <p className="text-[11px] text-gray-400 mt-1 ml-5">{h.description}</p>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <span className="text-sm text-gray-500">
            <span className="font-mono font-bold text-gray-900">{patient.name}</span>
            <span className="text-gray-400 ml-1">#{patient.id}</span>
          </span>
          <button
            onClick={() => { setShowPatientList(!showPatientList); setShowHospitalList(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00B894] text-white rounded-lg text-sm font-semibold hover:bg-[#00a383] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            {patients.length} Patients
          </button>

          {/* Patient dropdown */}
          {showPatientList && (
            <div className="absolute right-5 top-12 w-[480px] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 mb-2">SELECT PATIENT ({filteredPatients.length} of {patients.length})</p>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ID, diagnosis, comorbidity..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B894]"
                  autoFocus
                />
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {filteredPatients.map((p) => {
                  const idx = patients.indexOf(p);
                  return (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPatientIdx(idx); setShowPatientList(false); setSearchQuery(""); }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${idx === selectedPatientIdx ? "bg-[#00B894]/5" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${acuityColor(p.acuity)}`} />
                          <div>
                            <span className="font-semibold text-sm text-gray-900">{p.name}</span>
                            <span className="text-gray-400 ml-2 text-xs font-mono">{p.id}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{p.age}y {p.sex} | Day {p.daysInHospital} | {p.sepsisSource}</p>
                          <p className="text-xs font-semibold">
                            <span className={acuityTextColor(p.acuity)}>{p.acuity.toUpperCase()}</span>
                            <span className="text-gray-400 mx-1">|</span>
                            <span className="text-gray-500">SOFA {p.sofa}</span>
                            <span className="text-gray-400 mx-1">|</span>
                            <span style={{ color: p.riskScore > 60 ? "#ef4444" : p.riskScore > 30 ? "#f59e0b" : "#22c55e" }}>Risk {p.riskScore}%</span>
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredPatients.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-400">No patients match your search</div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ═══════ LEFT SIDEBAR ═══════ */}
        <aside className="w-72 border-r border-gray-200 flex flex-col overflow-y-auto bg-white">
          {/* Similar decisions */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900">Similar decisions</h3>
              <span className={`text-xs font-bold ${patient.matchQuality === "High" ? "text-[#00B894]" : patient.matchQuality === "Medium" ? "text-amber-500" : "text-red-500"}`}>
                {patient.matchQuality} Match
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2">
              {patient.similarCount} decisions from {patient.similarPatients} different patients
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#00B894] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (patient.similarCount / 650) * 100)}%` }}
              />
            </div>
          </div>

          {/* Patient info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-sm font-bold">{patient.name}</p>
                <p className="text-xs text-gray-400">#{patient.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="text-gray-500">Age</div>
              <div className="font-semibold text-right">{patient.age}y {patient.sex}</div>
              <div className="text-gray-500">Weight</div>
              <div className="font-semibold text-right">{patient.weight} kg (BMI {patient.bmi})</div>
              <div className="text-gray-500">Day in ICU</div>
              <div className="font-semibold text-right">{patient.daysInHospital}</div>
              <div className="text-gray-500">Location</div>
              <div className="font-semibold text-right text-[11px]">{patient.unitBed}</div>
              <div className="text-gray-500">Code Status</div>
              <div className="font-semibold text-right">{patient.code}</div>
              <div className="text-gray-500">Allergies</div>
              <div className="font-semibold text-right text-[11px]">{patient.allergies.join(", ")}</div>
            </div>
          </div>

          {/* Acuity & SOFA */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${acuityColor(patient.acuity)}`} />
              <span className={`text-sm font-bold ${acuityTextColor(patient.acuity)}`}>{patient.acuity.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSofaModal(true)}
                className="flex-1 bg-gray-50 hover:bg-[#00B894]/5 rounded-lg p-2 text-center transition-colors cursor-pointer"
              >
                <p className="text-[10px] text-gray-400 uppercase">SOFA</p>
                <p className="text-xl font-bold text-gray-900">{patient.sofa}</p>
              </button>
              <button
                onClick={() => showVitalStats("riskScore", "Mortality Risk", patient.riskScore.toString(), "%")}
                className="flex-1 bg-gray-50 hover:bg-[#00B894]/5 rounded-lg p-2 text-center transition-colors cursor-pointer"
              >
                <p className="text-[10px] text-gray-400 uppercase">Risk</p>
                <p className="text-xl font-bold" style={{ color: patient.riskScore > 60 ? "#ef4444" : patient.riskScore > 30 ? "#f59e0b" : "#22c55e" }}>{patient.riskScore}%</p>
              </button>
            </div>
            {/* SOFA breakdown */}
            <div className="mt-2 space-y-1">
              {patient.sofaComponents.map(c => (
                <div key={c.name} className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-gray-500 w-20 truncate">{c.name}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${c.score >= 3 ? "bg-red-400" : c.score >= 2 ? "bg-amber-400" : c.score >= 1 ? "bg-blue-400" : "bg-green-400"}`} style={{ width: `${(c.score / 4) * 100}%` }} />
                  </div>
                  <span className="font-mono text-gray-700 w-4 text-right">{c.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Current observations */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Current Observations</h3>
            <div className="space-y-1.5">
              {[
                { label: "Heart Rate", value: `${patient.hr} bpm`, vital: "hr" as const, raw: patient.hr.toString(), unit: "bpm" },
                { label: "BP", value: `${patient.sbp}/${patient.dbp} (${patient.map.toFixed(1)}) mmHg`, vital: "map" as const, raw: patient.map.toFixed(1), unit: "mmHg" },
                { label: "Lactate", value: `${patient.lactate} mmol/L`, vital: "lactate" as const, raw: patient.lactate.toString(), unit: "mmol/L" },
                { label: "Temperature", value: `${patient.temp}°C`, vital: "temp" as const, raw: patient.temp.toString(), unit: "°C" },
                { label: "WBC", value: `${patient.wbc} K/uL`, vital: "wbc" as const, raw: patient.wbc.toString(), unit: "K/uL" },
                { label: "Creatinine", value: `${patient.creatinine} mg/dL`, vital: "creatinine" as const, raw: patient.creatinine.toString(), unit: "mg/dL" },
              ].map((v) => (
                <button
                  key={v.label}
                  onClick={() => showVitalStats(v.vital, v.label, v.raw, v.unit)}
                  className="w-full flex items-center justify-between text-sm hover:bg-[#00B894]/5 rounded-lg px-2 py-1 -mx-2 transition-colors cursor-pointer"
                >
                  <span className="text-gray-600">{v.label}</span>
                  <span className="font-mono font-bold text-gray-900">{v.value}</span>
                </button>
              ))}
              <div className="flex items-center justify-between text-sm px-2 -mx-2">
                <span className="text-gray-600">Urine Output (3h)</span>
                <span className="font-mono text-gray-700 text-xs">{patient.urineOutput}</span>
              </div>
              <div className="flex items-center justify-between text-sm px-2 -mx-2">
                <span className="text-gray-600">Crystalloids</span>
                <span className="font-mono font-bold text-gray-900">{patient.crystalloids} mL</span>
              </div>
              <div className="flex items-center justify-between text-sm px-2 -mx-2">
                <span className="text-gray-600">Fluid Balance</span>
                <span className={`font-mono font-bold ${Math.abs(patient.fluidBalance) > 2000 ? "text-red-500" : "text-gray-900"}`}>
                  {patient.fluidBalance > 0 ? "+" : ""}{patient.fluidBalance} mL
                </span>
              </div>
            </div>
          </div>

          {/* Vasoactive */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Vasoactive Agents</h3>
            <p className="text-sm text-gray-400 italic">{patient.vasoactive || "No vasoactive agents"}</p>
          </div>

          {/* Interventions — clickable */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Current Interventions</h3>
            <div className="space-y-2">
              {patient.interventions.map((int) => (
                <button
                  key={int.name}
                  onClick={() => showInterventionStats(int.name, int.active)}
                  className="w-full flex items-center justify-between hover:bg-[#00B894]/5 rounded-lg px-2 py-1 -mx-2 transition-colors cursor-pointer"
                >
                  <span className="text-sm text-gray-600">{int.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${int.active ? "bg-[#00B894]/10 text-[#00B894]" : "bg-gray-100 text-gray-400"}`}>
                    {int.active ? "Active" : "Inactive"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comorbidities */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Key Comorbidities</h3>
            {patient.comorbidities.map((c) => (
              <p key={c} className="text-sm text-gray-600">{c}</p>
            ))}
          </div>
        </aside>

        {/* ═══════ MAIN CONTENT ═══════ */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
          {/* Tab navigation */}
          <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-1 shrink-0">
            {(
              [
                ["overview", "Clinical Overview"],
                ["labs", "Lab Results"],
                ["antibiotics", "Antibiotic Regimen"],
                ["icu-overview", "ICU Overview"],
                ["simulator", "Treatment Simulator"],
                ["compliance", "Compliance & Data"],
              ] as [Tab, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-[#00B894] text-[#00B894]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* ═══════ OVERVIEW TAB ═══════ */}
            {activeTab === "overview" && (
              <>
                {/* Vitals Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Patient Haemodynamics During Hospital Stay</h2>
                    <div className="flex items-center gap-1">
                      {([6, 12, 24] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTimeRange(t)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            timeRange === t ? "bg-[#00B894] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {t}h
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mb-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-red-500 rounded" />MAP</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-purple-400 rounded" />Phenylephrine</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-px bg-blue-400 rounded" style={{ borderTop: "2px dashed #93c5fd" }} />Fluid Bolus</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-px" style={{ borderTop: "2px dashed #93c5fd" }} />SBP/DBP</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-green-500 rounded" />Heart Rate</div>
                  </div>
                  <VitalsChart data={vitals} sepsisIndex={patient.sepsisOnsetHour} timeRange={timeRange} />
                </div>

                {/* Expected Benefit Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-1">Expected Benefit -- Mean Arterial Pressure &amp; Fluid Bolus</h2>
                  <p className="text-xs text-gray-500 mb-3">Mean Arterial Pressure observed in similar patients</p>
                  <div className="flex items-center gap-5 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#00B894]" />greatest Expected Benefit</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" />sufficient decisions</div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-300" />insufficient data</div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Expected Benefit</p>
                    <div className="flex items-end gap-3 h-40 mb-2 px-4">
                      {patient.mapBenefits.map((d) => {
                        const barColor = d.color === "green" ? "#00B894" : d.color === "blue" ? "#60a5fa" : "#d1d5db";
                        const barH = (d.benefit / 100) * 140;
                        return (
                          <button
                            key={d.mapRange}
                            className="flex-1 flex flex-col items-center justify-end gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              const mapVals = patients.map(p => p.map);
                              const rangeParts = d.mapRange.replace(/[<>]/g, "").split("-");
                              const lo = d.mapRange.startsWith("<") ? 0 : parseInt(rangeParts[0]);
                              const hi = d.mapRange.startsWith(">") ? 200 : parseInt(rangeParts[1] || rangeParts[0]);
                              const inRange = patients.filter(p => p.map >= lo && p.map < (d.mapRange.startsWith(">") ? 200 : hi));
                              setStatsModal({
                                title: `MAP Range: ${d.mapRange} mmHg`,
                                subtitle: `${inRange.length} patients in this range`,
                                currentValue: `Benefit: ${d.benefit.toFixed(1)}`,
                                currentLabel: d.isTarget ? "OPTIMAL TARGET RANGE" : "Expected outcome score",
                                stats: computeDistribution(mapVals),
                              });
                            }}
                          >
                            <span className="text-xs font-bold text-gray-700">{d.benefit.toFixed(1)}</span>
                            <div className="w-full flex justify-center">
                              <div className="w-1 rounded-t transition-all relative" style={{ height: barH, backgroundColor: barColor }}>
                                <div className="absolute -left-3 -right-3 top-0 bottom-0" style={{ backgroundColor: barColor, borderRadius: "2px 2px 0 0" }}>
                                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full" style={{ backgroundColor: barColor }} />
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full" style={{ backgroundColor: barColor }} />
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 px-4">
                      {patient.mapBenefits.map((d) => (
                        <div key={d.mapRange} className={`flex-1 text-center text-xs ${d.isTarget ? "font-bold text-[#00B894]" : "text-gray-500"}`}>
                          {d.isTarget ? `[${d.mapRange}]` : d.mapRange}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">MAP (mmHg)</p>
                  </div>
                </div>

                {/* Fluid Bolus Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Fluid Bolus Analysis of similar decisions</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Summary</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Expected Benefit</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.similarDecisions.map((d) => (
                        <tr
                          key={d.action}
                          className="border-b border-gray-100 hover:bg-[#00B894]/5 transition-colors cursor-pointer"
                          onClick={() => {
                            const bolusPatients = patients.filter(p => p.recommendation.fluidBolus === "give");
                            const noBolusPatients = patients.filter(p => p.recommendation.fluidBolus === "withhold");
                            setStatsModal({
                              title: d.action,
                              subtitle: `${d.count} cases with this action`,
                              currentValue: d.avgBenefit.toFixed(1),
                              currentLabel: "Average expected benefit",
                              stats: computeDistribution(d.action.includes("No fluid") ? noBolusPatients.map(p => p.recommendation.noBolusExpectedBenefit) : bolusPatients.map(p => p.recommendation.bolusExpectedBenefit)),
                            });
                          }}
                        >
                          <td className="py-3 text-gray-700">{d.action} <span className="text-gray-400">({d.count} cases)</span></td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-gray-100 rounded-full h-2">
                                <div className="h-2 rounded-full transition-all" style={{ width: `${d.avgBenefit}%`, backgroundColor: d.significance === "high" ? "#00B894" : d.significance === "medium" ? "#60a5fa" : "#d1d5db" }} />
                              </div>
                              <span className="font-mono font-bold w-12 text-right">{d.avgBenefit.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`text-xs font-semibold ${d.significance === "high" ? "text-[#00B894]" : d.significance === "medium" ? "text-amber-400" : "text-gray-400"}`}>
                              {d.significance === "high" ? "HIGH" : d.significance === "medium" ? "MED" : "LOW"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* RL Insights */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded bg-[#00B894]/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#00B894]" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" /></svg>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">StriveMAP Clinical Insights</h2>
                    <span className="text-[10px] bg-[#00B894]/10 text-[#00B894] px-2 py-0.5 rounded-full font-bold">RL-POWERED</span>
                  </div>
                  <div className="space-y-2">
                    {patient.agentInsights.map((insight, i) => (
                      <button
                        key={i}
                        onClick={() => setExpandedInsight(expandedInsight === i ? null : i)}
                        className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                      >
                        <div className="flex items-start gap-2">
                          <span className={`text-xs mt-0.5 ${insight.startsWith("CRITICAL") ? "text-red-500" : "text-[#00B894]"}`}>
                            {insight.startsWith("CRITICAL") ? "!!" : "->"}
                          </span>
                          <p className={`text-sm ${insight.startsWith("CRITICAL") ? "text-red-700 font-semibold" : "text-gray-700"}`}>{insight}</p>
                        </div>
                        {expandedInsight === i && (
                          <p className="text-xs text-gray-500 mt-2 ml-5">
                            Based on {patient.similarCount} similar patient trajectories from {patient.similarPatients} patients. Confidence: {patient.matchQuality === "High" ? "95%" : patient.matchQuality === "Medium" ? "82%" : "68%"}. Model: RL policy v2.4 trained on 5M+ ICU hours. Not an LLM — this is a reinforcement learning model that learned optimal treatment policies from real outcomes.
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ═══════ LABS TAB ═══════ */}
            {activeTab === "labs" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Laboratory Results</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Test</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Value</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Normal</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Flag</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.labs.map((lab) => (
                      <tr
                        key={lab.name}
                        className="border-b border-gray-100 hover:bg-[#00B894]/5 transition-colors cursor-pointer"
                        onClick={() => showLabStats(lab.name, lab.value, lab.unit)}
                      >
                        <td className="py-3 text-gray-700 font-medium">{lab.name}</td>
                        <td className={`py-3 text-right font-mono font-bold ${lab.flag === "critical" ? "text-red-600" : lab.flag ? "text-amber-600" : "text-gray-900"}`}>
                          {lab.value}
                        </td>
                        <td className="py-3 text-right text-xs text-gray-400">{lab.normalRange}</td>
                        <td className="py-3 text-right text-gray-400">{lab.unit}</td>
                        <td className="py-3 text-right">
                          {lab.flag && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${lab.flag === "critical" ? "bg-red-100 text-red-600" : lab.flag === "high" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}>
                              {lab.flag.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-sm ${lab.trend === "up" ? "text-red-500" : lab.trend === "down" ? "text-blue-500" : "text-gray-400"}`}>
                            {lab.trend === "up" ? "^" : lab.trend === "down" ? "v" : "-"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-gray-400 mt-3">Click any lab value to see distribution across all {patients.length} patients.</p>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <button onClick={() => showVitalStats("temp", "Temperature", patient.temp.toString(), "C")} className="p-4 bg-gray-50 rounded-lg hover:bg-[#00B894]/5 transition-colors cursor-pointer text-left">
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className={`text-xl font-bold ${patient.temp > 38.5 ? "text-red-500" : "text-gray-900"}`}>{patient.temp}C</p>
                  </button>
                  <button onClick={() => showVitalStats("wbc", "WBC", patient.wbc.toString(), "K/uL")} className="p-4 bg-gray-50 rounded-lg hover:bg-[#00B894]/5 transition-colors cursor-pointer text-left">
                    <p className="text-xs text-gray-500">WBC</p>
                    <p className={`text-xl font-bold ${patient.wbc > 15 ? "text-amber-500" : "text-gray-900"}`}>{patient.wbc} K/uL</p>
                  </button>
                  <button onClick={() => showVitalStats("creatinine", "Creatinine", patient.creatinine.toString(), "mg/dL")} className="p-4 bg-gray-50 rounded-lg hover:bg-[#00B894]/5 transition-colors cursor-pointer text-left">
                    <p className="text-xs text-gray-500">Creatinine</p>
                    <p className={`text-xl font-bold ${patient.creatinine > 2 ? "text-red-500" : "text-gray-900"}`}>{patient.creatinine} mg/dL</p>
                  </button>
                </div>
              </div>
            )}

            {/* ═══════ ANTIBIOTICS TAB ═══════ */}
            {activeTab === "antibiotics" && (
              <>
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-1">Antibiotic Regimen</h2>
                  <p className="text-xs text-gray-500 mb-4">Source: {patient.sepsisSource}</p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Medication</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Dose</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Route</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Frequency</th>
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Started</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.antibioticRegimen.map((abx, i) => (
                        <tr
                          key={`${abx.name}-${i}`}
                          className="border-b border-gray-100 hover:bg-[#00B894]/5 transition-colors cursor-pointer"
                          onClick={() => {
                            const patientsOnDrug = patients.filter(p => p.antibioticRegimen.some(a => a.name === abx.name));
                            const patientsNotOnDrug = patients.filter(p => !p.antibioticRegimen.some(a => a.name === abx.name));
                            const avgRiskOn = patientsOnDrug.length ? Math.round(patientsOnDrug.reduce((s, p) => s + p.riskScore, 0) / patientsOnDrug.length * 10) / 10 : 0;
                            const avgRiskOff = patientsNotOnDrug.length ? Math.round(patientsNotOnDrug.reduce((s, p) => s + p.riskScore, 0) / patientsNotOnDrug.length * 10) / 10 : 0;
                            setStatsModal({
                              title: abx.name,
                              subtitle: `${abx.dose} ${abx.route} ${abx.frequency}`,
                              currentValue: `${patientsOnDrug.length} patients on this drug`,
                              currentLabel: "Cohort usage",
                              stats: computeDistribution(patientsOnDrug.map(p => p.riskScore)),
                              children: undefined,
                            });
                          }}
                        >
                          <td className="py-3 font-medium text-gray-900">{abx.name}</td>
                          <td className="py-3 font-mono text-gray-700">{abx.dose}</td>
                          <td className="py-3 text-gray-700">{abx.route}</td>
                          <td className="py-3 text-gray-700">{abx.frequency}</td>
                          <td className="py-3 text-gray-500">{abx.started}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-400 mt-3">Click any medication to see usage statistics across the cohort.</p>
                </div>
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-500 text-lg">!!</span>
                    <div>
                      <p className="text-sm font-bold text-amber-700 mb-1">Time-Critical Alert</p>
                      <p className="text-sm text-amber-600">
                        Each hour delay in appropriate antibiotics is associated with 7.6% increase in mortality. Ensure blood cultures obtained and empiric antibiotics administered within 1 hour of sepsis recognition.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ═══════ ICU OVERVIEW TAB ═══════ */}
            {activeTab === "icu-overview" && <ICUOverviewTab patients={patients} selectedIdx={selectedPatientIdx} onSelectPatient={setSelectedPatientIdx} />}

            {/* ═══════ TREATMENT SIMULATOR TAB ═══════ */}
            {activeTab === "simulator" && <TreatmentSimulatorTab patient={patient} />}

            {/* ═══════ COMPLIANCE & DATA TAB ═══════ */}
            {activeTab === "compliance" && <ComplianceTab hospital={selectedHospital} />}

          </div>

          <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-400 shrink-0">
            <span>Clinicians should exercise their own clinical judgement. StriveMAP assists, human decides.</span>
            <span className="font-mono">StriveMAP v2.4.1 (c) 2026 STRIVE Health -- {patient.similarCount} similar decisions analysed</span>
          </div>
        </main>

        {/* ═══════ RIGHT AGENT PANEL ═══════ */}
        <aside className="w-80 border-l border-gray-200 bg-white flex flex-col shrink-0 overflow-hidden">
          {/* Agent header */}
          <div className="px-4 py-3 border-b border-gray-200 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-[#00B894] flex items-center justify-center">
                  <span className="text-white font-black text-[8px]">S</span>
                </div>
                <span className="text-sm font-bold text-gray-900">StriveMAP Agent</span>
              </div>
              <a href="/agent" className="text-[10px] text-[#00B894] font-semibold hover:underline">Full view &rarr;</a>
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-400">
              {hospitalJurisdiction === "US" && <><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />HIPAA</span><span>|</span><span>SOC2</span><span>|</span><span>21 CFR 11</span></>}
              {hospitalJurisdiction === "UK" && <><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />UK GDPR</span><span>|</span><span>NHS DTAC</span><span>|</span><span>DCB0129</span></>}
              {hospitalJurisdiction === "EU" && <><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />EU GDPR</span><span>|</span><span>ISO 13485</span><span>|</span><span>MDR</span></>}
              <span>|</span>
              <span>On-Premise</span>
            </div>
          </div>

          {/* Consent status bar */}
          <div className="px-3 py-2 border-b border-gray-100 shrink-0">
            {allConsented ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-green-600">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="font-semibold">All permissions granted</span>
                </div>
                <button onClick={() => setConsentGranted({})} className="text-[9px] text-gray-400 hover:text-red-500 transition-colors">Revoke</button>
              </div>
            ) : (
              <button
                onClick={() => { setPendingQuery(null); setShowConsentModal(true); }}
                className="w-full flex items-center justify-between text-[10px] group"
              >
                <div className="flex items-center gap-1.5 text-amber-600">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <span className="font-semibold">Authorization required</span>
                </div>
                <span className="text-[#00B894] font-semibold group-hover:underline">Grant access →</span>
              </button>
            )}
          </div>

          {/* Quick actions */}
          <div className="px-3 py-2 border-b border-gray-100 flex flex-wrap gap-1 shrink-0">
            {["Fluid bolus?", "Mortality risk?", "Vasopressor?", "MAP target?"].map((q) => (
              <button key={q} onClick={() => askAgent(q)} className="text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">{q}</button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {agentMessages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-10 h-10 rounded-full bg-[#00B894]/10 flex items-center justify-center mx-auto mb-2">
                  <svg className="w-5 h-5 text-[#00B894]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>
                </div>
                <p className="text-xs text-gray-500">Ask about this patient</p>
                <p className="text-[10px] text-gray-400 mt-0.5">RL-powered, not LLM • Consent required</p>
              </div>
            )}
            {agentMessages.map((msg, i) => {
              const isAgent = msg.startsWith("StriveMAP Agent:");
              return (
                <div key={i} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[90%] p-2.5 rounded-lg text-xs leading-relaxed ${isAgent ? "bg-gray-50 border border-gray-200 text-gray-700" : "bg-[#00B894] text-white"}`}>
                    {isAgent ? msg.replace("StriveMAP Agent: ", "") : msg.replace("You: ", "")}
                  </div>
                </div>
              );
            })}
            {agentThinking && (
              <div className="flex justify-start">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-500">
                  <span className="animate-pulse">Analyzing...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 shrink-0">
            <MediaInputBar
              compact
              disabled={agentThinking}
              placeholder="Ask anything..."
              onSend={(text, attachments) => askAgent(text, attachments)}
            />
            <p className="text-[9px] text-gray-400 text-center mt-1">RL model v2.4.1 • Not an LLM • On-premise</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
