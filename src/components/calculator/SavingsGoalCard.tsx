'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  DS49CalculationResult,
  DS49Region,
  DS49_REGIONAL_CUTOFFS_2025,
  SavingsTimelineResult,
  SavingsRatePreset,
} from '@/domain/subsidies/ds49';
import { formatCLP } from '@/utils/format';
import { ScoreBreakdownModal } from './ScoreBreakdownModal';
import { SubsidyRecommendation } from '@/hooks/useDS49Calculator';

interface SavingsGoalCardProps {
  result: DS49CalculationResult;
  ufValue: number;
  selectedRegion: DS49Region;
  onRegionChange: (region: DS49Region) => void;
  recommendation: SubsidyRecommendation;
  ingresoFamiliarCLP: number;
  savingsRatePreset: SavingsRatePreset;
  onSavingsRateChange: (preset: SavingsRatePreset, customClp?: number) => void;
  savingsTimeline: SavingsTimelineResult;
}

export function SavingsGoalCard({
  result,
  ufValue,
  selectedRegion,
  onRegionChange,
  recommendation,
  ingresoFamiliarCLP,
  savingsRatePreset,
  onSavingsRateChange,
  savingsTimeline,
}: SavingsGoalCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    puntajeTotalActual,
    puntajeCorteRegion,
    superaCorte,
    ahorroTotalSugeridoUF,
    ahorroExtraRequeridoUF,
    brechaAhorroUF,
    brechaAhorroCLP,
    ahorroActualUF,
  } = result;

  // Porcentaje de avance hacia el corte regional
  const progressPercent = Math.min(100, Math.round((puntajeTotalActual / puntajeCorteRegion) * 100));

  // Conversión monetaria del ahorro sugerido
  const ahorroTotalSugeridoCLP = Math.round(ahorroTotalSugeridoUF * ufValue);
  const ahorroMinimoCLP = Math.round(10 * ufValue);

  // Estimaciones comparativas rápidas para 5%, 10% y 15%
  const getMonthsForRate = (rate: number) => {
    const monthlyClp = Math.round(ingresoFamiliarCLP * (rate / 100));
    if (brechaAhorroUF === 0) return 0;
    if (monthlyClp <= 0 || (brechaAhorroCLP ?? 0) <= 0) return 0;
    return Math.ceil((brechaAhorroCLP ?? 0) / monthlyClp);
  };

  const monthsAt5 = getMonthsForRate(5);
  const monthsAt10 = getMonthsForRate(10);
  const monthsAt15 = getMonthsForRate(15);

  return (
    <>
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 relative overflow-hidden transition-all">
        {/* Barra superior con gradiente de estado */}
        <div
          className={`absolute top-0 left-0 right-0 h-2.5 ${
            superaCorte
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
              : 'bg-gradient-to-r from-amber-400 to-orange-500'
          }`}
        />

        {/* Header de la tarjeta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  superaCorte
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {superaCorte ? '✓ Puntaje Competitivo' : '⚡ Meta de Ahorro Activa'}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Corte Regional 2025: <strong className="text-slate-800">{puntajeCorteRegion} pts</strong>
              </span>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Ecuación Inversa & Meta de Ahorro
            </h3>
          </div>

          {/* Selector Reactivo de Región */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <label htmlFor="region-selector" className="text-xs font-semibold text-slate-600 pl-2">
              Región:
            </label>
            <select
              id="region-selector"
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value as DS49Region)}
              className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 capitalize cursor-pointer shadow-xs"
            >
              {(Object.keys(DS49_REGIONAL_CUTOFFS_2025) as DS49Region[]).map((reg) => (
                <option key={reg} value={reg} className="capitalize">
                  {reg} ({DS49_REGIONAL_CUTOFFS_2025[reg]} pts)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Barra de Progreso hacia el corte regional */}
        <div className="py-6">
          <div className="flex justify-between items-baseline mb-2">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tu puntaje acumulado
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {puntajeTotalActual}
                </span>
                <span className="text-sm font-semibold text-slate-400">
                  / {puntajeCorteRegion} pts corte
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`text-sm font-extrabold ${
                  superaCorte ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {progressPercent}% de la meta
              </span>
              <span className="block text-xs text-slate-500">
                {superaCorte
                  ? `Superas por ${puntajeTotalActual - puntajeCorteRegion} pts`
                  : `Faltan ${puntajeCorteRegion - puntajeTotalActual} pts`}
              </span>
            </div>
          </div>

          {/* Track de progreso */}
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                superaCorte
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tarjetas comparativas: Ahorro Mínimo Legal vs Ahorro Sugerido */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
          {/* Tarjeta 1: Ahorro Mínimo Exigido */}
          <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Requisito Base Obligatorio
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  10 pts base
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-800">Ahorro Mínimo Legal</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Monto reglamentario obligatorio en la libreta para poder postular al subsidio DS49.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60">
              <div className="text-2xl font-black text-slate-800">10 UF</div>
              <div className="text-xs font-semibold text-slate-500">
                ≈ {formatCLP(ahorroMinimoCLP)} CLP
              </div>
            </div>
          </div>

          {/* Tarjeta 2: Ahorro Óptimo Sugerido (Ecuación Inversa) */}
          <div
            className={`rounded-2xl p-5 border flex flex-col justify-between shadow-xs ${
              superaCorte
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-amber-50/70 border-amber-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    superaCorte ? 'text-emerald-700' : 'text-amber-800'
                  }`}
                >
                  Ecuación Inversa Subsimatch
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    superaCorte
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {superaCorte ? 'Meta Cumplida' : `+${ahorroExtraRequeridoUF} UF Extra`}
                </span>
              </div>
              <h4
                className={`text-base font-bold ${
                  superaCorte ? 'text-emerald-950' : 'text-amber-950'
                }`}
              >
                Ahorro Total Recomendado
              </h4>
              <p
                className={`text-xs mt-1 leading-relaxed ${
                  superaCorte ? 'text-emerald-800' : 'text-amber-800'
                }`}
              >
                {superaCorte
                  ? 'Con tus condiciones actuales ya igualas o superas el puntaje de corte de tu región.'
                  : `Cada 1 UF adicional sobre las 10 UF base otorga 2 puntos normativos directos.`}
              </p>
            </div>

            <div
              className={`mt-4 pt-3 border-t ${
                superaCorte ? 'border-emerald-200' : 'border-amber-200'
              }`}
            >
              <div
                className={`text-2xl font-black ${
                  superaCorte ? 'text-emerald-800' : 'text-amber-900'
                }`}
              >
                {ahorroTotalSugeridoUF} UF
              </div>
              <div
                className={`text-xs font-semibold ${
                  superaCorte ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                ≈ {formatCLP(ahorroTotalSugeridoCLP)} CLP
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* PROYECCIÓN TEMPORAL AJUSTABLE CON TOGGLE DE PORCENTAJES */}
        {/* ============================================================= */}
        <div className="mt-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-inner space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⏱️</span>
              <div>
                <span className="text-xs font-semibold text-teal-300 uppercase tracking-wider block">
                  Proyección Temporal Ajustable
                </span>
                <span className="text-xs text-slate-300">
                  Simula cómo cambia tu plazo al ajustar el porcentaje de ahorro:
                </span>
              </div>
            </div>

            {/* Selector interactivo de porcentaje directo en resultados */}
            <div className="inline-flex bg-white/10 p-1 rounded-xl border border-white/20 self-start sm:self-auto">
              {[
                { val: 5, label: '5%' },
                { val: 10, label: '10%' },
                { val: 15, label: '15%' },
              ].map((chip) => (
                <button
                  key={chip.val}
                  type="button"
                  onClick={() => onSavingsRateChange(chip.val as SavingsRatePreset)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    savingsRatePreset === chip.val
                      ? 'bg-teal-400 text-slate-950 shadow-sm scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              {savingsRatePreset === 'custom' && (
                <span className="px-2.5 py-1 text-xs font-bold text-teal-300 bg-white/20 rounded-lg">
                  Personalizado
                </span>
              )}
            </div>
          </div>

          {/* Resultado de la Proyección Temporal */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            {brechaAhorroUF === 0 ? (
              <div className="text-emerald-300 font-bold text-sm">
                🎉 ¡Ya dispones del ahorro necesario para este corte regional!
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="text-sm font-medium text-white">
                    Ahorrando el{' '}
                    <strong className="text-teal-300 font-extrabold text-base">
                      {savingsTimeline.savingsRatePercentage}%
                    </strong>{' '}
                    (
                    <strong className="text-white">
                      {formatCLP(savingsTimeline.monthlySavingsCLP)}/mes
                    </strong>
                    , ≈ {savingsTimeline.monthlySavingsUF} UF)
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Tiempo estimado:</span>
                    <span className="text-xl sm:text-2xl font-black text-teal-300">
                      {savingsTimeline.mesesProyectados}{' '}
                      {savingsTimeline.mesesProyectados === 1 ? 'mes' : 'meses'}
                    </span>
                  </div>
                </div>

                {/* Comparación rápida interactiva de escenarios */}
                <div className="text-xs text-slate-300 pt-2 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Al 5%: <strong>{monthsAt5} meses</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Al 10%: <strong>{monthsAt10} meses</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Al 15%: <strong>{monthsAt15} meses</strong>
                  </span>
                </div>
              </div>
            )}

            <div className="text-[11px] text-slate-400 mt-2.5 flex justify-between items-center">
              <span>
                Brecha por cubrir: <strong>{brechaAhorroUF.toFixed(1)} UF</strong>
                {brechaAhorroCLP !== null && ` (≈ ${formatCLP(brechaAhorroCLP)} CLP)`}
              </span>
              <span>
                Ahorro actual: <strong>{ahorroActualUF} UF</strong>
              </span>
            </div>
          </div>

          {/* Banner de Consejo para Metas a Mediano Plazo (> 24 meses) */}
          {savingsTimeline.esMedianoPlazo && (
            <div className="bg-amber-400/15 border border-amber-400/40 rounded-xl p-3 text-xs text-amber-200 flex items-start gap-2.5 animate-fade-in">
              <span className="text-base shrink-0">⏳</span>
              <div className="leading-relaxed">
                <strong>Consejo de Postulación:</strong> {savingsTimeline.consejoPermanencia}
                <span className="block text-[11px] text-amber-300/90 mt-0.5">
                  Cada mes activo suma 1 punto (hasta 40 pts) y mantener saldo regular suma 10 pts adicionales (Factor D).
                </span>
              </div>
            </div>
          )}

          {/* Botón para abrir la auditoría técnica */}
          <div className="flex justify-end pt-1">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              🔍 Ver Auditoría de Puntos
            </button>
          </div>
        </div>

        {/* Derivación inteligente a DS1 si corresponde */}
        {recommendation.suggestsDS1Alternative && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <span className="text-blue-600 text-lg">💡</span>
              <div className="text-xs text-blue-900 leading-relaxed">
                <strong>¿Buscas una opción con menor tiempo de espera?</strong> Si tienes capacidad
                de crédito o ahorro adicional, el <strong>Subsidio DS1 Tramo 1</strong> te permite
                asegurar cupo directamente mediante ahorro programado sin depender de hacinamiento
                extremo.
              </div>
            </div>
            <Link
              href="/percentil/ds1t1"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs whitespace-nowrap shadow-xs transition-all shrink-0"
            >
              Simular DS1 Tramo 1 →
            </Link>
          </div>
        )}
      </div>

      {/* Modal de desglose de factores */}
      <ScoreBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        result={result}
      />
    </>
  );
}
