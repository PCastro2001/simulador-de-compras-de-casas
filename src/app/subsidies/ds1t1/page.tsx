// src/app/subsidies/ds1t1/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks"; // Motor central de tasas

export default function DS1Tramo1Page() {
  const [propertyCLP, setPropertyCLP] = useState("");
  const [propertyUF, setPropertyUF] = useState("");
  const [savings, setSavings] = useState("");
  const [isNewHome, setIsNewHome] = useState(false);
  const [bank, setBank] = useState("");
  const [location, setLocation] = useState("none");
  const [loanTerm, setLoanTerm] = useState("15");
  const [isYoungSingle, setIsYoungSingle] = useState(false);
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  // Límites dinámicos según zona geográfica para Tramo 1
  const maxLimit = location === 'north' ? 1200 : location === 'south' ? 1250 : 1100;

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

    if (sUF < 30) {
      alert("El ahorro mínimo exigido para el Tramo 1 es de 30 UF.");
      return;
    }

    if (pUF > maxLimit) {
      alert(`El valor de la vivienda no puede exceder las ${maxLimit} UF en la zona seleccionada.`);
      return;
    }

    // Cálculo del subsidio base estatal fijo según ubicación
    const stateSubsidy = location === 'north' ? 700 : location === 'south' ? 750 : 600;
    
    // El crédito es el valor de la propiedad menos el ahorro y menos el subsidio estatal
    const loanAmount = pUF - sUF - stateSubsidy;

    if (loanAmount < 0) {
      alert("El subsidio y tu ahorro cubren el valor total de la vivienda. ¡No necesitas solicitar crédito!");
      return;
    }

    // --- Motor de Bancos ---
    const bankData = BANKS[bank];
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(loanAmount, term) : (bankData.tasaBase || 0.05);
    
    // Si es vivienda nueva, aplica el descuento de tasa (Ley de incentivo), aunque no tenga DS15
    const tasaAplicada = isNewHome ? (tasaOriginal - (bankData.descuentoDS15 || 0)) : tasaOriginal;

    const monthlyRate = tasaAplicada / 12;
    const totalPayments = term * 12;
    const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const incomeMultiplier = isYoungSingle ? 3 : 4;

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
      ahorroMensualCLP: stateSubsidy * ufValue, // Mostramos solo el aporte del Estado en el banner
      aplicaLey: isNewHome && (bankData.descuentoDS15 || 0) > 0, // Verifica si realmente hubo rebaja
      multiplicadorRenta: incomeMultiplier
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subsidio DS1 Tramo 1</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Simulador para viviendas hasta {maxLimit} UF.
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
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor Vivienda ($ CLP):</label>
                <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={propertyCLP} onChange={(e) => handleCLPChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Valor Vivienda (UF):</label>
                <input type="number" required step="0.01" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={propertyUF} onChange={(e) => handleUFChange(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ahorro Depositado (UF):</label>
                <input type="number" required min="30" step="1" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={savings} onChange={(e) => setSavings(e.target.value)} />
                <span className="text-[10px] text-slate-400 mt-1 block">Mínimo legal: 30 UF.</span>
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ubicación:</label>
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
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" 
                  value={bank} 
                  onChange={(e) => setBank(e.target.value)}
                >
                    <option value="">Selecciona un banco...</option>
                    {BANKS && typeof BANKS === 'object' && Object.keys(BANKS).map(key => {
                      const banco = BANKS[key];
                      // Determinamos qué texto mostrar en los paréntesis
                      const textoTasa = banco?.tasaBase 
                        ? `${(banco.tasaBase * 100).toFixed(2)}%` 
                        : 'Tasa Dinámica';
                        
                      return (
                        <option key={key} value={key}>
                          {banco?.name || key} ({textoTasa})
                        </option>
                      );
                    })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Plazo (años):</label>
                <select required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)}>
                  <option value="5">5 años</option>
                  <option value="10">10 años</option>
                  <option value="15">15 años</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
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

        {/* INTERFAZ DE RESULTADOS UNIFICADA */}
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

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Análisis de Financiamiento ({results.banco})
              </h3>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Precio Propiedad:</span>
                  <strong className="text-slate-800">{results.valorViviendaUF.toFixed(2)} UF</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tu Ahorro ({results.piePorcentajeReal.toFixed(1)}%):</span>
                  <strong className="text-slate-800">{results.pieUF.toFixed(2)} UF</strong>
                </div>
                <div className="pt-2 border-t border-slate-50 col-span-2">
                  <span className="text-slate-500 block">Crédito a Solicitar al Banco:</span>
                  <strong className="text-blue-600 font-bold">{results.creditoUF.toFixed(2)} UF</strong>
                  <span className="text-xs text-slate-400 block">(${(results.creditoUF * ufValue).toLocaleString("es-CL")})</span>
                </div>
                <div className="pt-2 border-t border-slate-50 col-span-2">
                  <span className="text-slate-500 block">Tasa Final Efectiva:</span>
                  <strong className="text-slate-800">
                    {(results.tasaAplicada * 100).toFixed(2)}% Anual
                    {results.tasaAplicada < results.tasaOriginal && (
                      <span className="text-xs text-emerald-600 font-normal block">
                        (Tasa sin rebaja: {(results.tasaOriginal * 100).toFixed(2)}%)
                      </span>
                    )}
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
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Renta Mínima ({results.multiplicadorRenta}x):</span>
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