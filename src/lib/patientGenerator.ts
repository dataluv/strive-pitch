/* ============================================================
   PROCEDURAL PATIENT GENERATOR
   Generates 120 realistic ICU sepsis patients from a seed.
   Each patient has full clinical data: vitals, labs, comorbidities,
   SOFA scores, risk scores, interventions, recommendations, etc.
   ============================================================ */

// Seeded PRNG (LCG)
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

// Pick from array using rng
function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, n);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function round1(v: number) {
  return Math.round(v * 10) / 10;
}

// ─── Types ───────────────────────────────────────────────────

export interface LabValue {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  flag?: "high" | "low" | "critical";
  trend?: "up" | "down" | "stable";
}

export interface FluidBolusDecision {
  mapRange: string;
  benefit: number;
  color: "green" | "blue" | "gray";
  isTarget?: boolean;
}

export interface SimilarDecisionSummary {
  action: string;
  count: number;
  avgBenefit: number;
  significance: "high" | "medium" | "low";
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: "M" | "F";
  weight: number;
  height: number;
  bmi: number;
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
  urineOutputValues: number[];
  crystalloids: number;
  fluidBalance: number;
  comorbidities: string[];
  sepsisSource: string;
  sofa: number;
  sofaComponents: { name: string; score: number; detail: string }[];
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
  acuity: "critical" | "serious" | "stable" | "improving";
  admitDiagnosis: string;
  allergies: string[];
  code: string;
  unitBed: string;
}

// ─── Reference Data ──────────────────────────────────────────

const FIRST_NAMES_M = ["James","Robert","John","Michael","David","William","Richard","Joseph","Thomas","Charles","Christopher","Daniel","Matthew","Anthony","Mark","Donald","Steven","Paul","Andrew","Joshua","Kenneth","Kevin","Brian","George","Timothy","Ronald","Edward","Jason","Jeffrey","Ryan","Jacob","Gary","Nicholas","Eric","Jonathan","Stephen","Larry","Justin","Scott","Brandon","Benjamin","Samuel","Raymond","Gregory","Frank","Patrick","Alexander","Jack","Dennis","Jerry"];
const FIRST_NAMES_F = ["Mary","Patricia","Jennifer","Linda","Barbara","Elizabeth","Susan","Jessica","Sarah","Karen","Lisa","Nancy","Betty","Margaret","Sandra","Ashley","Dorothy","Kimberly","Emily","Donna","Michelle","Carol","Amanda","Melissa","Deborah","Stephanie","Rebecca","Sharon","Laura","Cynthia","Kathleen","Amy","Angela","Shirley","Anna","Brenda","Pamela","Emma","Nicole","Helen","Samantha","Katherine","Christine","Debra","Rachel","Carolyn","Janet","Catherine","Maria","Heather"];
const LAST_NAMES = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts"];

const COMORBIDITIES = [
  "Congestive heart failure","Type 2 diabetes","Chronic kidney disease Stage III","Chronic kidney disease Stage IV",
  "Hypertension","Atrial fibrillation","COPD","Coronary artery disease","Cirrhosis",
  "Obesity","Obstructive sleep apnea","Peripheral vascular disease","History of stroke",
  "Chronic liver disease","Immunosuppression","HIV (on ART)","Hepatitis C",
  "End-stage renal disease on dialysis","Pulmonary hypertension","Aortic stenosis",
  "Rheumatoid arthritis","Lupus","History of DVT/PE","Dementia","Parkinson's disease",
  "Type 1 diabetes","Hypothyroidism","Hyperlipidemia","Asthma","Sickle cell disease",
];

const SEPSIS_SOURCES = [
  "Urinary tract","Pneumonia","Pneumonia — community-acquired","Pneumonia — ventilator-associated",
  "Abdominal — cholangitis","Abdominal — perforated viscus","Abdominal — diverticulitis",
  "Skin/soft tissue — cellulitis","Skin/soft tissue — necrotizing fasciitis",
  "Bloodstream — catheter-related","Endocarditis — MRSA","Endocarditis — MSSA",
  "Meningitis","Empyema","Prosthetic joint infection","Osteomyelitis",
  "Intra-abdominal abscess","Pyelonephritis","Surgical site infection",
  "C. difficile colitis",
];

const ALLERGIES = ["NKDA","Penicillin","Sulfa drugs","Cephalosporins","Contrast dye","Codeine","Morphine","Aspirin","Iodine","Latex","Vancomycin (Red Man)"];

