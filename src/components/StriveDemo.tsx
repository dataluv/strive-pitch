"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ============================================================
   PATIENT DATABASE — 6 patients with rich clinical profiles
   ============================================================ */

interface LabValue {
  name: string;
  value: string;
  unit: string;
  flag?: "high" | "low" | "critical";
  trend?: "up" | "down" | "stable";
}

interface FluidBolusDecision {
  mapRange: string;
  benefit: number;
  color: "green" | "blue" | "gray";
  isTarget?: boolean;
}

interface SimilarDecisionSummary {
  action: string;
  count: number;
  avgBenefit: number;
  significance: "high" | "medium" | "low";
}

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
  labs: LabValue[];
  mapBenefits: FluidBolusDecision[];
  similarDecisions: SimilarDecisionSummary[];
  agentInsights: string[];
  antibioticRegimen: { name: string; dose: string; route: string; frequency: string; started: string }[];
}

const PATIENTS: Patient[] = [
  {
    id: "1943127_S76",
    age: 91,
    sex: "F",
    daysInHospital: 1,
    hr: 91,
    sbp: 98,
    dbp: 54,
    map: 60.9,
    lactate: 2.3,
    temp: 38.4,
    wbc: 14.2,
    creatinine: 1.8,
    urineOutput: "0 mL / 25 mL / 17 mL",
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
        "Patient has negative fluid balance and congestive heart failure. Among 500 similar decisions from 89 patients, withholding fluid bolus was associated with higher expected benefit (78.2 vs 73.4). MAP target 70-75 mmHg is optimal based on reinforcement learning policy.",
    },
    similarCount: 500,
    similarPatients: 89,
    matchQuality: "High",
    riskScore: 34,
    sepsisOnsetHour: 8,
    labs: [
      { name: "Hemoglobin", value: "9.8", unit: "g/dL", flag: "low", trend: "down" },
      { name: "Platelets", value: "142", unit: "K/μL", trend: "stable" },
      { name: "BUN", value: "38", unit: "mg/dL", flag: "high", trend: "up" },
      { name: "pH", value: "7.31", unit: "", flag: "low", trend: "down" },
      { name: "pCO2", value: "32", unit: "mmHg", trend: "stable" },
      { name: "Bicarbonate", value: "18", unit: "mEq/L", flag: "low", trend: "down" },
      { name: "Procalcitonin", value: "4.2", unit: "ng/mL", flag: "high", trend: "up" },
      { name: "CRP", value: "148", unit: "mg/L", flag: "high", trend: "up" },
    ],
    mapBenefits: [
      { mapRange: "<55", benefit: 59.2, color: "gray" },
      { mapRange: "55-60", benefit: 67.8, color: "gray" },
      { mapRange: "60-65", benefit: 74.1, color: "blue" },
      { mapRange: "65-70", benefit: 76.5, color: "blue" },
      { mapRange: "70-75", benefit: 78.2, color: "green", isTarget: true },
      { mapRange: "75-80", benefit: 72.4, color: "blue" },
      { mapRange: ">80", benefit: 64.3, color: "gray" },
    ],
    similarDecisions: [
      { action: "No fluid bolus given", count: 312, avgBenefit: 78.2, significance: "high" },
      { action: "250 mL crystalloid bolus", count: 145, avgBenefit: 73.4, significance: "medium" },
      { action: "500 mL crystalloid bolus", count: 43, avgBenefit: 64.1, significance: "low" },
    ],
    agentInsights: [
      "CHF history increases risk of fluid overload — withholding bolus preferred in 62% of similar cases",
      "Current MAP 60.9 is below target range. Monitor for natural recovery before vasopressor initiation",
      "Negative fluid balance (-2762 mL) is appropriate given cardiac history — do not attempt to correct",
      "Procalcitonin trend rising — confirm antibiotic coverage is adequate for urinary source",
    ],
    antibioticRegimen: [
      { name: "Piperacillin-Tazobactam", dose: "4.5g", route: "IV", frequency: "q8h", started: "4h ago" },
      { name: "Vancomycin", dose: "1g", route: "IV", frequency: "q12h", started: "4h ago" },
    ],
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
    urineOutput: "0 mL / 0 mL / 10 mL",
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
        "MAP critically low at 55 mmHg despite vasopressors. 250 mL crystalloid bolus recommended based on 342 similar trajectories. Expected benefit 81.7 vs 64.3 for withholding. Consider vasopressor dose escalation if MAP remains <65 after 30 min.",
    },
    similarCount: 342,
    similarPatients: 67,
    matchQuality: "High",
    riskScore: 72,
    sepsisOnsetHour: 4,
    labs: [
      { name: "Hemoglobin", value: "11.2", unit: "g/dL", trend: "stable" },
      { name: "Platelets", value: "88", unit: "K/μL", flag: "low", trend: "down" },
      { name: "BUN", value: "52", unit: "mg/dL", flag: "high", trend: "up" },
      { name: "pH", value: "7.24", unit: "", flag: "critical", trend: "down" },
      { name: "pCO2", value: "28", unit: "mmHg", flag: "low", trend: "down" },
      { name: "Bicarbonate", value: "14", unit: "mEq/L", flag: "critical", trend: "down" },
      { name: "Procalcitonin", value: "18.5", unit: "ng/mL", flag: "critical", trend: "up" },
      { name: "CRP", value: "285", unit: "mg/L", flag: "critical", trend: "up" },
    ],
    mapBenefits: [
      { mapRange: "<55", benefit: 42.1, color: "gray" },
      { mapRange: "55-60", benefit: 58.3, color: "gray" },
      { mapRange: "60-65", benefit: 72.6, color: "blue" },
      { mapRange: "65-70", benefit: 81.7, color: "green", isTarget: true },
      { mapRange: "70-75", benefit: 76.4, color: "blue" },
      { mapRange: "75-80", benefit: 68.2, color: "gray" },
      { mapRange: ">80", benefit: 55.1, color: "gray" },
    ],
    similarDecisions: [
      { action: "250 mL crystalloid bolus", count: 198, avgBenefit: 81.7, significance: "high" },
      { action: "No fluid bolus given", count: 89, avgBenefit: 64.3, significance: "medium" },
      { action: "Vasopressor escalation only", count: 55, avgBenefit: 71.2, significance: "medium" },
    ],
    agentInsights: [
      "CRITICAL: MAP 55 mmHg — below minimum safe threshold. Immediate intervention required",
      "Lactate 5.1 with rising trend indicates tissue hypoperfusion — fluid challenge is appropriate",
      "CKD Stage III: monitor for fluid tolerance. Recommend CRRT evaluation if oliguric >6h post-bolus",
      "Thrombocytopenia trend (88K) — consider DIC workup if platelets continue to decline",
      "Vasopressor dose below 0.2 mcg/kg/min — room for escalation before adding second agent",
    ],
    antibioticRegimen: [
      { name: "Meropenem", dose: "1g", route: "IV", frequency: "q8h", started: "2d ago" },
      { name: "Levofloxacin", dose: "750mg", route: "IV", frequency: "q24h", started: "2d ago" },
    ],
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
    urineOutput: "30 mL / 45 mL / 25 mL",
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
        "Early sepsis with rising lactate but preserved MAP. 250 mL bolus recommended. 478 similar cases show fluid-responsive pattern at this stage. Source control (ERCP) is priority — notify interventional team.",
    },
    similarCount: 478,
    similarPatients: 102,
    matchQuality: "High",
    riskScore: 28,
    sepsisOnsetHour: 6,
    labs: [
      { name: "Hemoglobin", value: "12.1", unit: "g/dL", trend: "stable" },
      { name: "Platelets", value: "205", unit: "K/μL", trend: "stable" },
      { name: "BUN", value: "22", unit: "mg/dL", trend: "stable" },
      { name: "pH", value: "7.35", unit: "", trend: "stable" },
      { name: "pCO2", value: "38", unit: "mmHg", trend: "stable" },
      { name: "Bicarbonate", value: "22", unit: "mEq/L", trend: "stable" },
      { name: "Total Bilirubin", value: "4.8", unit: "mg/dL", flag: "high", trend: "up" },
      { name: "Lipase", value: "320", unit: "U/L", flag: "high", trend: "up" },
    ],
    mapBenefits: [
      { mapRange: "<55", benefit: 51.3, color: "gray" },
      { mapRange: "55-60", benefit: 62.7, color: "gray" },
      { mapRange: "60-65", benefit: 71.4, color: "blue" },
      { mapRange: "65-70", benefit: 76.8, color: "blue" },
      { mapRange: "70-75", benefit: 80.3, color: "blue" },
      { mapRange: "75-80", benefit: 82.1, color: "green", isTarget: true },
      { mapRange: ">80", benefit: 74.5, color: "blue" },
    ],
    similarDecisions: [
      { action: "250 mL crystalloid bolus", count: 289, avgBenefit: 82.1, significance: "high" },
      { action: "No fluid bolus given", count: 134, avgBenefit: 71.4, significance: "medium" },
      { action: "500 mL crystalloid bolus", count: 55, avgBenefit: 78.9, significance: "medium" },
    ],
    agentInsights: [
      "Early sepsis presentation — fluid responsiveness likely based on clinical trajectory",
      "Source control is critical: cholangitis requires ERCP. Recommend GI/IR consult within 2h",
      "Rising bilirubin (4.8) and lipase (320) support biliary source — confirm imaging",
      "Low SOFA (5) with early intervention window — aggressive early treatment improves outcomes 23%",
    ],
    antibioticRegimen: [
      { name: "Piperacillin-Tazobactam", dose: "4.5g", route: "IV", frequency: "q8h", started: "2h ago" },
      { name: "Metronidazole", dose: "500mg", route: "IV", frequency: "q8h", started: "2h ago" },
    ],
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
    urineOutput: "60 mL / 55 mL / 70 mL",
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
        "Patient recovering well. Haemodynamics stable, lactate normalising at 1.1. No fluid or vasopressor intervention indicated. 621 similar trajectories support conservative management. Consider step-down in 24h.",
    },
    similarCount: 621,
    similarPatients: 134,
    matchQuality: "High",
    riskScore: 8,
    sepsisOnsetHour: 2,
    labs: [
      { name: "Hemoglobin", value: "13.4", unit: "g/dL", trend: "stable" },
      { name: "Platelets", value: "198", unit: "K/μL", trend: "up" },
      { name: "BUN", value: "18", unit: "mg/dL", trend: "down" },
      { name: "pH", value: "7.41", unit: "", trend: "stable" },
      { name: "pCO2", value: "40", unit: "mmHg", trend: "stable" },
      { name: "Bicarbonate", value: "24", unit: "mEq/L", trend: "stable" },
      { name: "Procalcitonin", value: "0.8", unit: "ng/mL", trend: "down" },
      { name: "CRP", value: "42", unit: "mg/L", trend: "down" },
    ],
    mapBenefits: [
      { mapRange: "<55", benefit: 38.4, color: "gray" },
      { mapRange: "55-60", benefit: 52.1, color: "gray" },
      { mapRange: "60-65", benefit: 64.5, color: "gray" },
      { mapRange: "65-70", benefit: 72.8, color: "blue" },
      { mapRange: "70-75", benefit: 81.3, color: "blue" },
      { mapRange: "75-80", benefit: 86.7, color: "blue" },
      { mapRange: ">80", benefit: 88.9, color: "green", isTarget: true },
    ],
    similarDecisions: [
      { action: "No fluid bolus given", count: 498, avgBenefit: 88.9, significance: "high" },
      { action: "250 mL crystalloid bolus", count: 98, avgBenefit: 65.2, significance: "low" },
      { action: "Oral fluids only", count: 25, avgBenefit: 84.1, significance: "medium" },
    ],
    agentInsights: [
      "Patient on recovery trajectory — all inflammatory markers trending down",
      "SOFA score decreased from 7 to 2 over 5 days — consider ICU discharge planning",
      "Atrial fibrillation: maintain rate control, avoid excessive fluid loading",
      "Step-down criteria met: MAP >80, lactate <2, adequate urine output, improving WBC",
    ],
    antibioticRegimen: [
      { name: "Cefazolin", dose: "2g", route: "IV", frequency: "q8h", started: "5d ago" },
    ],
  },
  {
    id: "5291048_S58",
    age: 43,
    sex: "M",
    daysInHospital: 2,
    hr: 125,
    sbp: 88,
    dbp: 52,
    map: 58,
    lactate: 6.8,
    temp: 40.1,
    wbc: 28.4,
    creatinine: 3.4,
    urineOutput: "0 mL / 0 mL / 5 mL",
    crystalloids: 4000,
    fluidBalance: 3200,
    comorbidities: ["IV drug use", "Hepatitis C", "HIV (on ART)"],
    sepsisSource: "Endocarditis — MRSA",
    sofa: 14,
    interventions: [
      { name: "Mechanical ventilation", active: true },
      { name: "Vasopressors", active: true },
      { name: "Circulatory support", active: false },
      { name: "CRRT", active: true },
    ],
    vasoactive: "Norepinephrine 0.25 mcg/kg/min + Vasopressin 0.04 U/min",
    recommendation: {
      fluidBolus: "withhold",
      bolusExpectedBenefit: 52.1,
      noBolusExpectedBenefit: 68.7,
      vasopressor: "Add epinephrine 0.05 mcg/kg/min as third agent",
      mapTarget: "65-70",
      rationale:
        "Refractory septic shock with multi-organ failure. Fluid overloaded (+3200 mL). Withholding bolus preferred (68.7 vs 52.1). Third vasopressor agent recommended. Consider cardiothoracic surgery consult for valve replacement if hemodynamically stable.",
    },
    similarCount: 187,
    similarPatients: 34,
    matchQuality: "Medium",
    riskScore: 89,
    sepsisOnsetHour: 3,
    labs: [
      { name: "Hemoglobin", value: "8.2", unit: "g/dL", flag: "low", trend: "down" },
      { name: "Platelets", value: "42", unit: "K/μL", flag: "critical", trend: "down" },
      { name: "BUN", value: "78", unit: "mg/dL", flag: "critical", trend: "up" },
      { name: "pH", value: "7.18", unit: "", flag: "critical", trend: "down" },
      { name: "pCO2", value: "24", unit: "mmHg", flag: "low", trend: "down" },
      { name: "Bicarbonate", value: "10", unit: "mEq/L", flag: "critical", trend: "down" },
      { name: "Procalcitonin", value: "42.8", unit: "ng/mL", flag: "critical", trend: "up" },
      { name: "Troponin", value: "2.4", unit: "ng/mL", flag: "critical", trend: "up" },
    ],
    mapBenefits: [
      { mapRange: "<55", benefit: 32.1, color: "gray" },
      { mapRange: "55-60", benefit: 48.3, color: "gray" },
      { mapRange: "60-65", benefit: 61.2, color: "blue" },
      { mapRange: "65-70", benefit: 68.7, color: "green", isTarget: true },
      { mapRange: "70-75", benefit: 64.1, color: "blue" },
      { mapRange: "75-80", benefit: 55.8, color: "gray" },
      { mapRange: ">80", benefit: 44.2, color: "gray" },
    ],
    similarDecisions: [
      { action: "No fluid bolus given", count: 112, avgBenefit: 68.7, significance: "high" },
      { action: "Vasopressor escalation", count: 48, avgBenefit: 65.3, significance: "high" },
      { action: "250 mL crystalloid bolus", count: 27, avgBenefit: 52.1, significance: "low" },
    ],
    agentInsights: [
      "CRITICAL: Refractory shock on 2 vasopressors — consider stress-dose hydrocortisone",
      "Severe thrombocytopenia (42K) with DIC picture — check fibrinogen and D-dimer",
      "Troponin elevated at 2.4 — likely septic cardiomyopathy. Echo recommended urgently",
      "CRRT initiated appropriately for AKI with fluid overload. Target negative balance",
      "Endocarditis: CT surgery consult for valve replacement timing assessment",
    ],
    antibioticRegimen: [
      { name: "Vancomycin", dose: "1.5g", route: "IV", frequency: "Per levels", started: "2d ago" },
      { name: "Daptomycin", dose: "8mg/kg", route: "IV", frequency: "q24h", started: "1d ago" },
      { name: "Rifampin", dose: "300mg", route: "IV", frequency: "q8h", started: "1d ago" },
    ],
  },
  {
    id: "6384921_S33",
    age: 62,
    sex: "F",
    daysInHospital: 2,
    hr: 95,
    sbp: 105,
    dbp: 58,
    map: 67,
    lactate: 3.2,
    temp: 38.7,
    wbc: 18.1,
    creatinine: 1.6,
    urineOutput: "15 mL / 20 mL / 30 mL",
    crystalloids: 1500,
    fluidBalance: 680,
    comorbidities: ["Obesity (BMI 38)", "Type 2 diabetes", "Obstructive sleep apnea"],
    sepsisSource: "Pneumonia — community-acquired",
    sofa: 7,
    interventions: [
      { name: "Mechanical ventilation", active: false },
      { name: "Vasopressors", active: false },
      { name: "Circulatory support", active: false },
      { name: "CRRT", active: false },
    ],
    vasoactive: null,
    recommendation: {
      fluidBolus: "give",
      bolusExpectedBenefit: 79.4,
      noBolusExpectedBenefit: 68.1,
      vasopressor: null,
      mapTarget: "70-75",
      rationale:
        "Borderline hypotension with adequate urine output. 250 mL bolus recommended — 412 similar trajectories show fluid responsiveness at this MAP range. If MAP does not improve to >70 after 500 mL total, initiate norepinephrine.",
    },
    similarCount: 412,
    similarPatients: 91,
    matchQuality: "High",
    riskScore: 45,
    sepsisOnsetHour: 5,
    labs: [
      { name: "Hemoglobin", value: "10.8", unit: "g/dL", flag: "low", trend: "stable" },
      { name: "Platelets", value: "165", unit: "K/μL", trend: "stable" },
      { name: "BUN", value: "32", unit: "mg/dL", flag: "high", trend: "up" },
      { name: "pH", value: "7.33", unit: "", flag: "low", trend: "down" },
      { name: "pCO2", value: "35", unit: "mmHg", trend: "stable" },
      { name: "Bicarbonate", value: "19", unit: "mEq/L", flag: "low", trend: "down" },
      { name: "Procalcitonin", value: "8.4", unit: "ng/mL", flag: "high", trend: "up" },
      { name: "HbA1c", value: "9.2", unit: "%", flag: "high", trend: "stable" },
    ],
    mapBenefits: [
      { mapRange: "<55", benefit: 44.8, color: "gray" },
      { mapRange: "55-60", benefit: 56.2, color: "gray" },
      { mapRange: "60-65", benefit: 68.1, color: "blue" },
      { mapRange: "65-70", benefit: 75.4, color: "blue" },
      { mapRange: "70-75", benefit: 79.4, color: "green", isTarget: true },
      { mapRange: "75-80", benefit: 74.8, color: "blue" },
      { mapRange: ">80", benefit: 66.2, color: "gray" },
    ],
    similarDecisions: [
      { action: "250 mL crystalloid bolus", count: 245, avgBenefit: 79.4, significance: "high" },
      { action: "No fluid bolus given", count: 118, avgBenefit: 68.1, significance: "medium" },
      { action: "Vasopressor initiation", count: 49, avgBenefit: 72.3, significance: "medium" },
    ],
    agentInsights: [
      "Obesity (BMI 38) may mask clinical signs — recommend arterial line for accurate BP monitoring",
      "HbA1c 9.2% — poor glycemic control increases infection risk. Initiate insulin drip if glucose >180",
      "Community-acquired pneumonia: consider Legionella and pneumococcal urinary antigens",
      "OSA: if intubation required, anticipate difficult airway — alert anesthesia preemptively",
    ],
    antibioticRegimen: [
      { name: "Ceftriaxone", dose: "2g", route: "IV", frequency: "q24h", started: "1d ago" },
      { name: "Azithromycin", dose: "500mg", route: "IV", frequency: "q24h", started: "1d ago" },
    ],
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
  phenylephrine: number;
  fluidBolus: boolean;
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

    const phenylephrine = patient.vasoactive && i >= patient.sepsisOnsetHour + 2
      ? 0.5 + rand() * 1.5
      : 0;
    const fluidBolus = (i === patient.sepsisOnsetHour + 1 || i === patient.sepsisOnsetHour + 4) && patient.recommendation.fluidBolus === "give";

    points.push({
      time: label,
      map: Math.round(map),
      sbp: Math.round(map * 1.45 + rand() * 8),
      dbp: Math.round(map * 0.78 + rand() * 4),
      hr: Math.round(hr),
      phenylephrine: Math.round(phenylephrine * 100) / 100,
      fluidBolus,
    });
  }
  return points;
}

