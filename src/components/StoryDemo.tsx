"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

/* ================================================================
   TYPES
   ================================================================ */
interface AgentMessage {
  role: "agent" | "system";
  text: string;
  delay?: number;
}

interface SceneConfig {
  id: string;
  title: string;
  duration: number; // seconds
  messages: AgentMessage[];
}

/* ================================================================
   SCENE DEFINITIONS
   ================================================================ */
const SCENES: SceneConfig[] = [
  {
    id: "patient",
    title: "The Patient",
    duration: 5,
    messages: [
      {
        role: "system",
        text: "Patient admitted to ICU. Analyzing 5,247 data points from 15 connected systems...",
        delay: 800,
      },
      {
        role: "agent",
        text: "78-year-old male with complex comorbidity profile: CHF (EF 32%), HTN (stage 2), CKD (stage 3b). Admitted with severe sepsis and acute respiratory failure. SOFA score 8 — high acuity.",
        delay: 2200,
      },
    ],
  },
  {
    id: "crisis",
    title: "The Crisis",
    duration: 6,
    messages: [
      {
        role: "system",
        text: "ALERT: Hemodynamic instability detected at Hour 15. MAP trending below 60 mmHg.",
        delay: 600,
      },
      {
        role: "agent",
        text: "Clinical Decision Required: Attending physician orders 1.5L crystalloid bolus to raise MAP to standard 65 target.\n\n\u26a0\ufe0f STRIVE detected HIGH RISK: Fluid overload probability 78% given CHF history. Analyzing 500 similar trajectories...",
        delay: 2000,
      },
    ],
  },
  {
    id: "outcome",
    title: "What Actually Happened",
    duration: 5,
    messages: [
      {
        role: "agent",
        text: "Without AI guidance, the standard protocol was followed. The patient had congestive heart failure \u2014 aggressive fluid resuscitation was contraindicated.",
        delay: 800,
      },
      {
        role: "system",
        text: "56% of ICU treatment decisions have room for improvement. This patient was one of them.",
        delay: 2800,
      },
    ],
  },
  {
    id: "strive",
    title: "What STRIVE Would Have Done",
    duration: 8,
    messages: [
      {
        role: "system",
        text: "Rewinding to Hour 15. STRIVE RL engine activated.",
        delay: 400,
      },
      {
        role: "agent",
        text: "RL policy identified optimal treatment from 500 comparable decisions across 151 similar patients.\n\nExpected mortality reduction: 41%\nBased on 5M+ hours of training data from 60K+ patients.\n\nRecommendation: WITHHOLD fluid bolus. Start low-dose vasopressor. Target MAP 65\u201370 mmHg.",
        delay: 2500,
      },
      {
        role: "agent",
        text: "Projected outcome: MAP stabilizes within 4 hours. Organ function recovers. Patient discharged Day 8.",
        delay: 5500,
      },
    ],
  },
  {
    id: "platform",
    title: "The Platform",
    duration: 5,
    messages: [
      {
        role: "agent",
        text: "This isn\u2019t one patient. It\u2019s every patient.\n\nSTRIVE is the operating system for real-time clinical decisions \u2014 deployed across entire ICUs.",
        delay: 800,
      },
      {
        role: "system",
        text: "STRIVE is HIPAA-compliant, on-premise deployable, FDA/CE-mark pending. Unlike generic AI, our RL models never send patient data externally.",
        delay: 3200,
      },
    ],
  },
  {
    id: "moat",
    title: "The Moat",
    duration: 999,
    messages: [
      {
        role: "agent",
        text: "Ask me anything about STRIVE \u2014 our technology, clinical evidence, deployment model, or regulatory pathway.",
        delay: 1000,
      },
    ],
  },
];

/* ================================================================
   TOAST
   ================================================================ */
function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1a1f36",
        color: "#fff",
        padding: "10px 24px",
        borderRadius: 8,
        fontSize: 14,
        zIndex: 9999,
        animation: "toastIn 0.3s ease-out",
      }}
    >
      {message}
    </div>
  );
}

/* ================================================================
   SVG ICONS (inline, no external deps needed)
   ================================================================ */
function MicIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 1a4 4 0 00-4 4v6a4 4 0 008 0V5a4 4 0 00-4-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v1a7 7 0 01-14 0v-1M12 19v4M8 23h8" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.531v11.378a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m4.187-9.94l-7.693 7.693" />
    </svg>
  );
}