const ANTIBIOTIC_REGIMENS: Record<string, { name: string; dose: string; route: string; frequency: string }[]> = {
  "Urinary tract": [
    { name: "Piperacillin-Tazobactam", dose: "4.5g", route: "IV", frequency: "q8h" },
    { name: "Vancomycin", dose: "1g", route: "IV", frequency: "q12h" },
  ],
  "Pneumonia": [
    { name: "Meropenem", dose: "1g", route: "IV", frequency: "q8h" },
    { name: "Levofloxacin", dose: "750mg", route: "IV", frequency: "q24h" },
  ],
  "Pneumonia — community-acquired": [
    { name: "Ceftriaxone", dose: "2g", route: "IV", frequency: "q24h" },
    { name: "Azithromycin", dose: "500mg", route: "IV", frequency: "q24h" },
  ],
  "Pneumonia — ventilator-associated": [
    { name: "Meropenem", dose: "1g", route: "IV", frequency: "q8h" },
    { name: "Vancomycin", dose: "1.5g", route: "IV", frequency: "Per levels" },
    { name: "Tobramycin", dose: "5mg/kg", route: "IV", frequency: "q24h" },
  ],
  "Abdominal — cholangitis": [
    { name: "Piperacillin-Tazobactam", dose: "4.5g", route: "IV", frequency: "q8h" },
    { name: "Metronidazole", dose: "500mg", route: "IV", frequency: "q8h" },
  ],
  "Abdominal — perforated viscus": [
    { name: "Meropenem", dose: "1g", route: "IV", frequency: "q8h" },
    { name: "Vancomycin", dose: "1g", route: "IV", frequency: "q12h" },
  ],
  "Abdominal — diverticulitis": [
    { name: "Ceftriaxone", dose: "2g", route: "IV", frequency: "q24h" },
    { name: "Metronidazole", dose: "500mg", route: "IV", frequency: "q8h" },
  ],
  "Skin/soft tissue — cellulitis": [
    { name: "Cefazolin", dose: "2g", route: "IV", frequency: "q8h" },
  ],
  "Skin/soft tissue — necrotizing fasciitis": [
    { name: "Meropenem", dose: "1g", route: "IV", frequency: "q8h" },
    { name: "Vancomycin", dose: "1.5g", route: "IV", frequency: "Per levels" },
    { name: "Clindamycin", dose: "900mg", route: "IV", frequency: "q8h" },
  ],
  "Bloodstream — catheter-related": [
    { name: "Vancomycin", dose: "1g", route: "IV", frequency: "q12h" },
    { name: "Cefepime", dose: "2g", route: "IV", frequency: "q8h" },
  ],
  "Endocarditis — MRSA": [
    { name: "Vancomycin", dose: "1.5g", route: "IV", frequency: "Per levels" },
    { name: "Daptomycin", dose: "8mg/kg", route: "IV", frequency: "q24h" },
    { name: "Rifampin", dose: "300mg", route: "IV", frequency: "q8h" },
  ],
  "Endocarditis — MSSA": [
    { name: "Nafcillin", dose: "2g", route: "IV", frequency: "q4h" },
    { name: "Gentamicin", dose: "1mg/kg", route: "IV", frequency: "q8h" },
  ],
  "Meningitis": [
    { name: "Ceftriaxone", dose: "2g", route: "IV", frequency: "q12h" },
    { name: "Vancomycin", dose: "1g", route: "IV", frequency: "q8h" },
    { name: "Ampicillin", dose: "2g", route: "IV", frequency: "q4h" },
  ],
  "default": [
    { name: "Piperacillin-Tazobactam", dose: "4.5g", route: "IV", frequency: "q8h" },
    { name: "Vancomycin", dose: "1g", route: "IV", frequency: "q12h" },
  ],
};

const UNITS = ["MICU","SICU","CCU","Neuro ICU","Burn ICU","Cardiac ICU"];

function getABX(source: string): { name: string; dose: string; route: string; frequency: string }[] {
  return ANTIBIOTIC_REGIMENS[source] || ANTIBIOTIC_REGIMENS["default"];
}

// ─── SOFA component calculation ─────────────────────────────

