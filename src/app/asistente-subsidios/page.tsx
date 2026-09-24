// src/app/asistente-subsidios/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks";
import { REGION_MAP } from "@/data/regions";

const DS19_COMMUNES_PERIPHERAL: Record<string, { key: string; label: string; isPeripheral: boolean }[]> = {
  "arica-y-parinacota": [
    { key: "arica", label: "Arica", isPeripheral: false }
  ],
  "tarapaca": [
    { key: "iquique", label: "Iquique (Zona Urbana)", isPeripheral: false },
    { key: "alto-hospicio", label: "Alto Hospicio (Otras Comunas)", isPeripheral: true }
  ],
  "antofagasta": [
    { key: "antofagasta", label: "Antofagasta (Zona Urbana)", isPeripheral: false },
    { key: "calama", label: "Calama (Zona Urbana)", isPeripheral: false }
  ],
  "atacama": [
    { key: "copiapo", label: "Copiapó (Zona Urbana)", isPeripheral: false }
  ],
  "coquimbo": [
    { key: "la-serena", label: "La Serena (Otras Comunas)", isPeripheral: true },
    { key: "coquimbo", label: "Coquimbo (Zona Urbana)", isPeripheral: false },
    { key: "ovalle", label: "Ovalle (Otras Comunas)", isPeripheral: true }
  ],
  "valparaiso": [
    { key: "valparaiso", label: "Valparaíso (Zona Urbana)", isPeripheral: false },
    { key: "vina-del-mar", label: "Viña del Mar (Zona Urbana)", isPeripheral: false },
    { key: "quilpue", label: "Quilpué (Otras Comunas)", isPeripheral: true },
    { key: "quillota", label: "Quillota (Otras Comunas)", isPeripheral: true },
    { key: "casablanca", label: "Casablanca (Otras Comunas)", isPeripheral: true },
    { key: "villa-alemana", label: "Villa Alemana (Otras Comunas)", isPeripheral: true },
    { key: "san-felipe", label: "San Felipe (Otras Comunas)", isPeripheral: true },
    { key: "limache", label: "Limache (Otras Comunas)", isPeripheral: true },
    { key: "la-ligua", label: "La Ligua (Otras Comunas)", isPeripheral: true },
    { key: "los-andes", label: "Los Andes (Otras Comunas)", isPeripheral: true },
    { key: "cartagena", label: "Cartagena (Otras Comunas)", isPeripheral: true },
    { key: "el-tabo", label: "El Tabo (Otras Comunas)", isPeripheral: true }
  ],
  "metropolitana": [
    { key: "santiago", label: "Gran Santiago (Provincia Urbana)", isPeripheral: false },
    { key: "melipilla", label: "Melipilla (Otras Comunas)", isPeripheral: true },
    { key: "padre-hurtado", label: "Padre Hurtado (Otras Comunas)", isPeripheral: true },
    { key: "el-monte", label: "El Monte (Otras Comunas)", isPeripheral: true },
    { key: "lampa", label: "Lampa (Otras Comunas)", isPeripheral: true },
    { key: "colina", label: "Colina (Otras Comunas)", isPeripheral: true },
    { key: "batuco", label: "Batuco (Otras Comunas)", isPeripheral: true }
  ],
  "biobio": [
    { key: "concepcion", label: "Concepción (Zona Urbana)", isPeripheral: false },
    { key: "los-angeles", label: "Los Ángeles (Zona Urbana)", isPeripheral: false },
    { key: "penco", label: "Penco (Otras Comunas)", isPeripheral: true },
    { key: "san-pedro-de-la-paz", label: "San Pedro de la Paz (Otras Comunas)", isPeripheral: true },
    { key: "chiguayante", label: "Chiguayante (Otras Comunas)", isPeripheral: true },
    { key: "curanilahue", label: "Curanilahue (Otras Comunas)", isPeripheral: true },
    { key: "talcahuano", label: "Talcahuano (Otras Comunas)", isPeripheral: true }
  ],
  "los-lagos": [
    { key: "castro", label: "Chiloé - Castro (Zona Urbana)", isPeripheral: false }
  ]
};