/* ================================================================
   ECG ANIMATION (canvas-based)
   ================================================================ */
function ECGCanvas({ color = "#10b981", speed = 2, height = 40 }: { color?: string; speed?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      const mid = h / 2;
      const period = 80;
      offsetRef.current += speed;

      for (let x = 0; x < w; x++) {
        const phase = ((x + offsetRef.current) % period) / period;
        let y = mid;
        if (phase > 0.3 && phase < 0.35) y = mid - h * 0.15;
        else if (phase > 0.35 && phase < 0.38) y = mid + h * 0.4;
        else if (phase > 0.38 && phase < 0.42) y = mid - h * 0.6;
        else if (phase > 0.42 && phase < 0.46) y = mid + h * 0.15;
        else if (phase > 0.46 && phase < 0.5) y = mid;

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [color, speed, height]);

  return <canvas ref={canvasRef} style={{ width: "100%", height }} />;
}

/* ================================================================
   VITAL BADGE
   ================================================================ */
function VitalBadge({
  label,
  value,
  unit,
  status = "normal",
  animate = false,
}: {
  label: string;
  value: string | number;
  unit: string;
  status?: "normal" | "warning" | "critical";
  animate?: boolean;
}) {
  const colors = {
    normal: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
    warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    critical: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
  };
  const c = colors[status];
  return (
    <div
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 10,
        padding: "10px 14px",
        minWidth: 100,
        textAlign: "center",
        animation: animate ? "pulse 1.5s ease-in-out infinite" : undefined,
      }}
    >
      <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: c.text, fontFamily: "var(--font-mono), monospace" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#9ca3af" }}>{unit}</div>
    </div>
  );
}

/* ================================================================
   SCENE COMPONENTS
   ================================================================ */

function Scene1_Patient({ progress }: { progress: number }) {
  const showVitals = progress > 0.25;
  const showECG = progress > 0.15;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 48px" }}>
      {/* Patient Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: "28px 32px",
          maxWidth: 640,
          boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
          animation: "slideUp 0.6s ease-out",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            JD
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#1a1f36" }}>Patient #4782</div>
            <div style={{ fontSize: 14, color: "#6b7280" }}>78-year-old male &bull; ICU Bed 12 &bull; Admitted 04:32</div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              background: "#fef2f2",
              color: "#dc2626",
              padding: "4px 12px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            HIGH ACUITY
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {["Chronic Heart Failure (EF 32%)", "Hypertension Stage 2", "CKD Stage 3b", "Severe Sepsis", "Acute Respiratory Failure"].map((dx) => (
            <span
              key={dx}
              style={{
                background: "#f1f5f9",
                color: "#475569",
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {dx}
            </span>
          ))}
        </div>

        <div style={{ fontSize: 13, color: "#9ca3af", display: "flex", gap: 16 }}>
          <span>15 connected systems</span>
          <span>&bull;</span>
          <span>5,247 data points ingested</span>
          <span>&bull;</span>
          <span>SOFA Score: 8</span>
        </div>
      </div>

      {/* ECG */}
      {showECG && (
        <div style={{ marginTop: 28, opacity: showECG ? 1 : 0, transition: "opacity 0.8s" }}>
          <ECGCanvas color="#10b981" speed={2} height={50} />
        </div>
      )}

      {/* Vitals */}
      {showVitals && (
        <div
          style={{
            display: "flex",
            gap: 14,
            marginTop: 24,
            animation: "slideUp 0.5s ease-out",
          }}
        >
          <VitalBadge label="Heart Rate" value={102} unit="bpm" status="warning" />
          <VitalBadge label="MAP" value={71} unit="mmHg" status="normal" />
          <VitalBadge label="Lactate" value="2.1" unit="mmol/L" status="warning" />
          <VitalBadge label="SpO2" value={94} unit="%" status="normal" />
          <VitalBadge label="SOFA" value={8} unit="score" status="warning" />
        </div>
      )}
    </div>
  );
}