function calcSOFAComponents(patient: {
  map: number; lactate: number; creatinine: number; wbc: number;
  vasoactive: string | null; mechVent: boolean; platelets: number;
  bilirubin: number; gcs: number; pao2fio2: number; urineOut: number;
}) {
  const resp = patient.pao2fio2 < 100 ? 4 : patient.pao2fio2 < 200 ? 3 : patient.pao2fio2 < 300 ? 2 : patient.pao2fio2 < 400 ? 1 : 0;
  const coag = patient.platelets < 20 ? 4 : patient.platelets < 50 ? 3 : patient.platelets < 100 ? 2 : patient.platelets < 150 ? 1 : 0;
  const liver = patient.bilirubin > 12 ? 4 : patient.bilirubin > 6 ? 3 : patient.bilirubin > 2 ? 2 : patient.bilirubin > 1.2 ? 1 : 0;
  const cardio = patient.vasoactive ? (patient.map < 60 ? 4 : 3) : patient.map < 70 ? 1 : 0;
  const cns = patient.gcs <= 5 ? 4 : patient.gcs <= 9 ? 3 : patient.gcs <= 12 ? 2 : patient.gcs <= 14 ? 1 : 0;
  const renal = patient.creatinine > 5 || patient.urineOut < 200 ? 4 : patient.creatinine > 3.5 ? 3 : patient.creatinine > 2 ? 2 : patient.creatinine > 1.2 ? 1 : 0;
  return [
    { name: "Respiration", score: resp, detail: `PaO2/FiO2: ${patient.pao2fio2}` },
    { name: "Coagulation", score: coag, detail: `Platelets: ${patient.platelets} K/uL` },
    { name: "Liver", score: liver, detail: `Bilirubin: ${patient.bilirubin} mg/dL` },
    { name: "Cardiovascular", score: cardio, detail: patient.vasoactive || `MAP: ${patient.map} mmHg` },
    { name: "CNS", score: cns, detail: `GCS: ${patient.gcs}` },
    { name: "Renal", score: renal, detail: `Creatinine: ${patient.creatinine} mg/dL` },
  ];
}

// ─── Generate a single patient ──────────────────────────────

