// src/app/valor-maximo/ds19/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks";
import { REGION_MAP } from "@/data/regions";

export default function MaxValueDS19Page() {
  const [incomeCLP, setIncomeCLP] = useState("");
  const [savingsUF, setSavingsUF] = useState("");
  const [propertyType, setPropertyType] = useState<"casa" | "depto" | "ambos">("ambos");
  const [subsidyType, setSubsidyType] = useState("none"); // "ds49" | "ds1t1" | "ds1t2" | "ds1t3" | "none"
  const [cupoType, setCupoType] = useState("urban_media"); // dependiente del subsidio
  const [manualSubsidy, setManualSubsidy] = useState(""); // para subsidios variables
  const [bank, setBank] = useState("");
  const [loanTerm, setLoanTerm] = useState("25");
  const [isDS15, setIsDS15] = useState(true);
  const [isYoungSingle, setIsYoungSingle] = useState(false);
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  const [region, setRegion] = useState("metropolitana");
  const [isMetroPeripheral, setIsMetroPeripheral] = useState(false);

  // Determinar si el subsidio es variable (Cupo Sectores Medios 2)
  const isVariable =
    (subsidyType === "ds1t2" && cupoType === "medios2") ||
    subsidyType === "ds1t3" ||
    (subsidyType === "none" && cupoType === "urban_media");

  // Obtener la zona geográfica DS19 basada en la región y si es comuna periférica
  const getDS19LocationZone = (reg: string, isVar: boolean, isPeripheral: boolean) => {
    if (["aysen", "magallanes"].includes(reg)) {
      return "sur_islas";
    }
    if (reg === "metropolitana" && isPeripheral) {
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

  const location = getDS19LocationZone(region, isVariable, isMetroPeripheral);

  // Sincronizar el Tipo de Cupo por defecto al cambiar el subsidio previo
  useEffect(() => {
    if (subsidyType === "ds49") setCupoType("vulnerable");
    if (subsidyType === "ds1t3") setCupoType("medios2");
    if (subsidyType === "ds1t1") setCupoType("medios1");
    if (subsidyType === "ds1t2") setCupoType("medios2");
    if (subsidyType === "none") setCupoType("urban_media");
    setResults(null);
  }, [subsidyType]);

  // Actualizar el valor estimado del subsidio variable según la zona
  useEffect(() => {
    if (isVariable) {
      const defaultVal = location === "sur_islas" ? "500" : "350";
      setManualSubsidy(defaultVal);
    }
  }, [location, isVariable]);

  useEffect(() => {
    async function init() {
      const uf = await fetchUFValue();
      setUfValue(uf);
    }
    init();
  }, []);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseFloat(incomeCLP);
    const savings = parseFloat(savingsUF);
    const term = parseInt(loanTerm);

    // Determinar si es cupo vulnerable
    const esCupoVulnerable =
      subsidyType === "ds49" || (subsidyType === "ds1t1" && cupoType === "vulnerable");

    if (esCupoVulnerable) {
      if (savings < 40) {
        alert("Para postular al cupo vulnerable se exige un ahorro mínimo de 40 UF.");
        return;
      }
    } else {
      if (savings < 80) {
        alert("Para proyectos DS19 (Sectores Medios) se exige un ahorro mínimo de 80 UF.");
        return;
      }
    }

    if (!esCupoVulnerable && (!bank || !BANKS[bank])) {
      alert("Por favor, selecciona una entidad bancaria.");
      return;
    }

    let maxLimit = 2200;
    let baseSubsidy = 0;
    let minAllowedSubsidy = 350;
    let nombreTramoVisual = "";

    // 1. Determinar topes y subsidios base según la matriz DS19
    if (esCupoVulnerable) {
      nombreTramoVisual = "Cupo de Integración Social (Sectores Vulnerables)";
      if (location === "sur_islas") {
        maxLimit = 2000;
        baseSubsidy = 1700;
      } else if (location === "urbana_norte_stgo") {
        maxLimit = propertyType === "casa" ? 1500 : 1600;
        baseSubsidy = propertyType === "casa" ? 1200 : 1300;
      } else {
        // Zona Regular
        maxLimit = propertyType === "casa" ? 1600 : 1500;
        baseSubsidy = propertyType === "casa" ? 1100 : 1200;
      }
    } else if (
      (subsidyType === "ds1t1" && cupoType === "medios1") ||
      (subsidyType === "ds1t2" && cupoType === "medios1") ||
      (subsidyType === "none" && cupoType === "vulnerable_rural")
    ) {
      nombreTramoVisual = "Cupo Sectores Medios / Zona Rural";
      if (location === "sur_islas") {
        maxLimit = 2400;
        baseSubsidy = 537.5;
      } else if (location === "urbana_norte_stgo") {
        maxLimit = 1900;
        baseSubsidy = 487.5;
      } else {
        maxLimit = 1800;
        baseSubsidy = 425;
      }
    } else if (isVariable) {
      nombreTramoVisual = "Cupo Sectores Medios / Zona Urbana";
      if (location === "sur_islas") {
        maxLimit = 3000;
        minAllowedSubsidy = 500;
      } else if (location === "urbana_norte_stgo") {
        maxLimit = 2800;
        minAllowedSubsidy = 350;
      } else {
        maxLimit = 2600;
        minAllowedSubsidy = 350;
      }

      const inputSub = parseFloat(manualSubsidy);
      if (isNaN(inputSub) || inputSub < minAllowedSubsidy) {
        alert(`Para esta zona, debes ingresar el subsidio específico del proyecto (Mínimo ${minAllowedSubsidy} UF).`);
        return;
      }
      baseSubsidy = inputSub;
    }

    const ds15Bonus = isDS15 ? 100 : 0;
    const totalSubsidy = baseSubsidy + ds15Bonus;

    // 2. Si es cupo vulnerable, no hay endeudamiento (el subsidio + ahorro cubre el 100%)
    if (esCupoVulnerable) {
      const maxPropertyValue = Math.min(maxLimit, savings + totalSubsidy);
      setResults({
        maxHouseUF: maxPropertyValue,
        loanUF: 0,
        savingsUF: savings,
        subsidyUF: totalSubsidy,
        maxDividendUF: 0,
        bank: "Sin Crédito (100% Subsidio + Ahorro)",
        tasaOriginal: 0,
        tasaAplicada: 0,
        aplicaLey: false,
        aplicaDS15: false,
        legalMaxCap: maxLimit,
        vulnerable: true,
        tramoDetectado: nombreTramoVisual
      });
      return;
    }

    // 3. Sectores Medios: Calcular capacidad de dividendo y crédito hipotecario
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const maxMonthlyPaymentUF = (income / ufValue) / incomeMultiplier;

    const bankData = BANKS[bank];
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(1000, term) : (bankData.tasaBase || 0.05);
    const tasaAplicada = isDS15 ? (tasaOriginal - (bankData.descuentoDS15 || 0)) : tasaOriginal;

    const monthlyRate = tasaAplicada / 12;
    const totalPayments = term * 12;
    const maxLoanUF = maxMonthlyPaymentUF * ((1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate);

    // Precio total estimado según capacidad
    let maxPropertyValue = maxLoanUF + savings + totalSubsidy;

    // Aplicar los Topes Legales Duros del DS19
    let isLimited = false;
    if (maxPropertyValue > maxLimit) {
      maxPropertyValue = maxLimit;
      isLimited = true;
    }

    // Ajustar el crédito real requerido
    const actualLoanUF = Math.max(0, maxPropertyValue - savings - totalSubsidy);

    setResults({
      maxHouseUF: maxPropertyValue,
      loanUF: actualLoanUF,
      savingsUF: savings,
      subsidyUF: totalSubsidy,
      maxDividendUF: actualLoanUF > 0 ? (actualLoanUF * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments)) : 0,
      bank: bankData.name,
      tasaOriginal,
      tasaAplicada,
      aplicaLey: isDS15 && (bankData.descuentoDS15 || 0) > 0,
      aplicaDS15: isDS15,
      legalMaxCap: maxLimit,
      vulnerable: false,
      isLimited,
      tramoDetectado: nombreTramoVisual
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Valor Máximo: Subsidio DS19</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Descubre el valor máximo de propiedad nueva que puedes comprar homologando o postulando a un proyecto DS19.
            </p>
          </div>
          <Link href="/valor-maximo" className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all">
            ← Menú
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleCalculate} className="space-y-5">
            
            {/* SUBSIDIO ADJUDICADO (HOMOLOGACIÓN) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">¿Tienes un subsidio adjudicado?</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-[#6b9ac4]" 
                  value={subsidyType} 
                  onChange={(e) => setSubsidyType(e.target.value)}
                >
                  <option value="none">No tengo subsidio (Postulación Directa)</option>
                  <option value="ds49">Sí, tengo Subsidio DS49</option>
                  <option value="ds1t1">Sí, tengo Subsidio DS1 Tramo 1</option>
                  <option value="ds1t2">Sí, tengo Subsidio DS1 Tramo 2</option>
                  <option value="ds1t3">Sí, tengo Subsidio DS1 Tramo 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cupo del Proyecto:</label>
                {subsidyType === "ds49" && <input type="text" readOnly className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-sm font-medium text-slate-500" value="Cupo Vulnerable Asignado" />}
                {subsidyType === "ds1t3" && <input type="text" readOnly className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-sm font-medium text-slate-500" value="Cupo Sectores Medios 2 Asignado" />}
                
                {subsidyType === "ds1t1" && (
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none text-blue-600 font-bold" value={cupoType} onChange={(e) => setCupoType(e.target.value)}>
                    <option value="vulnerable">Postular a Cupo Vulnerable (Hasta 1400-1600 UF)</option>
                    <option value="medios1">Postular a Cupo Sectores Medios 1 (Hasta 1800-1900 UF)</option>
                  </select>
                )}
                {subsidyType === "ds1t2" && (
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none text-blue-600 font-bold" value={cupoType} onChange={(e) => setCupoType(e.target.value)}>
                    <option value="medios1">Postular a Cupo Sectores Medios 1 (Hasta 1800-1900 UF)</option>
                    <option value="medios2">Postular a Cupo Sectores Medios 2 (Hasta 2600-2800 UF)</option>
                  </select>
                )}
                {subsidyType === "none" && (
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none text-blue-600 font-bold" value={cupoType} onChange={(e) => setCupoType(e.target.value)}>
                    <option value="urban_media">Sector Urbano / Clase Media (Hasta 2600-3000 UF)</option>
                    <option value="vulnerable_rural">Sector Vulnerable / Rural (Hasta 1800-2400 UF)</option>
                  </select>
                )}
              </div>
            </div>

            {/* INGRESOS Y AHORROS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Renta Líquida Mensual ($ CLP):
                </label>
                <input 
                  type="number" 
                  min="0" 
                  required={subsidyType !== "ds49" && cupoType !== "vulnerable"} 
                  disabled={subsidyType === "ds49" || cupoType === "vulnerable"}
                  placeholder={subsidyType === "ds49" || cupoType === "vulnerable" ? "No requiere renta (Sin deuda)" : "Ej: 1200000"} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4] disabled:opacity-50" 
                  value={incomeCLP} 
                  onChange={(e) => setIncomeCLP(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Ahorro Neto Actual (UF):
                </label>
                <input 
                  type="number" 
                  required 
                  min={subsidyType === "ds49" || cupoType === "vulnerable" ? "10" : "40"} 
                  step="1" 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                  value={savingsUF} 
                  onChange={(e) => setSavingsUF(e.target.value)} 
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Mínimo {subsidyType === "ds49" || cupoType === "vulnerable" ? "10 UF" : "40 UF"} según tu cupo.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Región del Proyecto:</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                  value={region} 
                  onChange={(e) => {
                    setRegion(e.target.value);
                    if (e.target.value !== "metropolitana") {
                      setIsMetroPeripheral(false);
                    }
                  }}
                >
                  {Object.keys(REGION_MAP).map((key) => (
                    <option key={key} value={key}>{REGION_MAP[key].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Edificación:</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                  value={propertyType} 
                  onChange={(e) => setPropertyType(e.target.value as "casa" | "depto" | "ambos")}
                >
                  <option value="ambos">Departamento o Casa (Cualquiera)</option>
                  <option value="depto">Solo Departamento</option>
                  <option value="casa">Solo Casa</option>
                </select>
              </div>
            </div>

            {/* SELECCIÓN DE COMUNA PARA REGIÓN METROPOLITANA */}
            {region === "metropolitana" && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl animate-fade-in space-y-2">
                <label className="block text-xs font-bold text-slate-700">Comuna / Sector en Región Metropolitana:</label>
                <select
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none text-blue-700 font-bold"
                  value={isMetroPeripheral ? "peripheral" : "urban"}
                  onChange={(e) => setIsMetroPeripheral(e.target.value === "peripheral")}
                >
                  <option value="urban">Gran Santiago / Provincia Urbana (Hasta 1900 o 2800 UF)</option>
                  <option value="peripheral">Melipilla, Padre Hurtado, El Monte, Lampa, Colina, Batuco (Otras Comunas - Hasta 1800 o 2600 UF)</option>
                </select>
                <span className="text-[10px] text-slate-500 block">
                  El DS19 asigna distintas zonas geográficas con topes diferenciados para comunas fuera del Gran Santiago.
                </span>
              </div>
            )}

            {/* SUBSIDIO ESPECÍFICO (SOLO PARA TRASLAPES CON SUBSIDIOS VARIABLES) */}
            {isVariable && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in">
                <label className="block text-xs font-bold text-blue-900 mb-1">
                  Subsidio estimado del proyecto (UF):
                </label>
                <input 
                  type="number" 
                  required 
                  step="0.01" 
                  placeholder={location === "sur_islas" ? "Mínimo 500 UF" : "Mínimo 350 UF"} 
                  className="w-full p-2.5 border border-blue-300 rounded-xl bg-white text-sm focus:outline-none" 
                  value={manualSubsidy} 
                  onChange={(e) => setManualSubsidy(e.target.value)} 
                />
                <span className="text-[10px] text-blue-700 mt-1 block">
                  En el Cupo de Sectores Medios 2, el subsidio varía según la comuna y el proyecto. Usamos {location === "sur_islas" ? "500 UF" : "350 UF"} por defecto.
                </span>
              </div>
            )}

            {/* BANCO Y PLAZO (OCULTO SI ES CUPO VULNERABLE SIN CRÉDITO) */}
            {subsidyType !== "ds49" && cupoType !== "vulnerable" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Institución Financiera:</label>
                  <select 
                    required 
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                    value={bank} 
                    onChange={(e) => setBank(e.target.value)}
                  >
                    <option value="">Selecciona un banco...</option>
                    {BANKS && typeof BANKS === 'object' && Object.keys(BANKS).map(key => {
                      const banco = BANKS[key];
                      const textoTasa = banco?.tasaBase ? `${(banco.tasaBase * 100).toFixed(2)}%` : 'Tasa Dinámica';
                      return (
                        <option key={key} value={key}>
                          {banco?.name || key} ({textoTasa})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Plazo del Crédito:</label>
                  <select 
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                    value={loanTerm} 
                    onChange={(e) => setLoanTerm(e.target.value)}
                  >
                    <option value="20">20 años</option>
                    <option value="25">25 años</option>
                    <option value="30">30 años</option>
                  </select>
                </div>
              </div>
            )}

            {/* OPCIONES DE LEY / BENEFICIOS */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-400 cursor-not-allowed">
                <input type="checkbox" checked disabled className="w-4 h-4 rounded text-slate-300" /> 
                Proyecto de Integración Social (Vivienda Nueva por defecto)
              </label>

              {subsidyType !== "ds49" && cupoType !== "vulnerable" && (
                <>
                  <div className="pl-6">
                    <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-not-allowed">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded" 
                        checked={true} 
                        disabled
                      /> 
                      Beneficio DS15 aplicado automáticamente: +100 UF Subsidio y rebaja de tasa (Mín. 80 UF de ahorro)
                    </label>
                  </div>

                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-[#6b9ac4] rounded" 
                      checked={isYoungSingle} 
                      onChange={(e) => setIsYoungSingle(e.target.checked)} 
                    /> 
                    ¿Eres joven soltero menor de 35 años? (Permite endeudamiento al 33% de la renta)
                  </label>
                </>
              )}
            </div>

            <button 
              type="submit" 
              className="w-full bg-[#6b9ac4] text-white font-bold p-3.5 rounded-xl hover:bg-[#5a86ae] transition-colors shadow-sm text-sm"
            >
              Calcular Presupuesto Máximo DS19
            </button>
          </form>
        </section>

        {/* INTERFAZ DE RESULTADOS */}
        {results && (
          <section className="space-y-4 animate-fade-in">
            <div className="text-center mb-6 pt-4 border-t border-slate-200">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                Tu Presupuesto Máximo en Proyectos DS19 Es
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">
                {results.maxHouseUF.toFixed(0)} UF
              </h2>
              <p className="text-lg font-semibold text-[#6b9ac4] mt-2">
                ≈ ${(Math.round(results.maxHouseUF * ufValue)).toLocaleString("es-CL")} CLP
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Desglose de Financiamiento ({results.vulnerable ? "Sin Deuda" : results.bank})
              </h3>
              
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-950 text-xs mb-4">
                <strong>Modalidad detectada:</strong> {results.tramoDetectado}.
              </div>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Crédito Hipotecario:</span>
                  <strong className="text-slate-800">
                    {results.vulnerable ? "No aplica (0 UF)" : `${results.loanUF.toFixed(0)} UF`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tu Ahorro:</span>
                  <strong className="text-slate-800">{results.savingsUF.toFixed(0)} UF</strong>
                </div>
                <div className="pt-2 border-t border-slate-50 col-span-2">
                  <span className="text-slate-500 block">Subsidio DS19 (Estado):</span>
                  <strong className="text-emerald-600 font-bold">+{results.subsidyUF.toFixed(0)} UF</strong>
                </div>
              </div>

              {!results.vulnerable && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dividendo Mensual Estimado:</span>
                    <span className="font-extrabold text-slate-900">
                      {results.maxDividendUF.toFixed(2)} UF 
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        ($ {Math.round(results.maxDividendUF * ufValue).toLocaleString("es-CL")})
                      </span>
                    </span>
                  </div>
                  {results.aplicaLey && (
                    <div className="text-[10px] text-blue-600 font-semibold">
                      ✓ Beneficio DS15 activo: Rebaja en la tasa de interés en tu dividendo.
                    </div>
                  )}
                </div>
              )}
            </div>

            {results.isLimited && (
              <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 p-4 rounded-xl shadow-sm text-xs">
                ⚠️ Tu capacidad financiera te permitiría un valor mayor, pero el resultado ha sido limitado a <strong>{results.legalMaxCap} UF</strong>, que es el tope máximo que permite la ley para esta zona y tipo de propiedad en proyectos DS19.
              </div>
            )}

            {results.vulnerable && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-900 p-4 rounded-xl shadow-sm text-xs">
                ℹ️ Al pertenecer a la modalidad de **Sectores Vulnerables (Cupo Integración)**, el valor de la vivienda es financiado en su totalidad por tu ahorro y el subsidio estatal del proyecto. No requieres endeudarte con un crédito hipotecario.
              </div>
            )}

            <div className="text-center pt-4">
              <Link 
                href={`/ofertas-inmobiliarias?maxPrice=${Math.round(results.maxHouseUF * ufValue)}&maxUF=${Math.round(results.maxHouseUF)}&credit=${Math.round(results.loanUF)}&origin=ds19&region=${region}&propertyType=${propertyType === "depto" ? "departamento" : propertyType === "casa" ? "casa" : "ambos"}&subsidyType=${subsidyType}&cupoType=${cupoType}&isPeripheral=${isMetroPeripheral}`}
                className="inline-block bg-[#87c0a3] text-slate-950 font-bold py-3.5 px-6 rounded-xl hover:bg-[#76b092] transition-colors shadow-sm text-sm"
              >
                Buscar Proyectos Nuevos DS19 →
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