/* ============================================================
   VITALS CHART — Light theme, matching original design
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: VitalPoint } | null>(null);

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
    const step = Math.max(1, Math.floor(slicedData.length / 10));
    ctx.fillStyle = "#94a3b8";
    for (let i = 0; i < slicedData.length; i += step) {
      const x = padL + (chartW / (slicedData.length - 1)) * i;
      ctx.fillText(slicedData[i].time, x, h - 10);
    }

    const toY = (v: number) => padT + ((yMax - v) / (yMax - yMin)) * chartH;
    const toX = (i: number) => padL + (chartW / (slicedData.length - 1)) * i;

    // Sepsis onset line
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

    // Fluid bolus markers
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

    // Phenylephrine area (purple, subtle)
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

      // Phenylephrine line
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

    // SBP/DBP fill
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

    // Draw lines helper
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

    // Hover highlight
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
              <p className="text-blue-600 font-semibold">Fluid Bolus (≥250 mL)</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   MAIN DEMO COMPONENT
   ============================================================ */

type Tab = "overview" | "labs" | "agent" | "antibiotics";

export default function StriveDemo() {
  const [selectedPatientIdx, setSelectedPatientIdx] = useState(0);
  const [timeRange, setTimeRange] = useState<6 | 12 | 24>(24);
  const [showPatientList, setShowPatientList] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [agentThinking, setAgentThinking] = useState(false);
  const [agentMessages, setAgentMessages] = useState<string[]>([]);
  const [agentInput, setAgentInput] = useState("");
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const patient = PATIENTS[selectedPatientIdx];
  const vitals = useMemo(() => generateVitals(patient), [patient]);

  // Reset agent messages on patient change
  useEffect(() => {
    setAgentMessages([]);
    setActiveTab("overview");
  }, [selectedPatientIdx]);

  // Simulate agent thinking
  const askAgent = useCallback((question: string) => {
    if (!question.trim()) return;
    setAgentMessages(prev => [...prev, `You: ${question}`]);
    setAgentInput("");
    setAgentThinking(true);

    const responses: Record<string, string> = {
      default: `Based on analysis of ${patient.similarCount} similar trajectories from ${patient.similarPatients} patients: ${patient.recommendation.rationale}`,
      fluid: `Fluid recommendation for Patient #${patient.id}: ${patient.recommendation.fluidBolus === "give" ? "Administer 250 mL crystalloid bolus" : "Withhold fluid bolus"}. Expected benefit: ${Math.max(patient.recommendation.bolusExpectedBenefit, patient.recommendation.noBolusExpectedBenefit)}. ${patient.recommendation.rationale}`,
      mortality: `Current mortality risk score: ${patient.riskScore}%. SOFA score ${patient.sofa} places this patient in the ${patient.sofa > 10 ? "high" : patient.sofa > 6 ? "moderate" : "low"} risk category. Key risk factors: ${patient.comorbidities.join(", ")}. ${patient.labs.filter(l => l.flag === "critical").map(l => `${l.name} (${l.value}) is critically abnormal`).join(". ")}.`,
      vasopressor: patient.vasoactive
        ? `Current vasopressor: ${patient.vasoactive}. ${patient.recommendation.vasopressor || "No dose change recommended at this time."}. MAP target ${patient.recommendation.mapTarget} mmHg based on RL policy trained on 5M+ ICU hours.`
        : `No vasopressors currently active. ${patient.recommendation.vasopressor || "Vasopressor initiation not recommended at this time. MAP is currently " + patient.map + " mmHg, within acceptable range for this patient's trajectory."}`,
    };

    const lowerQ = question.toLowerCase();
    let response = responses.default;
    if (lowerQ.includes("fluid") || lowerQ.includes("bolus")) response = responses.fluid;
    else if (lowerQ.includes("mortality") || lowerQ.includes("risk") || lowerQ.includes("prognosis")) response = responses.mortality;
    else if (lowerQ.includes("vasopressor") || lowerQ.includes("norepinephrine") || lowerQ.includes("pressor")) response = responses.vasopressor;

    setTimeout(() => {
      setAgentMessages(prev => [...prev, `StriveMAP Agent: ${response}`]);
      setAgentThinking(false);
    }, 1500);
  }, [patient]);

  return (
    <div className="h-screen flex flex-col bg-white text-gray-900 overflow-hidden">
      {/* ═══════════════ TOP BAR ═══════════════ */}
      <header className="h-12 bg-white border-b border-gray-200 px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#00B894] flex items-center justify-center">
            <span className="text-white font-black text-xs">S</span>
          </div>
          <span className="font-bold text-base tracking-tight text-gray-900">Strive</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Patient Row ID{" "}
            <span className="font-mono font-bold text-gray-900">{patient.id}</span>
          </span>
          <a
            href="/pitch"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Pitch
          </a>
          <button
            onClick={() => setShowPatientList(!showPatientList)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00B894] text-white rounded-lg text-sm font-semibold hover:bg-[#00a383] transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
            Live Demo
          </button>

          {/* Patient dropdown */}
          {showPatientList && (
            <div className="absolute right-5 top-12 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 mb-2">SELECT PATIENT</p>
              </div>
              {PATIENTS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPatientIdx(i); setShowPatientList(false); }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${i === selectedPatientIdx ? "bg-[#00B894]/5" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${p.riskScore > 60 ? "bg-red-500" : p.riskScore > 30 ? "bg-amber-500" : "bg-green-500"}`} />
                      <div>
                        <span className="font-mono font-bold text-sm">{p.id}</span>
                        <span className="text-gray-400 ml-2 text-sm">{p.age}y {p.sex} — Day {p.daysInHospital}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-gray-400">{p.sepsisSource}</span>
                      <p className="text-xs font-semibold" style={{ color: p.riskScore > 60 ? "#ef4444" : p.riskScore > 30 ? "#f59e0b" : "#22c55e" }}>
                        SOFA {p.sofa} • Risk {p.riskScore}%
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
        <aside className="w-72 border-r border-gray-200 flex flex-col overflow-y-auto bg-white">
          {/* Similar decisions */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900">Similar decisions</h3>
              <span className={`text-xs font-bold ${patient.matchQuality === "High" ? "text-[#00B894]" : "text-amber-500"}`}>
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
            <p className="text-[10px] text-gray-400 mt-1">
              {patient.similarCount}+ of 500 decisions found
            </p>
          </div>

          {/* Patient info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div>
                <p className="text-xs text-gray-500">ID #{patient.id} •</p>
                <p className="text-sm font-bold">{patient.age} Years • {patient.sex}</p>
                <p className="text-xs text-gray-400">{patient.daysInHospital} day{patient.daysInHospital > 1 ? "s" : ""} in hospital</p>
              </div>
            </div>
          </div>

          {/* Current observations */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Current Observations and Interventions
            </h3>
            <div className="space-y-2">
              {[
                { label: "Heart Rate", value: `${patient.hr} bpm`, bold: true },
                { label: "BP", value: `${patient.sbp}/${patient.dbp} (${patient.map.toFixed(1)}) mmHg`, bold: true },
                { label: "Lactate", value: `${patient.lactate} mmol/L`, bold: true },
                { label: "Urine Output (last 3h)", value: patient.urineOutput, bold: false },
                { label: "Crystalloids", value: `${patient.crystalloids} mL`, bold: true },
                { label: "Fluid Balance (last 24h)", value: `${patient.fluidBalance > 0 ? "+" : ""}${patient.fluidBalance} mL`, bold: true, critical: Math.abs(patient.fluidBalance) > 2000 },
              ].map((v) => (
                <div key={v.label} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{v.label}</span>
                  <span className={`font-mono ${v.bold ? "font-bold" : ""} ${v.critical ? "text-red-500" : "text-gray-900"}`}>
                    {v.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Vasoactive agents */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Vasoactive Agents
            </h3>
            <p className="text-sm text-gray-400 italic">
              {patient.vasoactive || "No vasoactive agents"}
            </p>
          </div>

          {/* Interventions */}
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
              Current Interventions
            </h3>
            <div className="space-y-2">
              {patient.interventions.map((int) => (
                <div key={int.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{int.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${int.active ? "bg-[#00B894]/10 text-[#00B894]" : "bg-gray-100 text-gray-400"}`}>
                    {int.active ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Comorbidities */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Key Comorbidities
            </h3>
            {patient.comorbidities.map((c) => (
              <p key={c} className="text-sm text-gray-600">{c}</p>
            ))}
          </div>
        </aside>

        {/* ═══════════════ MAIN CONTENT ═══════════════ */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
          {/* Tab navigation */}
          <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-1 shrink-0">
            {(
              [
                ["overview", "Clinical Overview"],
                ["labs", "Lab Results"],
                ["antibiotics", "Antibiotic Regimen"],
                ["agent", "AI Agent"],
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
                {key === "agent" && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-[#00B894]/10 text-[#00B894] rounded-full font-bold">
                    NEW
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 p-6 space-y-5 overflow-y-auto">
            {/* ═══════════════ OVERVIEW TAB ═══════════════ */}
            {activeTab === "overview" && (
              <>
                {/* Vitals Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        Patient Haemodynamics During Hospital Stay
                      </h2>
                    </div>
                    <div className="flex items-center gap-1">
                      {([6, 12, 24] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTimeRange(t)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                            timeRange === t
                              ? "bg-[#00B894] text-white"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                          }`}
                        >
                          {t}h
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center gap-6 mb-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-red-500 rounded" />
                      MAP
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-purple-400 rounded" />
                      Phenylephrine (mcg/kg/min)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-px bg-blue-400 rounded" style={{ borderTop: "2px dashed #93c5fd" }} />
                      Fluid Bolus (≥250 mL)
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-px" style={{ borderTop: "2px dashed #93c5fd" }} />
                      SBP/DBP
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-0.5 bg-green-500 rounded" />
                      Heart Rate
                    </div>
                  </div>
                  <VitalsChart data={vitals} sepsisIndex={patient.sepsisOnsetHour} timeRange={timeRange} />
                </div>

                {/* Expected Benefit Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-1">
                    Expected Benefit – Mean Arterial Pressure &amp; Fluid Bolus
                  </h2>
                  <p className="text-xs text-gray-500 mb-3">
                    Mean Arterial Pressure observed in similar patients
                  </p>
                  {/* Legend */}
                  <div className="flex items-center gap-5 mb-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#00B894]" />
                      greatest Expected Benefit seen in at least 10% of the decisions
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      a sufficient number of decisions supporting MAP range
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                      not enough decisions to support left MAP range
                    </div>
                  </div>

                  {/* MAP Benefit Chart */}
                  <div>
                    <p className="text-xs text-gray-500 mb-3">Expected Benefit</p>
                    <div className="flex items-end gap-3 h-40 mb-2 px-4">
                      {patient.mapBenefits.map((d) => {
                        const barColor = d.color === "green" ? "#00B894" : d.color === "blue" ? "#60a5fa" : "#d1d5db";
                        const barH = (d.benefit / 100) * 140;
                        return (
                          <div key={d.mapRange} className="flex-1 flex flex-col items-center justify-end gap-1">
                            <span className="text-xs font-bold text-gray-700">{d.benefit.toFixed(1)}</span>
                            <div className="w-full flex justify-center">
                              <div
                                className="w-1 rounded-t transition-all relative group"
                                style={{ height: barH, backgroundColor: barColor }}
                              >
                                <div className="absolute -left-3 -right-3 top-0 bottom-0" style={{ backgroundColor: barColor, borderRadius: "2px 2px 0 0" }}>
                                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full" style={{ backgroundColor: barColor }} />
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-1 rounded-full" style={{ backgroundColor: barColor }} />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 px-4">
                      {patient.mapBenefits.map((d) => (
                        <div
                          key={d.mapRange}
                          className={`flex-1 text-center text-xs ${d.isTarget ? "font-bold text-[#00B894]" : "text-gray-500"}`}
                        >
                          {d.isTarget ? `[${d.mapRange}]` : d.mapRange}
                        </div>
                      ))}
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-2">MAP (mmHg)</p>
                  </div>
                </div>

                {/* Fluid Bolus Analysis of similar decisions */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4">
                    Fluid Bolus Analysis of similar decisions
                  </h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Summary</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Treatment Expected Benefit</th>
                        <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Significance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.similarDecisions.map((d) => (
                        <tr key={d.action} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                          <td className="py-3 text-gray-700">
                            {d.action}
                            <span className="text-gray-400 ml-2">({d.count} cases)</span>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-24 bg-gray-100 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{
                                    width: `${d.avgBenefit}%`,
                                    backgroundColor: d.significance === "high" ? "#00B894" : d.significance === "medium" ? "#60a5fa" : "#d1d5db",
                                  }}
                                />
                              </div>
                              <span className="font-mono font-bold w-12 text-right">{d.avgBenefit.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                              d.significance === "high" ? "text-amber-500" : d.significance === "medium" ? "text-amber-400" : "text-gray-400"
                            }`}>
                              {d.significance === "high" ? "🟡🟡" : d.significance === "medium" ? "🟡" : "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* AI Insights */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 rounded bg-[#00B894]/10 flex items-center justify-center">
                      <svg className="w-3 h-3 text-[#00B894]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">StriveMAP Clinical Insights</h2>
                    <span className="text-[10px] bg-[#00B894]/10 text-[#00B894] px-2 py-0.5 rounded-full font-bold">
                      RL-POWERED
                    </span>
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
                            {insight.startsWith("CRITICAL") ? "⚠" : "→"}
                          </span>
                          <p className={`text-sm ${insight.startsWith("CRITICAL") ? "text-red-700 font-semibold" : "text-gray-700"}`}>
                            {insight}
                          </p>
                        </div>
                        {expandedInsight === i && (
                          <p className="text-xs text-gray-500 mt-2 ml-5">
                            Based on {patient.similarCount} similar patient trajectories from {patient.similarPatients} patients.
                            Confidence: {patient.matchQuality === "High" ? "95%" : patient.matchQuality === "Medium" ? "82%" : "68%"}.
                            Model: RL policy v2.4 trained on 5M+ ICU hours.
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════ LABS TAB ═══════════════ */}
            {activeTab === "labs" && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-900 mb-4">Laboratory Results</h2>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-xs font-semibold text-gray-500 uppercase">Test</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Value</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Unit</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Flag</th>
                      <th className="text-right py-2 text-xs font-semibold text-gray-500 uppercase">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.labs.map((lab) => (
                      <tr key={lab.name} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 text-gray-700 font-medium">{lab.name}</td>
                        <td className={`py-3 text-right font-mono font-bold ${lab.flag === "critical" ? "text-red-600" : lab.flag ? "text-amber-600" : "text-gray-900"}`}>
                          {lab.value}
                        </td>
                        <td className="py-3 text-right text-gray-400">{lab.unit}</td>
                        <td className="py-3 text-right">
                          {lab.flag && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              lab.flag === "critical" ? "bg-red-100 text-red-600" : lab.flag === "high" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                            }`}>
                              {lab.flag.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`text-sm ${lab.trend === "up" ? "text-red-500" : lab.trend === "down" ? "text-blue-500" : "text-gray-400"}`}>
                            {lab.trend === "up" ? "↑" : lab.trend === "down" ? "↓" : "→"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Additional vitals */}
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className={`text-xl font-bold ${patient.temp > 38.5 ? "text-red-500" : "text-gray-900"}`}>{patient.temp}°C</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">WBC</p>
                    <p className={`text-xl font-bold ${patient.wbc > 15 ? "text-amber-500" : "text-gray-900"}`}>{patient.wbc} K/μL</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Creatinine</p>
                    <p className={`text-xl font-bold ${patient.creatinine > 2 ? "text-red-500" : "text-gray-900"}`}>{patient.creatinine} mg/dL</p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════ ANTIBIOTICS TAB ═══════════════ */}
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
                      {patient.antibioticRegimen.map((abx) => (
                        <tr key={abx.name} className="border-b border-gray-100">
                          <td className="py-3 font-medium text-gray-900">{abx.name}</td>
                          <td className="py-3 font-mono text-gray-700">{abx.dose}</td>
                          <td className="py-3 text-gray-700">{abx.route}</td>
                          <td className="py-3 text-gray-700">{abx.frequency}</td>
                          <td className="py-3 text-gray-500">{abx.started}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-amber-50 rounded-xl border border-amber-200 p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-amber-500 text-lg">⏱</span>
                    <div>
                      <p className="text-sm font-bold text-amber-700 mb-1">Time-Critical Alert</p>
                      <p className="text-sm text-amber-600">
                        Each hour delay in appropriate antibiotics is associated with 7.6% increase in
                        mortality. Ensure blood cultures obtained and empiric antibiotics administered
                        within 1 hour of sepsis recognition.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════ AGENT TAB ═══════════════ */}
            {activeTab === "agent" && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col" style={{ minHeight: 500 }}>
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#00B894] flex items-center justify-center">
                      <span className="text-white font-black text-[10px]">S</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-900">StriveMAP Clinical Agent</h2>
                    <span className="text-[10px] bg-[#00B894]/10 text-[#00B894] px-2 py-0.5 rounded-full font-bold">
                      BETA
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Ask questions about patient #{patient.id}. Powered by RL policy trained on 5M+ ICU hours from 60K+ patients.
                  </p>
                </div>

                {/* Quick actions */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-gray-400">Quick:</span>
                  {[
                    "Should I give a fluid bolus?",
                    "What is the mortality risk?",
                    "Vasopressor recommendation?",
                    "Why this MAP target?",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => askAgent(q)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div className="flex-1 p-5 space-y-3 overflow-y-auto">
                  {agentMessages.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 rounded-full bg-[#00B894]/10 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-[#00B894]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">Ask a clinical question about this patient</p>
                      <p className="text-xs text-gray-400 mt-1">The agent uses reinforcement learning, not LLM, for treatment decisions</p>
                    </div>
                  )}
                  {agentMessages.map((msg, i) => {
                    const isAgent = msg.startsWith("StriveMAP Agent:");
                    return (
                      <div key={i} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          isAgent
                            ? "bg-gray-50 border border-gray-200 text-gray-700"
                            : "bg-[#00B894] text-white"
                        }`}>
                          {isAgent ? msg.replace("StriveMAP Agent: ", "") : msg.replace("You: ", "")}
                        </div>
                      </div>
                    );
                  })}
                  {agentThinking && (
                    <div className="flex justify-start">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-500">
                        <span className="animate-pulse">Analyzing {patient.similarCount} similar trajectories...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={agentInput}
                      onChange={(e) => setAgentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && askAgent(agentInput)}
                      placeholder="Ask about fluid management, vasopressors, prognosis..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#00B894] focus:ring-1 focus:ring-[#00B894]/20"
                    />
                    <button
                      onClick={() => askAgent(agentInput)}
                      disabled={agentThinking}
                      className="px-4 py-2.5 bg-[#00B894] text-white rounded-lg text-sm font-semibold hover:bg-[#00a383] transition-colors disabled:opacity-50"
                    >
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between text-xs text-gray-400 shrink-0">
            <span>
              Clinicians should exercise their own clinical judgement. StriveMAP assists, human decides.
            </span>
            <span className="font-mono">
              StriveMAP v2.4.1 &copy; 2026 STRIVE Health — {patient.similarCount} similar decisions analysed
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
