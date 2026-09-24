// src/app/subsidies/ds49/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";

export default function DS49Page() {
  const [propertyCLP, setPropertyCLP] = useState("");
  const [propertyUF, setPropertyUF] = useState("");
  const [savings, setSavings] = useState("10"); 
  const [isUrban, setIsUrban] = useState(true); 
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  const MAX_LIMIT_UF = 1300;

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

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const pUF = parseFloat(propertyUF);
    const sUF = parseFloat(savings);

    if (sUF < 10) {
      alert("El Subsidio DS49 exige un ahorro mínimo absoluto de 10 UF para postular.");
      return;
    }

    if (pUF > MAX_LIMIT_UF) {
      alert(`El valor máximo de la vivienda para el programa DS49 es de ${MAX_LIMIT_UF} UF en todo el país.`);
      return;
    }

    // 1. Matemáticas del DS49
    const baseSubsidy = 800; 
    const urbanBonus = isUrban ? 100 : 0; 

    // 2. Premio al Esfuerzo de Ahorro
    const extraSavings = Math.max(0, sUF - 10);
    const savingsBonus = Math.min(250, extraSavings * 5); 

    // 3. Capacidad Total Disponible
    const maxSubsidyPossible = baseSubsidy + urbanBonus + savingsBonus;
    const maxPurchasingPower = maxSubsidyPossible + sUF;

    // 4. Determinar si hay Brecha (Falta dinero)
    let hasShortfall = false;
    let shortfallUF = 0;
    let requiredTotalSavingsUF = 0;
    let additionalSavingsNeededUF = 0;
    let estimatedMonthlyQuotaUF = 0;
    
    if (pUF > maxPurchasingPower) {
      hasShortfall = true;
      shortfallUF = pUF - maxPurchasingPower;

      // Calcular ahorro extra inteligente (Aprovechando el multiplicador estatal)
      // Ecuación A (Si ahorro < 60): Ahorro + 800 + Urbano + (Ahorro-10)*5 = pUF -> Ahorro = (pUF - 750 - Urbano)/6
      const calcA = (pUF - 750 - urbanBonus) / 6;
      // Ecuación B (Si ahorro >= 60, tope de 250UF alcanzado): Ahorro + 800 + Urbano + 250 = pUF -> Ahorro = pUF - 1050 - Urbano
      const calcB = pUF - 1050 - urbanBonus;
      
      requiredTotalSavingsUF = Math.max(calcA, calcB);
      if (requiredTotalSavingsUF < 10) requiredTotalSavingsUF = 10;
      additionalSavingsNeededUF = requiredTotalSavingsUF - sUF;

      // Calcular crédito complementario (Tasa de consumo estimada 1.2% mensual a 5 años)
      const monthlyRate = 0.012; 
      const totalPayments = 60; // 5 años
      estimatedMonthlyQuotaUF = (shortfallUF * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    }

    // 5. Cálculo del Subsidio Real Utilizado
    const usedSubsidy = hasShortfall ? maxSubsidyPossible : pUF - sUF;

    setResults({
      valorViviendaUF: pUF,
      pieUF: sUF,
      piePorcentajeReal: (sUF / pUF) * 100,
      subsidioUsadoUF: usedSubsidy,
      subsidioUsadoCLP: usedSubsidy * ufValue,
      maxSubsidyPossible,
      maxPurchasingPower,
      baseSubsidy,
      urbanBonus,
      savingsBonus,
      hasShortfall,
      shortfallUF,
      shortfallCLP: shortfallUF * ufValue,
      additionalSavingsNeededUF,
      additionalSavingsNeededCLP: additionalSavingsNeededUF * ufValue,
      estimatedMonthlyQuotaUF,
      estimatedMonthlyQuotaCLP: estimatedMonthlyQuotaUF * ufValue
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subsidio DS49</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Fondo Solidario de Elección de Vivienda (Hasta {MAX_LIMIT_UF} UF).
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
                <input type="number" required min="10" max={MAX_LIMIT_UF} step="0.01" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" value={propertyUF} onChange={(e) => handleUFChange(e.target.value)} />
                <span className="text-[10px] text-slate-500 mt-1 block">Tope máximo nacional de {MAX_LIMIT_UF} UF.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tu Ahorro Exacto (UF):</label>
                <input type="number" required min="10" step="1" className="w-full p-2.5 border border-slate-200 rounded-xl bg-blue-50 text-blue-900 font-bold text-sm focus:outline-none focus:border-[#6b9ac4]" value={savings} onChange={(e) => setSavings(e.target.value)} />
                <span className="text-[10px] text-slate-500 mt-1 block">Por cada UF extra sobre las 10 UF, recibes 5 UF de premio.</span>
              </div>
               <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Zona:</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="zona" checked={isUrban} onChange={() => setIsUrban(true)} className="w-4 h-4 text-[#6b9ac4]" />
                    Urbana (+100 UF)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="radio" name="zona" checked={!isUrban} onChange={() => setIsUrban(false)} className="w-4 h-4 text-[#6b9ac4]" />
                    Rural
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-950 leading-relaxed">
                ℹ️ <strong>Mecánica del DS49:</strong> Este programa se basa en la cobertura total sin hipoteca. El Estado evaluará tu ahorro y te otorgará bonos variables.
              </p>
            </div>

            <button type="submit" className="w-full bg-[#87c0a3] text-slate-950 font-bold p-3.5 rounded-xl hover:bg-[#76b092] transition-colors shadow-sm">
              Simular Cobertura Solidaria
            </button>
          </form>
        </section>

        {results && (
          <section className="space-y-4 animate-fade-in">
            {results.hasShortfall ? (
              <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 p-5 rounded-xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-amber-200 pb-4">
                  <div>
                    <h4 className="text-base font-bold">⚠️ Financiamiento Incompleto</h4>
                    <p className="text-xs opacity-90 mt-0.5">El subsidio máximo y tu ahorro actual no alcanzan a cubrir la propiedad.</p>
                  </div>
                  <div className="md:text-right">
                    <span className="text-xs block font-medium opacity-75">Brecha Faltante:</span>
                    <span className="text-2xl font-black text-amber-700 block leading-none">
                      {results.shortfallUF.toFixed(2)} UF
                    </span>
                  </div>
                </div>

                <p className="text-sm font-bold mb-3">Tienes 2 opciones para lograr comprar esta vivienda:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                    <h5 className="font-bold text-emerald-600 mb-1 flex items-center gap-1">Opción 1: Ahorro Inteligente</h5>
                    <p className="text-xs text-slate-600 mb-3">Aprovecha el multiplicador x5 del Estado. En vez de pedir todo prestado, solo necesitas ahorrar un poco más.</p>
                    <div className="bg-slate-50 p-2 rounded text-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Debes ahorrar</span>
                      <strong className="text-lg text-slate-800">{results.additionalSavingsNeededUF.toFixed(1)} UF extra</strong>
                      <span className="block text-xs text-slate-500">(≈ ${Math.round(results.additionalSavingsNeededCLP).toLocaleString("es-CL")} CLP)</span>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                    <h5 className="font-bold text-blue-600 mb-1 flex items-center gap-1">Opción 2: Crédito de Consumo / Directo</h5>
                    <p className="text-xs text-slate-600 mb-3">Pide un préstamo complementario a 5 años para cubrir exclusivamente la diferencia faltante.</p>
                    <div className="bg-slate-50 p-2 rounded text-center">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase">Cuota Mensual Estimada</span>
                      <strong className="text-lg text-slate-800">≈ ${Math.round(results.estimatedMonthlyQuotaCLP).toLocaleString("es-CL")}</strong>
                      <span className="block text-[10px] text-blue-600 mt-1 font-semibold">Recomendación: Idealmente mantén esta cuota por debajo de los $150.000 mensuales.</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 p-5 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <h4 className="text-sm font-bold">🎉 Cobertura de Subsidio Aprobada</h4>
                  <p className="text-xs opacity-90 mt-0.5">Monto exacto que desembolsará el SERVIU para cubrir esta vivienda.</p>
                </div>
                <div className="text-right">
                  <span className="text-xs block font-medium opacity-75">Aporte del Estado:</span>
                  <span className="text-xl md:text-2xl font-extrabold text-emerald-700">
                    ${Math.round(results.subsidioUsadoCLP).toLocaleString("es-CL")} CLP
                  </span>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Desglose de tus Bonos del Estado
              </h3>
              
              <ul className="space-y-3 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <li className="flex justify-between items-center text-slate-600">
                  <span>Subsidio Base Fijo:</span>
                  <strong>{results.baseSubsidy} UF</strong>
                </li>
                {results.urbanBonus > 0 && (
                  <li className="flex justify-between items-center text-blue-600">
                    <span>Bono por Zona Urbana:</span>
                    <strong>+{results.urbanBonus} UF</strong>
                  </li>
                )}
                {results.savingsBonus > 0 && (
                  <li className="flex justify-between items-center text-emerald-600">
                    <span>Premio por Ahorro Adicional:</span>
                    <strong>+{results.savingsBonus.toFixed(1)} UF</strong>
                  </li>
                )}
                <li className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                  <span className="text-slate-800">Tope de Subsidio Disponible:</span>
                  <span className="text-slate-900">{results.maxSubsidyPossible.toFixed(1)} UF</span>
                </li>
              </ul>

              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Análisis de la Compra
              </h3>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Precio de Vivienda:</span>
                  <strong className="text-slate-800">{results.valorViviendaUF.toFixed(2)} UF</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tu Ahorro ({results.piePorcentajeReal.toFixed(1)}%):</span>
                  <strong className="text-slate-800">{results.pieUF.toFixed(2)} UF</strong>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block">Deuda Requerida:</span>
                  <strong className={results.hasShortfall ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                    {results.hasShortfall ? `${results.shortfallUF.toFixed(2)} UF` : "0 UF (Sin Deuda)"}
                  </strong>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block">Subsidio a Utilizar:</span>
                  <strong className="text-slate-800">{results.subsidioUsadoUF.toFixed(2)} UF</strong>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}