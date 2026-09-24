// src/app/percentil/ds52/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";

const formatCLP = (value: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
};

// Constantes DS52
const TOTAL_SUBSIDY_UF = 170;
const CAP_RENT_REGULAR = 11;
const CAP_SUBSIDY_REGULAR = 4.2;
const CAP_RENT_SPECIAL = 13;
const CAP_SUBSIDY_SPECIAL = 4.9;
const MIN_INCOME_UF = 7;
const MAX_INCOME_UF = 25;

export default function SubsidioArriendoDS52Page() {
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [incomeCLP, setIncomeCLP] = useState<number | null>(null);
  const [loadingIncome, setLoadingIncome] = useState(true);

  // Estados del Formulario
  const [locationType, setLocationType] = useState("regular");
  const [months, setMonths] = useState("48");

  // Resultados
  const [results, setResults] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // Cargar UF
      const uf = await fetchUFValue();
      setUfValue(uf);

      // Cargar ingreso desde localStorage
      const savedIncome = localStorage.getItem("income");
      if (savedIncome) {
        const parsed = parseFloat(savedIncome);
        if (!isNaN(parsed)) {
          setIncomeCLP(parsed);
        }
      }
      setLoadingIncome(false);
    }
    init();
  }, []);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    setValidationError(null);
    setResults(null);

    if (incomeCLP === null || isNaN(incomeCLP)) {
      setValidationError("No se encontró tu sueldo. Vuelve al inicio.");
      return;
    }

    const incomeInUF = incomeCLP / ufValue;

    // Validación de Rango de Ingresos (7 UF - 25 UF)
    if (incomeInUF < MIN_INCOME_UF || incomeInUF > MAX_INCOME_UF) {
      setValidationError(`Para el Subsidio de Arriendo, tu ingreso debe estar entre 7 UF y 25 UF. Tu ingreso actual es de ${incomeInUF.toFixed(2)} UF (${formatCLP(incomeCLP)}).`);
      return;
    }

    const vMonths = parseInt(months) || 48;
    const maxRentCapUF = locationType === "special" ? CAP_RENT_SPECIAL : CAP_RENT_REGULAR;
    const maxMonthlySubsidyCapUF = locationType === "special" ? CAP_SUBSIDY_SPECIAL : CAP_SUBSIDY_REGULAR;

    // 2. Calcular subsidio mensual TEÓRICO (Total / Meses)
    const calculatedMonthlySubsidyUF = TOTAL_SUBSIDY_UF / vMonths;

    // 3. Aplicar tope mensual al subsidio (No te pueden dar más de 4.2 o 4.9 al mes)
    const finalMonthlySubsidyUF = Math.min(calculatedMonthlySubsidyUF, maxMonthlySubsidyCapUF);

    // 4. Calcular capacidad de pago del usuario (Sueldo / 3)
    const userContributionCapacityUF = incomeInUF / 3;

    // 5. Calcular Arriendo Máximo que puede buscar
    const maxSearchableRentUF = userContributionCapacityUF + finalMonthlySubsidyUF;

    // 6. Aplicar el tope legal de la vivienda (11 UF o 13 UF)
    const finalRentUF = Math.min(maxSearchableRentUF, maxRentCapUF);

    // 7. Calcular el Copago Real (Lo que paga el usuario a fin de mes)
    const userFinalPaymentUF = finalRentUF - finalMonthlySubsidyUF;

    setResults({
      finalRentUF,
      finalRentCLP: finalRentUF * ufValue,
      finalMonthlySubsidyUF,
      finalMonthlySubsidyCLP: finalMonthlySubsidyUF * ufValue,
      userFinalPaymentUF,
      userFinalPaymentCLP: userFinalPaymentUF * ufValue,
      incomeInUF,
      maxRentCapUF,
      copagoPercent: (userFinalPaymentUF / incomeInUF) * 100
    });

    setTimeout(() => {
      document.getElementById("resultados-arriendo")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Subsidio de Arriendo (DS52)</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Calcula cuánto cubre el subsidio y cuánto debes pagar tú.
            </p>
          </div>
          <Link href="/percentil" className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all">
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleCalculate} className="space-y-6">
            
            {/* INGRESO MOSTRADO */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Sueldo mensual total (CLP):</label>
              {loadingIncome ? (
                <p className="text-sm font-semibold text-slate-600 animate-pulse">Cargando sueldo...</p>
              ) : incomeCLP !== null ? (
                <strong className="text-lg text-slate-900">{formatCLP(incomeCLP)}</strong>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-red-600">Sin información de sueldo en esta sesión.</p>
                  <Link href="/percentil" className="text-xs text-blue-600 hover:underline font-bold mt-1 inline-block">
                    Ir al inicio a ingresar sueldo →
                  </Link>
                </div>
              )}
            </div>

            {/* UBICACIÓN / COMUNA */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">¿Dónde quieres arrendar?</label>
              <select className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 font-medium" value={locationType} onChange={(e) => setLocationType(e.target.value)}>
                <option value="regular">Zona Regular (Regiones)</option>
                <option value="special">RM, Arica y Parinacota, Tarapacá, Antofagasta, Atacama, Aysén, Magallanes</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1.5 block">
                * Región Metropolitana y Zonas Extremas tienen topes de arriendo más altos (13 UF en lugar de 11 UF).
              </span>
            </div>

            {/* DISTRIBUCIÓN DEL SUBSIDIO */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">¿Por cuánto tiempo quieres distribuir el subsidio?</label>
              <select className="w-full p-3 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 font-medium" value={months} onChange={(e) => setMonths(e.target.value)}>
                <option value="12">1 Año (12 meses)</option>
                <option value="24">2 Años (24 meses)</option>
                <option value="36">3 Años (36 meses)</option>
                <option value="48">4 Años (48 meses)</option>
                <option value="60">5 Años (60 meses)</option>
                <option value="72">6 Años (72 meses)</option>
                <option value="84">7 Años (84 meses)</option>
                <option value="96">8 Años (Máximo - 96 meses)</option>
              </select>
              <span className="text-[10px] text-slate-400 mt-1.5 block">
                El subsidio total es de 170 UF a repartir en cuotas mensuales.
              </span>
            </div>

            {/* VALOR UF DE REFERENCIA */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor UF de referencia:</label>
              <span className="text-sm font-semibold text-slate-700">{formatCLP(ufValue)}</span>
            </div>

            <button type="submit" disabled={incomeCLP === null} className="w-full bg-[#6b9ac4] text-white font-bold p-4 rounded-xl hover:bg-[#5a86ae] transition-colors shadow-sm text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed">
              Calcular Subsidio y Copago
            </button>
          </form>
        </section>

        {/* ERROR DE VALIDACIÓN */}
        {validationError && (
          <section className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl mb-8">
            <h3 className="text-red-800 font-bold text-base mb-1">⚠️ Requisitos de Ingreso no cumplidos</h3>
            <p className="text-red-700 text-sm">{validationError}</p>
          </section>
        )}

        {/* INTERFAZ DE RESULTADOS */}
        {results && (
          <section id="resultados-arriendo" className="space-y-4 animate-fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Resultados de la Simulación</h3>

              {/* vivienda que puedes buscar */}
              <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">1. Vivienda que puedes buscar</span>
                <strong className="text-2xl text-slate-800 block">
                  Hasta {results.finalRentUF.toFixed(2)} UF
                </strong>
                <span className="text-base text-slate-600 font-semibold block">
                  ≈ {formatCLP(results.finalRentCLP)} / mes
                </span>
                <span className="text-[10px] text-slate-400 mt-2 block">Tope máximo legal de arriendo en esta zona: {results.maxRentCapUF} UF.</span>
              </div>

              {/* el estado paga */}
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-xl">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">2. El Estado paga (Subsidio)</span>
                <strong className="text-3xl text-emerald-700 block">
                  {results.finalMonthlySubsidyUF.toFixed(2)} UF / mes
                </strong>
                <span className="text-base text-emerald-600 font-semibold block">
                  ≈ {formatCLP(results.finalMonthlySubsidyCLP)}
                </span>
              </div>

              {/* tu pagas */}
              <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">3. Tú pagas (Copago estimado)</span>
                <strong className="text-3xl text-blue-700 block">
                  {results.userFinalPaymentUF.toFixed(2)} UF / mes
                </strong>
                <span className="text-base text-blue-600 font-semibold block">
                  ≈ {formatCLP(results.userFinalPaymentCLP)}
                </span>
                <span className="text-[10px] text-slate-500 mt-2 block">
                  Equivale aprox. al {results.copagoPercent.toFixed(1)}% de tu sueldo mensual.
                </span>
              </div>

            </div>
          </section>
        )}
      </main>
    </div>
  );
}