export default function AsistenteSubsidiosPage() {
  // Estado para el perfil: "A" (Descubrimiento), "B" (Simulación Rápida) o null (Sin seleccionar)
  const [profile, setProfile] = useState<"A" | "B" | null>(null);
  
  // Estado general para pasos
  const [step, setStep] = useState<number>(1);
  
  // Datos de la UF y banco
  const [ufValue, setUfValue] = useState<number>(DEFAULT_UF_VALUE);
  
  // --- Estados de Perfil A (Descubrimiento) ---
  const [familyType, setFamilyType] = useState<"familia" | "solo" | "">("");
  const [knowsRSH, setKnowsRSH] = useState<"si" | "no" | "">("");
  const [rshTramo, setRshTramo] = useState<"40" | "60" | "80" | "90" | "100" | "">("");
  
  // Mini-calculadora RSH
  const [rshMembers, setRshMembers] = useState<string>("3");
  const [rshIncome, setRshIncome] = useState<string>("");
  const [calculatedRsh, setCalculatedRsh] = useState<"40" | "60" | "80" | "90" | "100" | "">("");

  // Región e Ingreso para Perfil A
  const [regionA, setRegionA] = useState<string>("metropolitana");
  const [incomeCLPA, setIncomeCLPA] = useState<string>("");

  // Ahorro Perfil A
  const [savingsUF, setSavingsUF] = useState<string>("");
  const [savingsCLPA, setSavingsCLPA] = useState<string>("");

  // Controles dinámicos de Resultados Perfil A
  const [loanTermA, setLoanTermA] = useState<string>("25");
  const [isYoungSingleA, setIsYoungSingleA] = useState<boolean>(false);
  const [selectedBankA, setSelectedBankA] = useState<string>("BancoEstado");
  const [filterCategoryA, setFilterCategoryA] = useState<"todos" | "subsidio" | "nueva" | "usada">("todos");
  const [viewModeA, setViewModeA] = useState<"grid" | "horizontal">("grid");

  // --- Estados de Perfil B (Simulación Avanzada) ---
  const [incomeCLPB, setIncomeCLPB] = useState<string>("");
  const [savingsUFB, setSavingsUFB] = useState<string>("");
  const [savingsCLPB, setSavingsCLPB] = useState<string>("");
  const [propertyTypeB, setPropertyTypeB] = useState<"casa" | "depto" | "ambos">("ambos");
  const [isUrbanB, setIsUrbanB] = useState<boolean>(true);
  const [selectedSubsidyB, setSelectedSubsidyB] = useState<string>("none");
  const [loanTermB, setLoanTermB] = useState<string>("25");
  const [isYoungSingleB, setIsYoungSingleB] = useState<boolean>(false);
  const [selectedBankB, setSelectedBankB] = useState<string>("");
  const [locationB, setLocationB] = useState<string>("metropolitana");
  const [selectedCommuneB, setSelectedCommuneB] = useState<string>("");
  const [resultsB, setResultsB] = useState<any>(null);
  const [filterCategoryB, setFilterCategoryB] = useState<"todos" | "subsidio" | "nueva" | "usada">("todos");
  const [viewModeB, setViewModeB] = useState<"grid" | "horizontal">("grid");

  // Inicializar la UF y detectar perfil desde la URL
  useEffect(() => {
    async function init() {
      const uf = await fetchUFValue();
      if (uf && uf > 0) setUfValue(uf);
    }
    init();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const p = params.get("profile");
      if (p === "A" || p === "B") {
        setProfile(p);
        setStep(1);
      }
    }
  }, []);

  // Sincronizar renta y tramo de RSH de forma automática
  useEffect(() => {
    setIncomeCLPA(rshIncome);
  }, [rshIncome]);

  // Sincronizar integrantes de RSH si postula solo
  useEffect(() => {
    if (familyType === "solo") {
      setRshMembers("1");
    } else if (familyType === "familia" && rshMembers === "1") {
      setRshMembers("3");
    }
  }, [familyType]);

  // Sincronizar comuna al cambiar de región en Perfil B
  useEffect(() => {
    const list = DS19_COMMUNES_PERIPHERAL[locationB];
    if (list && list.length > 0) {
      setSelectedCommuneB(list[0].key);
    } else {
      setSelectedCommuneB("");
    }
  }, [locationB]);

  useEffect(() => {
    setRshTramo(calculatedRsh);
  }, [calculatedRsh]);

  // Calcular la estimación del RSH de forma dinámica en Perfil A
  useEffect(() => {
    const incomeVal = parseFloat(rshIncome);
    const membersVal = parseInt(rshMembers);
    if (!isNaN(incomeVal) && !isNaN(membersVal) && membersVal > 0) {
      const perCapita = incomeVal / membersVal;
      if (perCapita < 246960) {
        setCalculatedRsh("40");
      } else if (perCapita < 398493) {
        setCalculatedRsh("60");
      } else if (perCapita < 699720) {
        setCalculatedRsh("80");
      } else if (perCapita < 1151624) {
        setCalculatedRsh("90");
      } else {
        setCalculatedRsh("100");
      }
    } else {
      setCalculatedRsh("");
    }
  }, [rshIncome, rshMembers]);

  // Reiniciar el asistente
  const handleRestart = () => {
    setStep(1);
    setFamilyType("");
    setKnowsRSH("");
    setRshTramo("");
    setRshMembers("3");
    setRshIncome("");
    setCalculatedRsh("");
    setRegionA("metropolitana");
    setIncomeCLPA("");
    setSavingsUF("");
    setSavingsCLPA("");
    setLoanTermA("25");
    setIsYoungSingleA(false);
    setSelectedBankA("BancoEstado");
    setIncomeCLPB("");
    setSavingsUFB("");
    setSavingsCLPB("");
    setPropertyTypeB("ambos");
    setIsUrbanB(true);
    setSelectedSubsidyB("none");
    setLoanTermB("25");
    setIsYoungSingleB(false);
    setSelectedBankB("");
    setLocationB("metropolitana");
    setResultsB(null);
  };

  // --- NAVEGACIÓN ---
  const handleNextStep = () => {
    setStep((prev) => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      setProfile(null);
    }
  };

  // --- MATRIZ DE ZONAS GEOGRÁFICAS ---
  const getDS1Zone = (reg: string) => {
    if (["arica-y-parinacota", "tarapaca", "antofagasta", "atacama"].includes(reg)) {
      return "north";
    }
    if (["aysen", "magallanes"].includes(reg)) {
      return "south";
    }
    return "none";
  };

  const getDS19LocationZone = (reg: string) => {
    if (["aysen", "magallanes"].includes(reg)) {
      return "sur_islas";
    }
    if (["arica-y-parinacota", "tarapaca", "antofagasta", "atacama", "metropolitana"].includes(reg)) {
      return "urbana_norte_stgo";
    }
    return "regular";
  };

  // --- FÓRMULAS DE TOPES DE SUBSIDIO VARIABLE ---
  const calculateDS1T2Max = (maxLoanUF: number, savings: number, location: string) => {
    const baseCapacity = maxLoanUF + savings;
    let maxPropertyValue = 0;
    let subsidy = 0;
    if (location === 'none') {
      const projected = (baseCapacity + 550 + (0.375 * 800)) / 1.375;
      if (projected <= 800) { maxPropertyValue = baseCapacity + 550; subsidy = 550; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 550 - ((projected - 800) * 0.375); }
      else { maxPropertyValue = baseCapacity + 250; subsidy = 250; }
    } else if (location === 'north') {
      const projected = (baseCapacity + 650 + (0.375 * 800)) / 1.375;
      if (projected <= 800) { maxPropertyValue = baseCapacity + 650; subsidy = 650; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 650 - ((projected - 800) * 0.375); }
      else { maxPropertyValue = baseCapacity + 350; subsidy = 350; }
    } else {
      const projected = (baseCapacity + 700 + (0.375 * 800)) / 1.375;
      if (projected <= 800) { maxPropertyValue = baseCapacity + 700; subsidy = 700; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 700 - ((projected - 800) * 0.375); }
      else { maxPropertyValue = baseCapacity + 400; subsidy = 400; }
    }
    if (maxPropertyValue > 1600) maxPropertyValue = 1600;
    return { maxHouseUF: maxPropertyValue, subsidyUF: subsidy };
  };

  const calculateDS1T3Max = (maxLoanUF: number, savings: number, location: string) => {
    const baseCapacity = maxLoanUF + savings;
    let maxPropertyValue = 0;
    let subsidy = 0;
    if (location === 'none') {
      const projected = (baseCapacity + 850) / 1.375;
      if (projected <= 1200) { maxPropertyValue = baseCapacity + 400; subsidy = 400; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 850 - (0.375 * projected); }
      else { maxPropertyValue = baseCapacity + 250; subsidy = 250; }
    } else if (location === 'north') {
      const projected = (baseCapacity + 500 + (1200 * (1/7))) / (8/7);
      if (projected <= 1200) { maxPropertyValue = baseCapacity + 500; subsidy = 500; }
      else if (projected <= 2600) { maxPropertyValue = projected; subsidy = 500 - ((projected - 1200) * (1/7)); }
      else { maxPropertyValue = baseCapacity + 300; subsidy = 300; }
    } else {
      const projected = (baseCapacity + 550 + (1200 * (1/7))) / (8/7);
      if (projected <= 1200) { maxPropertyValue = baseCapacity + 550; subsidy = 550; }
      else if (projected <= 2600) { maxPropertyValue = projected; subsidy = 550 - ((projected - 1200) * (1/7)); }
      else { maxPropertyValue = baseCapacity + 350; subsidy = 350; }
    }
    const legalMax = (location === 'none') ? 2200 : 2600;
    if (maxPropertyValue > legalMax) maxPropertyValue = legalMax;
    return { maxHouseUF: maxPropertyValue, subsidyUF: subsidy };
  };

  const calculateDS1T2MaxWithDS15 = (maxLoanUF: number, savings: number, location: string) => {
    // DS15 para Tramo 2 otorga un bono de 150 UF y sube el tope a 3000 UF
    const baseCapacity = maxLoanUF + savings + 150;
    let maxPropertyValue = 0;
    let subsidy = 0;
    if (location === 'none') {
      const projected = (baseCapacity + 550 + (0.375 * 800)) / 1.375;
      if (projected <= 800) { maxPropertyValue = baseCapacity + 550; subsidy = 550; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 550 - ((projected - 800) * 0.375); }
      else { maxPropertyValue = baseCapacity + 250; subsidy = 250; }
    } else if (location === 'north') {
      const projected = (baseCapacity + 650 + (0.375 * 800)) / 1.375;
      if (projected <= 800) { maxPropertyValue = baseCapacity + 650; subsidy = 650; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 650 - ((projected - 800) * 0.375); }
      else { maxPropertyValue = baseCapacity + 350; subsidy = 350; }
    } else {
      const projected = (baseCapacity + 700 + (0.375 * 800)) / 1.375;
      if (projected <= 800) { maxPropertyValue = baseCapacity + 700; subsidy = 700; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 700 - ((projected - 800) * 0.375); }
      else { maxPropertyValue = baseCapacity + 400; subsidy = 400; }
    }
    if (maxPropertyValue > 3000) maxPropertyValue = 3000;
    return { maxHouseUF: maxPropertyValue, subsidyUF: subsidy + 150 };
  };

  const calculateDS1T3MaxWithDS15 = (maxLoanUF: number, savings: number, location: string) => {
    // DS15 para Tramo 3 otorga un bono de 150 UF y sube el tope a 3000 UF
    const baseCapacity = maxLoanUF + savings + 150;
    let maxPropertyValue = 0;
    let subsidy = 0;
    if (location === 'none') {
      const projected = (baseCapacity + 850) / 1.375;
      if (projected <= 1200) { maxPropertyValue = baseCapacity + 400; subsidy = 400; }
      else if (projected <= 1600) { maxPropertyValue = projected; subsidy = 850 - (0.375 * projected); }
      else { maxPropertyValue = baseCapacity + 250; subsidy = 250; }
    } else if (location === 'north') {
      const projected = (baseCapacity + 500 + (1200 * (1/7))) / (8/7);
      if (projected <= 1200) { maxPropertyValue = baseCapacity + 500; subsidy = 500; }
      else if (projected <= 2600) { maxPropertyValue = projected; subsidy = 500 - ((projected - 1200) * (1/7)); }
      else { maxPropertyValue = baseCapacity + 300; subsidy = 300; }
    } else {
      const projected = (baseCapacity + 550 + (1200 * (1/7))) / (8/7);
      if (projected <= 1200) { maxPropertyValue = baseCapacity + 550; subsidy = 550; }
      else if (projected <= 2600) { maxPropertyValue = projected; subsidy = 550 - ((projected - 1200) * (1/7)); }
      else { maxPropertyValue = baseCapacity + 350; subsidy = 350; }
    }
    if (maxPropertyValue > 3000) maxPropertyValue = 3000;
    return { maxHouseUF: maxPropertyValue, subsidyUF: subsidy + 150 };
  };

  const handleSavingsUFChange = (val: string) => {
    setSavingsUF(val);
    const uf = parseFloat(val);
    if (!isNaN(uf) && ufValue > 0) {
      setSavingsCLPA((uf * ufValue).toFixed(0));
    } else {
      setSavingsCLPA("");
    }
  };

  const handleSavingsCLPChange = (val: string) => {
    setSavingsCLPA(val);
    const clp = parseFloat(val);
    if (!isNaN(clp) && ufValue > 0) {
      setSavingsUF((clp / ufValue).toFixed(2));
    } else {
      setSavingsUF("");
    }
  };

  const handleSavingsUFBChange = (val: string) => {
    setSavingsUFB(val);
    const uf = parseFloat(val);
    if (!isNaN(uf) && ufValue > 0) {
      setSavingsCLPB((uf * ufValue).toFixed(0));
    } else {
      setSavingsCLPB("");
    }
  };

  const handleSavingsCLPBChange = (val: string) => {
    setSavingsCLPB(val);
    const clp = parseFloat(val);
    if (!isNaN(clp) && ufValue > 0) {
      setSavingsUFB((clp / ufValue).toFixed(2));
    }
  };

  // --- CÁLCULO DINÁMICO DE MULTI-RECOMENDACIONES PERFIL A ---
  const getDynamicRecommendationsA = () => {
    const savings = parseFloat(savingsUF) || 0;
    const income = parseFloat(incomeCLPA) || 0;
    const term = parseInt(loanTermA) || 25;
    const isYoungSingle = isYoungSingleA;
    const bankKey = selectedBankA || "BancoEstado";

    const bankData = BANKS[bankKey] || BANKS["BancoEstado"];
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const maxMonthlyPaymentUF = (income / ufValue) / incomeMultiplier;

    // Tasa bancaria
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(1000, term) : (bankData.tasaBase || 0.0425);
    const descuento = bankData.descuentoDS15 !== undefined ? bankData.descuentoDS15 : 0;
    const tasaDS15 = tasaOriginal - descuento;

    const monthlyRateNormal = tasaOriginal / 12;
    const monthlyRateDS15 = tasaDS15 / 12;
    const totalPayments = term * 12;

    const maxLoanUFNormal = monthlyRateNormal > 0 
      ? maxMonthlyPaymentUF * ((1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) / monthlyRateNormal)
      : 0;

    const maxLoanUFDS15 = monthlyRateDS15 > 0 
      ? maxMonthlyPaymentUF * ((1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) / monthlyRateDS15)
      : 0;

    const ds1Zone = getDS1Zone(regionA);
    const ds19Zone = getDS19LocationZone(regionA);

    const hhSize = familyType === "solo" ? 1 : (parseInt(rshMembers) || 3);
    const rshNum = parseInt(rshTramo) || 100;

    const checkDS1T3IncomeLimit = (inc: number, sz: number, loc: string) => {
      const limitsNorthSouth = [2589712, 3386546, 3705280, 4204014];
      const limitsRegular = [1992086, 2788921, 3107655, 3426388];
      const limits = (loc === "north" || loc === "south") ? limitsNorthSouth : limitsRegular;
      const idx = Math.min(sz - 1, 3);
      return inc <= limits[idx];
    };

    const checkDS1T4IncomeLimit = (inc: number, sz: number) => {
      const baseLimits = [1992086, 2788921, 3107655, 3426388];
      const idx = Math.min(sz - 1, 3);
      return inc <= (baseLimits[idx] * 1.8);
    };

    const meetsDS1T3Limit = checkDS1T3IncomeLimit(income, hhSize, ds1Zone);
    const meetsDS1T4Limit = checkDS1T4IncomeLimit(income, hhSize);

    const cards: any[] = [];

    // Topes y subsidios geográficos DS19
    const capVul = ds19Zone === "sur_islas" ? 2000 : 1550;
    const subVul = ds19Zone === "sur_islas" ? 1700 : (ds19Zone === "urbana_norte_stgo" ? 1250 : 1150);

    const capRural = ds19Zone === "sur_islas" ? 2400 : (ds19Zone === "urbana_norte_stgo" ? 1900 : 1800);
    const subRural = (ds19Zone === "sur_islas" ? 537.5 : (ds19Zone === "urbana_norte_stgo" ? 487.5 : 425)) + 100;

    const capUrban = ds19Zone === "sur_islas" ? 3000 : (ds19Zone === "urbana_norte_stgo" ? 2800 : 2600);
    const subUrban = (ds19Zone === "sur_islas" ? 500 : 350) + 100;

    // --- OPCIÓN 1: DS49 (Fondo Solidario) ---
    if (rshNum <= 40) {
      const extraAhorro = savings - 10;
      const incentive = savings >= 60 ? 250 : (extraAhorro > 0 ? 5 * extraAhorro : 0);
      const subsidyDS49 = 800 + 100 + incentive;
      const maxHouseDS49 = Math.min(savings + subsidyDS49, 1300);

      cards.push({
        id: "ds49",
        subsidyKey: "ds49",
        badge: "Vivienda Social - Postulación MINVU",
        title: "Subsidio DS49 (Fondo Solidario de Elección de Vivienda)",
        description: "Adquisición de vivienda social sin necesidad de crédito hipotecario. Dirigido a familias del 40% RSH.",
        maxHouseUF: maxHouseDS49,
        loanUF: 0,
        savingsUF: savings,
        subsidyUF: subsidyDS49,
        minAhorro: 10,
        maxDividendUF: 0,
        category: "subsidio",
        isNew: false,
        linkParams: `maxPrice=${Math.round(maxHouseDS49 * ufValue)}&maxUF=${Math.round(maxHouseDS49)}&credit=0&origin=ds49&region=${regionA}`
      });
    }

    // --- OPCIÓN 2: DS19 Cupo Vulnerable ---
    if (rshNum <= 60) {
      const maxHouseDS19Vul = Math.min(savings + subVul, capVul);
      cards.push({
        id: "ds19-vulnerable",
        subsidyKey: "ds19",
        cupoType: "vulnerable",
        badge: "Solo Vivienda Nueva - Convenio Inmobiliaria",
        title: "Subsidio DS19 (Cupo Vulnerable / Integración Social)",
        description: "Permite comprar sin crédito hipotecario una vivienda nueva en proyectos seleccionados con convenio DS19.",
        maxHouseUF: maxHouseDS19Vul,
        loanUF: 0,
        savingsUF: savings,
        subsidyUF: subVul,
        minAhorro: 40,
        maxDividendUF: 0,
        category: "subsidio",
        isNew: true,
        linkParams: `maxPrice=${Math.round(maxHouseDS19Vul * ufValue)}&maxUF=${Math.round(maxHouseDS19Vul)}&credit=0&origin=ds19&region=${regionA}&cupoType=vulnerable`
      });
    }

    // --- OPCIÓN 3: DS1 Tramo 1 ---
    if (rshNum <= 60) {
      const capT1 = ds1Zone === "north" ? 1200 : (ds1Zone === "south" ? 1250 : 1100);
      const subT1 = ds1Zone === "north" ? 700 : (ds1Zone === "south" ? 750 : 600);
      const maxHouseT1 = Math.min(maxLoanUFNormal + savings + subT1, capT1);
      const loanT1 = Math.max(0, maxHouseT1 - savings - subT1);
      const dividendT1 = loanT1 > 0 ? (loanT1 * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

      cards.push({
        id: "ds1t1",
        subsidyKey: "ds1t1",
        badge: "Vivienda Nueva/Usada - MINVU",
        title: "Subsidio DS1 Tramo 1",
        description: "Para familias hasta el 60% RSH. Requiere un crédito bancario pequeño o pago al contado de la diferencia.",
        maxHouseUF: maxHouseT1,
        loanUF: loanT1,
        savingsUF: savings,
        subsidyUF: subT1,
        minAhorro: 30,
        maxDividendUF: dividendT1,
        category: "subsidio",
        isNew: false,
        linkParams: `maxPrice=${Math.round(maxHouseT1 * ufValue)}&maxUF=${Math.round(maxHouseT1)}&credit=${Math.round(loanT1)}&origin=ds1t1&region=${regionA}`
      });
    }

    // --- OPCIÓN 4: DS1 Tramo 2 (Sin DS15) ---
    if (rshNum <= 80) {
      const resNormal = calculateDS1T2Max(maxLoanUFNormal, savings, ds1Zone);
      const loanNormal = Math.max(0, resNormal.maxHouseUF - savings - resNormal.subsidyUF);
      const dividendNormal = loanNormal > 0 ? (loanNormal * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

      cards.push({
        id: "ds1t2-usada",
        subsidyKey: "ds1t2",
        badge: "Vivienda Usada o Nueva - MINVU",
        title: "Subsidio DS1 Tramo 2 (Sin Beneficio DS15)",
        description: "Para compra de viviendas usadas o nuevas tradicionales. Subsidio variable decreciente.",
        maxHouseUF: resNormal.maxHouseUF,
        loanUF: loanNormal,
        savingsUF: savings,
        subsidyUF: resNormal.subsidyUF,
        minAhorro: 40,
        maxDividendUF: dividendNormal,
        category: "subsidio",
        isNew: false,
        linkParams: `maxPrice=${Math.round(resNormal.maxHouseUF * ufValue)}&maxUF=${Math.round(resNormal.maxHouseUF)}&credit=${Math.round(loanNormal)}&origin=ds1t2&region=${regionA}&isNew=false`
      });
    }

    // --- OPCIÓN 5: DS1 Tramo 2 (Con Beneficio DS15 - Nueva) ---
    if (rshNum <= 80) {
      const resDS15 = calculateDS1T2MaxWithDS15(maxLoanUFDS15, savings, ds1Zone);
      const loanDS15 = Math.max(0, resDS15.maxHouseUF - savings - resDS15.subsidyUF);
      const dividendDS15 = loanDS15 > 0 ? (loanDS15 * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let infoDS15 = "";
      if (savings >= 80) {
        infoDS15 = "✨ Beneficio DS15 Activo: +150 UF de bono y tope extendido a 3.000 UF por contar con 80 UF o más de ahorro.";
      }

      cards.push({
        id: "ds1t2-nueva-ds15",
        subsidyKey: "ds1t2",
        badge: "Solo Vivienda Nueva - Beneficio DS15",
        title: "Subsidio DS1 Tramo 2 (Con Beneficio DS15)",
        description: "Aplica en viviendas nuevas. Ofrece tasa de interés preferencial y bono adicional de 150 UF al subsidio.",
        maxHouseUF: resDS15.maxHouseUF,
        loanUF: loanDS15,
        savingsUF: savings,
        subsidyUF: resDS15.subsidyUF,
        minAhorro: 80,
        maxDividendUF: dividendDS15,
        info: infoDS15,
        category: "subsidio",
        isNew: true,
        linkParams: `maxPrice=${Math.round(resDS15.maxHouseUF * ufValue)}&maxUF=${Math.round(resDS15.maxHouseUF)}&credit=${Math.round(loanDS15)}&origin=ds1t2&region=${regionA}&applyRateDiscount=true&isNew=true`
      });
    }

    // --- OPCIÓN 6: DS19 Cupo Sectores Medios 1 (Rural / Periférica) ---
    if (rshNum <= 80) {
      const maxHouseDS19Rural = Math.min(maxLoanUFDS15 + savings + subRural, capRural);
      const loanDS19Rural = Math.max(0, maxHouseDS19Rural - savings - subRural);
      const dividendDS19Rural = loanDS19Rural > 0 ? (loanDS19Rural * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;

      cards.push({
        id: "ds19-rural",
        subsidyKey: "ds19",
        badge: "Solo Vivienda Nueva - Convenio Inmobiliaria",
        title: "Homologación / Proyecto DS19 (Cupo Rural / Medios 1)",
        description: "Viviendas nuevas en proyectos con convenio en zonas rurales o comunas periféricas. Beneficio DS15 incluido.",
        maxHouseUF: maxHouseDS19Rural,
        loanUF: loanDS19Rural,
        savingsUF: savings,
        subsidyUF: subRural,
        minAhorro: 80,
        maxDividendUF: dividendDS19Rural,
        category: "subsidio",
        isNew: true,
        linkParams: `maxPrice=${Math.round(maxHouseDS19Rural * ufValue)}&maxUF=${Math.round(maxHouseDS19Rural)}&credit=${Math.round(loanDS19Rural)}&origin=ds19&region=${regionA}&cupoType=vulnerable_rural`
      });
    }

    // --- OPCIÓN 7: DS19 Cupo Sectores Medios 2 (Urbano) ---
    if (rshNum <= 90) {
      const maxHouseDS19Urban = Math.min(maxLoanUFDS15 + savings + subUrban, capUrban);
      const loanDS19Urban = Math.max(0, maxHouseDS19Urban - savings - subUrban);
      const dividendDS19Urban = loanDS19Urban > 0 ? (loanDS19Urban * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;

      cards.push({
        id: "ds19-urban",
        subsidyKey: "ds19",
        badge: "Solo Vivienda Nueva - Convenio Inmobiliaria",
        title: "Homologación / Proyecto DS19 (Cupo Urbano / Medios 2)",
        description: "Viviendas nuevas en proyectos integrados urbanos. Incluye subsidio estatal y beneficio de tasa DS15.",
        maxHouseUF: maxHouseDS19Urban,
        loanUF: loanDS19Urban,
        savingsUF: savings,
        subsidyUF: subUrban,
        minAhorro: 80,
        maxDividendUF: dividendDS19Urban,
        category: "subsidio",
        isNew: true,
        linkParams: `maxPrice=${Math.round(maxHouseDS19Urban * ufValue)}&maxUF=${Math.round(maxHouseDS19Urban)}&credit=${Math.round(loanDS19Urban)}&origin=ds19&region=${regionA}&cupoType=urban_media`
      });
    }

    // --- OPCIÓN 8: DS1 Tramo 3 (Sin DS15) ---
    if (rshNum <= 90 || meetsDS1T3Limit) {
      const resNormal = calculateDS1T3Max(maxLoanUFNormal, savings, ds1Zone);
      const loanNormal = Math.max(0, resNormal.maxHouseUF - savings - resNormal.subsidyUF);
      const dividendNormal = loanNormal > 0 ? (loanNormal * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

      cards.push({
        id: "ds1t3-usada",
        subsidyKey: "ds1t3",
        badge: "Vivienda Usada o Nueva - MINVU",
        title: "Subsidio DS1 Tramo 3 (Sin Beneficio DS15)",
        description: "Tope de compra ampliado con crédito hipotecario bancario obligatorio.",
        maxHouseUF: resNormal.maxHouseUF,
        loanUF: loanNormal,
        savingsUF: savings,
        subsidyUF: resNormal.subsidyUF,
        minAhorro: 80,
        maxDividendUF: dividendNormal,
        category: "subsidio",
        isNew: false,
        linkParams: `maxPrice=${Math.round(resNormal.maxHouseUF * ufValue)}&maxUF=${Math.round(resNormal.maxHouseUF)}&credit=${Math.round(loanNormal)}&origin=ds1t3&region=${regionA}&isNew=false`
      });
    }

    // --- OPCIÓN 9: DS1 Tramo 3 (Con Beneficio DS15 - Nueva) ---
    if (rshNum <= 90 || meetsDS1T3Limit) {
      const resDS15 = calculateDS1T3MaxWithDS15(maxLoanUFDS15, savings, ds1Zone);
      const loanDS15 = Math.max(0, resDS15.maxHouseUF - savings - resDS15.subsidyUF);
      const dividendDS15 = loanDS15 > 0 ? (loanDS15 * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let infoDS15 = "";
      if (savings >= 160) {
        infoDS15 = "✨ Beneficio DS15 Activo: +150 UF de bono y tope extendido a 3.000 UF por contar con 160 UF o más de ahorro.";
      }

      cards.push({
        id: "ds1t3-nueva-ds15",
        subsidyKey: "ds1t3",
        badge: "Solo Vivienda Nueva - Beneficio DS15",
        title: "Subsidio DS1 Tramo 3 (Con Beneficio DS15)",
        description: "Aplica en viviendas nuevas. Ofrece tasa de interés preferencial y bono de 150 UF al subsidio.",
        maxHouseUF: resDS15.maxHouseUF,
        loanUF: loanDS15,
        savingsUF: savings,
        subsidyUF: resDS15.subsidyUF,
        minAhorro: 160,
        maxDividendUF: dividendDS15,
        info: infoDS15,
        category: "subsidio",
        isNew: true,
        linkParams: `maxPrice=${Math.round(resDS15.maxHouseUF * ufValue)}&maxUF=${Math.round(resDS15.maxHouseUF)}&credit=${Math.round(loanDS15)}&origin=ds1t3&region=${regionA}&applyRateDiscount=true&isNew=true`
      });
    }

    // --- OPCIÓN 10: DS1 Tramo 4 ---
    if (meetsDS1T4Limit) {
      const minAhorro = 200;
      const effectiveSavings = savings < minAhorro ? minAhorro : savings;
      const cap = 4000;
      const sub = 400;
      const valMax = Math.min(maxLoanUFNormal + effectiveSavings + sub, cap);
      const creditReal = Math.max(0, valMax - effectiveSavings - sub);
      const dividendT4 = creditReal > 0 ? (creditReal * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

      cards.push({
        id: "ds1t4",
        subsidyKey: "ds1t4",
        badge: "Vivienda Nueva/Usada - MINVU",
        title: "Subsidio DS1 Tramo 4",
        description: "Diseñado para viviendas de hasta 4.000 UF en sectores medios. Apoyo estatal directo de 400 UF.",
        maxHouseUF: valMax,
        loanUF: creditReal,
        savingsUF: effectiveSavings,
        subsidyUF: sub,
        minAhorro,
        maxDividendUF: dividendT4,
        category: "subsidio",
        isNew: false,
        linkParams: `maxPrice=${Math.round(valMax * ufValue)}&maxUF=${Math.round(valMax)}&credit=${Math.round(creditReal)}&origin=ds1t4&region=${regionA}`
      });
    }

    // --- OPCIONES SIN SUBSIDIO (FINANCIAMIENTO PRIVADO) ---

    // 1A. FOGAES Nueva - Versión 1: Basada en el Ahorro Actual del Usuario
    const maxHouseFogaesWithDiscountActual = Math.min(4000, Math.min(savings / 0.10, maxLoanUFDS15 + savings));
    const maxHouseFogaesNormalActual = Math.min(4500, Math.min(savings / 0.10, maxLoanUFNormal + savings));
    const maxHouseFogaesActual = Math.max(maxHouseFogaesWithDiscountActual, maxHouseFogaesNormalActual);
    const loanFogaesActual = Math.max(0, maxHouseFogaesActual - savings);
    const aplicaLeyFogaesActual = maxHouseFogaesActual < 4000;
    const rateFogaesActual = aplicaLeyFogaesActual ? monthlyRateDS15 : monthlyRateNormal;
    const dividendFogaesActual = loanFogaesActual > 0 ? (loanFogaesActual * rateFogaesActual) / (1 - Math.pow(1 + rateFogaesActual, -totalPayments)) : 0;

    cards.push({
      id: "sin-subsidio-fogaes-ahorro",
      subsidyKey: "none",
      badge: "Vivienda Nueva - Ahorro Actual",
      title: "Crédito Hipotecario sin Subsidio (Con FOGAES - Según tu ahorro)",
      description: `Financiamiento hasta el 90% con aval estatal FOGAES (pie del 10%). Muestra la casa que puedes comprar hoy con tus ${savings.toFixed(0)} UF de ahorro${aplicaLeyFogaesActual ? " e incluye rebaja de tasa Ley 21.748" : ""}.`,
      maxHouseUF: maxHouseFogaesActual,
      loanUF: loanFogaesActual,
      savingsUF: savings,
      subsidyUF: 0,
      minAhorro: 0,
      savingsLabel: "Tu Ahorro Actual",
      maxDividendUF: dividendFogaesActual,
      category: "privado",
      isNew: true,
      linkParams: `maxPrice=${Math.round(maxHouseFogaesActual * ufValue)}&maxUF=${Math.round(maxHouseFogaesActual)}&credit=${Math.round(loanFogaesActual)}&origin=no-subsidy&region=${regionA}&applyFogaes=true&applyRateDiscount=${aplicaLeyFogaesActual ? "true" : "false"}&isNew=true`
    });

    // 1B. FOGAES Nueva - Versión 2: Maximizado por Sueldo (Ahorro Mínimo Sugerido)
    const maxLoanFogaesLimit = maxLoanUFDS15 > 0 ? maxLoanUFDS15 : maxLoanUFNormal;
    const maxHouseFogaesMaximized = Math.min(4500, maxLoanFogaesLimit / 0.90);
    const minSavingsFogaesNeeded = maxHouseFogaesMaximized * 0.10;
    const loanFogaesMaximized = Math.max(0, maxHouseFogaesMaximized - minSavingsFogaesNeeded);
    const aplicaLeyFogaesMax = maxHouseFogaesMaximized < 4000;
    const rateFogaesMax = aplicaLeyFogaesMax ? monthlyRateDS15 : monthlyRateNormal;
    const dividendFogaesMaximized = loanFogaesMaximized > 0 ? (loanFogaesMaximized * rateFogaesMax) / (1 - Math.pow(1 + rateFogaesMax, -totalPayments)) : 0;

    let infoFogaesMax = "";
    if (savings < minSavingsFogaesNeeded) {
      infoFogaesMax = `💡 Ahorro Mínimo Sugerido: Con un pie del 10% (${minSavingsFogaesNeeded.toFixed(0)} UF, aprox. $${Math.round(minSavingsFogaesNeeded * ufValue).toLocaleString("es-CL")} CLP), podrías aprovechar al máximo tu sueldo y comprar una propiedad nueva de hasta ${maxHouseFogaesMaximized.toFixed(0)} UF. Te faltan ${(minSavingsFogaesNeeded - savings).toFixed(0)} UF de ahorro.`;
    } else {
      infoFogaesMax = `✨ ¡Tu ahorro actual (${savings.toFixed(0)} UF) ya te permite alcanzar el máximo permitido por tu sueldo (${maxHouseFogaesMaximized.toFixed(0)} UF)!`;
    }

    cards.push({
      id: "sin-subsidio-fogaes-maximizado",
      subsidyKey: "none",
      badge: "Vivienda Nueva - Ahorro Objetivo",
      title: "Crédito Hipotecario sin Subsidio (Con FOGAES - Maximizado por Sueldo)",
      description: "Financiamiento hasta 90% con aval FOGAES. Muestra la vivienda máxima alcanzable según tu sueldo y el ahorro mínimo de pie (10%) necesario para comprarla.",
      maxHouseUF: maxHouseFogaesMaximized,
      loanUF: loanFogaesMaximized,
      savingsUF: minSavingsFogaesNeeded,
      subsidyUF: 0,
      minAhorro: minSavingsFogaesNeeded,
      savingsLabel: "Ahorro Mínimo Requerido",
      maxDividendUF: dividendFogaesMaximized,
      info: infoFogaesMax,
      category: "privado",
      isNew: true,
      linkParams: `maxPrice=${Math.round(maxHouseFogaesMaximized * ufValue)}&maxUF=${Math.round(maxHouseFogaesMaximized)}&credit=${Math.round(loanFogaesMaximized)}&origin=no-subsidy&region=${regionA}&applyFogaes=true&applyRateDiscount=${aplicaLeyFogaesMax ? "true" : "false"}&isNew=true`
    });

    // 2A. Tradicional Usada - Versión 1: Basada en el Ahorro Actual del Usuario
    const maxHouseUsadaActual = Math.min(savings / 0.20, maxLoanUFNormal + savings);
    const loanUsadaActual = Math.max(0, maxHouseUsadaActual - savings);
    const dividendUsadaActual = loanUsadaActual > 0 ? (loanUsadaActual * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

    cards.push({
      id: "sin-subsidio-usada-ahorro",
      subsidyKey: "none",
      badge: "Vivienda Usada - Ahorro Actual",
      title: "Crédito Hipotecario sin Subsidio (Sin FOGAES - Según tu ahorro)",
      description: `Financiamiento bancario convencional hasta el 80% (pie mínimo del 20%). Muestra la casa usada que puedes comprar con tus ${savings.toFixed(0)} UF de ahorro.`,
      maxHouseUF: maxHouseUsadaActual,
      loanUF: loanUsadaActual,
      savingsUF: savings,
      subsidyUF: 0,
      minAhorro: 0,
      savingsLabel: "Tu Ahorro Actual",
      maxDividendUF: dividendUsadaActual,
      category: "privado",
      isNew: false,
      linkParams: `maxPrice=${Math.round(maxHouseUsadaActual * ufValue)}&maxUF=${Math.round(maxHouseUsadaActual)}&credit=${Math.round(loanUsadaActual)}&origin=no-subsidy&region=${regionA}&applyFogaes=false&applyRateDiscount=false&isNew=false`
    });

    // 2B. Tradicional Usada - Versión 2: Maximizado por Sueldo (Ahorro Mínimo Sugerido)
    const maxHouseUsadaMaximized = maxLoanUFNormal / 0.80;
    const minSavingsUsadaNeeded = maxHouseUsadaMaximized * 0.20;
    const loanUsadaMaximized = Math.max(0, maxHouseUsadaMaximized - minSavingsUsadaNeeded);
    const dividendUsadaMaximized = loanUsadaMaximized > 0 ? (loanUsadaMaximized * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

    let infoUsadaMax = "";
    if (savings < minSavingsUsadaNeeded) {
      infoUsadaMax = `💡 Ahorro Mínimo Sugerido: Con un pie del 20% (${minSavingsUsadaNeeded.toFixed(0)} UF, aprox. $${Math.round(minSavingsUsadaNeeded * ufValue).toLocaleString("es-CL")} CLP), podrías aprovechar al máximo tu sueldo y comprar una propiedad usada de hasta ${maxHouseUsadaMaximized.toFixed(0)} UF. Te faltan ${(minSavingsUsadaNeeded - savings).toFixed(0)} UF de ahorro.`;
    } else {
      infoUsadaMax = `✨ ¡Tu ahorro actual (${savings.toFixed(0)} UF) ya te permite alcanzar el máximo permitido por tu sueldo (${maxHouseUsadaMaximized.toFixed(0)} UF)!`;
    }

    cards.push({
      id: "sin-subsidio-usada-maximizado",
      subsidyKey: "none",
      badge: "Vivienda Usada - Ahorro Objetivo",
      title: "Crédito Hipotecario sin Subsidio (Sin FOGAES - Maximizado por Sueldo)",
      description: "Financiamiento bancario convencional hasta el 80%. Muestra la vivienda usada máxima alcanzable según tu sueldo y el ahorro mínimo (pie del 20%) necesario.",
      maxHouseUF: maxHouseUsadaMaximized,
      loanUF: loanUsadaMaximized,
      savingsUF: minSavingsUsadaNeeded,
      subsidyUF: 0,
      minAhorro: minSavingsUsadaNeeded,
      savingsLabel: "Ahorro Mínimo Requerido",
      maxDividendUF: dividendUsadaMaximized,
      info: infoUsadaMax,
      category: "privado",
      isNew: false,
      linkParams: `maxPrice=${Math.round(maxHouseUsadaMaximized * ufValue)}&maxUF=${Math.round(maxHouseUsadaMaximized)}&credit=${Math.round(loanUsadaMaximized)}&origin=no-subsidy&region=${regionA}&applyFogaes=false&applyRateDiscount=false&isNew=false`
    });

    // --- ORDENAR DEL MAYOR VALOR MÁXIMO DE CASA AL MENOR ---
    cards.sort((a, b) => b.maxHouseUF - a.maxHouseUF);

    return cards;
  };

  const recommendationsA = getDynamicRecommendationsA();

  // --- CÁLCULO DE PERFIL B (SIMULACIÓN AVANZADA) ---
  const handleCalculateB = (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseFloat(incomeCLPB) || 0;
    const savings = parseFloat(savingsUFB) || 0;
    const term = parseInt(loanTermB) || 25;

    if (selectedSubsidyB !== "ds49" && (!selectedBankB || !BANKS[selectedBankB])) {
      alert("Por favor, selecciona una institución financiera para la tasa de interés.");
      return;
    }

    const bankKey = selectedBankB || "BancoEstado";
    const bankData = BANKS[bankKey] || BANKS["BancoEstado"];
    const incomeMultiplier = isYoungSingleB ? 3 : 4;
    const maxMonthlyPaymentUF = (income / ufValue) / incomeMultiplier;

    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(1000, term) : (bankData.tasaBase || 0.0425);
    const descuento = bankData.descuentoDS15 !== undefined ? bankData.descuentoDS15 : 0;
    const tasaDS15 = tasaOriginal - descuento;

    const monthlyRateNormal = tasaOriginal / 12;
    const monthlyRateDS15 = tasaDS15 / 12;
    const totalPayments = term * 12;

    const maxLoanUFNormal = monthlyRateNormal > 0 
      ? maxMonthlyPaymentUF * ((1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) / monthlyRateNormal)
      : 0;

    const maxLoanUFDS15 = monthlyRateDS15 > 0 
      ? maxMonthlyPaymentUF * ((1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) / monthlyRateDS15)
      : 0;

    const ds1ZoneB = getDS1Zone(locationB);
    
    const activeCommunes = DS19_COMMUNES_PERIPHERAL[locationB] || [];
    const currentCommune = activeCommunes.find(c => c.key === selectedCommuneB);
    const isPeripheral = currentCommune ? currentCommune.isPeripheral : false;

    const getDS19LocationZoneB = (reg: string, isVar: boolean, isPerip: boolean) => {
      if (["aysen", "magallanes"].includes(reg)) {
        return "sur_islas";
      }
      if (isPerip) {
        return "regular";
      }
      const urbanRegions = isVar 
        ? ["arica-y-parinacota", "tarapaca", "antofagasta", "atacama", "metropolitana", "valparaiso", "biobio"]
        : ["arica-y-parinacota", "tarapaca", "antofagasta", "atacama", "metropolitana"];
      if (urbanRegions.includes(reg)) {
        return "urbana_norte_stgo";
      }
      return "regular";
    };

    const options: any[] = [];

    if (selectedSubsidyB === "none" || selectedSubsidyB === "all") {
      // 1A. FOGAES Nueva - Versión 1: Basada en el Ahorro Actual
      const maxHouseFogaesWithDiscountActual = Math.min(4000, Math.min(savings / 0.10, maxLoanUFDS15 + savings));
      const maxHouseFogaesNormalActual = Math.min(4500, Math.min(savings / 0.10, maxLoanUFNormal + savings));
      const maxHouseFogaesActual = Math.max(maxHouseFogaesWithDiscountActual, maxHouseFogaesNormalActual);
      const loanFogaesActual = Math.max(0, maxHouseFogaesActual - savings);
      const aplicaLeyFogaesActual = maxHouseFogaesActual < 4000;
      const rateFogaesActual = aplicaLeyFogaesActual ? monthlyRateDS15 : monthlyRateNormal;
      const maxDividendFogaesActual = loanFogaesActual > 0 ? (loanFogaesActual * rateFogaesActual) / (1 - Math.pow(1 + rateFogaesActual, -totalPayments)) : 0;
      
      options.push({
        id: "fogaes-nueva-ahorro",
        badge: "Vivienda Nueva - Ahorro Actual",
        title: "Crédito Hipotecario sin Subsidio (Con FOGAES - Según tu ahorro)",
        description: `Financiamiento hasta 90% con aval del Estado (FOGAES). Basado en tus ${savings.toFixed(0)} UF de ahorro actual.`,
        maxHouseUF: maxHouseFogaesActual,
        loanUF: loanFogaesActual,
        savingsUF: savings,
        subsidyUF: 0,
        minAhorro: 0,
        savingsLabel: "Tu Ahorro Actual",
        maxDividendUF: maxDividendFogaesActual,
        linkParams: `maxPrice=${Math.round(maxHouseFogaesActual * ufValue)}&maxUF=${Math.round(maxHouseFogaesActual)}&credit=${Math.round(loanFogaesActual)}&origin=no-subsidy&region=${locationB}&applyFogaes=true&applyRateDiscount=${aplicaLeyFogaesActual ? "true" : "false"}&isNew=true`
      });

      // 1B. FOGAES Nueva - Versión 2: Maximizado por Sueldo (Ahorro Mínimo Sugerido)
      const maxLoanFogaesLimit = maxLoanUFDS15 > 0 ? maxLoanUFDS15 : maxLoanUFNormal;
      const maxHouseFogaesMaximized = Math.min(4500, maxLoanFogaesLimit / 0.90);
      const minSavingsFogaesNeeded = maxHouseFogaesMaximized * 0.10;
      const loanFogaesMaximized = Math.max(0, maxHouseFogaesMaximized - minSavingsFogaesNeeded);
      const aplicaLeyFogaesMax = maxHouseFogaesMaximized < 4000;
      const rateFogaesMax = aplicaLeyFogaesMax ? monthlyRateDS15 : monthlyRateNormal;
      const maxDividendFogaesMaximized = loanFogaesMaximized > 0 ? (loanFogaesMaximized * rateFogaesMax) / (1 - Math.pow(1 + rateFogaesMax, -totalPayments)) : 0;

      let warningFogaesMax = "";
      if (savings < minSavingsFogaesNeeded) {
        warningFogaesMax = `💡 Ahorro Mínimo Sugerido: Con un pie del 10% (${minSavingsFogaesNeeded.toFixed(0)} UF, aprox. $${Math.round(minSavingsFogaesNeeded * ufValue).toLocaleString("es-CL")} CLP), podrías aprovechar al máximo tu sueldo y comprar una propiedad nueva de hasta ${maxHouseFogaesMaximized.toFixed(0)} UF. Te faltan ${(minSavingsFogaesNeeded - savings).toFixed(0)} UF de ahorro.`;
      } else {
        warningFogaesMax = `✨ ¡Tu ahorro actual (${savings.toFixed(0)} UF) ya te permite alcanzar el máximo permitido por tu sueldo (${maxHouseFogaesMaximized.toFixed(0)} UF)!`;
      }

      options.push({
        id: "fogaes-nueva-maximizado",
        badge: "Vivienda Nueva - Ahorro Objetivo",
        title: "Crédito Hipotecario sin Subsidio (Con FOGAES - Maximizado por Sueldo)",
        description: "Financiamiento hasta 90% con aval FOGAES. Muestra la vivienda nueva máxima alcanzable según tu sueldo y el ahorro mínimo (10%) necesario.",
        maxHouseUF: maxHouseFogaesMaximized,
        loanUF: loanFogaesMaximized,
        savingsUF: minSavingsFogaesNeeded,
        subsidyUF: 0,
        minAhorro: minSavingsFogaesNeeded,
        savingsLabel: "Ahorro Mínimo Requerido",
        maxDividendUF: maxDividendFogaesMaximized,
        warning: warningFogaesMax,
        linkParams: `maxPrice=${Math.round(maxHouseFogaesMaximized * ufValue)}&maxUF=${Math.round(maxHouseFogaesMaximized)}&credit=${Math.round(loanFogaesMaximized)}&origin=no-subsidy&region=${locationB}&applyFogaes=true&applyRateDiscount=${aplicaLeyFogaesMax ? "true" : "false"}&isNew=true`
      });

      // 2A. Tradicional Usada - Versión 1: Basada en el Ahorro Actual
      const maxHouseUsadaActual = Math.min(savings / 0.20, maxLoanUFNormal + savings);
      const loanUsadaActual = Math.max(0, maxHouseUsadaActual - savings);
      const maxDividendUsadaActual = loanUsadaActual > 0 ? (loanUsadaActual * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

      options.push({
        id: "tradicional-usada-ahorro",
        badge: "Vivienda Usada - Ahorro Actual",
        title: "Crédito Hipotecario sin Subsidio (Sin FOGAES - Según tu ahorro)",
        description: `Financiamiento bancario convencional hasta el 80% (pie del 20%). Basado en tus ${savings.toFixed(0)} UF de ahorro actual.`,
        maxHouseUF: maxHouseUsadaActual,
        loanUF: loanUsadaActual,
        savingsUF: savings,
        subsidyUF: 0,
        minAhorro: 0,
        savingsLabel: "Tu Ahorro Actual",
        maxDividendUF: maxDividendUsadaActual,
        linkParams: `maxPrice=${Math.round(maxHouseUsadaActual * ufValue)}&maxUF=${Math.round(maxHouseUsadaActual)}&credit=${Math.round(loanUsadaActual)}&origin=no-subsidy&region=${locationB}&applyFogaes=false&applyRateDiscount=false&isNew=false`
      });

      // 2B. Tradicional Usada - Versión 2: Maximizado por Sueldo (Ahorro Mínimo Sugerido)
      const maxHouseUsadaMaximized = maxLoanUFNormal / 0.80;
      const minSavingsUsadaNeeded = maxHouseUsadaMaximized * 0.20;
      const loanUsadaMaximized = Math.max(0, maxHouseUsadaMaximized - minSavingsUsadaNeeded);
      const maxDividendUsadaMaximized = loanUsadaMaximized > 0 ? (loanUsadaMaximized * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;

      let warningUsadaMax = "";
      if (savings < minSavingsUsadaNeeded) {
        warningUsadaMax = `💡 Ahorro Mínimo Sugerido: Con un pie del 20% (${minSavingsUsadaNeeded.toFixed(0)} UF, aprox. $${Math.round(minSavingsUsadaNeeded * ufValue).toLocaleString("es-CL")} CLP), podrías aprovechar al máximo tu sueldo y comprar una propiedad usada de hasta ${maxHouseUsadaMaximized.toFixed(0)} UF. Te faltan ${(minSavingsUsadaNeeded - savings).toFixed(0)} UF de ahorro.`;
      } else {
        warningUsadaMax = `✨ ¡Tu ahorro actual (${savings.toFixed(0)} UF) ya te permite alcanzar el máximo permitido por tu sueldo (${maxHouseUsadaMaximized.toFixed(0)} UF)!`;
      }

      options.push({
        id: "tradicional-usada-maximizado",
        badge: "Vivienda Usada - Ahorro Objetivo",
        title: "Crédito Hipotecario sin Subsidio (Sin FOGAES - Maximizado por Sueldo)",
        description: "Financiamiento bancario convencional hasta el 80%. Muestra la vivienda usada máxima alcanzable según tu sueldo y el ahorro mínimo (20%) necesario.",
        maxHouseUF: maxHouseUsadaMaximized,
        loanUF: loanUsadaMaximized,
        savingsUF: minSavingsUsadaNeeded,
        subsidyUF: 0,
        minAhorro: minSavingsUsadaNeeded,
        savingsLabel: "Ahorro Mínimo Requerido",
        maxDividendUF: maxDividendUsadaMaximized,
        warning: warningUsadaMax,
        linkParams: `maxPrice=${Math.round(maxHouseUsadaMaximized * ufValue)}&maxUF=${Math.round(maxHouseUsadaMaximized)}&credit=${Math.round(loanUsadaMaximized)}&origin=no-subsidy&region=${locationB}&applyFogaes=false&applyRateDiscount=false&isNew=false`
      });
    }

    if (selectedSubsidyB === "ds49" || selectedSubsidyB === "all") {
      // Opción 1: Subsidio DS49
      let extraAhorro = savings - 10;
      let incentive = 0;
      if (savings >= 60) {
        incentive = 250;
      } else if (extraAhorro > 0) {
        incentive = 5 * extraAhorro;
      }
      const subsidyUF = 800 + (isUrbanB ? 100 : 0) + incentive;
      const maxHouseUF = Math.min(savings + subsidyUF, 1300);
      let warningDS49 = "";
      if (savings < 10) {
        warningDS49 = `⚠️ Falta Ahorro: El subsidio DS49 exige un ahorro mínimo de 10 UF. Te faltan ${(10 - savings).toFixed(1)} UF (aprox. $${Math.round((10 - savings) * ufValue).toLocaleString("es-CL")} CLP).`;
      }
      options.push({
        id: "ds49-propio",
        badge: "Vivienda Nueva o Usada - Postulación MINVU",
        title: "Subsidio DS49 (Fondo Solidario)",
        description: "Adquisición de vivienda sin crédito hipotecario. Financiado por subsidio y tu ahorro.",
        maxHouseUF,
        loanUF: 0,
        savingsUF: savings,
        subsidyUF,
        minAhorro: 10,
        maxDividendUF: 0,
        warning: warningDS49,
        linkParams: `maxPrice=${Math.round(maxHouseUF * ufValue)}&maxUF=${Math.round(maxHouseUF)}&credit=0&origin=ds49&region=${locationB}&isUrban=${isUrbanB}`
      });

      // Opción 2: Homologación a DS19 Cupo Vulnerable
      const zoneVul = getDS19LocationZoneB(locationB, false, isPeripheral);
      let subDS19 = 0;
      let capDS19 = 0;
      if (zoneVul === "sur_islas") {
        capDS19 = 2000;
        subDS19 = 1700;
      } else if (zoneVul === "urbana_norte_stgo") {
        capDS19 = propertyTypeB === "casa" ? 1500 : 1600;
        subDS19 = propertyTypeB === "casa" ? 1200 : 1300;
      } else {
        capDS19 = propertyTypeB === "casa" ? 1600 : 1500;
        subDS19 = propertyTypeB === "casa" ? 1100 : 1200;
      }
      
      const maxHouseDS19 = Math.min(savings + subDS19, capDS19);
      let warningDS19 = "";
      if (savings < 40) {
        warningDS19 = `⚠️ Falta Ahorro: Para homologar a DS19 Cupo Vulnerable necesitas mínimo 40 UF. Te faltan ${(40 - savings).toFixed(0)} UF (aprox. $${Math.round((40 - savings) * ufValue).toLocaleString("es-CL")} CLP).`;
      }
      options.push({
        id: "ds49-homologado",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "Homologación a DS19 (Cupo Vulnerable)",
        description: "Permite comprar sin crédito hipotecario una vivienda nueva en proyectos con convenio DS19.",
        maxHouseUF: maxHouseDS19,
        loanUF: 0,
        savingsUF: savings,
        subsidyUF: subDS19,
        minAhorro: 40,
        maxDividendUF: 0,
        warning: warningDS19,
        linkParams: `maxPrice=${Math.round(maxHouseDS19 * ufValue)}&maxUF=${Math.round(maxHouseDS19)}&credit=0&origin=ds19&region=${locationB}&cupoType=vulnerable&propertyType=${propertyTypeB}`
      });
    }

    if (selectedSubsidyB === "ds1t1" || selectedSubsidyB === "all") {
      // Opción 1: DS1 Tramo 1 Normal
      const cap = ds1ZoneB === "north" ? 1200 : (ds1ZoneB === "south" ? 1250 : 1100);
      const sub = ds1ZoneB === "north" ? 700 : (ds1ZoneB === "south" ? 750 : 600);
      const maxHouseUF = Math.min(maxLoanUFNormal + savings + sub, cap);
      const loanUF = Math.max(0, maxHouseUF - savings - sub);
      const maxDividend = loanUF > 0 ? (loanUF * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;
      let warningT1 = "";
      if (savings < 30) {
        warningT1 = `⚠️ Falta Ahorro: Se exige mínimo 30 UF para el DS1 Tramo 1. Te faltan ${(30 - savings).toFixed(0)} UF (aprox. $${Math.round((30 - savings) * ufValue).toLocaleString("es-CL")} CLP).`;
      }
      options.push({
        id: "ds1t1-propio",
        badge: "Vivienda Nueva/Usada o Construcción - MINVU",
        title: "Subsidio DS1 Tramo 1",
        description: "Requiere un crédito bancario pequeño o pago al contado de la diferencia. Tope de propiedad de hasta 1.100 UF (o hasta 1.250 UF en zonas extremas).",
        maxHouseUF,
        loanUF,
        savingsUF: savings,
        subsidyUF: sub,
        minAhorro: 30,
        maxDividendUF: maxDividend,
        warning: warningT1,
        linkParams: `maxPrice=${Math.round(maxHouseUF * ufValue)}&maxUF=${Math.round(maxHouseUF)}&credit=${Math.round(loanUF)}&origin=ds1t1&region=${locationB}&propertyType=${propertyTypeB}`
      });

      // Opción 2: Homologación a DS19 Cupo Vulnerable
      const zoneVul = getDS19LocationZoneB(locationB, false, isPeripheral);
      let subDS19Vul = 0;
      let capDS19Vul = 0;
      if (zoneVul === "sur_islas") {
        capDS19Vul = 2000;
        subDS19Vul = 1700;
      } else if (zoneVul === "urbana_norte_stgo") {
        capDS19Vul = propertyTypeB === "casa" ? 1500 : 1600;
        subDS19Vul = propertyTypeB === "casa" ? 1200 : 1300;
      } else {
        capDS19Vul = propertyTypeB === "casa" ? 1600 : 1500;
        subDS19Vul = propertyTypeB === "casa" ? 1100 : 1200;
      }
      const maxHouseVul = Math.min(savings + subDS19Vul, capDS19Vul);
      let warningVul = "";
      if (savings < 40) {
        warningVul = `⚠️ Falta Ahorro: Para homologar a DS19 Cupo Vulnerable necesitas mínimo 40 UF. Te faltan ${(40 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds1t1-homologado-vulnerable",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "Homologación a DS19 (Cupo Vulnerable)",
        description: "Permite comprar sin crédito hipotecario una vivienda nueva en proyectos con convenio DS19.",
        maxHouseUF: maxHouseVul,
        loanUF: 0,
        savingsUF: savings,
        subsidyUF: subDS19Vul,
        minAhorro: 40,
        maxDividendUF: 0,
        warning: warningVul,
        linkParams: `maxPrice=${Math.round(maxHouseVul * ufValue)}&maxUF=${Math.round(maxHouseVul)}&credit=0&origin=ds19&region=${locationB}&cupoType=vulnerable&propertyType=${propertyTypeB}`
      });

      // Opción 3: Homologación a DS19 Cupo Sectores Medios 1 (Rural)
      const zoneRural = getDS19LocationZoneB(locationB, false, isPeripheral);
      let subDS19Rural = 0;
      let capDS19Rural = 0;
      if (zoneRural === "sur_islas") {
        capDS19Rural = 2400;
        subDS19Rural = 537.5 + 100;
      } else if (zoneRural === "urbana_norte_stgo") {
        capDS19Rural = 1900;
        subDS19Rural = 487.5 + 100;
      } else {
        capDS19Rural = 1800;
        subDS19Rural = 425 + 100;
      }
      const maxHouseRural = Math.min(maxLoanUFDS15 + savings + subDS19Rural, capDS19Rural);
      const loanRural = Math.max(0, maxHouseRural - savings - subDS19Rural);
      const maxDividendRural = loanRural > 0 ? (loanRural * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningRural = "";
      if (savings < 80) {
        warningRural = `⚠️ Falta Ahorro: Para el Cupo Rural necesitas un ahorro mínimo de 80 UF. Te faltan ${(80 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds1t1-homologado-rural",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "Homologación a DS19 (Cupo Rural / Medios 1)",
        description: "Adquiere vivienda nueva en proyectos con convenio en sectores rurales o comunas periféricas. Incluye beneficio DS15.",
        maxHouseUF: maxHouseRural,
        loanUF: loanRural,
        savingsUF: savings,
        subsidyUF: subDS19Rural,
        minAhorro: 80,
        maxDividendUF: maxDividendRural,
        warning: warningRural,
        linkParams: `maxPrice=${Math.round(maxHouseRural * ufValue)}&maxUF=${Math.round(maxHouseRural)}&credit=${Math.round(loanRural)}&origin=ds19&region=${locationB}&cupoType=vulnerable_rural`
      });
    }

    if (selectedSubsidyB === "ds1t2" || selectedSubsidyB === "all") {
      // Opción 1: DS1 Tramo 2 Usada (Sin DS15)
      const resNormal = calculateDS1T2Max(maxLoanUFNormal, savings, ds1ZoneB);
      const loanNormal = Math.max(0, resNormal.maxHouseUF - savings - resNormal.subsidyUF);
      const maxDividendNormal = loanNormal > 0 ? (loanNormal * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;
      let warningNormal = "";
      if (savings < 40) {
        warningNormal = `⚠️ Falta Ahorro: Se exige mínimo 40 UF para el DS1 Tramo 2. Te faltan ${(40 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds1t2-usada",
        badge: "Vivienda Usada o Nueva - MINVU",
        title: "DS1 Tramo 2 Usada/Nueva (Sin DS15)",
        description: "Para compras tradicionales. El subsidio es variable decreciente según el valor de la vivienda.",
        maxHouseUF: resNormal.maxHouseUF,
        loanUF: loanNormal,
        savingsUF: savings,
        subsidyUF: resNormal.subsidyUF,
        minAhorro: 40,
        maxDividendUF: maxDividendNormal,
        warning: warningNormal,
        linkParams: `maxPrice=${Math.round(resNormal.maxHouseUF * ufValue)}&maxUF=${Math.round(resNormal.maxHouseUF)}&credit=${Math.round(loanNormal)}&origin=ds1t2&region=${locationB}&isNew=false`
      });

      // Opción 2: DS1 Tramo 2 Nueva (Con DS15)
      const resDS15 = calculateDS1T2MaxWithDS15(maxLoanUFDS15, savings, ds1ZoneB);
      const loanDS15 = Math.max(0, resDS15.maxHouseUF - savings - resDS15.subsidyUF);
      const maxDividendDS15 = loanDS15 > 0 ? (loanDS15 * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningDS15 = "";
      let infoDS15 = "";
      if (savings < 80) {
        warningDS15 = `⚠️ Falta Ahorro: Para activar el beneficio DS15 en Tramo 2 necesitas mínimo 80 UF. Te faltan ${(80 - savings).toFixed(0)} UF.`;
        infoDS15 = `💡 ¡Duplica tu ahorro! Si logras llegar a 80 UF, activarás el beneficio DS15, que añade un bono de 150 UF al subsidio y amplía tu tope de compra a 3.000 UF.`;
      } else {
        infoDS15 = `✨ ¡Beneficio DS15 Activo! Se agrega un bono de 150 UF al subsidio y el tope de vivienda sube a 3.000 UF por tener 80 UF o más de ahorro.`;
      }
      options.push({
        id: "ds1t2-nueva-ds15",
        badge: "Solo Vivienda Nueva - Beneficio DS15",
        title: "DS1 Tramo 2 Nueva (Con DS15)",
        description: "Aplica para viviendas nuevas. Ofrece tasa de interés preferencial y un bono adicional al subsidio.",
        maxHouseUF: resDS15.maxHouseUF,
        loanUF: loanDS15,
        savingsUF: savings,
        subsidyUF: resDS15.subsidyUF,
        minAhorro: 80,
        maxDividendUF: maxDividendDS15,
        warning: warningDS15,
        info: infoDS15,
        linkParams: `maxPrice=${Math.round(resDS15.maxHouseUF * ufValue)}&maxUF=${Math.round(resDS15.maxHouseUF)}&credit=${Math.round(loanDS15)}&origin=ds1t2&region=${locationB}&applyRateDiscount=true&isNew=true`
      });

      // Opción 3: Homologación a DS19 Cupo Sectores Medios 1 (Rural)
      const zoneRural = getDS19LocationZoneB(locationB, false, isPeripheral);
      let subRural = 0;
      let capRural = 0;
      if (zoneRural === "sur_islas") {
        capRural = 2400;
        subRural = 537.5 + 100;
      } else if (zoneRural === "urbana_norte_stgo") {
        capRural = 1900;
        subRural = 487.5 + 100;
      } else {
        capRural = 1800;
        subRural = 425 + 100;
      }
      const maxHouseRural = Math.min(maxLoanUFDS15 + savings + subRural, capRural);
      const loanRural = Math.max(0, maxHouseRural - savings - subRural);
      const maxDividendRural = loanRural > 0 ? (loanRural * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningRural = "";
      if (savings < 80) {
        warningRural = `⚠️ Falta Ahorro: Para el Cupo Rural necesitas un ahorro mínimo de 80 UF. Te faltan ${(80 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds1t2-homologado-rural",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "Homologación a DS19 (Cupo Rural / Medios 1)",
        description: "Adquiere vivienda nueva en proyectos con convenio en sectores rurales o comunas periféricas. Incluye beneficio DS15.",
        maxHouseUF: maxHouseRural,
        loanUF: loanRural,
        savingsUF: savings,
        subsidyUF: subRural,
        minAhorro: 80,
        maxDividendUF: maxDividendRural,
        warning: warningRural,
        linkParams: `maxPrice=${Math.round(maxHouseRural * ufValue)}&maxUF=${Math.round(maxHouseRural)}&credit=${Math.round(loanRural)}&origin=ds19&region=${locationB}&cupoType=vulnerable_rural`
      });

      // Opción 4: Homologación a DS19 Cupo Sectores Medios 2 (Urbano)
      const zoneUrban = getDS19LocationZoneB(locationB, true, isPeripheral);
      let subUrban = 0;
      let capUrban = 0;
      if (zoneUrban === "sur_islas") {
        capUrban = 3000;
        subUrban = 500 + 100;
      } else if (zoneUrban === "urbana_norte_stgo") {
        capUrban = 2800;
        subUrban = 350 + 100;
      } else {
        capUrban = 2600;
        subUrban = 350 + 100;
      }
      const maxHouseUrban = Math.min(maxLoanUFDS15 + savings + subUrban, capUrban);
      const loanUrban = Math.max(0, maxHouseUrban - savings - subUrban);
      const maxDividendUrban = loanUrban > 0 ? (loanUrban * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningUrban = "";
      if (savings < 80) {
        warningUrban = `⚠️ Falta Ahorro: Para el Cupo Urbano necesitas un ahorro mínimo de 80 UF. Te faltan ${(80 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds1t2-homologado-urban",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "Homologación a DS19 (Cupo Urbano / Medios 2)",
        description: "Adquiere vivienda nueva en proyectos integrados urbanos con beneficio DS15 aplicado automáticamente.",
        maxHouseUF: maxHouseUrban,
        loanUF: loanUrban,
        savingsUF: savings,
        subsidyUF: subUrban,
        minAhorro: 80,
        maxDividendUF: maxDividendUrban,
        warning: warningUrban,
        linkParams: `maxPrice=${Math.round(maxHouseUrban * ufValue)}&maxUF=${Math.round(maxHouseUrban)}&credit=${Math.round(loanUrban)}&origin=ds19&region=${locationB}&cupoType=urban_media`
      });
    }

    if (selectedSubsidyB === "ds1t3" || selectedSubsidyB === "all") {
      // Opción 1: DS1 Tramo 3 Usada (Sin DS15)
      const resNormal = calculateDS1T3Max(maxLoanUFNormal, savings, ds1ZoneB);
      const loanNormal = Math.max(0, resNormal.maxHouseUF - savings - resNormal.subsidyUF);
      const maxDividendNormal = loanNormal > 0 ? (loanNormal * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;
      let warningNormal = "";
      if (savings < 80) {
        warningNormal = `⚠️ Falta Ahorro: Se exige mínimo 80 UF para el DS1 Tramo 3. Te faltan ${(80 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds1t3-usada",
        badge: "Vivienda Usada o Nueva - MINVU",
        title: "DS1 Tramo 3 Usada/Nueva (Sin DS15)",
        description: "Para compras convencionales. Tope máximo de compra de hasta 2.200 UF (o 2.600 UF en zonas extremas).",
        maxHouseUF: resNormal.maxHouseUF,
        loanUF: loanNormal,
        savingsUF: savings,
        subsidyUF: resNormal.subsidyUF,
        minAhorro: 80,
        maxDividendUF: maxDividendNormal,
        warning: warningNormal,
        linkParams: `maxPrice=${Math.round(resNormal.maxHouseUF * ufValue)}&maxUF=${Math.round(resNormal.maxHouseUF)}&credit=${Math.round(loanNormal)}&origin=ds1t3&region=${locationB}&isNew=false`
      });

      // Opción 2: DS1 Tramo 3 Nueva (Con DS15)
      const resDS15 = calculateDS1T3MaxWithDS15(maxLoanUFDS15, savings, ds1ZoneB);
      const loanDS15 = Math.max(0, resDS15.maxHouseUF - savings - resDS15.subsidyUF);
      const maxDividendDS15 = loanDS15 > 0 ? (loanDS15 * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningDS15 = "";
      let infoDS15 = "";
      if (savings < 160) {
        warningDS15 = `⚠️ Falta Ahorro: Para activar el beneficio DS15 en Tramo 3 necesitas mínimo 160 UF. Te faltan ${(160 - savings).toFixed(0)} UF.`;
        infoDS15 = `💡 ¡Duplica tu ahorro! Si logras llegar a 160 UF, activarás el beneficio DS15, que añade un bono de 150 UF al subsidio y amplía tu tope de compra a 3.000 UF.`;
      } else {
        infoDS15 = `✨ ¡Beneficio DS15 Activo! Se añade un bono de 150 UF al subsidio y el tope de vivienda sube a 3.000 UF por tener 160 UF o más de ahorro.`;
      }
      options.push({
        id: "ds1t3-nueva-ds15",
        badge: "Solo Vivienda Nueva - Beneficio DS15",
        title: "DS1 Tramo 3 Nueva (Con DS15)",
        description: "Aplica para viviendas nuevas. Agrega un bono de 150 UF al subsidio y tasa preferencial.",
        maxHouseUF: resDS15.maxHouseUF,
        loanUF: loanDS15,
        savingsUF: savings,
        subsidyUF: resDS15.subsidyUF,
        minAhorro: 160,
        maxDividendUF: maxDividendDS15,
        warning: warningDS15,
        info: infoDS15,
        linkParams: `maxPrice=${Math.round(resDS15.maxHouseUF * ufValue)}&maxUF=${Math.round(resDS15.maxHouseUF)}&credit=${Math.round(loanDS15)}&origin=ds1t3&region=${locationB}&applyRateDiscount=true&isNew=true`
      });

      // Opción 3: Homologación a DS19 Cupo Sectores Medios 2 (Urbano)
      const zoneUrban = getDS19LocationZoneB(locationB, true, isPeripheral);
      let subUrban = 0;
      let capUrban = 0;
      if (zoneUrban === "sur_islas") {
        capUrban = 3000;
        subUrban = 500 + 100;
      } else if (zoneUrban === "urbana_norte_stgo") {
        capUrban = 2800;
        subUrban = 350 + 100;
      } else {
        capUrban = 2600;
        subUrban = 350 + 100;
      }
      const maxHouseUrban = Math.min(maxLoanUFDS15 + savings + subUrban, capUrban);
      const loanUrban = Math.max(0, maxHouseUrban - savings - subUrban);
      const maxDividendUrban = loanUrban > 0 ? (loanUrban * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningUrban = "";
      if (savings < 80) {
        warningUrban = `⚠️ Falta Ahorro: Para el Cupo Urbano necesitas un ahorro mínimo de 80 UF. Te faltan ${(80 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds1t3-homologado-urban",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "Homologación a DS19 (Cupo Urbano / Medios 2)",
        description: "Adquiere vivienda nueva en proyectos integrados urbanos con beneficio DS15 aplicado automáticamente.",
        maxHouseUF: maxHouseUrban,
        loanUF: loanUrban,
        savingsUF: savings,
        subsidyUF: subUrban,
        minAhorro: 80,
        maxDividendUF: maxDividendUrban,
        warning: warningUrban,
        linkParams: `maxPrice=${Math.round(maxHouseUrban * ufValue)}&maxUF=${Math.round(maxHouseUrban)}&credit=${Math.round(loanUrban)}&origin=ds19&region=${locationB}&cupoType=urban_media`
      });
    }

    if (selectedSubsidyB === "ds1t4" || selectedSubsidyB === "all") {
      const subsidyUF = 400;
      const cap = 4000;
      const effectiveSavingsB = savings < 200 ? 200 : savings;
      const maxHouseUF = Math.min(maxLoanUFNormal + effectiveSavingsB + subsidyUF, cap);
      const loanUF = Math.max(0, maxHouseUF - effectiveSavingsB - subsidyUF);
      const maxDividend = loanUF > 0 ? (loanUF * monthlyRateNormal) / (1 - Math.pow(1 + monthlyRateNormal, -totalPayments)) : 0;
      let warningT4 = "";
      if (savings < 200) {
        warningT4 = `⚠️ Falta Ahorro: Se exige mínimo 200 UF para el DS1 Tramo 4. Te faltan ${(200 - savings).toFixed(0)} UF. Hemos simulado asumiendo que alcanzarás la meta de 200 UF.`;
      }
      options.push({
        id: "ds1t4-propio",
        badge: "Vivienda Nueva/Usada - Postulación MINVU",
        title: "Subsidio DS1 Tramo 4",
        description: "Diseñado para viviendas de hasta 4.000 UF en sectores medios. Apoyo estatal directo de 400 UF.",
        maxHouseUF,
        loanUF,
        savingsUF: effectiveSavingsB,
        subsidyUF,
        minAhorro: 200,
        maxDividendUF: maxDividend,
        warning: warningT4,
        linkParams: `maxPrice=${Math.round(maxHouseUF * ufValue)}&maxUF=${Math.round(maxHouseUF)}&credit=${Math.round(loanUF)}&origin=ds1t4&region=${locationB}&propertyType=${propertyTypeB}`
      });
    }

    if (selectedSubsidyB === "ds19" || selectedSubsidyB === "all") {
      // Opción 1: DS19 Cupo Urbano (Medios 2)
      const zoneUrban = getDS19LocationZoneB(locationB, true, isPeripheral);
      let subUrban = 0;
      let capUrban = 0;
      if (zoneUrban === "sur_islas") {
        capUrban = 3000;
        subUrban = 500 + 100;
      } else if (zoneUrban === "urbana_norte_stgo") {
        capUrban = 2800;
        subUrban = 350 + 100;
      } else {
        capUrban = 2600;
        subUrban = 350 + 100;
      }
      const maxHouseUrban = Math.min(maxLoanUFDS15 + savings + subUrban, capUrban);
      const loanUrban = Math.max(0, maxHouseUrban - savings - subUrban);
      const maxDividendUrban = loanUrban > 0 ? (loanUrban * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningUrban = "";
      if (savings < 80) {
        warningUrban = `⚠️ Falta Ahorro: Para proyectos DS19 (Sectores Medios) se exige un ahorro mínimo de 80 UF. Te faltan ${(80 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds19-urban",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "DS19 Cupo Urbano (Sectores Medios 2)",
        description: "Adquiere tu vivienda nueva en proyectos con convenio en zonas urbanas. Incluye el beneficio DS15 aplicado automáticamente.",
        maxHouseUF: maxHouseUrban,
        loanUF: loanUrban,
        savingsUF: savings,
        subsidyUF: subUrban,
        minAhorro: 80,
        maxDividendUF: maxDividendUrban,
        warning: warningUrban,
        linkParams: `maxPrice=${Math.round(maxHouseUrban * ufValue)}&maxUF=${Math.round(maxHouseUrban)}&credit=${Math.round(loanUrban)}&origin=ds19&region=${locationB}&cupoType=urban_media`
      });

      // Opción 2: DS19 Cupo Rural (Medios 1)
      const zoneRural = getDS19LocationZoneB(locationB, false, isPeripheral);
      let subRural = 0;
      let capRural = 0;
      if (zoneRural === "sur_islas") {
        capRural = 2400;
        subRural = 537.5 + 100;
      } else if (zoneRural === "urbana_norte_stgo") {
        capRural = 1900;
        subRural = 487.5 + 100;
      } else {
        capRural = 1800;
        subRural = 425 + 100;
      }
      const maxHouseRural = Math.min(maxLoanUFDS15 + savings + subRural, capRural);
      const loanRural = Math.max(0, maxHouseRural - savings - subRural);
      const maxDividendRural = loanRural > 0 ? (loanRural * monthlyRateDS15) / (1 - Math.pow(1 + monthlyRateDS15, -totalPayments)) : 0;
      let warningRural = "";
      if (savings < 80) {
        warningRural = `⚠️ Falta Ahorro: Para proyectos DS19 se exige un ahorro mínimo de 80 UF. Te faltan ${(80 - savings).toFixed(0)} UF.`;
      }
      options.push({
        id: "ds19-rural",
        badge: "Solo Vivienda Nueva - Convenio DS19",
        title: "DS19 Cupo Rural (Sectores Medios 1)",
        description: "Adquiere tu vivienda nueva en proyectos con convenio en sectores rurales o comunas periféricas. Incluye beneficio DS15.",
        maxHouseUF: maxHouseRural,
        loanUF: loanRural,
        savingsUF: savings,
        subsidyUF: subRural,
        minAhorro: 80,
        maxDividendUF: maxDividendRural,
        warning: warningRural,
        linkParams: `maxPrice=${Math.round(maxHouseRural * ufValue)}&maxUF=${Math.round(maxHouseRural)}&credit=${Math.round(loanRural)}&origin=ds19&region=${locationB}&cupoType=vulnerable_rural`
      });
    }

    options.sort((a: any, b: any) => b.maxHouseUF - a.maxHouseUF);
    setResultsB(options);
  };

  // Calcular número total de pasos en Perfil A (total 5 pasos)
  const totalStepsA = 5;
  const progressPercentA = (step / totalStepsA) * 100;

  const getGridColsClass = (length: number) => {
    if (length === 1) return "grid-cols-1 max-w-md mx-auto";
    if (length === 2) return "grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto";
    if (length === 4) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"; // Default for 3
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans flex flex-col justify-between">
      <div>
        {/* Encabezado General */}
        <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
          <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Asistente de Subsidios</h1>
              <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
                Encuentra el camino ideal a tu vivienda propia según tu perfil.
              </p>
            </div>
            <Link href="/" className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all">
              ← Inicio
            </Link>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <main className="max-w-5xl mx-auto px-6 py-10">

          {/* 1. SELECCIÓN DE PERFIL INICIAL */}
          {profile === null && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 max-w-3xl mx-auto animate-fade-in">
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#6b9ac4] block mb-1">
                  Paso 0: Identificación
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                  ¿Cuál es tu situación actual con los subsidios?
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                  Selecciona una opción para adaptar el asistente a lo que necesitas de forma inteligente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => { setProfile("A"); setStep(1); }}
                  className="w-full text-left p-6 rounded-2xl border border-slate-200 hover:border-[#6b9ac4] hover:bg-slate-50 transition-all shadow-sm hover:scale-[1.01] flex flex-col justify-between h-48 group"
                >
                  <div>
                    <span className="text-2xl mb-2 block">🔍</span>
                    <h3 className="font-bold text-slate-900 text-sm md:text-base group-hover:text-[#6b9ac4] transition-colors">
                      Perfil A: Descubrimiento Total
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      No sé mucho sobre los subsidios o en qué tramo del RSH me encuentro. Deseo una guía paso a paso.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#6b9ac4] flex items-center gap-1 mt-4">
                    Iniciar diagnóstico guiado →
                  </span>
                </button>

                <button
                  onClick={() => { setProfile("B"); setStep(1); }}
                  className="w-full text-left p-6 rounded-2xl border border-slate-200 hover:border-[#87c0a3] hover:bg-slate-50 transition-all shadow-sm hover:scale-[1.01] flex flex-col justify-between h-48 group"
                >
                  <div>
                    <span className="text-2xl mb-2 block">⚡</span>
                    <h3 className="font-bold text-slate-900 text-sm md:text-base group-hover:text-[#87c0a3] transition-colors">
                      Perfil B: Simulación Avanzada
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Ya sé qué subsidio buscar o deseo calcular mi presupuesto máximo de compra de inmediato con mis ingresos.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-4">
                    Calcular mi presupuesto ahora →
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* 2. FLUJO PERFIL A: DESCUBRIMIENTO TOTAL */}
          {profile === "A" && (
            <div className="space-y-6 max-w-5xl mx-auto">
              
              {/* Progreso Stepper */}
              {step <= totalStepsA && (
                <div className="max-w-3xl mx-auto space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span className="text-[#6b9ac4] uppercase tracking-wide">Asistente de Descubrimiento (Perfil A)</span>
                    <span>Paso {step} de {totalStepsA}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-[#6b9ac4] h-full transition-all duration-500 ease-out rounded-full"
                      style={{ width: `${progressPercentA}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Contenedores por pasos de Perfil A */}
              {step === 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto animate-fade-in space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paso 1: Grupo Familiar</span>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1 leading-snug">
                      ¿Cómo postularás a tu futura vivienda?
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      El número de integrantes de tu hogar determina los tipos de subsidio a los que tienes derecho legal.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-2">
                    <button
                      onClick={() => { setFamilyType("familia"); handleNextStep(); }}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group ${
                        familyType === "familia" 
                          ? "border-[#6b9ac4] bg-blue-50/50 font-bold" 
                          : "border-slate-200 hover:border-[#6b9ac4] hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <strong className="text-slate-800 text-sm block">Con mi grupo o núcleo familiar</strong>
                        <span className="text-xs text-slate-400 font-normal">Postulación con cónyuge, conviviente, hijos u otros familiares dependientes (2 o más personas).</span>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#6b9ac4] font-bold text-lg">→</span>
                    </button>

                    <button
                      onClick={() => setFamilyType("solo")}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center group ${
                        familyType === "solo" 
                          ? "border-[#6b9ac4] bg-blue-50/50 font-bold" 
                          : "border-slate-200 hover:border-[#6b9ac4] hover:bg-slate-50"
                      }`}
                    >
                      <div>
                        <strong className="text-slate-800 text-sm block">Postulo de manera individual (Solo)</strong>
                        <span className="text-xs text-slate-400 font-normal">Persona soltera o sin cargas familiares registradas ante el MINVU (1 persona).</span>
                      </div>
                      <span className="text-slate-300 group-hover:text-[#6b9ac4] font-bold text-lg">→</span>
                    </button>
                  </div>

                  {familyType === "solo" && (
                    <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-xl text-xs text-amber-900 animate-fade-in leading-relaxed">
                      ⚠️ <strong>Restricción del Subsidio DS49:</strong> El subsidio DS49 exige postular obligatoriamente con un núcleo familiar conformado. Al postular solo, solo podrás postular bajo excepciones muy estrictas (ser adulto mayor, persona viuda, tener discapacidad certificada por el COMPIN, o poseer calidad de indígena acreditada por CONADI). Para los subsidios DS1 o DS19 no aplica esta restricción familiar.
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button onClick={handlePrevStep} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                      ← Cambiar Perfil
                    </button>
                    
                    {familyType !== "" && (
                      <button onClick={handleNextStep} className="bg-[#6b9ac4] hover:bg-[#5a86ae] text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-all">
                        Siguiente paso
                      </button>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto animate-fade-in space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paso 2: Registro Social de Hogares (RSH)</span>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1 leading-snug">
                      Ingresa los datos de tu hogar para estimar tu tramo del RSH
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      El Registro Social de Hogares clasifica tu vulnerabilidad socioeconómica. Necesitamos estos datos para calcular a qué subsidios calificas.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Integrantes del Hogar:</label>
                        <input 
                          type="number" 
                          min="1" 
                          disabled={familyType === "solo"}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:border-[#6b9ac4] disabled:opacity-70 disabled:bg-slate-100 disabled:cursor-not-allowed" 
                          value={rshMembers} 
                          onChange={(e) => setRshMembers(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Ingreso Familiar Líquido Mensual ($ CLP):</label>
                        <input 
                          type="number" 
                          placeholder="Ej: 800000"
                          min="0"
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-800 focus:outline-none focus:border-[#6b9ac4]" 
                          value={rshIncome} 
                          onChange={(e) => setRshIncome(e.target.value)} 
                        />
                      </div>
                    </div>

                    {calculatedRsh !== "" && (
                      <div className="bg-[#6b9ac4]/10 border border-[#6b9ac4]/30 p-3 rounded-lg text-xs leading-relaxed text-slate-700">
                        ✨ <strong>Tramo Estimado:</strong> Basado en un ingreso per cápita familiar de <strong>${Math.round(parseFloat(rshIncome)/parseInt(rshMembers)).toLocaleString("es-CL")}</strong>, estimamos que te encuentras en el tramo del <strong>{calculatedRsh === "100" ? "mayor a 90%" : calculatedRsh + "%"}</strong> de vulnerabilidad.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button onClick={handlePrevStep} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                      ← Atrás
                    </button>
                    
                    <button 
                      onClick={handleNextStep}
                      disabled={rshIncome === "" || parseFloat(rshIncome) < 0}
                      className={`font-bold text-xs py-2.5 px-5 rounded-lg transition-all ${
                        (rshIncome !== "" && parseFloat(rshIncome) >= 0)
                          ? "bg-[#6b9ac4] hover:bg-[#5a86ae] text-white" 
                          : "bg-slate-200 text-slate-400 cursor-not-allowed"
                      }`}
                    >
                      Siguiente paso
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 3: Ubicación de Compra */}
              {step === 3 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto animate-fade-in space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paso 3: Ubicación de Compra</span>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1 leading-snug">
                      ¿En qué región deseas buscar o comprar tu vivienda?
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Los límites de valor de propiedad y montos de subsidio varían según la región del país.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Región donde deseas comprar:</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]"
                        value={regionA}
                        onChange={(e) => setRegionA(e.target.value)}
                      >
                        {Object.keys(REGION_MAP).map((key) => (
                          <option key={key} value={key}>{REGION_MAP[key].label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button onClick={handlePrevStep} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                      ← Atrás
                    </button>
                    
                    <button 
                      onClick={handleNextStep} 
                      className="bg-[#6b9ac4] hover:bg-[#5a86ae] text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-all"
                    >
                      Siguiente paso
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 4: Capacidad de Ahorro */}
              {step === 4 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm max-w-3xl mx-auto animate-fade-in space-y-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Paso 4: Ahorro Habitacional</span>
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1 leading-snug">
                      ¿Con cuánto ahorro cuentas en tu Libreta de Vivienda?
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      El MINVU exige montos mínimos de ahorro depositados para poder postular a los subsidios.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Monto de Ahorro ($ CLP):</label>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Ej: 3000000"
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]"
                          value={savingsCLPA} 
                          onChange={(e) => handleSavingsCLPChange(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Monto de Ahorro (UF):</label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          placeholder="Ej: 80"
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]"
                          value={savingsUF} 
                          onChange={(e) => handleSavingsUFChange(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border border-slate-200/60 rounded-xl space-y-2">
                      <span className="text-xs font-bold text-slate-600 block">Ahorros mínimos de referencia exigidos:</span>
                      <ul className="text-[11px] text-slate-500 space-y-1 list-disc pl-4">
                        <li><strong>Subsidio DS49:</strong> 10 UF mínimo</li>
                        <li><strong>DS1 Tramo 1:</strong> 30 UF mínimo</li>
                        <li><strong>DS1 Tramo 2 y DS19 (vulnerable):</strong> 40 UF mínimo</li>
                        <li><strong>DS1 Tramo 3 y DS19 (clase media):</strong> 80 UF mínimo</li>
                        <li><strong>DS1 Tramo 4 (4000 UF):</strong> 200 UF mínimo</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button onClick={handlePrevStep} className="text-xs font-bold text-slate-500 hover:text-slate-700">
                      ← Atrás
                    </button>
                    
                    {savingsUF !== "" && (
                      <button onClick={handleNextStep} className="bg-[#6b9ac4] hover:bg-[#5a86ae] text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-all">
                        Ver Recomendación
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Paso 5: Resultados (Perfil A - Multi-Recomendación) */}
              {step === 5 && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Panel de Controles Interactivos */}
                  <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-lg font-black text-slate-900">Configuración Financiera del Reporte</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Ajusta los plazos del crédito para recalcular los presupuestos máximos.</p>
                      </div>
                      
                      {/* Controles rápidos */}
                      <div className="w-full md:w-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Plazo Crédito:</label>
                          <select
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none"
                            value={loanTermA}
                            onChange={(e) => setLoanTermA(e.target.value)}
                          >
                            <option value="15">15 años</option>
                            <option value="20">20 años</option>
                            <option value="25">25 años</option>
                            <option value="30">30 años</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Banco Simulado:</label>
                          <select
                            className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none"
                            value={selectedBankA}
                            onChange={(e) => setSelectedBankA(e.target.value)}
                          >
                            {Object.keys(BANKS).map((key) => (
                              <option key={key} value={key}>{BANKS[key].name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-end pb-2 sm:pb-3">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-3.5 h-3.5 rounded text-[#6b9ac4]"
                              checked={isYoungSingleA}
                              onChange={(e) => setIsYoungSingleA(e.target.checked)}
                            />
                            ¿Menor de 35 años?
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Título de Recomendaciones */}
                  <div className="text-center pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#6b9ac4] block mb-1">Resultados de Diagnóstico</span>
                    <h2 className="text-2xl font-extrabold text-slate-900">Tus Subsidios y Alternativas de Compra</h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
                      Listado ordenado de mayor a menor valor máximo de propiedad alcanzable en {REGION_MAP[regionA]?.label || "tu región"} con tus ingresos y ahorro.
                    </p>
                  </div>

                  {/* Filtros Rápidos y Selector de Vista (Perfil A) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    {/* Filtros de Categoría */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filtrar:</span>
                      <button
                        onClick={() => setFilterCategoryA("todos")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryA === "todos"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Todas ({recommendationsA.length})
                      </button>
                      <button
                        onClick={() => setFilterCategoryA("subsidio")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryA === "subsidio"
                            ? "bg-[#6b9ac4] text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        🏛️ Con Subsidio
                      </button>
                      <button
                        onClick={() => setFilterCategoryA("nueva")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryA === "nueva"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        ✨ Vivienda Nueva
                      </button>
                      <button
                        onClick={() => setFilterCategoryA("usada")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryA === "usada"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        🏡 Vivienda Usada
                      </button>
                    </div>

                    {/* Selector de Modo de Vista (Cuadros vs Lista Horizontal) */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => setViewModeA("grid")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          viewModeA === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Ver en Cuadros / Grilla Responsiva"
                      >
                        <span>🔲</span>
                        <span>Cuadros</span>
                      </button>
                      <button
                        onClick={() => setViewModeA("horizontal")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          viewModeA === "horizontal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Ver en Lista Horizontal Deslizable"
                      >
                        <span>↔️</span>
                        <span>Lista Horizontal</span>
                      </button>
                    </div>
                  </div>

                  {/* Leyenda para móvil en Lista Horizontal */}
                  {viewModeA === "horizontal" && (
                    <div className="text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5 py-1">
                      <span>⬅️</span> Desliza horizontalmente para explorar todas tus opciones <span>➡️</span>
                    </div>
                  )}

                  {/* Contenedor de Recomendaciones Perfil A (Cuadros o Lista Horizontal) */}
                  <div className={
                    viewModeA === "horizontal"
                      ? "flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 px-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  }>
                    {recommendationsA
                      .filter((card) => {
                        if (filterCategoryA === "subsidio") return card.subsidyUF > 0;
                        if (filterCategoryA === "nueva") return card.isNew === true;
                        if (filterCategoryA === "usada") return card.isNew === false;
                        return true;
                      })
                      .map((card, idx) => {
                        const isFirst = idx === 0 && filterCategoryA === "todos";
                        const isSavingsShort = card.minAhorro > 0 && (parseFloat(savingsUF) || 0) < card.minAhorro;
                        const missingUF = Math.max(0, card.minAhorro - (parseFloat(savingsUF) || 0));
                        const missingCLP = missingUF * ufValue;

                        return (
                          <article 
                            key={card.id || idx}
                            className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative ${
                              viewModeA === "horizontal" ? "w-[300px] sm:w-[340px] shrink-0 snap-start" : "w-full"
                            } ${
                              isFirst 
                                ? "border-emerald-400 ring-2 ring-emerald-400/20 bg-gradient-to-b from-emerald-50/40 via-white to-white" 
                                : "border-slate-200/90 hover:border-[#6b9ac4]"
                            }`}
                          >
                            <div className="space-y-4">
                              {/* Cabecera con Insignias */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg tracking-wide uppercase ${
                                  isFirst ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-800 text-white"
                                }`}>
                                  #{idx + 1} {isFirst ? "🏆 Mayor Capacidad" : ""}
                                </span>

                                <span className="bg-blue-50 text-[#6b9ac4] text-[10px] font-bold py-1 px-2.5 rounded-lg border border-blue-100">
                                  {card.badge}
                                </span>
                              </div>

                              {/* Título y Descripción */}
                              <div>
                                <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-[#6b9ac4] transition-colors">
                                  {card.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                                  {card.description}
                                </p>
                              </div>

                              {/* Cuadro de Valor Máximo de Casa */}
                              <div className="bg-slate-900 text-white p-4 rounded-xl text-center shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                                  Valor Máximo de Casa
                                </span>
                                <strong className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
                                  {card.maxHouseUF.toFixed(0)} UF
                                </strong>
                                <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                                  ≈ ${Math.round(card.maxHouseUF * ufValue).toLocaleString("es-CL")} CLP
                                </span>
                              </div>

                              {/* Desglose de Financiamiento */}
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600">
                                  <span>{card.savingsLabel || "Tu Ahorro"}:</span>
                                  <span className="font-bold text-slate-800">
                                    {(card.savingsUF !== undefined ? card.savingsUF : Math.max(card.minAhorro || 0, parseFloat(savingsUF) || 0)).toFixed(0)} UF
                                  </span>
                                </div>

                                <div className="flex justify-between text-slate-600">
                                  <span>Aporte Subsidio Estatal:</span>
                                  <span className="font-bold text-emerald-600">
                                    {card.subsidyUF > 0 ? `+${card.subsidyUF.toFixed(0)} UF` : "0 UF"}
                                  </span>
                                </div>

                                <div className="flex justify-between text-slate-600">
                                  <span>Crédito Hipotecario:</span>
                                  <span className="font-bold text-blue-600">
                                    {card.loanUF > 0 ? `${card.loanUF.toFixed(0)} UF` : "No requiere"}
                                  </span>
                                </div>

                                {card.maxDividendUF > 0 && (
                                  <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-200/60 font-medium">
                                    <span>Dividendo Estimado:</span>
                                    <span className="font-bold text-slate-900">
                                      ${Math.round(card.maxDividendUF * ufValue).toLocaleString("es-CL")}/mes
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Alertas e Información */}
                              {isSavingsShort && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs leading-relaxed">
                                  <strong>⚠️ Ahorro Insuficiente:</strong> Exige mínimo <strong>{card.minAhorro} UF</strong>. Te faltan <strong>{missingUF.toFixed(0)} UF</strong> (aprox. <strong>${Math.round(missingCLP).toLocaleString("es-CL")} CLP</strong>).
                                </div>
                              )}

                              {card.warning && !isSavingsShort && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs leading-relaxed">
                                  {card.warning}
                                </div>
                              )}

                              {card.info && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-xl text-xs leading-relaxed">
                                  {card.info}
                                </div>
                              )}
                            </div>

                            {/* Botón CTA */}
                            <div className="pt-4 mt-auto">
                              <Link 
                                href={`/ofertas-inmobiliarias?${card.linkParams}`}
                                className="w-full text-center py-3 px-4 bg-[#6b9ac4] hover:bg-[#5a86ae] text-white font-bold text-xs rounded-xl transition-all shadow-sm block group-hover:shadow-md"
                              >
                                Buscar Ofertas Compatibles →
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                  </div>

                  <div className="text-center pt-4">
                    <button
                      onClick={handleRestart}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium underline transition-colors"
                    >
                      Volver a empezar el asistente (Perfil A)
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* 3. FLUJO PERFIL B: SIMULACIÓN RÁPIDA / AVANZADA */}
          {profile === "B" && (
            <div className="space-y-6 max-w-3xl mx-auto">
              
              {!resultsB ? (
                // Formulario de Entrada Perfil B
                <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm animate-fade-in">
                  <div className="mb-6 flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Simulación Rápida (Perfil B)</span>
                      <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1">Calcular Capacidad de Compra Inmediata</h2>
                    </div>
                    <button onClick={handlePrevStep} className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                      Volver
                    </button>
                  </div>

                  <form onSubmit={handleCalculateB} className="space-y-5">
                    
                    {/* Fila 1: Ingreso y Ahorro Sincronizado */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Renta Líquida Familiar Mensual ($ CLP):
                        </label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          placeholder="Ej: 1200000"
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                          value={incomeCLPB} 
                          onChange={(e) => setIncomeCLPB(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ahorro Disponible ($ CLP):
                        </label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          placeholder="Ej: 3000000"
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                          value={savingsCLPB} 
                          onChange={(e) => handleSavingsCLPBChange(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Ahorro Disponible (UF):
                        </label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          step="0.01"
                          placeholder="Ej: 80"
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                          value={savingsUFB} 
                          onChange={(e) => handleSavingsUFBChange(e.target.value)} 
                        />
                      </div>
                    </div>

                    {/* Fila 2: Subsidio, Tipo de Hogar, Entorno */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Subsidio a Postular:</label>
                        <select 
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                          value={selectedSubsidyB} 
                          onChange={(e) => setSelectedSubsidyB(e.target.value)}
                        >
                          <option value="all">Todas las Opciones / Comparar Todos los Subsidios</option>
                          <option value="none">Compra sin Subsidio (Hipotecario Tradicional)</option>
                          <option value="ds1t1">Subsidio DS1 Tramo 1</option>
                          <option value="ds1t2">Subsidio DS1 Tramo 2</option>
                          <option value="ds1t3">Subsidio DS1 Tramo 3</option>
                          <option value="ds1t4">Subsidio DS1 Tramo 4 (4000 UF)</option>
                          <option value="ds19">Proyecto de Integración DS19</option>
                          <option value="ds49">Subsidio DS49 (Fondo Solidario)</option>
                        </select>
                      </div>

                      {["ds49", "ds1t1"].includes(selectedSubsidyB) && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Hogar:</label>
                          <select 
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                            value={propertyTypeB} 
                            onChange={(e) => setPropertyTypeB(e.target.value as "casa" | "depto" | "ambos")}
                          >
                            <option value="ambos">Casa o Departamento (Cualquiera)</option>
                            <option value="casa">Solo Casa</option>
                            <option value="depto">Solo Departamento</option>
                          </select>
                        </div>
                      )}

                      {selectedSubsidyB === "ds49" && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Entorno / Ubicación:</label>
                          <select 
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                            value={isUrbanB ? "urban" : "rural"} 
                            onChange={(e) => setIsUrbanB(e.target.value === "urban")}
                          >
                            <option value="urban">Urbano</option>
                            <option value="rural">Rural</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Fila 3: Región de la Vivienda y Comuna */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Región de la vivienda:</label>
                        <select 
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                          value={locationB} 
                          onChange={(e) => setLocationB(e.target.value)}
                        >
                          {Object.keys(REGION_MAP).map((key) => (
                            <option key={key} value={key}>{REGION_MAP[key].label}</option>
                          ))}
                        </select>
                      </div>

                      {["ds1t2", "ds1t3", "ds19"].includes(selectedSubsidyB) && DS19_COMMUNES_PERIPHERAL[locationB]?.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Comuna / Ciudad en la Región:</label>
                          <select 
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                            value={selectedCommuneB} 
                            onChange={(e) => setSelectedCommuneB(e.target.value)}
                          >
                            {DS19_COMMUNES_PERIPHERAL[locationB].map((c) => (
                              <option key={c.key} value={c.key}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Fila 4: Banco y Plazo (Solo si no es DS49) */}
                    {selectedSubsidyB !== "ds49" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Institución Financiera para Simulación:</label>
                          <select 
                            required
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                            value={selectedBankB} 
                            onChange={(e) => setSelectedBankB(e.target.value)}
                          >
                            <option value="">Selecciona un banco...</option>
                            {Object.keys(BANKS).map(key => (
                              <option key={key} value={key}>
                                {BANKS[key].name} ({BANKS[key].tasaBase ? `${(BANKS[key].tasaBase * 100).toFixed(2)}%` : 'Tasa Dinámica'})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Plazo del Crédito Hipotecario:</label>
                          <select 
                            className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#87c0a3]" 
                            value={loanTermB} 
                            onChange={(e) => setLoanTermB(e.target.value)}
                          >
                            <option value="15">15 años</option>
                            <option value="20">20 años</option>
                            <option value="25">25 años</option>
                            <option value="30">30 años</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Leyes y Beneficios Adicionales */}
                    {selectedSubsidyB !== "ds49" && (
                      <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-[#87c0a3]" 
                            checked={isYoungSingleB} 
                            onChange={(e) => setIsYoungSingleB(e.target.checked)} 
                          />
                          ¿Eres joven soltero menor de 35 años? (Permite endeudamiento al 33% de la renta)
                        </label>
                      </div>
                    )}

                    <button 
                      type="submit" 
                      className="w-full bg-[#87c0a3] hover:bg-[#76b092] text-slate-950 font-bold p-3.5 rounded-xl transition-all shadow-sm text-sm"
                    >
                      Calcular Capacidad de Compra Real →
                    </button>
                  </form>
                </section>
              ) : (
                // Resultados de Simulación Perfil B
                <div className="space-y-6 animate-fade-in">
                  <div className="text-center pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 block mb-1">
                      Resultados de Simulación (Perfil B)
                    </span>
                    <h2 className="text-2xl font-extrabold text-slate-900">Capacidad de Compra Real Estimada</h2>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
                      Listado ordenado de mayor a menor valor máximo de propiedad alcanzable en la región de {REGION_MAP[locationB]?.label} con tus ingresos y ahorro.
                    </p>
                  </div>

                  {/* Filtros Rápidos y Selector de Vista (Perfil B) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                    {/* Filtros de Categoría */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Filtrar:</span>
                      <button
                        onClick={() => setFilterCategoryB("todos")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryB === "todos"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Todas ({resultsB.length})
                      </button>
                      <button
                        onClick={() => setFilterCategoryB("subsidio")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryB === "subsidio"
                            ? "bg-[#87c0a3] text-slate-950 shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        🏛️ Con Subsidio
                      </button>
                      <button
                        onClick={() => setFilterCategoryB("nueva")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryB === "nueva"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        ✨ Vivienda Nueva
                      </button>
                      <button
                        onClick={() => setFilterCategoryB("usada")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          filterCategoryB === "usada"
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        🏡 Vivienda Usada
                      </button>
                    </div>

                    {/* Selector de Modo de Vista (Cuadros vs Lista Horizontal) */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => setViewModeB("grid")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          viewModeB === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Ver en Cuadros / Grilla Responsiva"
                      >
                        <span>🔲</span>
                        <span>Cuadros</span>
                      </button>
                      <button
                        onClick={() => setViewModeB("horizontal")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          viewModeB === "horizontal" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                        }`}
                        title="Ver en Lista Horizontal Deslizable"
                      >
                        <span>↔️</span>
                        <span>Lista Horizontal</span>
                      </button>
                    </div>
                  </div>

                  {/* Leyenda para móvil en Lista Horizontal */}
                  {viewModeB === "horizontal" && (
                    <div className="text-center text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1.5 py-1">
                      <span>⬅️</span> Desliza horizontalmente para explorar todas tus opciones <span>➡️</span>
                    </div>
                  )}

                  {/* Contenedor de Resultados Perfil B (Cuadros o Lista Horizontal) */}
                  <div className={
                    viewModeB === "horizontal"
                      ? "flex gap-5 overflow-x-auto snap-x snap-mandatory pb-6 px-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
                      : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  }>
                    {resultsB
                      .filter((card: any) => {
                        if (filterCategoryB === "subsidio") return card.subsidyUF > 0;
                        if (filterCategoryB === "nueva") return card.isNew === true;
                        if (filterCategoryB === "usada") return card.isNew === false;
                        return true;
                      })
                      .map((card: any, idx: number) => {
                        const isFirst = idx === 0 && filterCategoryB === "todos";
                        const isSavingsShort = card.minAhorro > 0 && (parseFloat(savingsUFB) || 0) < card.minAhorro;
                        const missingUF = Math.max(0, card.minAhorro - (parseFloat(savingsUFB) || 0));
                        const missingCLP = missingUF * ufValue;

                        return (
                          <article 
                            key={card.id || idx}
                            className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative ${
                              viewModeB === "horizontal" ? "w-[300px] sm:w-[340px] shrink-0 snap-start" : "w-full"
                            } ${
                              isFirst 
                                ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/40 via-white to-white" 
                                : "border-slate-200/90 hover:border-emerald-500"
                            }`}
                          >
                            <div className="space-y-4">
                              {/* Cabecera con Insignias */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5">
                                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-lg tracking-wide uppercase ${
                                  isFirst ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-800 text-white"
                                }`}>
                                  #{idx + 1} {isFirst ? "🏆 Mayor Capacidad" : ""}
                                </span>

                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-emerald-100">
                                  {card.badge}
                                </span>
                              </div>

                              {/* Título y Descripción */}
                              <div>
                                <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-emerald-600 transition-colors">
                                  {card.title}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                                  {card.description}
                                </p>
                              </div>

                              {/* Cuadro de Valor Máximo de Casa */}
                              <div className="bg-slate-900 text-white p-4 rounded-xl text-center shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                                  Valor Máximo de Casa
                                </span>
                                <strong className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
                                  {card.maxHouseUF.toFixed(0)} UF
                                </strong>
                                <span className="text-xs font-bold text-emerald-400 block mt-0.5">
                                  ≈ ${Math.round(card.maxHouseUF * ufValue).toLocaleString("es-CL")} CLP
                                </span>
                              </div>

                              {/* Desglose de Financiamiento */}
                              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 text-xs">
                                <div className="flex justify-between text-slate-600">
                                  <span>{card.savingsLabel || "Tu Ahorro"}:</span>
                                  <span className="font-bold text-slate-800">
                                    {(card.savingsUF !== undefined ? card.savingsUF : Math.max(card.minAhorro || 0, parseFloat(savingsUFB) || 0)).toFixed(0)} UF
                                  </span>
                                </div>

                                <div className="flex justify-between text-slate-600">
                                  <span>Aporte Subsidio Estatal:</span>
                                  <span className="font-bold text-emerald-600">
                                    {card.subsidyUF > 0 ? `+${card.subsidyUF.toFixed(0)} UF` : "0 UF"}
                                  </span>
                                </div>

                                <div className="flex justify-between text-slate-600">
                                  <span>Crédito Hipotecario:</span>
                                  <span className="font-bold text-blue-600">
                                    {card.loanUF > 0 ? `${card.loanUF.toFixed(0)} UF` : "No requiere"}
                                  </span>
                                </div>

                                {card.maxDividendUF > 0 && (
                                  <div className="flex justify-between text-slate-700 pt-2 border-t border-slate-200/60 font-medium">
                                    <span>Dividendo Estimado:</span>
                                    <span className="font-bold text-slate-900">
                                      ${Math.round(card.maxDividendUF * ufValue).toLocaleString("es-CL")}/mes
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Alertas e Información */}
                              {isSavingsShort && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs leading-relaxed">
                                  <strong>⚠️ Ahorro Insuficiente:</strong> Exige mínimo <strong>{card.minAhorro} UF</strong>. Te faltan <strong>{missingUF.toFixed(0)} UF</strong> (aprox. <strong>${Math.round(missingCLP).toLocaleString("es-CL")} CLP</strong>).
                                </div>
                              )}

                              {card.warning && !isSavingsShort && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs leading-relaxed">
                                  {card.warning}
                                </div>
                              )}

                              {card.info && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-xl text-xs leading-relaxed">
                                  {card.info}
                                </div>
                              )}
                            </div>

                            {/* Botón CTA */}
                            <div className="pt-4 mt-auto">
                              <Link 
                                href={`/ofertas-inmobiliarias?${card.linkParams}`}
                                className="w-full text-center py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm block group-hover:shadow-md"
                              >
                                Buscar Ofertas Compatibles →
                              </Link>
                            </div>
                          </article>
                        );
                      })}
                  </div>

                  <div className="flex justify-center gap-4 pt-4">
                    <Link 
                      href="/formulario"
                      className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                    >
                      Evaluar mi Capacidad Gratis
                    </Link>
                    <button
                      onClick={handleRestart}
                      className="py-3 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all"
                    >
                      Volver a simular con otros valores
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* Footer único */}
      <footer className="text-center py-6 text-slate-400 text-xs border-t border-slate-200 bg-white">
        <p>© 2026 SubsiMatch</p>
      </footer>
    </div>
  );
}
