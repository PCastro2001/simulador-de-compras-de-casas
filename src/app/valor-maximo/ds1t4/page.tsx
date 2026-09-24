// src/app/valor-maximo/ds1t4/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks";
import { REGION_MAP } from "@/data/regions";

export default function MaxValueDS1T4Page() {
  const [incomeCLP, setIncomeCLP] = useState("");
  const [savingsUF, setSavingsUF] = useState("");
  const [bank, setBank] = useState("");
  const [loanTerm, setLoanTerm] = useState("25");
  const [isNewHome, setIsNewHome] = useState(false);
  const [isYoungSingle, setIsYoungSingle] = useState(false);
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  const [region, setRegion] = useState("metropolitana");
  const [propertyType, setPropertyType] = useState("ambos"); // 'casa', 'depto', 'ambos'

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

    if (!bank || !BANKS[bank]) {
      alert("Por favor, selecciona un banco válido.");
      return;
    }

    const effectiveSavings = savings < 200 ? 200 : savings;

    // 1. Capacidad Máxima de Pago
    // Si es joven soltero menor de 35 años, el dividendo puede representar hasta el 33% de la renta (divisor 3).
    // En caso contrario, el límite estándar es 25% (divisor 4).
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const maxMonthlyPaymentUF = (income / ufValue) / incomeMultiplier;

    // 2. Extraer Tasa de Interés y calcular Crédito Máximo
    const bankData = BANKS[bank];
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(1000, term) : (bankData.tasaBase || 0.05);
    const tasaAplicada = tasaOriginal;

    const monthlyRate = tasaAplicada / 12;
    const totalPayments = term * 12;
    const maxLoanUF = maxMonthlyPaymentUF * ((1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate);

    // 3. Subsidio Fijo Tramo 4 = 400 UF
    const subsidyUF = 400;

    // 4. Presupuesto Máximo de Compra (Crédito + Ahorro + Subsidio Fijo)
    let maxPropertyValue = maxLoanUF + effectiveSavings + subsidyUF;

    // 5. Aplicar el Tope Legal de 4.000 UF
    const legalMaxCap = 4000;
    if (maxPropertyValue > legalMaxCap) {
      maxPropertyValue = legalMaxCap;
    }

    setResults({
      maxHouseUF: maxPropertyValue,
      loanUF: maxLoanUF,
      savingsUF: effectiveSavings,
      userSavingsUF: savings,
      subsidyUF: subsidyUF,
      maxDividendUF: maxMonthlyPaymentUF,
      bank: bankData.name,
      tasaOriginal,
      tasaAplicada,
      legalMaxCap
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Valor Máximo: DS1 Tramo 4 (4000 UF)</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Ingresa tus datos para calcular el presupuesto máximo de compra bajo este nuevo subsidio.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Renta Líquida Familiar Mensual ($ CLP):</label>
                <input 
                  type="number" 
                  min="0" 
                  required 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                  value={incomeCLP} 
                  onChange={(e) => setIncomeCLP(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ahorro Actual (UF):</label>
                <input 
                  type="number" 
                  min="0" 
                  step="1" 
                  required 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:border-[#6b9ac4]" 
                  value={savingsUF} 
                  placeholder="Ej: 200"
                  onChange={(e) => setSavingsUF(e.target.value)} 
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Mínimo 200 UF para postular. Si ingresas menos, simularemos asumiendo que llegarás a las 200 UF.</span>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Plazo del Crédito:</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" 
                  value={loanTerm} 
                  onChange={(e) => setLoanTerm(e.target.value)}
                >
                  <option value="15">15 años</option>
                  <option value="20">20 años</option>
                  <option value="25">25 años</option>
                  <option value="30">30 años</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Región de búsqueda:</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" 
                  value={region} 
                  onChange={(e) => setRegion(e.target.value)}
                >
                  {Object.keys(REGION_MAP).map((key) => (
                    <option key={key} value={key}>{REGION_MAP[key].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Propiedad:</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" 
                  value={propertyType} 
                  onChange={(e) => setPropertyType(e.target.value)}
                >
                  <option value="ambos">Casas y Departamentos</option>
                  <option value="casa">Solo Casas</option>
                  <option value="depto">Solo Departamentos</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isNewHome} onChange={(e) => setIsNewHome(e.target.checked)} /> 
                ¿Buscas vivienda nueva?
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isYoungSingle} onChange={(e) => setIsYoungSingle(e.target.checked)} /> 
                ¿Eres joven soltero menor de 35 años? (Permite endeudamiento al 33%)
              </label>
            </div>

            <button type="submit" className="w-full bg-[#6b9ac4] text-white font-bold p-3.5 rounded-xl hover:bg-[#5a86ae] transition-colors shadow-sm">
              Calcular Presupuesto Máximo
            </button>
          </form>
        </section>

        {results && (
          <section className="space-y-4 animate-fade-in">
            <div className="text-center mb-6 pt-4 border-t border-slate-200">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Tu Presupuesto Máximo Es</p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900">
                {results.maxHouseUF.toFixed(0)} UF
              </h2>
              <p className="text-lg font-semibold text-[#6b9ac4] mt-2">
                ≈ ${(Math.round(results.maxHouseUF * ufValue)).toLocaleString("es-CL")} CLP
              </p>
            </div>

            {results.userSavingsUF < 200 && (
              <div className="bg-amber-50 border-2 border-amber-300 text-amber-950 p-4 rounded-xl shadow-sm text-xs leading-relaxed">
                ⚠️ <strong>Ahorro insuficiente para postular:</strong> Tu ahorro actual es de <strong>{results.userSavingsUF.toFixed(0)} UF</strong>, pero el subsidio DS1 Tramo 4 exige un ahorro mínimo de <strong>200 UF</strong>. Hemos calculado tu capacidad asumiendo que alcanzarás la meta de ahorro (te faltan <strong>{(200 - results.userSavingsUF).toFixed(0)} UF</strong>, aprox. <strong>${Math.round((200 - results.userSavingsUF) * ufValue).toLocaleString("es-CL")} CLP</strong>).
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Desglose de Financiamiento ({results.bank})
              </h3>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Crédito Máximo Banco:</span>
                  <strong className="text-slate-800">{results.loanUF.toFixed(0)} UF</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Tu Ahorro:</span>
                  <strong className="text-slate-800">{results.savingsUF.toFixed(0)} UF</strong>
                </div>
                <div className="pt-2 border-t border-slate-50 col-span-2">
                  <span className="text-slate-500 block">Subsidio Total Estado:</span>
                  <strong className="text-emerald-600 font-bold">+{results.subsidyUF.toFixed(0)} UF</strong>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mt-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Tope Dividendo:</span>
                    <span className="font-extrabold text-slate-900">
                      {results.maxDividendUF.toFixed(2)} UF <span className="text-xs font-normal text-slate-400">(${Math.round(results.maxDividendUF * ufValue).toLocaleString("es-CL")})</span>
                    </span>
                 </div>
              </div>
            </div>

            {results.maxHouseUF >= results.legalMaxCap && (
              <div className="bg-amber-50 border-2 border-amber-200 text-amber-900 p-4 rounded-xl shadow-sm text-xs">
                ⚠️ Tu capacidad financiera es mayor, pero el resultado ha sido limitado a <strong>{results.legalMaxCap} UF</strong>, que es el tope máximo que permite el subsidio DS1 Tramo 4.
              </div>
            )}

            <div className="text-center pt-4">
              <Link 
                href={`/ofertas-inmobiliarias?maxPrice=${Math.round(results.maxHouseUF * ufValue)}&maxUF=${Math.round(results.maxHouseUF)}&credit=${Math.round(results.loanUF)}&origin=ds1t4&region=${region}&propertyType=${propertyType === "depto" ? "departamento" : propertyType}`}
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
