// src/app/valor-maximo/sin-subsidio/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks";

export default function ValorMaximoSinSubsidioPage() {
  const [incomeCLP, setIncomeCLP] = useState("");
  const [hasSavings, setHasSavings] = useState<"yes" | "no">("yes");
  const [savingsCLP, setSavingsCLP] = useState("");
  const [savingsUF, setSavingsUF] = useState("");
  
  const [bank, setBank] = useState("");
  const [loanTerm, setLoanTerm] = useState("25");
  const [isNewHome, setIsNewHome] = useState(false);
  const [applyRateDiscount, setApplyRateDiscount] = useState(false);
  const [applyFogaes, setApplyFogaes] = useState(false);
  const [isYoungSingle, setIsYoungSingle] = useState(false);
  
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    async function init() {
      const uf = await fetchUFValue();
      setUfValue(uf);
    }
    init();
  }, []);

  const handleSavingsCLPChange = (val: string) => {
    setSavingsCLP(val);
    const clp = parseFloat(val);
    if (!isNaN(clp) && ufValue > 0) {
      setSavingsUF((clp / ufValue).toFixed(2));
    } else {
      setSavingsUF("");
    }
  };

  const handleSavingsUFChange = (val: string) => {
    setSavingsUF(val);
    const uf = parseFloat(val);
    if (!isNaN(uf) && ufValue > 0) {
      setSavingsCLP((uf * ufValue).toFixed(0));
    } else {
      setSavingsCLP("");
    }
  };

  const handleNewHomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsNewHome(checked);
    if (!checked) {
      setApplyRateDiscount(false);
      setApplyFogaes(false);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const income = parseFloat(incomeCLP);
    const term = parseInt(loanTerm);
    const minPiePercentage = applyFogaes ? 0.10 : 0.20;

    if (!bank || !BANKS[bank]) {
      alert("Por favor, selecciona un banco válido.");
      return;
    }

    if (applyRateDiscount && !isNewHome) {
      alert("La rebaja de tasa (Ley 21.748) solo es aplicable si buscas una vivienda nueva.");
      return;
    }
    
    if (applyFogaes && !isNewHome) {
      alert("El beneficio FOGAES solo aplica para viviendas nuevas.");
      return;
    }

    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const maxMonthlyPaymentUF = (income / ufValue) / incomeMultiplier;

    const bankData = BANKS[bank];
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(2500, term) : (bankData.tasaBase || 0.05);
    const tasaAplicada = applyRateDiscount ? (tasaOriginal - (bankData.descuentoDS15 || 0)) : tasaOriginal;

    const monthlyRate = tasaAplicada / 12;
    const totalPayments = term * 12;
    const maxLoanUF = maxMonthlyPaymentUF * ((1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate);

    let legalMaxCap = Infinity;
    if (applyRateDiscount) legalMaxCap = Math.min(legalMaxCap, 4000);
    if (applyFogaes) legalMaxCap = Math.min(legalMaxCap, 4500);

    if (hasSavings === "yes") {
      const savings = parseFloat(savingsUF) || 0;

      const maxHouseByIncome = maxLoanUF / (1 - minPiePercentage);
      const maxHouseBySavings = savings / minPiePercentage;

      let finalMaxHouse = Math.min(maxHouseByIncome, maxHouseBySavings);
      const isCapped = finalMaxHouse > legalMaxCap;
      finalMaxHouse = Math.min(finalMaxHouse, legalMaxCap);

      let mensajeOptimizacion = "";
      if (maxHouseBySavings < maxHouseByIncome && finalMaxHouse < legalMaxCap) {
        const targetHouse = Math.min(maxHouseByIncome, legalMaxCap);
        const savingsNeededForTarget = targetHouse * minPiePercentage;
        const missingUF = savingsNeededForTarget - savings;
        
        mensajeOptimizacion = `💡 Para aprovechar al máximo tu sueldo podrías alcanzar una casa de ${targetHouse.toFixed(0)} UF. Te faltan exactamente ${missingUF.toFixed(1)} UF de ahorro (~$${Math.round(missingUF * ufValue).toLocaleString("es-CL")} CLP) para lograrlo.`;
      }

      setResults({
        mode: "has-savings",
        maxHouseByIncome,
        maxHouseBySavings,
        finalMaxHouse,
        loanUF: finalMaxHouse - savings,
        savingsUF: savings,
        maxDividendUF: maxMonthlyPaymentUF,
        bank: bankData.name,
        tasaAplicada,
        tasaOriginal,
        aplicaLey: applyRateDiscount && (bankData.descuentoDS15 || 0) > 0,
        aplicaFogaes: applyFogaes,
        mensajeOptimizacion,
        isCapped,
        legalMaxCap
      });

    } else {
      const maxHouseByIncome = maxLoanUF / (1 - minPiePercentage);
      let finalMaxHouse = Math.min(maxHouseByIncome, legalMaxCap);
      const isCapped = maxHouseByIncome > legalMaxCap;

      const requiredSavingsUF = finalMaxHouse * minPiePercentage;

      setResults({
        mode: "no-savings",
        maxHouseByIncome,
        finalMaxHouse,
        requiredSavingsUF,
        loanUF: finalMaxHouse - requiredSavingsUF,
        maxDividendUF: maxMonthlyPaymentUF,
        bank: bankData.name,
        tasaAplicada,
        tasaOriginal,
        aplicaLey: applyRateDiscount && (bankData.descuentoDS15 || 0) > 0,
        aplicaFogaes: applyFogaes,
        isCapped,
        legalMaxCap
      });
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Valor Máximo: Sin Subsidio</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Calcula tu techo inmobiliario real basándote en tu perfil financiero libre.
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
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">¿Cuentas con ahorros para el pie actualmente?</label>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className={`p-3 rounded-xl border font-bold text-sm transition-all ${hasSavings === "yes" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-500"}`} onClick={() => { setHasSavings("yes"); setResults(null); }}>
                  Sí, tengo un monto ahorrado
                </button>
                <button type="button" className={`p-3 rounded-xl border font-bold text-sm transition-all ${hasSavings === "no" ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-500"}`} onClick={() => { setHasSavings("no"); setResults(null); setSavingsCLP(""); setSavingsUF(""); }}>
                  No, quiero saber cuánto juntar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Renta Líquida Mensual ($ CLP):</label>
              <input type="number" min="0" required placeholder="Ej: 900000" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={incomeCLP} onChange={(e) => setIncomeCLP(e.target.value)} />
            </div>

            {hasSavings === "yes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mis Ahorros ($ CLP):</label>
                  <input type="number" min="0" placeholder="Ej: 5000000" className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-[#6b9ac4]" value={savingsCLP} onChange={(e) => handleSavingsCLPChange(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mis Ahorros (UF):</label>
                  <input type="number" min="0" step="0.01" placeholder="Ej: 130" className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-[#6b9ac4]" value={savingsUF} onChange={(e) => handleSavingsUFChange(e.target.value)} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Banco Evaluador:</label>
                <select required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={bank} onChange={(e) => setBank(e.target.value)}>
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
                <label className="block text-sm font-bold text-slate-700 mb-1">Plazo del Hipotecario:</label>
                <select required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)}>
                  <option value="15">15 años</option>
                  <option value="20">20 años</option>
                  <option value="25">25 años</option>
                  <option value="30">30 años</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isNewHome} onChange={handleNewHomeChange} /> 
                ¿La propiedad evaluada es nueva?
              </label>
              
              <div className="pl-6 space-y-2 border-l-2 border-slate-200 ml-2">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" checked={applyRateDiscount} onChange={(e) => setApplyRateDiscount(e.target.checked)} disabled={!isNewHome} /> 
                  Rebaja de Tasa por Ley 21.748 (Hasta 4.000 UF)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-pointer pt-2">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={applyFogaes} onChange={(e) => setApplyFogaes(e.target.checked)} disabled={!isNewHome} /> 
                  Garantía FOGAES (Financiar con 10% de Pie — Hasta 4.500 UF)
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isYoungSingle} onChange={(e) => setIsYoungSingle(e.target.checked)} /> 
                ¿Eres joven soltero menor de 35 años?
              </label>
            </div>

            <button type="submit" className="w-full bg-[#6b9ac4] text-white font-bold p-3.5 rounded-xl hover:bg-[#5a86ae] transition-colors shadow-sm">
              Analizar Viabilidad Financiera
            </button>
          </form>
        </section>

        {results && (
          <section className="space-y-4 animate-fade-in">
            
            <div className="text-center bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Máximo Real de Compra</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                {results.finalMaxHouse.toFixed(0)} UF
              </h2>
              <p className="text-md font-bold text-[#6b9ac4] mt-1">
                ≈ ${Math.round(results.finalMaxHouse * ufValue).toLocaleString("es-CL")} CLP
              </p>
            </div>

            {results.mode === "has-savings" && results.mensajeOptimizacion && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-950 p-4 rounded-xl text-xs font-medium shadow-sm leading-relaxed">
                {results.mensajeOptimizacion}
              </div>
            )}

            {results.isCapped && (
              <div className="bg-amber-50 border-2 border-amber-200 text-amber-950 p-4 rounded-xl text-xs shadow-sm">
                ⚠️ Tu perfil da para un valor superior, pero se aplicó el tope legal duro de <strong>{results.legalMaxCap} UF</strong> estipulado por los beneficios estatales activos.
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Comparativa de Capacidad Cruzada
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-500 block text-xs font-bold">Valor Máx. según tu Sueldo:</span>
                  <strong className="text-slate-800 text-lg">{results.maxHouseByIncome.toFixed(0)} UF</strong>
                  <span className="text-xs text-slate-400 block">(${Math.round(results.maxHouseByIncome * ufValue).toLocaleString("es-CL")})</span>
                </div>
                
                {results.mode === "has-savings" ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block text-xs font-bold">Valor Máx. según tu Ahorro:</span>
                    <strong className="text-slate-800 text-lg">{results.maxHouseBySavings.toFixed(0)} UF</strong>
                    <span className="text-xs text-slate-400 block">(${Math.round(results.maxHouseBySavings * ufValue).toLocaleString("es-CL")})</span>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-emerald-800 block text-xs font-bold">Ahorro mínimo requerido (Pie):</span>
                    <strong className="text-emerald-700 text-lg">{results.requiredSavingsUF.toFixed(0)} UF</strong>
                    <span className="text-xs text-emerald-600 font-semibold block">≈ ${Math.round(results.requiredSavingsUF * ufValue).toLocaleString("es-CL")} CLP</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs font-medium text-slate-500">
                <div>Crédito a solicitar: <strong>{results.loanUF.toFixed(0)} UF</strong></div>
                <div className="text-right">Tasa Efectiva: <strong>{(results.tasaAplicada * 100).toFixed(2)}%</strong></div>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Dividendo Máx. Permitido:</span>
                    <span className="font-extrabold text-slate-900">{results.maxDividendUF.toFixed(2)} UF <span className="text-xs font-normal text-slate-400">(${Math.round(results.maxDividendUF * ufValue).toLocaleString("es-CL")})</span></span>
                 </div>
              </div>

            </div>

            <div className="text-center pt-4">
              <Link 
                href={`/ofertas-inmobiliarias?maxPrice=${Math.round(results.finalMaxHouse * ufValue)}&maxUF=${Math.round(results.finalMaxHouse)}&credit=${Math.round(results.loanUF)}&origin=no-subsidy`}
                className="inline-block bg-[#87c0a3] text-slate-950 font-bold py-3.5 px-6 rounded-xl hover:bg-[#76b092] transition-colors shadow-sm text-sm"
              >
                Buscar Ofertas Inmobiliarias →
              </Link>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}