function Scene2_Crisis({ progress }: { progress: number }) {
  const showDecision = progress > 0.45;
  const showAlert = progress > 0.2;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 48px" }}>
      {/* Time indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, animation: "slideUp 0.4s ease-out" }}>
        <div
          style={{
            background: "#dc2626",
            color: "#fff",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          HOUR 15
        </div>
        <div style={{ fontSize: 14, color: "#dc2626", fontWeight: 600 }}>Patient deteriorating rapidly</div>
      </div>

      {/* ECG — faster, red-ish */}
      <ECGCanvas color="#ef4444" speed={3.5} height={45} />

      {/* Vitals — critical */}
      <div style={{ display: "flex", gap: 14, marginTop: 20, animation: "slideUp 0.5s ease-out" }}>
        <VitalBadge label="Heart Rate" value={125} unit="bpm" status="critical" animate />
        <VitalBadge label="MAP" value={58} unit="mmHg" status="critical" animate />
        <VitalBadge label="Lactate" value="4.8" unit="mmol/L" status="critical" animate />
        <VitalBadge label="SpO2" value={88} unit="%" status="critical" animate />
        <VitalBadge label="SOFA" value={12} unit="score" status="critical" animate />
      </div>

      {/* Alert */}
      {showAlert && (
        <div
          style={{
            marginTop: 28,
            background: "#fef2f2",
            border: "2px solid #fca5a5",
            borderRadius: 12,
            padding: "16px 24px",
            animation: "flashBorder 1.5s ease-in-out infinite",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
            CLINICAL DECISION REQUIRED
          </div>
          <div style={{ fontSize: 14, color: "#7f1d1d" }}>
            Hemodynamic instability. MAP below threshold. Immediate intervention needed.
          </div>
        </div>
      )}

      {/* The decision */}
      {showDecision && (
        <div
          style={{
            marginTop: 20,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            animation: "slideUp 0.5s ease-out",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}>Attending Physician Order</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1f36" }}>Administer 1.5L Crystalloid Bolus</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 4 }}>Target MAP &ge; 65 mmHg per Surviving Sepsis Guidelines</div>
          </div>
          <div
            style={{
              background: "#dbeafe",
              color: "#1d4ed8",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            Standard Protocol
          </div>
        </div>
      )}
    </div>
  );
}

function Scene3_Outcome({ progress }: { progress: number }) {
  const events = [
    { time: "Hour 15", label: "1.5L crystalloids administered", status: "critical" as const },
    { time: "Hour 18", label: "MAP drops to 52. Additional fluids ordered.", status: "critical" as const },
    { time: "Hour 24", label: "Pulmonary edema develops. Intubation required.", status: "critical" as const },
    { time: "Day 3", label: "Multi-organ dysfunction. Renal replacement initiated.", status: "critical" as const },
    { time: "Day 6", label: "Refractory shock. Patient deceased.", status: "critical" as const },
  ];

  const visibleCount = Math.min(events.length, Math.floor(progress * events.length * 1.8) + 1);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 48px" }}>
      <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Without STRIVE
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "#1a1f36", marginBottom: 28 }}>
        Standard protocol was followed. The patient did not survive.
      </div>

      {/* Timeline */}
      <div style={{ position: "relative", paddingLeft: 28 }}>
        <div style={{ position: "absolute", left: 8, top: 0, bottom: 0, width: 2, background: "#fecaca" }} />
        {events.slice(0, visibleCount).map((evt, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              paddingBottom: 20,
              paddingLeft: 20,
              animation: "slideUp 0.4s ease-out",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -24,
                top: 4,
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: i === events.length - 1 ? "#dc2626" : "#fca5a5",
                border: "2px solid #fff",
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600, color: "#dc2626", fontFamily: "var(--font-mono), monospace" }}>
              {evt.time}
            </div>
            <div style={{ fontSize: 15, color: i === events.length - 1 ? "#991b1b" : "#4b5563", fontWeight: i === events.length - 1 ? 700 : 400 }}>
              {evt.label}
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      {progress > 0.6 && (
        <div
          style={{
            marginTop: 28,
            display: "flex",
            gap: 24,
            animation: "slideUp 0.5s ease-out",
          }}
        >
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: "16px 24px", flex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#dc2626" }}>5,000+</div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>data points per patient per day</div>
          </div>
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: "16px 24px", flex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#dc2626" }}>15+</div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>fragmented data systems</div>
          </div>
          <div style={{ background: "#fef2f2", borderRadius: 12, padding: "16px 24px", flex: 1 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#dc2626" }}>56%</div>
            <div style={{ fontSize: 13, color: "#7f1d1d" }}>of ICU decisions can be improved</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Scene4_Strive({ progress }: { progress: number }) {
  const showAnalysis = progress > 0.15;
  const showRecommendation = progress > 0.4;
  const showOutcome = progress > 0.65;
  const comparisonBar = Math.min(1, (progress - 0.2) * 2.5);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 48px" }}>
      {/* Rewind effect */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
          animation: "slideUp 0.4s ease-out",
        }}
      >
        <div
          style={{
            background: "#6366f1",
            color: "#fff",
            padding: "6px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "var(--font-mono), monospace",
          }}
        >
          HOUR 15 — REWIND
        </div>
        <div style={{ fontSize: 14, color: "#6366f1", fontWeight: 600 }}>STRIVE RL engine activated</div>
      </div>

      {/* ECG — calm, green */}
      <ECGCanvas color="#6366f1" speed={1.8} height={40} />

      {/* Analysis panel */}
      {showAnalysis && (
        <div
          style={{
            marginTop: 24,
            background: "#fff",
            border: "1px solid #e0e7ff",
            borderRadius: 14,
            padding: "24px 28px",
            boxShadow: "0 4px 24px rgba(99,102,241,0.08)",
            animation: "slideUp 0.5s ease-out",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
            STRIVE Decision Analysis
          </div>

          {/* Similar patients bar */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 6 }}>Similar Patients Found</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(100, comparisonBar * 100)}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                    borderRadius: 4,
                    transition: "width 1s ease-out",
                  }}
                />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1a1f36", fontFamily: "var(--font-mono), monospace" }}>
                500 decisions from 151 patients
              </span>
            </div>
          </div>

          {/* Expected benefit comparison */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <div
              style={{
                flex: 1,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "14px 18px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase" }}>No Bolus (Recommended)</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#16a34a", fontFamily: "var(--font-mono), monospace" }}>78.2</div>
              <div style={{ fontSize: 12, color: "#166534" }}>Expected Benefit Score</div>
            </div>
            <div
              style={{
                flex: 1,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 10,
                padding: "14px 18px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase" }}>Fluid Bolus</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#dc2626", fontFamily: "var(--font-mono), monospace" }}>52.1</div>
              <div style={{ fontSize: 12, color: "#991b1b" }}>Expected Benefit Score</div>
            </div>
          </div>

          {/* Recommendation */}
          {showRecommendation && (
            <div
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                borderRadius: 10,
                padding: "16px 20px",
                color: "#fff",
                animation: "slideUp 0.4s ease-out",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, opacity: 0.8, marginBottom: 4 }}>
                STRIVE Recommendation
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                WITHHOLD fluid bolus. Start low-dose vasopressor.
              </div>
              <div style={{ fontSize: 13, opacity: 0.85 }}>
                Target MAP 65\u201370 mmHg (personalized, not generic 65). 30% higher expected benefit.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Outcome */}
      {showOutcome && (
        <div style={{ marginTop: 20, display: "flex", gap: 16, animation: "slideUp 0.5s ease-out" }}>
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "16px 24px", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", marginBottom: 4 }}>MAP at Hour 20</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", fontFamily: "var(--font-mono), monospace" }}>68</div>
            <div style={{ fontSize: 12, color: "#166534" }}>Stabilized</div>
          </div>
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "16px 24px", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", marginBottom: 4 }}>Organs</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", fontFamily: "var(--font-mono), monospace" }}>Recovering</div>
            <div style={{ fontSize: 12, color: "#166534" }}>No failure cascade</div>
          </div>
          <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "16px 24px", flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", marginBottom: 4 }}>Outcome</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#16a34a", fontFamily: "var(--font-mono), monospace" }}>Day 8</div>
            <div style={{ fontSize: 12, color: "#166534" }}>Patient discharged</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Scene5_Platform({ progress }: { progress: number }) {
  const showStats = progress > 0.3;
  const showGrid = progress > 0.1;
  const gridCount = Math.min(108, Math.floor(progress * 200));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 48px" }}>
      <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Not just one patient
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1f36", marginBottom: 8 }}>
        The operating system for real-time clinical decisions.
      </div>
      <div style={{ fontSize: 15, color: "#6b7280", marginBottom: 28 }}>
        Every patient. Every decision. Every second.
      </div>

      {/* Patient grid */}
      {showGrid && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(18, 1fr)",
            gap: 4,
            marginBottom: 28,
          }}
        >
          {Array.from({ length: 108 }).map((_, i) => {
            const visible = i < gridCount;
            const hasStrive = i % 3 !== 2;
            return (
              <div
                key={i}
                style={{
                  width: "100%",
                  paddingBottom: "100%",
                  borderRadius: 4,
                  background: visible ? (hasStrive ? "#6366f1" : "#e0e7ff") : "#f8fafc",
                  opacity: visible ? (hasStrive ? 0.9 : 0.5) : 0.15,
                  transition: "all 0.3s ease-out",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div style={{ display: "flex", gap: 16, animation: "slideUp 0.5s ease-out" }}>
          {[
            { value: "5M+", label: "hours of ICU data" },
            { value: "60K+", label: "patients trained on" },
            { value: "41%", label: "mortality reduction" },
            { value: "76/78", label: "clinicians want daily use" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: "#fff",
                border: "1px solid #e0e7ff",
                borderRadius: 12,
                padding: "18px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 30, fontWeight: 800, color: "#6366f1", fontFamily: "var(--font-mono), monospace" }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const CLINICIAN_QUOTES = [
  { text: "The tool gives us real-time insight we simply cannot produce ourselves.", author: "Dominic Marshall", role: "ICU Fellow, Cleveland Clinic" },
  { text: "After using STRIVE, you realize there\u2019s no going back.", author: "Jham Valenzuela", role: "ICU Clinician, Columbia University" },
  { text: "STRIVE is not a nice-to-have, it\u2019s essential infrastructure for modern ICUs.", author: "Louis Kreitmann", role: "ICU Consultant, NHS" },
];

function LogoCard({ name, size = "normal" }: { name: string; size?: "normal" | "small" }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: size === "small" ? "8px 14px" : "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono), 'SF Mono', 'Fira Code', monospace",
        fontSize: size === "small" ? 11 : 13,
        fontWeight: 700,
        color: "#1a1f36",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {name}
    </div>
  );
}

function Scene6_Moat() {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % CLINICIAN_QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const quote = CLINICIAN_QUOTES[quoteIdx];

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 48px" }}>
      <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        Why this can&apos;t be replicated
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#1a1f36", marginBottom: 24 }}>
        The STRIVE Moat
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        {[
          { icon: "\ud83e\udde0", title: "Not an LLM", desc: "Reinforcement Learning trained on 5M+ real ICU hours. Causal reasoning, not pattern matching." },
          { icon: "\ud83c\udfe5", title: "On-Premise", desc: "Patient data never leaves the hospital. Full data sovereignty. No cloud dependency." },
          { icon: "\ud83d\udee1\ufe0f", title: "FDA & CE Mark", desc: "Regulatory clearance expected 2026. Built to clinical-grade compliance from day one." },
          { icon: "\ud83c\udfeb", title: "Elite Trial Sites", desc: "Cleveland Clinic + Harvard affiliated hospitals confirmed. Multi-site validation underway." },
        ].map((item) => (
          <div key={item.title} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px", animation: "slideUp 0.5s ease-out" }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1f36", marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Hospital Partners ── */}
      <div style={{ marginBottom: 28, animation: "slideUp 0.6s ease-out" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Trial Sites (Treating Patients in 2026)
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <LogoCard name="Cleveland Clinic" />
          <LogoCard name="Harvard University / Beth Israel" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Deployment Partner
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <LogoCard name="UC Health" />
          <span style={{ fontSize: 12, color: "#9ca3af", alignSelf: "center" }}>deploy + scale integration</span>
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Validation Studies
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <LogoCard name="Columbia University" />
          <LogoCard name="NHS" />
          <LogoCard name="Charit\u00e9 Berlin" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Backed by leaders from
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Moderna", "Philips", "DeepMind", "OpenAI", "Viz.ai", "Oaktree", "Merck", "Mount Sinai"].map(n => (
            <LogoCard key={n} name={n} size="small" />
          ))}
        </div>
      </div>

      {/* ── Key Stats ── */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, animation: "slideUp 0.7s ease-out" }}>
        {[
          { value: "76/78", label: "clinicians want to use STRIVE daily" },
          { value: "$3.5M", label: "pre-seed closed" },
          { value: "CE ~3mo", label: "FDA ~6 months" },
          { value: "Star Award", label: "SCCM 2026" },
        ].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#f0f0ff", border: "1px solid #e0e7ff", borderRadius: 12, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#6366f1", fontFamily: "var(--font-mono), monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Clinician Quote ── */}
      <div
        key={quoteIdx}
        style={{
          background: "#fff",
          border: "1px solid #e0e7ff",
          borderLeft: "4px solid #6366f1",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 28,
          animation: "slideUp 0.5s ease-out",
        }}
      >
        <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.6, fontStyle: "italic", marginBottom: 10 }}>
          &ldquo;{quote.text}&rdquo;
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1f36" }}>{quote.author}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{quote.role}</div>
      </div>

      {/* ── CTA Buttons ── */}
      <div style={{ display: "flex", gap: 12 }}>
        <Link
          href="/platform"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#6366f1", color: "#fff", padding: "12px 28px",
            borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}
        >
          Explore the Platform &rarr;
        </Link>
        <Link
          href="/agent"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "#f1f5f9", color: "#475569", padding: "12px 28px",
            borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: "none",
          }}
        >
          Try the Agent
        </Link>
      </div>
    </div>
  );
}

/* ================================================================
   AGENT SIDEBAR
   ================================================================ */
function AgentSidebar({
  messages,
  toastFn,
}: {
  messages: { role: string; text: string }[];
  toastFn: (msg: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#fafbfc",
        borderLeft: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1f36" }}>STRIVE Agent</div>
            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 500 }}>Active &bull; Monitoring</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "16px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              animation: "slideUp 0.4s ease-out",
            }}
          >
            {msg.role === "system" ? (
              <div
                style={{
                  background: "#f0f0ff",
                  border: "1px solid #e0e7ff",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#4338ca",
                  lineHeight: 1.5,
                }}
              >
                {msg.text}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  S
                </div>
                <div
                  style={{
                    background: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Badges */}
      <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {["HIPAA", "SOC 2", "On-Premise", "FDA Pending"].map((badge) => (
          <span
            key={badge}
            style={{
              background: "#f0fdf4",
              color: "#166534",
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {badge}
          </span>
        ))}
      </div>

      {/* Input area */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid #e5e7eb" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          <input
            type="text"
            placeholder="Ask STRIVE anything..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#374151",
              background: "transparent",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                toastFn("Interactive chat coming soon");
                (e.target as HTMLInputElement).value = "";
              }
            }}
          />
          <button
            onClick={() => toastFn("Voice input coming soon")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Voice"
          >
            <MicIcon />
          </button>
          <button
            onClick={() => toastFn("Video coming soon")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Video"
          >
            <CameraIcon />
          </button>
          <button
            onClick={() => toastFn("File upload coming soon")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: 4,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Upload"
          >
            <PaperclipIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN STORY DEMO
   ================================================================ */
export default function StoryDemo() {
  const [currentScene, setCurrentScene] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [agentMessages, setAgentMessages] = useState<{ role: string; text: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const scheduledMsgsRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scene = SCENES[currentScene];
  const totalScenes = SCENES.length;

  // Show toast
  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  // Scene timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duration = scene.duration * 1000;
    const tick = 50;

    timerRef.current = setInterval(() => {
      setSceneProgress((prev) => {
        const next = prev + tick / duration;
        if (next >= 1 && currentScene < totalScenes - 1) {
          setCurrentScene((s) => s + 1);
          setSceneProgress(0);
          return 0;
        }
        return Math.min(next, 1);
      });
    }, tick);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, scene.duration, currentScene, totalScenes]);

  // Agent messages based on scene + progress
  useEffect(() => {
    const sceneMessages = SCENES[currentScene].messages;
    sceneMessages.forEach((msg, i) => {
      const key = `${currentScene}-${i}`;
      const delayProgress = (msg.delay || 0) / (SCENES[currentScene].duration * 1000);
      if (sceneProgress >= delayProgress && !scheduledMsgsRef.current.has(key)) {
        scheduledMsgsRef.current.add(key);
        setAgentMessages((prev) => [...prev, { role: msg.role, text: msg.text }]);
      }
    });
  }, [currentScene, sceneProgress]);

  // Reset messages when going backward
  const goToScene = useCallback((idx: number) => {
    setCurrentScene(idx);
    setSceneProgress(0);
    // Rebuild messages for all scenes before idx
    scheduledMsgsRef.current = new Set();
    const newMessages: { role: string; text: string }[] = [];
    for (let s = 0; s < idx; s++) {
      SCENES[s].messages.forEach((msg, i) => {
        const key = `${s}-${i}`;
        scheduledMsgsRef.current.add(key);
        newMessages.push({ role: msg.role, text: msg.text });
      });
    }
    setAgentMessages(newMessages);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && currentScene < totalScenes - 1) {
        goToScene(currentScene + 1);
      } else if (e.key === "ArrowLeft" && currentScene > 0) {
        goToScene(currentScene - 1);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentScene, totalScenes, goToScene]);

  // Scene renderer
  const renderScene = () => {
    switch (currentScene) {
      case 0:
        return <Scene1_Patient progress={sceneProgress} />;
      case 1:
        return <Scene2_Crisis progress={sceneProgress} />;
      case 2:
        return <Scene3_Outcome progress={sceneProgress} />;
      case 3:
        return <Scene4_Strive progress={sceneProgress} />;
      case 4:
        return <Scene5_Platform progress={sceneProgress} />;
      case 5:
        return <Scene6_Moat />;
      default:
        return null;
    }
  };

  // Overall progress
  const overallProgress = (currentScene + sceneProgress) / totalScenes;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#fff", overflow: "hidden" }}>
      {/* CSS Animations */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes flashBorder {
          0%, 100% { border-color: #fca5a5; }
          50% { border-color: #ef4444; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Top Bar: Progress + Nav */}
      <div style={{ borderBottom: "1px solid #e5e7eb", background: "#fff", zIndex: 50 }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "#f1f5f9" }}>
          <div
            style={{
              height: "100%",
              width: `${overallProgress * 100}%`,
              background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
              transition: "width 0.15s linear",
            }}
          />
        </div>

        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 24px", gap: 20 }}>
          {/* Logo */}
          <Link href="/" style={{ fontSize: 18, fontWeight: 800, color: "#6366f1", textDecoration: "none", letterSpacing: -0.5 }}>
            STRIVE
          </Link>

          {/* Scene indicators */}
          <div style={{ display: "flex", gap: 4, marginLeft: 16 }}>
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToScene(i)}
                style={{
                  width: i === currentScene ? 32 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i <= currentScene ? "#6366f1" : "#e5e7eb",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  padding: 0,
                }}
                title={s.title}
              />
            ))}
          </div>

          {/* Scene title */}
          <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
            {scene.title}
          </span>

          {/* Play / Pause */}
          <button
            onClick={() => setIsPlaying((p) => !p)}
            style={{
              background: "none",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 12,
              color: "#6b7280",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Nav links */}
          <Link href="/cases" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>
            Case Studies
          </Link>
          <Link href="/platform" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>
            Platform
          </Link>
          <Link href="/agent" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>
            Agent
          </Link>
          <Link
            href="/platform"
            style={{
              fontSize: 12,
              color: "#6366f1",
              textDecoration: "none",
              fontWeight: 600,
              background: "#f0f0ff",
              padding: "4px 12px",
              borderRadius: 6,
            }}
          >
            Open Platform &rarr;
          </Link>
        </div>
      </div>

      {/* Main content: Story + Agent sidebar */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Story area ~70% */}
        <div
          style={{
            flex: 7,
            background: "#fafbfc",
            overflow: "hidden",
            position: "relative",
          }}
          onClick={() => {
            if (currentScene < totalScenes - 1) {
              goToScene(currentScene + 1);
            }
          }}
        >
          {renderScene()}

          {/* Click to advance hint */}
          {currentScene < totalScenes - 1 && (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 12,
                color: "#c3c8d4",
                pointerEvents: "none",
              }}
            >
              Click or press &rarr; to advance &bull; Space to {isPlaying ? "pause" : "play"}
            </div>
          )}
        </div>

        {/* Right: Agent sidebar ~30% */}
        <div style={{ flex: 3, minWidth: 320, maxWidth: 400 }}>
          <AgentSidebar messages={agentMessages} toastFn={showToast} />
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
