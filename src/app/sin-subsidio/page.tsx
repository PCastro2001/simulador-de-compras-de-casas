// src/app/sin-subsidio/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks";

export default function SinSubsidioPage() {
  const [propertyCLP, setPropertyCLP] = useState("");
  const [propertyUF, setPropertyUF] = useState("");
  
  const [downPaymentType, setDownPaymentType] = useState<"percentage" | "uf">("percentage");
  const [downPaymentValue, setDownPaymentValue] = useState("20");
  
  const [bank, setBank] = useState("");
  const [loanTerm, setLoanTerm] = useState("25");
  
  const [isNewHome, setIsNewHome] = useState(false);
  const [applyFogaes, setApplyFogaes] = useState(false);
  const [applyRateDiscount, setApplyRateDiscount] = useState(false);
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

  const handleCLPChange = (val: string) => {
    setPropertyCLP(val);
    const clp = parseFloat(val);
    if (!isNaN(clp) && ufValue > 0) {
      setPropertyUF((clp / ufValue).toFixed(2));
    } else {
      setPropertyUF("");
    }
  };

  const handleUFChange = (val: string) => {
    setPropertyUF(val);
    const uf = parseFloat(val);
    if (!isNaN(uf) && ufValue > 0) {
      setPropertyCLP((uf * ufValue).toFixed(0));
    } else {
      setPropertyCLP("");
    }
  };

  const handleNewHomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsNewHome(checked);
    // Si desmarca vivienda nueva, se apagan los beneficios exclusivos
    if (!checked) {
      setApplyRateDiscount(false);
      setApplyFogaes(false);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const pUF = parseFloat(propertyUF);
    const dpVal = parseFloat(downPaymentValue);
    const term = parseInt(loanTerm);

    if (!bank || !BANKS[bank]) {
      alert("Por favor, selecciona un banco válido.");
      return;
    }

    // Cálculo del Pie
    let pieUF = 0;
    if (downPaymentType === "percentage") {
      pieUF = pUF * (dpVal / 100);
    } else {
      pieUF = dpVal;
    }
    const piePercentage = (pieUF / pUF) * 100;

    // Validaciones FOGAES
    if (applyFogaes) {
      if (!isNewHome) {
        alert("El beneficio FOGAES solo aplica para viviendas nuevas.");
        return;
      }
      if (pUF > 4500) {
        alert("El beneficio FOGAES solo aplica para viviendas de hasta 4.500 UF.");
        return;
      }
      if (piePercentage < 10) {
        alert("Incluso con FOGAES, el banco exige un pie mínimo del 10%.");
        return;
      }
    } else {
      if (piePercentage < 20) {
        alert("Sin FOGAES, el mercado exige un pie mínimo del 20%.");
        return;
      }
    }

    // Validaciones Ley de Tasas
    if (applyRateDiscount) {
      if (!isNewHome) {
        alert("La rebaja de tasa (Ley 21.748) solo aplica para viviendas nuevas.");
        return;
      }
      if (pUF > 4000) {
        alert("La rebaja de tasa tiene un tope para viviendas de hasta 4.000 UF.");
        return;
      }
    }

    const loanAmount = pUF - pieUF;
    
    if (loanAmount <= 0) {
      alert("Tu pie cubre la totalidad de la vivienda. ¡No necesitas crédito!");
      return;
    }

    const bankData = BANKS[bank];
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(loanAmount, term) : (bankData.tasaBase || 0.05);
    const tasaAplicada = applyRateDiscount ? (tasaOriginal - (bankData.descuentoDS15 || 0)) : tasaOriginal;

    const monthlyRate = tasaAplicada / 12;
    const totalPayments = term * 12;
    const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const incomeMultiplier = isYoungSingle ? 3 : 4;

    setResults({
      valorViviendaUF: pUF,
      pieUF: pieUF,
      piePorcentajeReal: piePercentage,
      creditoUF: loanAmount,
      banco: bankData.name,
      tasaOriginal,
      tasaAplicada,
      dividendoUF: monthlyPayment,
      rentaMinimaUF: monthlyPayment * incomeMultiplier,
      aplicaLey: applyRateDiscount && (bankData.descuentoDS15 || 0) > 0,
      aplicaFogaes: applyFogaes,
      multiplicadorRenta: incomeMultiplier
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Simulador Libre (Sin Subsidio)</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Calcula tu crédito bancario con opciones FOGAES y Ley de Tasas.
            </p>
          </div>
          <Link href="/" className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all">
            ← Inicio
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleCalculate} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor de la vivienda ($ CLP):</label>
                <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={propertyCLP} onChange={(e) => handleCLPChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor de la vivienda (UF):</label>
                <input type="number" required min="100" step="0.01" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={propertyUF} onChange={(e) => handleUFChange(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-bold text-slate-700">Pie / Enganche:</label>
                  <select className="text-xs border-none bg-transparent text-[#6b9ac4] font-bold focus:ring-0 cursor-pointer" value={downPaymentType} onChange={(e) => setDownPaymentType(e.target.value as "percentage" | "uf")}>
                    <option value="percentage">% Porcentaje</option>
                    <option value="uf">UF Monto Fijo</option>
                  </select>
                </div>
                <input type="number" required min="0" step="0.01" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={downPaymentValue} onChange={(e) => setDownPaymentValue(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Plazo de amortización:</label>
                <select required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)}>
                  <option value="10">10 años</option>
                  <option value="15">15 años</option>
                  <option value="20">20 años</option>
                  <option value="25">25 años</option>
                  <option value="30">30 años</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Institución Financiera:</label>
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

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isNewHome} onChange={handleNewHomeChange} /> 
                ¿Es una vivienda nueva?
              </label>
              
              <div className="pl-6 space-y-2 border-l-2 border-slate-200 ml-2">
                <label className="flex items-center gap-2 text-sm font-bold text-emerald-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" checked={applyRateDiscount} onChange={(e) => setApplyRateDiscount(e.target.checked)} disabled={!isNewHome || (parseFloat(propertyUF || "0") > 4000)} /> 
                  Aplicar Rebaja de Tasa Hipotecaria (Máx. 4.000 UF)
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-pointer pt-2">
                  <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={applyFogaes} onChange={(e) => setApplyFogaes(e.target.checked)} disabled={!isNewHome || (parseFloat(propertyUF || "0") > 4500)} /> 
                  Aplicar FOGAES (Reduce el pie exigido al 10%)
                </label>
              </div>
              
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isYoungSingle} onChange={(e) => setIsYoungSingle(e.target.checked)} /> 
                ¿Eres joven soltero menor de 35 años?
              </label>
            </div>

            <button type="submit" className="w-full bg-[#87c0a3] text-slate-950 font-bold p-3.5 rounded-xl hover:bg-[#76b092] transition-colors shadow-sm">
              Calcular Financiamiento Bancario
            </button>
          </form>
        </section>

        {results && (
          <section className="space-y-4 animate-fade-in">
            {results.aplicaLey && (
              <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-sm font-bold">🎉 Rebaja de Tasa Activada</h4>
                  <p className="text-xs opacity-90 mt-0.5">Se aplicó el subsidio estatal directamente a la tasa de interés.</p>
                </div>
              </div>
            )}

            {results.aplicaFogaes && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-950 p-4 rounded-xl shadow-sm text-xs">
                🛡️ <strong>Garantía Estatal (FOGAES):</strong> El Estado actuará como aval ante {results.banco} por el 10% del crédito, permitiéndote acceder con un pie menor.
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Análisis de Financiamiento ({results.banco})
              </h3>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Precio Propiedad:</span>
                  <strong className="text-slate-800">{results.valorViviendaUF.toFixed(2)} UF</strong>
                  <span className="text-xs text-slate-400 block">(${Math.round(results.valorViviendaUF * ufValue).toLocaleString("es-CL")})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tu Pie ({results.piePorcentajeReal.toFixed(1)}%):</span>
                  <strong className="text-slate-800">{results.pieUF.toFixed(2)} UF</strong>
                  <span className="text-xs text-slate-400 block">(${Math.round(results.pieUF * ufValue).toLocaleString("es-CL")})</span>
                </div>
                <div className="pt-2 border-t border-slate-50 col-span-2">
                  <span className="text-slate-500 block">Crédito a Solicitar al Banco:</span>
                  <strong className="text-blue-600 font-bold">{results.creditoUF.toFixed(2)} UF</strong>
                  <span className="text-xs text-slate-400 block">(${Math.round(results.creditoUF * ufValue).toLocaleString("es-CL")})</span>
                </div>
                <div className="pt-2 border-t border-slate-50 col-span-2">
                  <span className="text-slate-500 block">Tasa Final Efectiva:</span>
                  <strong className="text-slate-800">
                    {(results.tasaAplicada * 100).toFixed(2)}% Anual
                    {results.aplicaLey && <span className="text-xs text-emerald-600 font-normal block">(Tasa sin rebaja: {(results.tasaOriginal * 100).toFixed(2)}%)</span>}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Dividendo Mensual:</span>
                  <span className="text-xl md:text-2xl font-extrabold text-slate-900">{results.dividendoUF.toFixed(2)} UF</span>
                  <span className="text-sm font-semibold text-blue-600 block">
                    ≈ ${Math.round(results.dividendoUF * ufValue).toLocaleString("es-CL")} / mes
                  </span>
                </div>
                <div className="md:border-l md:pl-4 border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Renta Mínima Exigida ({results.multiplicadorRenta}x):</span>
                  <span className="text-lg md:text-xl font-bold text-slate-800">{results.rentaMinimaUF.toFixed(2)} UF</span>
                  <span className="text-sm font-bold text-slate-700 block">
                    ≈ ${Math.round(results.rentaMinimaUF * ufValue).toLocaleString("es-CL")}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}