function generatePatient(index: number, seed: number): Patient {
  const rng = createRng(seed + index * 7919);

  const sex: "M" | "F" = rng() > 0.48 ? "M" : "F";
  const firstName = sex === "M" ? pick(FIRST_NAMES_M, rng) : pick(FIRST_NAMES_F, rng);
  const lastName = pick(LAST_NAMES, rng);
  const name = `${firstName} ${lastName}`;

  // Age distribution weighted toward elderly
  const age = Math.floor(25 + rng() * 15 + rng() * 30 + rng() * 25);
  const weight = sex === "M" ? Math.floor(65 + rng() * 45) : Math.floor(50 + rng() * 45);
  const height = sex === "M" ? Math.floor(165 + rng() * 20) : Math.floor(152 + rng() * 18);
  const bmi = round1(weight / ((height / 100) ** 2));

  const daysInHospital = Math.floor(1 + rng() * rng() * 14);

  // Acuity determines most clinical parameters
  const acuityRoll = rng();
  const acuity: Patient["acuity"] = acuityRoll < 0.2 ? "critical" : acuityRoll < 0.45 ? "serious" : acuityRoll < 0.75 ? "stable" : "improving";

  // Vitals based on acuity
  let hr: number, sbp: number, dbp: number, map: number, lactate: number, temp: number;
  switch (acuity) {
    case "critical":
      hr = Math.floor(110 + rng() * 30);
      map = Math.floor(48 + rng() * 15);
      lactate = round1(4 + rng() * 8);
      temp = round1(38.5 + rng() * 2);
      break;
    case "serious":
      hr = Math.floor(90 + rng() * 25);
      map = Math.floor(58 + rng() * 12);
      lactate = round1(2.5 + rng() * 4);
      temp = round1(38 + rng() * 1.5);
      break;
    case "stable":
      hr = Math.floor(75 + rng() * 20);
      map = Math.floor(68 + rng() * 15);
      lactate = round1(1.2 + rng() * 2.5);
      temp = round1(37 + rng() * 1.5);
      break;
    case "improving":
      hr = Math.floor(65 + rng() * 20);
      map = Math.floor(75 + rng() * 18);
      lactate = round1(0.8 + rng() * 1.5);
      temp = round1(36.8 + rng() * 0.8);
      break;
  }

  // Derive SBP/DBP from MAP
  const pp = Math.floor(30 + rng() * 25); // pulse pressure
  sbp = Math.floor(map * 1.35 + pp * 0.3 + rng() * 8);
  dbp = Math.floor(map * 0.82 - rng() * 5);

  // WBC
  const wbc = acuity === "critical" ? round1(18 + rng() * 15) :
              acuity === "serious" ? round1(12 + rng() * 10) :
              acuity === "stable" ? round1(8 + rng() * 10) :
              round1(5 + rng() * 8);

  // Creatinine
  const creatinine = acuity === "critical" ? round1(2 + rng() * 3) :
                     acuity === "serious" ? round1(1.2 + rng() * 2) :
                     round1(0.7 + rng() * 1.2);

  // Urine output
  const uo1 = acuity === "critical" ? Math.floor(rng() * 10) : Math.floor(10 + rng() * 50);
  const uo2 = acuity === "critical" ? Math.floor(rng() * 15) : Math.floor(15 + rng() * 55);
  const uo3 = acuity === "critical" ? Math.floor(rng() * 20) : Math.floor(20 + rng() * 60);
  const urineOutput = `${uo1} mL / ${uo2} mL / ${uo3} mL`;

  // Fluids
  const crystalloids = acuity === "critical" ? Math.floor(2000 + rng() * 3000) :
                       acuity === "serious" ? Math.floor(500 + rng() * 2000) :
                       Math.floor(rng() * 1000);
  const fluidBalance = acuity === "critical" ? Math.floor(1500 + rng() * 2500) :
                       acuity === "serious" ? Math.floor(-500 + rng() * 2000) :
                       Math.floor(-2000 + rng() * 1500);

  // Comorbidities
  const numComorbidities = Math.floor(1 + rng() * 3 + (age > 65 ? 1 : 0));
  const comorbidities = pickN(COMORBIDITIES, numComorbidities, rng);

  const sepsisSource = pick(SEPSIS_SOURCES, rng);
  const sepsisOnsetHour = Math.floor(2 + rng() * 8);

  // Interventions
  const mechVent = acuity === "critical" ? rng() > 0.2 : acuity === "serious" ? rng() > 0.6 : rng() > 0.9;
  const onVasopressors = acuity === "critical" ? rng() > 0.15 : acuity === "serious" ? rng() > 0.65 : false;
  const onCRRT = acuity === "critical" && creatinine > 3 ? rng() > 0.3 : false;
  const circSupport = acuity === "critical" && rng() > 0.8;

  const interventions = [
    { name: "Mechanical ventilation", active: mechVent },
    { name: "Vasopressors", active: onVasopressors },
    { name: "Circulatory support", active: circSupport },
    { name: "CRRT", active: onCRRT },
  ];

  // Vasoactive
  let vasoactive: string | null = null;
  if (onVasopressors) {
    const dose = round1(0.05 + rng() * 0.25);
    if (acuity === "critical" && rng() > 0.4) {
      vasoactive = `Norepinephrine ${dose} mcg/kg/min + Vasopressin 0.04 U/min`;
    } else {
      vasoactive = `Norepinephrine ${dose} mcg/kg/min`;
    }
  }

  // Labs
  const platelets = acuity === "critical" ? Math.floor(20 + rng() * 80) :
                    acuity === "serious" ? Math.floor(80 + rng() * 100) :
                    Math.floor(150 + rng() * 150);
  const bilirubin = acuity === "critical" ? round1(1 + rng() * 8) :
                    acuity === "serious" ? round1(0.5 + rng() * 3) :
                    round1(0.3 + rng() * 1.5);
  const gcs = acuity === "critical" ? Math.floor(3 + rng() * 8) :
              acuity === "serious" ? Math.floor(10 + rng() * 5) : 15;
  const pao2fio2 = acuity === "critical" ? Math.floor(80 + rng() * 150) :
                   acuity === "serious" ? Math.floor(200 + rng() * 150) :
                   Math.floor(350 + rng() * 150);

  const hemoglobin = round1(acuity === "critical" ? 7 + rng() * 3 : 9 + rng() * 5);
  const bun = Math.floor(acuity === "critical" ? 40 + rng() * 50 : 10 + rng() * 30);
  const ph = round1(acuity === "critical" ? 7.1 + rng() * 0.15 : acuity === "serious" ? 7.25 + rng() * 0.12 : 7.35 + rng() * 0.08) / 1;
  const phStr = ph.toFixed(2);
  const pco2 = Math.floor(acuity === "critical" ? 22 + rng() * 12 : 32 + rng() * 12);
  const bicarb = Math.floor(acuity === "critical" ? 8 + rng() * 8 : acuity === "serious" ? 16 + rng() * 6 : 22 + rng() * 4);
  const procal = round1(acuity === "critical" ? 10 + rng() * 40 : acuity === "serious" ? 2 + rng() * 12 : 0.1 + rng() * 3);
  const crp = Math.floor(acuity === "critical" ? 150 + rng() * 200 : acuity === "serious" ? 50 + rng() * 150 : 5 + rng() * 60);

  const flagVal = (val: number, lo: number, hi: number, critLo?: number, critHi?: number): LabValue["flag"] => {
    if (critLo !== undefined && val < critLo) return "critical";
    if (critHi !== undefined && val > critHi) return "critical";
    if (val < lo) return "low";
    if (val > hi) return "high";
    return undefined;
  };

  const trendForAcuity = (isGood: boolean): LabValue["trend"] => {
    if (acuity === "improving") return isGood ? "down" : "up";
    if (acuity === "critical") return isGood ? "up" : "down";
    return rng() > 0.5 ? "stable" : (rng() > 0.5 ? "up" : "down");
  };

  const labs: LabValue[] = [
    { name: "Hemoglobin", value: hemoglobin.toFixed(1), unit: "g/dL", normalRange: "12.0-17.5", flag: flagVal(hemoglobin, 12, 17.5, 7, undefined), trend: trendForAcuity(false) },
    { name: "Platelets", value: platelets.toString(), unit: "K/uL", normalRange: "150-400", flag: flagVal(platelets, 150, 400, 50, undefined), trend: trendForAcuity(false) },
    { name: "BUN", value: bun.toString(), unit: "mg/dL", normalRange: "7-20", flag: flagVal(bun, 7, 20, undefined, 60), trend: trendForAcuity(true) },
    { name: "pH", value: phStr, unit: "", normalRange: "7.35-7.45", flag: flagVal(ph, 7.35, 7.45, 7.2, undefined), trend: trendForAcuity(false) },
    { name: "pCO2", value: pco2.toString(), unit: "mmHg", normalRange: "35-45", flag: flagVal(pco2, 35, 45), trend: trendForAcuity(false) },
    { name: "Bicarbonate", value: bicarb.toString(), unit: "mEq/L", normalRange: "22-28", flag: flagVal(bicarb, 22, 28, 12, undefined), trend: trendForAcuity(false) },
    { name: "Procalcitonin", value: procal.toFixed(1), unit: "ng/mL", normalRange: "<0.5", flag: flagVal(procal, 0, 0.5, undefined, 10), trend: trendForAcuity(true) },
    { name: "CRP", value: crp.toString(), unit: "mg/L", normalRange: "<10", flag: flagVal(crp, 0, 10, undefined, 200), trend: trendForAcuity(true) },
  ];

  // Extra labs based on source
  if (sepsisSource.includes("biliary") || sepsisSource.includes("cholangitis") || sepsisSource.includes("liver")) {
    labs.push({ name: "Total Bilirubin", value: bilirubin.toFixed(1), unit: "mg/dL", normalRange: "0.1-1.2", flag: flagVal(bilirubin, 0.1, 1.2, undefined, 6), trend: trendForAcuity(true) });
  }
  if (sepsisSource.includes("Endocarditis") || acuity === "critical") {
    const troponin = round1(acuity === "critical" ? 0.5 + rng() * 3 : 0.01 + rng() * 0.5);
    labs.push({ name: "Troponin", value: troponin.toFixed(2), unit: "ng/mL", normalRange: "<0.04", flag: flagVal(troponin, 0, 0.04, undefined, 1), trend: trendForAcuity(true) });
  }

  // SOFA
  const sofaComponents = calcSOFAComponents({
    map, lactate, creatinine, wbc, vasoactive, mechVent, platelets, bilirubin, gcs, pao2fio2, urineOut: uo1 + uo2 + uo3,
  });
  const sofa = sofaComponents.reduce((s, c) => s + c.score, 0);

  // Risk score (mortality %)
  const riskScore = clamp(Math.floor(sofa * 3.5 + (age > 75 ? 10 : 0) + (lactate > 4 ? 15 : 0) + (mechVent ? 8 : 0) + rng() * 10), 2, 96);

  // Similar patients
  const similarCount = Math.floor(150 + rng() * 500);
  const similarPatients = Math.floor(30 + rng() * 120);
  const matchQuality: Patient["matchQuality"] = similarCount > 400 ? "High" : similarCount > 250 ? "Medium" : "Low";

  // MAP benefit ranges
  const optimalMapLow = acuity === "critical" ? 60 + Math.floor(rng() * 5) : 65 + Math.floor(rng() * 15);
  const optimalMapHigh = optimalMapLow + 5;
  const optimalBenefit = round1(65 + rng() * 25);
  const mapRanges = ["<55", "55-60", "60-65", "65-70", "70-75", "75-80", ">80"];
  const optimalIdx = mapRanges.findIndex(r => r === `${optimalMapLow}-${optimalMapHigh}`);
  const targetIdx = optimalIdx >= 0 ? optimalIdx : Math.floor(3 + rng() * 2);

  const mapBenefits: FluidBolusDecision[] = mapRanges.map((range, i) => {
    const dist = Math.abs(i - targetIdx);
    const benefit = round1(optimalBenefit - dist * (8 + rng() * 6));
    return {
      mapRange: range,
      benefit: clamp(benefit, 30, 95),
      color: i === targetIdx ? "green" as const : dist <= 1 ? "blue" as const : "gray" as const,
      isTarget: i === targetIdx,
    };
  });

  // Recommendation
  const shouldGive = map < 65 && lactate > 2 && crystalloids < 3000 && !comorbidities.includes("Congestive heart failure");
  const giveBenefit = round1(shouldGive ? optimalBenefit : optimalBenefit - 10 - rng() * 8);
  const withholdBenefit = round1(shouldGive ? optimalBenefit - 12 - rng() * 8 : optimalBenefit);
  const mapTarget = `${optimalMapLow}-${optimalMapHigh}`;

  let vasoRec: string | null = null;
  if (onVasopressors && map < 65) {
    vasoRec = `Increase norepinephrine to ${round1(0.15 + rng() * 0.15)} mcg/kg/min`;
  } else if (!onVasopressors && map < 60) {
    vasoRec = `Initiate norepinephrine at 0.05 mcg/kg/min`;
  }

  const bolusWord = shouldGive ? "give" : "withhold";
  const bestBenefit = Math.max(giveBenefit, withholdBenefit);
  const rationale = shouldGive
    ? `MAP ${map} mmHg with lactate ${lactate}. ${crystalloids < 2000 ? "Fluid-responsive phase" : "Cautious fluid challenge"}. ${similarCount} similar trajectories from ${similarPatients} patients support 250 mL crystalloid bolus. Expected benefit ${giveBenefit} vs ${withholdBenefit} for withholding. MAP target ${mapTarget} mmHg based on RL policy.`
    : `${comorbidities.includes("Congestive heart failure") ? "CHF history increases fluid overload risk. " : ""}${crystalloids > 2500 ? `Already received ${crystalloids} mL crystalloids. ` : ""}Among ${similarCount} similar decisions from ${similarPatients} patients, withholding fluid bolus was associated with higher expected benefit (${withholdBenefit} vs ${giveBenefit}). MAP target ${mapTarget} mmHg is optimal based on reinforcement learning policy.`;

  const recommendation = {
    fluidBolus: bolusWord as "give" | "withhold",
    bolusExpectedBenefit: giveBenefit,
    noBolusExpectedBenefit: withholdBenefit,
    vasopressor: vasoRec,
    mapTarget,
    rationale,
  };

  // Similar decisions
  const primaryAction = shouldGive ? "250 mL crystalloid bolus" : "No fluid bolus given";
  const secondaryAction = shouldGive ? "No fluid bolus given" : "250 mL crystalloid bolus";
  const primaryCount = Math.floor(similarCount * (0.5 + rng() * 0.2));
  const secondaryCount = Math.floor(similarCount * (0.15 + rng() * 0.15));
  const tertiaryCount = similarCount - primaryCount - secondaryCount;

  const tertiaryActions = ["500 mL crystalloid bolus", "Vasopressor escalation only", "Vasopressor initiation", "Oral fluids only", "Colloid bolus 250 mL"];
  const similarDecisions: SimilarDecisionSummary[] = [
    { action: primaryAction, count: primaryCount, avgBenefit: bestBenefit, significance: "high" },
    { action: secondaryAction, count: secondaryCount, avgBenefit: round1(bestBenefit - 8 - rng() * 8), significance: "medium" },
    { action: pick(tertiaryActions, rng), count: tertiaryCount, avgBenefit: round1(bestBenefit - 12 - rng() * 10), significance: "low" },
  ];

  // Agent insights
  const agentInsights: string[] = [];
  if (acuity === "critical") {
    agentInsights.push(`CRITICAL: ${map < 55 ? `MAP ${map} mmHg below minimum safe threshold. Immediate intervention required` : `Severe sepsis with SOFA ${sofa}. Multi-organ support required`}`);
  }
  if (lactate > 4) {
    agentInsights.push(`Lactate ${lactate} with ${trendForAcuity(true) === "up" ? "rising" : "stable"} trend indicates tissue hypoperfusion — ${shouldGive ? "fluid challenge is appropriate" : "vasopressor optimization preferred"}`);
  }
  if (comorbidities.includes("Congestive heart failure")) {
    agentInsights.push(`CHF history increases risk of fluid overload — withholding bolus preferred in 62% of similar cases`);
  }
  if (creatinine > 2) {
    agentInsights.push(`Renal impairment (Cr ${creatinine}) — ${onCRRT ? "CRRT initiated appropriately" : "monitor for CRRT indication if oliguric >6h"}`);
  }
  if (platelets < 100) {
    agentInsights.push(`Thrombocytopenia (${platelets}K) — ${platelets < 50 ? "consider DIC workup, check fibrinogen and D-dimer" : "monitor trend, hold anticoagulation"}`);
  }
  if (acuity === "improving") {
    agentInsights.push(`Patient on recovery trajectory — ${sofa <= 4 ? "consider ICU discharge planning" : "continue current management, trending toward recovery"}`);
  }
  if (comorbidities.includes("Type 2 diabetes") || comorbidities.includes("Type 1 diabetes")) {
    agentInsights.push(`Diabetes: initiate insulin drip if glucose >180. Poor glycemic control increases infection risk`);
  }
  if (mechVent) {
    agentInsights.push(`On mechanical ventilation — ${pao2fio2 < 200 ? "PaO2/FiO2 " + pao2fio2 + " consistent with ARDS, consider prone positioning" : "oxygenation adequate, assess for weaning readiness"}`);
  }
  // Ensure at least 3 insights
  const genericInsights = [
    `${similarCount} similar patient trajectories analyzed. Match quality: ${matchQuality}. Model confidence: ${matchQuality === "High" ? "95%" : matchQuality === "Medium" ? "82%" : "68%"}`,
    `Source control (${sepsisSource}) — ${daysInHospital > 3 ? "ongoing treatment" : "ensure definitive management within appropriate timeframe"}`,
    `Current SOFA ${sofa} — ${sofa > 10 ? "high mortality risk, aggressive management indicated" : sofa > 6 ? "moderate severity, close monitoring required" : "manageable severity, continue standard protocols"}`,
    `Antibiotic review: confirm cultures and adjust coverage based on sensitivities when available`,
  ];
  while (agentInsights.length < 4) {
    agentInsights.push(genericInsights[agentInsights.length % genericInsights.length]);
  }

  // Antibiotics
  const abxBase = getABX(sepsisSource);
  const startedTimes = ["1h ago", "2h ago", "4h ago", "6h ago", "12h ago", "1d ago", "2d ago", "3d ago", "5d ago"];
  const antibioticRegimen = abxBase.map(a => ({
    ...a,
    started: pick(startedTimes, rng),
  }));

  // ID
  const idNum = Math.floor(1000000 + rng() * 9000000);
  const idSuffix = Math.floor(10 + rng() * 80);
  const id = `${idNum}_S${idSuffix}`;

  const allergies = rng() > 0.6 ? pickN(ALLERGIES.filter(a => a !== "NKDA"), Math.floor(1 + rng() * 2), rng) : ["NKDA"];
  const unitBed = `${pick(UNITS, rng)} Bed ${Math.floor(1 + rng() * 30)}`;
  const code = acuity === "critical" ? "Full Code" : rng() > 0.8 ? "DNR/DNI" : "Full Code";

  const admitDiagnoses = [
    `Sepsis secondary to ${sepsisSource.toLowerCase()}`,
    `Septic shock — ${sepsisSource.toLowerCase()}`,
    `Severe sepsis with ${sepsisSource.toLowerCase()}`,
  ];
  const admitDiagnosis = acuity === "critical" ? admitDiagnoses[1] : pick(admitDiagnoses, rng);

  return {
    id, name, age, sex, weight, height, bmi, daysInHospital,
    hr, sbp, dbp, map, lactate, temp, wbc, creatinine,
    urineOutput, urineOutputValues: [uo1, uo2, uo3], crystalloids, fluidBalance,
    comorbidities, sepsisSource, sofa, sofaComponents, interventions,
    vasoactive, recommendation, similarCount, similarPatients, matchQuality,
    riskScore, sepsisOnsetHour, labs, mapBenefits, similarDecisions,
    agentInsights, antibioticRegimen, acuity, admitDiagnosis, allergies,
    code, unitBed,
  };
}

