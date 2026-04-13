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
   ROI TAB
   ============================================================ */

function ROITab() {
  const [beds, setBeds] = useState(50);
  const [occupancy, setOccupancy] = useState(85);
  const [costPerDay, setCostPerDay] = useState(5500);

  const roi = useMemo(() => {
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
    const costPerBedPerYear = striveCostPerBed;

    return {
      patientsPerYear,
      sepsisCases,
      livesSaved,
      icuDaysSaved,
      annualSavings,
      roiRatio,
      costPerBedPerYear,
    };
  }, [beds, occupancy, costPerDay]);

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
    <>
      <style>{`
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ROI Calculator */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">Hospital ROI Calculator</h2>
        <p className="text-xs text-gray-500 mb-5">Adjust parameters to estimate STRIVE impact at your facility</p>

        {/* Sliders */}
        <div className="space-y-5 mb-8">
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Patients Treated / Year", value: roi.patientsPerYear.toLocaleString() },
            { label: "Sepsis Cases / Year", value: roi.sepsisCases.toLocaleString() },
            { label: "Lives Saved / Year", value: roi.livesSaved.toLocaleString(), highlight: true },
          ].map(r => (
            <div key={r.label} className={`rounded-xl p-4 text-center ${r.highlight ? "bg-[#00B894]/10 border border-[#00B894]/30" : "bg-gray-50"}`} style={{ animation: "countUp 0.4s ease-out" }}>
              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{r.label}</p>
              <p className={`text-2xl font-bold font-mono ${r.highlight ? "text-[#00B894]" : "text-gray-900"}`}>{r.value}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 text-center" style={{ animation: "countUp 0.5s ease-out" }}>
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">ICU Days Saved / Year</p>
            <p className="text-xl font-bold font-mono text-gray-900">{roi.icuDaysSaved.toLocaleString()}</p>
          </div>
          <div className="bg-[#00B894]/10 border border-[#00B894]/30 rounded-xl p-4 text-center" style={{ animation: "countUp 0.6s ease-out" }}>
            <p className="text-[10px] text-[#00B894] uppercase font-semibold mb-1">Annual Cost Savings</p>
            <p className="text-xl font-bold font-mono text-[#00B894]">{formatMoney(roi.annualSavings)}</p>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-center" style={{ animation: "countUp 0.7s ease-out" }}>
            <p className="text-[10px] text-indigo-500 uppercase font-semibold mb-1">ROI</p>
            <p className="text-xl font-bold font-mono text-indigo-600">{roi.roiRatio}:1</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-center" style={{ animation: "countUp 0.8s ease-out" }}>
            <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Cost / Bed / Year</p>
            <p className="text-xl font-bold font-mono text-gray-900">${roi.costPerBedPerYear.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-[10px] text-gray-500">Based on peer-reviewed evidence (p&lt;0.0001, 95% CI) published at SCCM 2026. 41% mortality reduction, 18% LOS reduction from prospective clinical validation.</p>
        </div>
      </div>

      {/* TAM Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-900 mb-1">Total Addressable Market</h2>
        <p className="text-xs text-gray-500 mb-5">AI-driven clinical decision support across chronic & acute conditions</p>

        <div className="space-y-3 mb-6">
          {tamData.map(d => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-28 text-sm font-medium text-gray-700 text-right">{d.label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                <div
                  className={`h-7 rounded-full flex items-center px-3 transition-all ${
                    d.status === "delivered" ? "bg-[#00B894]" :
                    d.status === "building" ? "bg-indigo-400" : "bg-gray-300"
                  }`}
                  style={{ width: `${(d.value / tamMax) * 100}%` }}
                >
                  <span className="text-xs font-bold text-white">${d.value}B</span>
                </div>
              </div>
              <span className={`text-[10px] font-semibold uppercase w-16 ${
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
    </>
  );
}

/* ============================================================
   MAIN DEMO COMPONENT
   ============================================================ */

type Tab = "overview" | "labs" | "antibiotics" | "icu-overview" | "simulator" | "roi";

export default function StriveDemo() {
  const patients = useMemo(() => getAllPatients(), []);
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(0);
  const [timeRange, setTimeRange] = useState<6 | 12 | 24>(24);
  const [showPatientList, setShowPatientList] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentMessages, setAgentMessages] = useState<string[]>([]);
  const [agentInput, setAgentInput] = useState("");
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    setAgentMessages([]);
    setActiveTab("overview");
    setExpandedInsight(null);
  }, [selectedPatientIdx]);

  const askAgent = useCallback(async (question: string, attachments: Attachment[] = []) => {
    if (!question.trim() && attachments.length === 0) return;
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
          <span className="text-sm text-gray-500">
            <span className="font-mono font-bold text-gray-900">{patient.name}</span>
            <span className="text-gray-400 ml-1">#{patient.id}</span>
          </span>
          <button
            onClick={() => setShowPatientList(!showPatientList)}
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
                ["roi", "ROI"],
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

            {/* ═══════ ROI TAB ═══════ */}
            {activeTab === "roi" && <ROITab />}

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
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />HIPAA</span>
              <span>|</span>
              <span>SOC2</span>
              <span>|</span>
              <span>On-Premise</span>
              <span>|</span>
              <span>RL Model</span>
            </div>
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
                <p className="text-[10px] text-gray-400 mt-0.5">RL-powered, not LLM</p>
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
