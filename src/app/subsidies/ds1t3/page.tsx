// src/app/subsidies/ds1t3/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks"; // Conectado al motor central de tasas

export default function DS1Tramo3Page() {
  const [propertyCLP, setPropertyCLP] = useState("");
  const [propertyUF, setPropertyUF] = useState("");
  const [savings, setSavings] = useState("");
  const [isNewHome, setIsNewHome] = useState(false);
  const [isDS15, setIsDS15] = useState(false);
  const [bank, setBank] = useState("");
  const [location, setLocation] = useState("none");
  const [loanTerm, setLoanTerm] = useState("25");
  const [isYoungSingle, setIsYoungSingle] = useState(false);
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  // Límite dinámico: Sube a 3000 UF si aplica DS15 con vivienda nueva, si no, respeta topes zonales
  const maxLimit = (isNewHome && isDS15) ? 3000 : (location === "none" ? 2200 : 2600);

  useEffect(() => {
    async function init() {
      const uf = await fetchUFValue();
      setUfValue(uf);
    }
    init();
  }, []);

  // Sincronizar CLP a UF
  const handleCLPChange = (val: string) => {
    setPropertyCLP(val);
    const clp = parseFloat(val);
    if (!isNaN(clp) && ufValue > 0) {
      setPropertyUF((clp / ufValue).toFixed(2));
    } else {
      setPropertyUF("");
    }
  };

  // Sincronizar UF a CLP
  const handleUFChange = (val: string) => {
    setPropertyUF(val);
    const uf = parseFloat(val);
    if (!isNaN(uf) && ufValue > 0) {
      setPropertyCLP((uf * ufValue).toFixed(0));
    } else {
      setPropertyCLP("");
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const pUF = parseFloat(propertyUF);
    const sUF = parseFloat(savings);
    const term = parseInt(loanTerm);

    if (!bank || !BANKS[bank]) {
      alert("Por favor, selecciona un banco válido.");
      return;
    }

    // Validación oficial del documento para DS15 en Tramo 3: Exige mínimo 160 UF
    if (isDS15) {
      if (!isNewHome) {
        alert("El beneficio DS15 solo aplica para la adquisición de viviendas nuevas.");
        return;
      }
      if (sUF < 160) {
        alert("Según la normativa del DS15, para el Tramo 3 debes contar con un ahorro mínimo de 160 UF.");
        return;
      }
    }

    // Regla de Ahorro Mínimo Estándar para Tramo 3 (80 UF)
    if (sUF < 80) {
      alert("El Subsidio DS1 Tramo 3 exige un ahorro mínimo de 80 UF.");
      return;
    }

    if (pUF > maxLimit || pUF < 800) {
      alert(`Para el Tramo 3 en esta zona, el valor de la vivienda debe estar entre 800 y ${maxLimit} UF.`);
      return;
    }

    // Cálculo del subsidio base decreciente según los parámetros del MINVU para Tramo 3
    let subsidy = 0;
    if (location === "north") {
      subsidy = pUF <= 1200 ? 500 : 500 - ((pUF - 1200) * (200 / 1000));
    } else if (location === "south") {
      subsidy = pUF <= 1200 ? 550 : 550 - ((pUF - 1200) * (200 / 1000));
    } else {
      if (pUF < 1200) {
        subsidy = 400;
      } else if (pUF > 1600) {
        subsidy = 250;
      } else {
        subsidy = 850 - (0.375 * pUF);
      }
    }

    // Si excede el tope estándar por ampliación DS15, se fija en el mínimo del tramo
    if (pUF > 2200 && location === "none") {
      subsidy = 250;
    } else if (pUF > 2600 && location === "north") {
      subsidy = 300;
    } else if (pUF > 2600 && location === "south") {
      subsidy = 350;
    }

    // Bono Adicional DS15 (+150 UF)
    const ds15Bonus = isDS15 ? 150 : 0;
    const totalSubsidy = subsidy + ds15Bonus;
    
    const loanAmount = pUF - sUF - totalSubsidy;

    if (loanAmount < 0) {
      alert("El subsidio acumulado y tu ahorro cubren la totalidad de la vivienda. ¡No requieres un crédito!");
      return;
    }

    // --- Motor Universal de Bancos ---
    const bankData = BANKS[bank];
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(loanAmount, term) : (bankData.tasaBase || 0.05);
    
    // Si es vivienda nueva, aplicamos el descuento oficial a la tasa si el banco lo ofrece
    const tasaAplicada = isNewHome ? (tasaOriginal - (bankData.descuentoDS15 || 0)) : tasaOriginal;

    const monthlyRate = tasaAplicada / 12;
    const totalPayments = term * 12;
    const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const incomeMultiplier = isYoungSingle ? 3 : 4;

    // Asignación estricta de variables para la UI unificada
    setResults({
      valorViviendaUF: pUF,
      pieUF: sUF,
      piePorcentajeReal: (sUF / pUF) * 100,
      creditoUF: loanAmount,
      banco: bankData.name,
      tasaOriginal: tasaOriginal,
      tasaAplicada: tasaAplicada,
      dividendoUF: monthlyPayment,
      rentaMinimaUF: monthlyPayment * incomeMultiplier,
      ahorroMensualCLP: totalSubsidy * ufValue,
      aplicaLey: isNewHome && (bankData.descuentoDS15 || 0) > 0, // Muestra el banner verde de tasa si hubo rebaja
      aplicaDS15: isDS15, // Muestra el banner azul del DS15
      multiplicadorRenta: incomeMultiplier
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subsidio DS1 Tramo 3</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Simulador integrado con las condiciones especiales de tasas e incentivos del DS15.
            </p>
          </div>
          <Link href="/subsidies" className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all">
            ← Volver
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
                <input type="number" required min="800" step="0.01" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={propertyUF} onChange={(e) => handleUFChange(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ahorro depositado (UF):</label>
                <input type="number" required min="80" step="1" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={savings} onChange={(e) => setSavings(e.target.value)} />
                <span className="text-[10px] text-slate-400 mt-1 block">Mínimo 80 UF para postular. (160 UF para el beneficio DS15).</span>
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Zona Geográfica:</label>
                <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={location} onChange={(e) => setLocation(e.target.value)}>
                    <option value="none">Zona Regular</option>
                    <option value="north">Extremo Norte</option>
                    <option value="south">Extremo Sur</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Institución Financiera:</label>
                  <select 
                  required 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                  value={bank} 
                  onChange={(e) => setBank(e.target.value)}
                  >
                      <option value="">Selecciona una entidad...</option>
                      {BANKS && typeof BANKS === 'object' ? (
                          Object.keys(BANKS).map((key) => (
                              <option key={key} value={key}>
                                  {BANKS[key]?.name || key}
                              </option>
                          ))
                      ) : (
                          <option disabled>No hay bancos disponibles</option>
                      )}
                  </select>
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

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isNewHome} onChange={(e) => setIsNewHome(e.target.checked)} /> 
                ¿Es una vivienda nueva? (Aplica subsidio a la tasa de interés)
              </label>
              
              <div className="pl-6">
                <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={isDS15} onChange={(e) => setIsDS15(e.target.checked)} disabled={!isNewHome} /> 
                  Acogerse a Beneficios DS15 (+150 UF Subs. Adicional)
                </label>
              </div>
              
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isYoungSingle} onChange={(e) => setIsYoungSingle(e.target.checked)} /> 
                ¿Eres joven soltero menor de 35 años?
              </label>
            </div>

            <button type="submit" className="w-full bg-[#87c0a3] text-slate-950 font-bold p-3.5 rounded-xl hover:bg-[#76b092] transition-colors shadow-sm">
              Calcular Financiamiento
            </button>
          </form>
        </section>

        {/* INTERFAZ DE RESULTADOS UNIFICADA Y BLINDADA */}
        {results && (
          <section className="space-y-4 animate-fade-in">
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <h4 className="text-sm font-bold">💰 Subsidio Aplicado</h4>
                <p className="text-xs opacity-90 mt-0.5">Monto otorgado por el Estado para este tramo.</p>
              </div>
              <div className="text-right">
                <span className="text-xs block font-medium opacity-75">Aporte Estatal:</span>
                <span className="text-lg font-extrabold text-emerald-700">
                  ${Math.round(results.ahorroMensualCLP).toLocaleString("es-CL")} CLP
                </span>
              </div>
            </div>

            {results.aplicaLey && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-950 p-4 rounded-xl shadow-sm text-xs">
                🎉 <strong>Ley de Tasas Activada:</strong> Al ser vivienda nueva, se aplicó la rebaja estatal directa sobre la tasa del crédito hipotecario de {results.banco}.
              </div>
            )}

            {results.aplicaDS15 && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-950 p-4 rounded-xl shadow-sm text-xs">
                🚀 <strong>Mejora Transitoria DS15:</strong> Se otorgaron 150 UF adicionales por cumplir el requisito de ahorro de 160 UF para el Tramo 3.
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
                  <span className="text-xs text-slate-400 block">(${(results.valorViviendaUF * ufValue).toLocaleString("es-CL")})</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ahorro Neto ({results.piePorcentajeReal.toFixed(1)}%):</span>
                  <strong className="text-slate-800">{results.pieUF.toFixed(2)} UF</strong>
                  <span className="text-xs text-slate-400 block">(${(results.pieUF * ufValue).toLocaleString("es-CL")})</span>
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
                    {results.aplicaLey && <span className="text-xs text-emerald-600 font-normal block">(Tasa base: {(results.tasaOriginal * 100).toFixed(2)}%)</span>}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Dividendo Neto Estimado:</span>
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