// ─── Generate all patients ──────────────────────────────────

const PATIENT_COUNT = 120;
const SEED = 42;

let _cachedPatients: Patient[] | null = null;

export function getAllPatients(): Patient[] {
  if (_cachedPatients) return _cachedPatients;
  const patients: Patient[] = [];
  for (let i = 0; i < PATIENT_COUNT; i++) {
    patients.push(generatePatient(i, SEED));
  }
  _cachedPatients = patients;
  return patients;
}

// ─── Vitals time series ─────────────────────────────────────

export interface VitalPoint {
  time: string;
  map: number;
  sbp: number;
  dbp: number;
  hr: number;
  phenylephrine: number;
  fluidBolus: boolean;
}

export function generateVitals(patient: Patient): VitalPoint[] {
  const points: VitalPoint[] = [];
  const seed = patient.id.charCodeAt(0) + patient.age + patient.id.charCodeAt(3);
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

    let mapVal: number, hrVal: number;
    if (preSepsis) {
      mapVal = patient.map + 15 + rand() * 8;
      hrVal = patient.hr - 15 + rand() * 6;
    } else if (afterRecovery) {
      mapVal = patient.map + 5 + rand() * 10;
      hrVal = patient.hr - 5 + rand() * 8;
    } else {
      const severity = Math.min(1, (i - patient.sepsisOnsetHour) / 8);
      mapVal = patient.map + 10 * (1 - severity) + rand() * 8 - 4;
      hrVal = patient.hr + 15 * severity + rand() * 10 - 5;
    }

    const phenylephrine = patient.vasoactive && i >= patient.sepsisOnsetHour + 2
      ? 0.5 + rand() * 1.5
      : 0;
    const fluidBolus = (i === patient.sepsisOnsetHour + 1 || i === patient.sepsisOnsetHour + 4) && patient.recommendation.fluidBolus === "give";

    points.push({
      time: label,
      map: Math.round(mapVal),
      sbp: Math.round(mapVal * 1.45 + rand() * 8),
      dbp: Math.round(mapVal * 0.78 + rand() * 4),
      hr: Math.round(hrVal),
      phenylephrine: Math.round(phenylephrine * 100) / 100,
      fluidBolus,
    });
  }
  return points;
}

