'use client';

import React from 'react';
import {
  RecommendationEngineResult,
  EvaluatedSubsidyOption,
  SubsidyOptionKey,
} from '@/domain/subsidies/recommendationEngine';
import { DS49_REGION_LABELS } from '@/domain/subsidies/ds49';
import { formatCLP } from '@/utils/format';

interface SubsidyComparisonMatrixProps {
  recommendation: RecommendationEngineResult;
  ufValue: number;
  onSelectOption?: (key: SubsidyOptionKey) => void;
  selectedKey?: SubsidyOptionKey;
  onOpenAuditModal?: (option: EvaluatedSubsidyOption) => void;
  onNavigateToPurchaseCapacity?: (key: SubsidyOptionKey) => void;
}

export function SubsidyComparisonMatrix({
  recommendation,
  ufValue,
  onSelectOption,
  selectedKey,
  onOpenAuditModal,
  onNavigateToPurchaseCapacity,
}: SubsidyComparisonMatrixProps) {
  const { topMatch, options, profileSummary } = recommendation;

  return (
    <section className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Cabecera de la Matriz */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider mb-2">
            <span>⚖️ Comparador Multitramo</span>
            <span>•</span>
            <span>{DS49_REGION_LABELS[profileSummary.region] || profileSummary.region}</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Matriz Comparativa: ¿Cuál subsidio te conviene más?
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
            Evaluamos en tiempo real los 4 subsidios del Estado (DS49, DS1 Tramo 1, Tramo 2 y Tramo 3) según tu RSH calculado y capacidad de ahorro. Identificamos tu mejor opción y bloqueamos de inmediato las que no cumplen con los requisitos normativos.
          </p>
        </div>

        {/* Resumen de Datos del Postulante */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto bg-white p-3 rounded-2xl border border-slate-200 text-xs text-slate-700 shadow-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">RSH Calculado</span>
            <span className="font-extrabold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
              Hasta {profileSummary.rshPercentil}%
            </span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Ahorro Actual</span>
            <span className="font-extrabold text-slate-900">{profileSummary.ahorroActualUF} UF</span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Crédito</span>
            <span
              className={`font-extrabold ${profileSummary.tieneCredito ? 'text-blue-700' : 'text-slate-500'
                }`}
            >
              {profileSummary.tieneCredito ? 'Viable' : 'No'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid de Tarjetas Comparativas (4 opciones) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {options.map((option: EvaluatedSubsidyOption) => {
          const isTopMatch = !option.estaBloqueado && option.key === topMatch.key;
          const isSelected = selectedKey === option.key;
          const isBlocked = option.estaBloqueado;

          return (
            <article
              key={option.key}
              onClick={() => {
                if (!isBlocked && onSelectOption) {
                  onSelectOption(option.key);
                }
              }}
              className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between relative group ${isBlocked
                  ? 'border-dashed border-slate-300 bg-slate-100/90 text-slate-500 opacity-75'
                  : isTopMatch
                    ? 'border-2 border-emerald-500 ring-4 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/70 via-white to-white shadow-xl scale-[1.02] cursor-pointer'
                    : isSelected
                      ? 'border-blue-400 ring-2 ring-blue-400/30 bg-white shadow-md cursor-pointer'
                      : 'border-slate-200 hover:border-slate-400 bg-white shadow-xs hover:shadow-md cursor-pointer'
                }`}
            >
              {/* Contenido Principal de la Tarjeta */}
              <div className="space-y-3">
                {/* Badge Superior */}
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span
                    className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${isBlocked
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isTopMatch
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                  >
                    {isBlocked ? '🔒 Bloqueado' : isTopMatch ? '★ Tu Mejor Opción' : '✓ Compatible'}
                  </span>

                  <span className="text-[11px] font-bold text-slate-500">
                    Corte: {option.puntajeCorteRegion} pts
                  </span>
                </div>

                <div>
                  <h4
                    className={`text-base font-black ${isBlocked
                        ? 'text-slate-600 line-through'
                        : isTopMatch
                          ? 'text-emerald-950'
                          : 'text-slate-900 group-hover:text-teal-700'
                      }`}
                  >
                    {option.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {option.shortDescription}
                  </p>
                </div>

                {/* Banner de Bloqueo Inmediato si no es compatible */}
                {isBlocked && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-xs text-rose-900 space-y-1 animate-fade-in">
                    <span className="font-extrabold flex items-center gap-1 text-[11px] uppercase tracking-wider text-rose-700">
                      <span>🚫</span> Subsidio Incompatible
                    </span>
                    <p className="text-[11px] leading-tight text-rose-800">
                      {option.motivoBloqueo || option.motivo}
                    </p>
                  </div>
                )}

                {/* Filtros de Cumplimiento (RSH y Crédito) */}
                <div
                  className={`rounded-xl p-2.5 border text-xs space-y-1 ${isBlocked
                      ? 'bg-slate-200/50 border-slate-300/80 text-slate-500'
                      : 'bg-slate-50 border-slate-200/70'
                    }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium">Exigencia RSH:</span>
                    <span
                      className={`font-bold text-[11px] ${option.esElegibleRSH ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                    >
                      {option.esElegibleRSH ? '✓' : '✗'} Hasta {option.rshMaximo}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-medium">Crédito Hipotecario:</span>
                    <span
                      className={`font-bold text-[11px] ${!option.requiereCredito
                          ? 'text-teal-700'
                          : option.esElegibleCredito
                            ? 'text-blue-700'
                            : 'text-rose-600'
                        }`}
                    >
                      {!option.requiereCredito
                        ? 'Sin Crédito'
                        : option.esElegibleCredito
                          ? '✓ Califica'
                          : '✗ Requerido'}
                    </span>
                  </div>
                </div>

                {/* Métricas de Ahorro: Legal vs Sugerido */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Ahorro Mínimo Legal:</span>
                    <span className="font-bold text-slate-700">{option.ahorroMinimoLegalUF} UF</span>
                  </div>

                  <div className="flex justify-between items-baseline text-xs">
                    <span className="text-slate-700 font-semibold">Ahorro Recomendado:</span>
                    <div className="text-right">
                      <span
                        className={`font-extrabold text-sm block ${isBlocked ? 'text-slate-500' : isTopMatch ? 'text-emerald-800' : 'text-slate-900'
                          }`}
                      >
                        {option.ahorroSugeridoMetaUF} UF
                      </span>
                      <span className="text-[10px] text-slate-500">
                        ≈ {formatCLP(option.ahorroSugeridoMetaCLP)}
                      </span>
                    </div>
                  </div>

                  {/* Brecha / Déficit de Ahorro */}
                  <div
                    className={`flex justify-between text-xs p-2 rounded-lg ${isBlocked ? 'bg-slate-200/50' : 'bg-slate-50'
                      }`}
                  >
                    <span className="text-slate-500">Brecha de Ahorro:</span>
                    <span
                      className={`font-bold ${option.brechaAhorroUF === 0
                          ? 'text-emerald-700'
                          : isBlocked
                            ? 'text-slate-600'
                            : 'text-amber-800'
                        }`}
                    >
                      {option.brechaAhorroUF === 0
                        ? '✓ Meta Cubierta'
                        : `+${option.brechaAhorroUF.toFixed(1)} UF`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tiempo Estimado y Botón de Acción */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-[11px] text-slate-500">Tiempo estimado:</span>
                  <span
                    className={`text-sm font-black ${isBlocked
                        ? 'text-slate-400'
                        : option.mesesEstimados === 0
                          ? 'text-emerald-700'
                          : option.mesesEstimados > 24
                            ? 'text-amber-700'
                            : 'text-slate-900'
                      }`}
                  >
                    {isBlocked
                      ? 'No disponible'
                      : option.mesesEstimados === 0
                        ? 'Meta Lista'
                        : option.mesesEstimados > 120
                          ? '+10 años'
                          : `${option.mesesEstimados} meses`}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  {/* Botón 1: Auditoría Técnica de Puntos */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectOption) onSelectOption(option.key);
                      if (onOpenAuditModal) onOpenAuditModal(option);
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all text-center flex items-center justify-center gap-1.5 shadow-2xs hover:border-slate-400"
                  >
                    <span>🔍</span>
                    <span>Auditoría de Puntos</span>
                  </button>

                  {/* Botón 2: Vinculación directa a Perfil B (Calcular Valor Máximo) */}
                  {isBlocked ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-200 text-slate-400 cursor-not-allowed text-center flex items-center justify-center gap-1.5"
                    >
                      <span>🔒</span>
                      <span>Incompatible con tu Perfil</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onNavigateToPurchaseCapacity) {
                          onNavigateToPurchaseCapacity(option.key);
                        }
                      }}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-xs ${
                        isTopMatch
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-slate-900 hover:bg-slate-800 text-white hover:scale-[1.01]'
                      }`}
                    >
                      <span>🏠</span>
                      <span>Calcular Valor Máximo →</span>
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}