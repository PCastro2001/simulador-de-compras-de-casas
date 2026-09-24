// src/app/percentil/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { REGION_MAP } from "@/data/regions";

export default function PercentilPage() {
  // Estados para el formulario
  const [income, setIncome] = useState<string>("");
  const [householdSize, setHouseholdSize] = useState<string>("");
  const [region, setRegion] = useState<string>("metropolitana");
  const [ufValue, setUfValue] = useState<number>(DEFAULT_UF_VALUE);
  
  // Estados para los resultados
  const [result, setResult] = useState<{
    percentile: number;
    showSubsidies: boolean;
  } | null>(null);

  // Cargar el valor real de la UF al montar el componente
  useEffect(() => {
    async function loadUF() {
      const value = await fetchUFValue();
      setUfValue(value);
    }
    loadUF();
  }, []);

  const getDS1Zone = (reg: string) => {
    if (["arica-y-parinacota", "tarapaca", "antofagasta", "atacama"].includes(reg)) {
      return "north";
    }
    if (["aysen", "magallanes"].includes(reg)) {
      return "south";
    }
    return "none";
  };

  const isDS1T3Eligible = () => {
    if (!result) return false;
    const size = parseInt(householdSize) || 1;
    const incomeNum = parseFloat(income) || 0;
    const zone = getDS1Zone(region);
    
    // Si es del 90% o menos en RSH, cumple automáticamente
    if (result.percentile <= 90) return true;
    
    // Si es > 90% en RSH, se aplican los límites oficiales de ingresos familiares por zona
    const limitsNorthSouth = [2589712, 3386546, 3705280, 4204014];
    const limitsRegular = [1992086, 2788921, 3107655, 3426388];
    const limits = (zone === "north" || zone === "south") ? limitsNorthSouth : limitsRegular;
    const idx = Math.min(size - 1, 3);
    
    return incomeNum <= limits[idx];
  };

  const isDS1T4Eligible = () => {
    if (!result) return false;
    const size = parseInt(householdSize) || 1;
    const incomeNum = parseFloat(income) || 0;
    
    // Si es del 90% o menos en RSH, cumple automáticamente
    if (result.percentile <= 90) return true;
    
    // Si es > 90% en RSH, el límite es 1.8 veces la Zona Regular del DS1 Tramo 3 (Todo Chile)
    const limitsRegular = [1992086, 2788921, 3107655, 3426388];
    const idx = Math.min(size - 1, 3);
    const limit = limitsRegular[idx] * 1.8;
    
    return incomeNum <= limit;
  };

  // Fórmulas matemáticas idénticas a tu JS original
  const calculatePercentile = (perCapitaIncome: number): number => {
    const thresholds = [
      { max: 82320, percentile: 10 },
      { max: 141488, percentile: 20 },
      { max: 195510, percentile: 30 },
      { max: 246960, percentile: 40 },
      { max: 308700, percentile: 50 },
      { max: 398493, percentile: 60 },
      { max: 514500, percentile: 70 },
      { max: 699720, percentile: 80 },
      { max: 1151624, percentile: 90 },
    ];

    const found = thresholds.find((t) => perCapitaIncome < t.max);
    return found ? found.percentile : 100;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const incomeNum = parseFloat(income);
    const sizeNum = parseInt(householdSize);

    if (isNaN(incomeNum) || isNaN(sizeNum) || sizeNum < 1) return;

    // Guardar el sueldo líquido en localStorage para las futuras pantallas
    localStorage.setItem("income", incomeNum.toString());

    // Calcular ingreso per cápita y obtener percentil
    const adjustedIncome = incomeNum / sizeNum;
    const computedPercentile = calculatePercentile(adjustedIncome);

    setResult({
      percentile: computedPercentile,
      showSubsidies: true,
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans">
      
      {/* Header institucional alineado con la portada */}
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Subsidios según tu sueldo
            </h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Calcula tu percentil estimado en el Registro Social de Hogares.
            </p>
          </div>
          <Link 
            href="/" 
            className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all"
          >
            ← Volver al Inicio
          </Link>
        </div>
      </header>

      {/* Contenedor del Formulario y Resultados */}
      <main className="max-w-3xl mx-auto px-6 py-10">
        
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="form-group">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Sueldo mensual líquido total ($ CLP):
              </label>
              <input
                type="number"
                min="0"
                required
                placeholder="Ej: 900000"
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] transition-all text-sm"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Número de personas que viven en el hogar:
              </label>
              <input
                type="number"
                min="1"
                required
                placeholder="Ej: 3"
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] transition-all text-sm"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">
                Región de búsqueda/compra:
              </label>
              <select
                className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] transition-all text-sm focus:ring-1 focus:ring-[#6b9ac4]/30"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {Object.keys(REGION_MAP).map((key) => (
                  <option key={key} value={key}>{REGION_MAP[key].label}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full p-3.5 bg-[#87c0a3] text-slate-950 font-bold text-sm rounded-xl hover:bg-[#76b092] transition-colors shadow-sm"
              >
                Calcular Percentil y Subsidios
              </button>
            </div>
            
            <div className="text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Valor UF de referencia actualizado: ${ufValue.toLocaleString("es-CL")}
              </span>
            </div>

          </form>
        </section>

        {/* Bloque de Resultados Reactivos (Solo aparece si el usuario presionó Calcular) */}
        {result && (
          <section className="space-y-6 animate-fade-in">
            
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 text-center shadow-md border border-slate-800">
              <span className="text-xs font-bold tracking-wider uppercase text-sky-400 block mb-1">
                Resultado de Vulnerabilidad
              </span>
              <p className="text-lg text-slate-300">
                Tu percentil estimado es:{" "}
                <strong className="text-2xl text-white ml-1 font-extrabold">
                  {result.percentile}%
                </strong>
              </p>
              <p className="text-slate-400 text-xs mt-2 max-w-md mx-auto">
                Esto significa que estás dentro del grupo de hogares con ingresos menores al {result.percentile}% de la población nacional según el RSH.
              </p>
            </div>

            <div className="flex items-center gap-4 py-2">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase whitespace-nowrap">
                Subsidios Disponibles para tu Perfil
              </h3>
              <div className="h-px bg-slate-300 w-full"></div>
            </div>

            {/* Renderizado condicional de tarjetas de subsidios calcado de tu lógica de negocio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Lógica DS52 */}
              {result.percentile <= 70 && parseInt(householdSize) > 1 && parseFloat(income) >= 7 * ufValue && parseFloat(income) <= 25 * ufValue && (
                <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6b9ac4] transition-all">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Arriendo</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Subsidio DS52</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Aporte mensual de arriendo que te permite mantener capacidad de ahorro de cara a la casa propia.</p>
                  <Link href="/percentil/ds52" className="text-xs text-blue-600 font-bold hover:underline">Ver detalles del subsidio →</Link>
                </article>
              )}

              {/* Lógica DS49 */}
              {result.percentile <= 40 && (
                <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6b9ac4] transition-all">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">Compra sin deuda</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Subsidio DS49</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Destinado a familias vulnerables para adquirir una vivienda social sin necesidad de crédito hipotecario.</p>
                  <Link href="/percentil/ds49" className="text-xs text-blue-600 font-bold hover:underline">Calcular probabilidad de selección →</Link>
                </article>
              )}

              {/* Lógica DS1 Tramo 1 */}
              {result.percentile <= 60 && (
                <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6b9ac4] transition-all">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Sectores Medios</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Subsidio DS1 — Tramo 1</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Para la compra de viviendas nuevas o usadas de hasta un valor máximo de 1.100 UF.</p>
                  <Link href="/percentil/ds1t1" className="text-xs text-blue-600 font-bold hover:underline">Simular ahorro seguro →</Link>
                </article>
              )}

              {/* Lógica DS1 Tramo 2 */}
              {result.percentile <= 80 && (
                <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6b9ac4] transition-all">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Sectores Medios</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Subsidio DS1 — Tramo 2</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Permite la compra de propiedades de hasta 1.600 UF complementando con crédito hipotecario opcional.</p>
                  <Link href="/percentil/ds1t2" className="text-xs text-blue-600 font-bold hover:underline">Simular ahorro seguro →</Link>
                </article>
              )}

              {/* Lógica DS1 Tramo 3 */}
              {result.percentile <= 100 && isDS1T3Eligible() && (
                <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6b9ac4] transition-all">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Sectores Medios</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Subsidio DS1 — Tramo 3</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Para la compra de viviendas de hasta 2.200 UF. Requiere capacidad de crédito hipotecario bancario obligatorio.</p>
                  <Link href="/percentil/ds1t3" className="text-xs text-blue-600 font-bold hover:underline">Simular Ahorro Seguro →</Link>
                </article>
              )}

              {/* Lógica DS1 Tramo 4 */}
              {result.percentile <= 100 && isDS1T4Eligible() && (
                <article className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#6b9ac4] transition-all">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Sectores Medios</span>
                  <h4 className="text-base font-bold text-slate-900 mb-1">Subsidio DS1 — Tramo 4</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4">Para compra de viviendas nuevas o usadas de hasta 4.000 UF. Exige ahorro mínimo de 200 UF y otorga subsidio de 400 UF.</p>
                  <Link href="/valor-maximo/ds1t4" className="text-xs text-blue-600 font-bold hover:underline">Simular Valor Máximo →</Link>
                </article>
              )}

            </div>
          </section>
        )}

      </main>
    </div>
  );
}