// ─── Statistics helpers for clickable comparisons ───────────

export interface DistributionStats {
  mean: number;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  values: number[];
  histogram: { label: string; count: number; pct: number }[];
}

export function computeDistribution(values: number[], binCount = 8): DistributionStats {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const p25 = sorted[Math.floor(n * 0.25)];
  const p75 = sorted[Math.floor(n * 0.75)];
  const min = sorted[0];
  const max = sorted[n - 1];

  const binWidth = (max - min) / binCount || 1;
  const bins: number[] = new Array(binCount).fill(0);
  for (const v of values) {
    const idx = Math.min(binCount - 1, Math.floor((v - min) / binWidth));
    bins[idx]++;
  }
  const histogram = bins.map((count, i) => ({
    label: `${round1(min + i * binWidth)}-${round1(min + (i + 1) * binWidth)}`,
    count,
    pct: Math.round((count / n) * 100),
  }));

  return { mean: round1(mean), median: round1(median), p25: round1(p25), p75: round1(p75), min: round1(min), max: round1(max), values, histogram };
}

export function getLabDistribution(patients: Patient[], labName: string): DistributionStats {
  const vals: number[] = [];
  for (const p of patients) {
    const lab = p.labs.find(l => l.name === labName);
    if (lab) vals.push(parseFloat(lab.value));
  }
  return computeDistribution(vals);
}

export function getVitalDistribution(patients: Patient[], vital: "hr" | "sbp" | "dbp" | "map" | "lactate" | "temp" | "wbc" | "creatinine" | "sofa" | "riskScore"): DistributionStats {
  return computeDistribution(patients.map(p => p[vital]));
}

export function getOutcomesByIntervention(patients: Patient[], interventionName: string): { with: { count: number; avgRisk: number; avgSOFA: number }; without: { count: number; avgRisk: number; avgSOFA: number } } {
  const withInt = patients.filter(p => p.interventions.find(i => i.name === interventionName && i.active));
  const withoutInt = patients.filter(p => !p.interventions.find(i => i.name === interventionName && i.active));

  const avg = (arr: Patient[], key: "riskScore" | "sofa") => arr.length ? round1(arr.reduce((s, p) => s + p[key], 0) / arr.length) : 0;

  return {
    with: { count: withInt.length, avgRisk: avg(withInt, "riskScore"), avgSOFA: avg(withInt, "sofa") },
    without: { count: withoutInt.length, avgRisk: avg(withoutInt, "riskScore"), avgSOFA: avg(withoutInt, "sofa") },
  };
}

export function getSofaMortalityCorrelation(patients: Patient[]): { sofa: number; avgMortality: number; count: number }[] {
  const groups: Record<number, number[]> = {};
  for (const p of patients) {
    const s = p.sofa;
    if (!groups[s]) groups[s] = [];
    groups[s].push(p.riskScore);
  }
  return Object.entries(groups)
    .map(([sofa, risks]) => ({
      sofa: parseInt(sofa),
      avgMortality: round1(risks.reduce((s, r) => s + r, 0) / risks.length),
      count: risks.length,
    }))
    .sort((a, b) => a.sofa - b.sofa);
}
