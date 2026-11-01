'use client';

import React, { useState, useEffect } from 'react';
import { useDS49Calculator } from '@/hooks/useDS49Calculator';
import { SubsidyComparisonMatrix } from './SubsidyComparisonMatrix';
import { ScoreBreakdownModal } from './ScoreBreakdownModal';
import {
  DS49Region,
  DS49_REGIONAL_CUTOFFS_2025,
  DS49_REGION_LABELS,
  SavingsRatePreset,
} from '@/domain/subsidies/ds49';
import { SubsidyOptionKey } from '@/domain/subsidies/recommendationEngine';
import { TipoTenencia } from '@/domain/rsh/calculator';
import { formatCLP } from '@/utils/format';

export interface SubsidyWizardProps {
  onNavigateToPurchaseCapacity?: (subsidyKey: SubsidyOptionKey) => void;
}

export function SubsidyWizard({ onNavigateToPurchaseCapacity }: SubsidyWizardProps = {}) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  const {
    state,
    updateField,
    setSavingsRate,
    reset,
    ufValue,
    isLoadingUF,
    calculationResult,
    recommendation,
    comparisonResult,
    rshResult,
    hacinamientoResult,
  } = useDS49Calculator();

  // Estados para sincronización bidireccional de Ahorro Actual (CLP y UF)
  const [savingsCLPInput, setSavingsCLPInput] = useState<string>(() =>
    state.ahorroActualUF && ufValue > 0
      ? Math.round(state.ahorroActualUF * ufValue).toLocaleString('es-CL')
      : ''
  );
  const [savingsUFInput, setSavingsUFInput] = useState<string>(() =>
    state.ahorroActualUF > 0 ? state.ahorroActualUF.toString() : ''
  );

  // Sincronizar inputs si cambia externamente el valor de UF o se reinicia el estado
  useEffect(() => {
    if (ufValue > 0) {
      const calculatedClp = Math.round(state.ahorroActualUF * ufValue);
      const clpStr = calculatedClp > 0 ? calculatedClp.toLocaleString('es-CL') : '';
      const ufStr = state.ahorroActualUF > 0 ? state.ahorroActualUF.toString() : '';

      const currentClpNum = parseInt(savingsCLPInput.replace(/\D/g, ''), 10) || 0;
      if (Math.abs(currentClpNum - calculatedClp) > 100) {
        setSavingsCLPInput(clpStr);
      }
      const currentUfNum = parseFloat(savingsUFInput) || 0;
      if (Math.abs(currentUfNum - state.ahorroActualUF) > 0.05) {
        setSavingsUFInput(ufStr);
      }
    }
  }, [state.ahorroActualUF, ufValue]);

  const handleSavingsCLPChange = (val: string) => {
    const raw = val.replace(/\D/g, '');
    if (!raw) {
      setSavingsCLPInput('');
      setSavingsUFInput('');
      updateField('ahorroActualUF', 0);
      return;
    }
    const clp = parseInt(raw, 10);
    setSavingsCLPInput(clp.toLocaleString('es-CL'));
    if (ufValue > 0) {
      const uf = Number((clp / ufValue).toFixed(2));
      setSavingsUFInput(uf.toString());
      updateField('ahorroActualUF', uf);
    }
  };

  const handleSavingsUFChange = (val: string) => {
    setSavingsUFInput(val);
    const uf = parseFloat(val);
    if (!isNaN(uf) && uf >= 0) {
      updateField('ahorroActualUF', uf);
      if (ufValue > 0) {
        const clp = Math.round(uf * ufValue);
        setSavingsCLPInput(clp > 0 ? clp.toLocaleString('es-CL') : '');
      }
    } else {
      updateField('ahorroActualUF', 0);
      setSavingsCLPInput('');
    }
  };

  // Helper para formatear inputs de dinero en CLP
  const handleMoneyInput = (
    value: string,
    callback: (num: number) => void
  ) => {
    const rawValue = value.replace(/\D/g, '');
    const num = rawValue ? parseInt(rawValue, 10) : 0;
    callback(num);
  };

  const personasHogar = Math.max(
    1,
    state.cantidadPersonasHogar || (state.adultosTotales + state.menoresDe18) || 1
  );
  const isSingleApplicant = state.adultosTotales === 1 && state.menoresDe18 === 0;
  const ingresoPerCapita = Math.round(state.ingresoFamiliarCLP / personasHogar);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-10">
      {/* ============================================================= */}
      {/* HERO BANNER: Descubrimiento & Ahorro Mínimo para Ganar */}
      {/* ============================================================= */}
      <div className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold mb-3">
            <span>✨ Asistente Inteligente</span>
            <span>•</span>
            <span>Conoce tu ahorro mínimo para ganar</span>
            <span>•</span>
            <span>UF Hoy: {isLoadingUF ? 'Cargando...' : formatCLP(ufValue)} CLP</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-2">
            Conoce el mejor subsidio para ti y tu ahorro mínimo para ganar
          </h1>
          <p className="text-white/90 text-sm sm:text-base max-w-3xl leading-relaxed">
            Evaluamos tu situación familiar, cálculo de RSH y capacidad de ahorro para clasificar cuál de los 4 subsidios del Estado (DS49, DS1 T1, T2 y T3) es tu mejor alternativa y exactamente cuántas UF necesitas para ganar.
          </p>

          {/* Tarjeta de Pre-Diagnóstico Dinámico */}
          <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                🎯
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-200">
                    {comparisonResult.topMatch ? comparisonResult.topMatch.badge : recommendation.badge}
                  </span>
                  <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                    RSH Estimado: {state.rshPercentil}%
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {comparisonResult.topMatch ? comparisonResult.topMatch.title : recommendation.title}
                </h2>
                <p className="text-xs text-white/80 mt-1 max-w-2xl leading-relaxed">
                  {comparisonResult.topMatch ? comparisonResult.topMatch.shortDescription : recommendation.explanation}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs text-white/70 block">
                Corte Regional ({DS49_REGION_LABELS[state.region] || state.region})
              </span>
              <span className="text-xl font-black text-teal-200">
                {comparisonResult.topMatch ? comparisonResult.topMatch.puntajeCorteRegion : calculationResult.puntajeCorteRegion} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* FORMULARIO EN PASOS (WIZARD CENTRADO) */}
      {/* ============================================================= */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Barra de Pasos / Stepper */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex justify-between items-center">
          {[
            { num: 1, title: 'Finanzas & RSH Base', icon: '💰' },
            { num: 2, title: 'Hogar & Cargas', icon: '👨‍👩‍👧' },
            { num: 3, title: 'Vulnerabilidad', icon: '🏠' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num as 1 | 2 | 3)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentStep === s.num
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">Paso {s.num}:</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* Contenedor del Formulario Activo */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 space-y-6">
          {/* ============================================================= */}
          {/* PASO 1: Finanzas, Personas & Cálculo Automático del RSH */}
          {/* ============================================================= */}
          {currentStep === 1 && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Paso 1: Situación Financiera & Cálculo Automático del RSH
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ingresa tu región, la cantidad de personas en tu hogar y tus ingresos. El sistema calcula en vivo tu tramo oficial del Registro Social de Hogares.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Selector de Región */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="input-region"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Región de Postulación *
                  </label>
                  <select
                    id="input-region"
                    value={state.region}
                    onChange={(e) => updateField('region', e.target.value as DS49Region)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {(Object.keys(DS49_REGIONAL_CUTOFFS_2025) as DS49Region[]).map((reg) => (
                      <option key={reg} value={reg}>
                        {DS49_REGION_LABELS[reg] || reg}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Composición Demográfica del Hogar (Para Escala Oficial RSH) */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        1. Composición Demográfica del Hogar (Escala Oficial MDSF) *
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Ponderación oficial: Postulante (1.0) + Adultos (+0.7 c/u) + Menores (+0.5 c/u) + Discapacidad (+0.4 c/u).
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full ${
                          isSingleApplicant
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-teal-100 text-teal-900 border border-teal-300'
                        }`}
                      >
                        {isSingleApplicant
                          ? '👤 Hogar Unipersonal (1 postulante)'
                          : `👥 Núcleo de ${personasHogar} integrantes (${state.adultosTotales} adultos, ${state.menoresDe18} menores)`}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label
                        htmlFor="input-adultos-totales"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Adultos en el hogar (Postulante + otros ≥ 18 años)
                      </label>
                      <input
                        id="input-adultos-totales"
                        type="number"
                        min="1"
                        max="12"
                        value={state.adultosTotales}
                        onChange={(e) =>
                          updateField('adultosTotales', Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Mínimo 1 (tú como postulante principal).
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="input-menores-18-demog"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Menores de edad (0 a 17 años)
                      </label>
                      <input
                        id="input-menores-18-demog"
                        type="number"
                        min="0"
                        max="10"
                        value={state.menoresDe18}
                        onChange={(e) =>
                          updateField('menoresDe18', Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Ponderan factor 0.5 en escala de necesidades.
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="input-miembros-discapacidad-rsh"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Miembros con discapacidad / dependencia
                      </label>
                      <input
                        id="input-miembros-discapacidad-rsh"
                        type="number"
                        min="0"
                        max="5"
                        value={state.miembrosDiscapacidad}
                        onChange={(e) =>
                          updateField('miembrosDiscapacidad', Math.max(0, parseInt(e.target.value, 10) || 0))
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Ajuste +0.4 en escala de necesidades.
                      </span>
                    </div>
                  </div>

                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={state.postulanteEsAdultoMayor}
                        onChange={(e) => updateField('postulanteEsAdultoMayor', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>
                        El postulante principal tiene <strong>60 o más años (Adulto Mayor)</strong>
                        {isSingleApplicant && ' (Ajuste +0.2 en escala de hogar unipersonal)'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Ingreso Familiar Líquido */}
                <div className="sm:col-span-2">
                  <label
                    htmlFor="input-ingreso"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    2. Ingreso Familiar Mensual Líquido Total (CLP) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                    <input
                      id="input-ingreso"
                      type="text"
                      inputMode="numeric"
                      value={state.ingresoFamiliarCLP ? state.ingresoFamiliarCLP.toLocaleString('es-CL') : ''}
                      onChange={(e) =>
                        handleMoneyInput(e.target.value, (val) => updateField('ingresoFamiliarCLP', val))
                      }
                      placeholder="Ej: 500.000"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Suma de remuneraciones líquidas mensuales de todos los integrantes que generan ingresos en el hogar.
                  </span>
                </div>

                {/* Situación Habitacional & Tenencia */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      3. Situación Habitacional & Tenencia de Vivienda *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Indica si vives como allegado/a, arrendatario/a independiente o si ya posees vivienda propia.
                    </span>
                  </div>

                  {/* Selector Segmentado de Tipo de Tenencia */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { key: 'ALLEGADO' as TipoTenencia, label: '🏠 Allegado / Compartiendo', desc: 'Vives en casa de familiares u otros' },
                      { key: 'ARRENDATARIO' as TipoTenencia, label: '🔑 Arrendatario', desc: 'Arriendas vivienda independiente' },
                      { key: 'PROPIETARIO' as TipoTenencia, label: '🚫 Propietario', desc: 'Tienes vivienda a tu nombre' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => updateField('tipoTenencia', item.key)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          state.tipoTenencia === item.key
                            ? item.key === 'PROPIETARIO'
                              ? 'bg-rose-900 text-white border-rose-900 shadow-sm scale-[1.01]'
                              : 'bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.01]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100/60'
                        }`}
                      >
                        <span className="text-xs font-extrabold">{item.label}</span>
                        <span
                          className={`text-[10px] mt-1 font-medium ${
                            state.tipoTenencia === item.key ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Advertencia si es Propietario */}
                  {state.tipoTenencia === 'PROPIETARIO' && (
                    <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3.5 text-xs text-rose-950 flex items-start gap-3 animate-fade-in">
                      <span className="text-xl shrink-0">🚫</span>
                      <div>
                        <span className="font-extrabold text-xs uppercase tracking-wider text-rose-900 block">
                          Restricción Normativa MINVU: Propietario de Vivienda
                        </span>
                        <p className="mt-0.5 text-rose-800 leading-relaxed text-[11px]">
                          La normativa legal del MINVU no permite postular a subsidios estatales de adquisición habitacional (DS49, DS1) si el postulante o algún miembro del hogar ya posee una vivienda inscrita a su nombre. Todos los subsidios quedarán bloqueados en la matriz comparativa.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Inputs de Hacinamiento (Dormitorios y Total Personas) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label
                        htmlFor="input-dormitorios-paso1"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Dormitorios de uso exclusivo o familiar en la vivienda actual
                      </label>
                      <input
                        id="input-dormitorios-paso1"
                        type="number"
                        min="1"
                        max="10"
                        value={state.dormitorios}
                        onChange={(e) =>
                          updateField('dormitorios', Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        Mínimo 1 dormitorio.
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="input-personas-vivienda-paso1"
                        className="block text-xs font-bold text-slate-700 mb-1"
                      >
                        Total de personas durmiendo en el inmueble
                      </label>
                      <input
                        id="input-personas-vivienda-paso1"
                        type="number"
                        min={personasHogar}
                        max="25"
                        disabled={state.tipoTenencia === 'ARRENDATARIO'}
                        value={state.tipoTenencia === 'ARRENDATARIO' ? personasHogar : state.totalPersonasVivienda}
                        onChange={(e) =>
                          updateField('totalPersonasVivienda', Math.max(personasHogar, parseInt(e.target.value, 10) || personasHogar))
                        }
                        className={`w-full border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                          state.tipoTenencia === 'ARRENDATARIO'
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                            : 'bg-white text-slate-800 border-slate-300'
                        }`}
                      />
                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                        {state.tipoTenencia === 'ARRENDATARIO'
                          ? `Fijado en ${personasHogar} (arriendo independiente de tu núcleo).`
                          : `Incluye dueños de casa y parientes (mínimo ${personasHogar}).`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Cards: RSH y Hacinamiento Reactivo */}
                <div className="sm:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Tarjeta 1: RSH Reactivo */}
                  <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-xs">
                          <span className="text-sm leading-none">{rshResult.percentil}%</span>
                          <span className="text-[8px] uppercase tracking-tighter text-teal-100">RSH</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                            Inferencia RSH (Escala MDSF)
                          </span>
                          <h4 className="text-sm font-black text-teal-950">
                            {rshResult.tramoLabel}
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-teal-300 text-teal-900 shrink-0">
                        Escala: {rshResult.escalaEquivalencia}
                      </span>
                    </div>

                    <div className="text-xs text-teal-950 font-medium space-y-1">
                      <p>
                        Ingreso equivalente: <strong>{formatCLP(rshResult.ingresoEquivalente)} CLP</strong>
                      </p>
                      <div className="flex flex-wrap gap-1 text-[10px] text-teal-800">
                        <span className="bg-white/80 px-1.5 py-0.5 rounded border border-teal-200">Base: 1.0</span>
                        {rshResult.detallesEscala.adultosAdicionales > 0 && (
                          <span className="bg-white/80 px-1.5 py-0.5 rounded border border-teal-200">
                            Adultos: +{rshResult.detallesEscala.adultosAdicionales}
                          </span>
                        )}
                        {rshResult.detallesEscala.menores > 0 && (
                          <span className="bg-white/80 px-1.5 py-0.5 rounded border border-teal-200">
                            Menores: +{rshResult.detallesEscala.menores}
                          </span>
                        )}
                        {rshResult.detallesEscala.ajusteDiscapacidad > 0 && (
                          <span className="bg-white/80 px-1.5 py-0.5 rounded border border-teal-200">
                            Discap.: +{rshResult.detallesEscala.ajusteDiscapacidad}
                          </span>
                        )}
                        {rshResult.detallesEscala.ajusteAdultoMayor > 0 && (
                          <span className="bg-white/80 px-1.5 py-0.5 rounded border border-teal-200">
                            Adulto Mayor: +{rshResult.detallesEscala.ajusteAdultoMayor}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-teal-700 pt-1 font-medium leading-tight">
                        {rshResult.percentil <= 40
                          ? '🎯 Calificas con máxima prioridad para DS49 (social sin crédito) y DS1 Tramo 1.'
                          : rshResult.percentil <= 60
                          ? '🎯 Calificas para DS1 Tramo 1 y Tramo 2 (Sectores Medios).'
                          : rshResult.percentil <= 80
                          ? '🎯 Calificas para DS1 Tramo 2 y Tramo 3.'
                          : rshResult.percentil <= 90
                          ? '🎯 Calificas para DS1 Tramo 3 y Proyectos DS19.'
                          : '🎯 Calificas para Proyectos de Integración Social DS19.'}
                      </p>
                    </div>
                  </div>

                  {/* Tarjeta 2: Hacinamiento Reactivo */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center font-black shrink-0 shadow-xs">
                          <span className="text-xs leading-none">{hacinamientoResult.ratio.toFixed(1)}</span>
                          <span className="text-[8px] uppercase tracking-tighter text-blue-100">Ratio</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800 block">
                            Índice de Hacinamiento
                          </span>
                          <h4 className="text-sm font-black text-blue-950">
                            {hacinamientoResult.ratio.toFixed(2)} pers/dormitorio
                          </h4>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-blue-300 text-blue-900 shrink-0">
                        {state.tipoTenencia === 'ALLEGADO' ? 'Allegado' : state.tipoTenencia === 'ARRENDATARIO' ? 'Arrendatario' : 'Propietario'}
                      </span>
                    </div>

                    <div className="text-xs text-blue-950 space-y-1.5">
                      <div className="flex items-center justify-between bg-white/80 p-1.5 rounded-lg border border-blue-200">
                        <span className="text-[11px] font-semibold text-slate-700">Puntaje DS49:</span>
                        <span className="font-extrabold text-blue-900">
                          {hacinamientoResult.ds49.puntos > 0 ? `+${hacinamientoResult.ds49.puntos} pts` : '0 pts'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-white/80 p-1.5 rounded-lg border border-blue-200">
                        <span className="text-[11px] font-semibold text-slate-700">Puntaje DS1:</span>
                        <span className="font-extrabold text-blue-900">
                          {hacinamientoResult.ds1.puntos > 0 ? `+${hacinamientoResult.ds1.puntos} pts` : '0 pts'}
                        </span>
                      </div>
                      <span className="text-[10px] text-blue-700 block leading-tight pt-0.5">
                        {hacinamientoResult.ds49.descripcion}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Selector de Capacidad de Ahorro Mensual */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Capacidad de Ahorro Mensual sobre el Sueldo Líquido *
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Selecciona el porcentaje mensual que puedes destinar a tu libreta de vivienda.
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-teal-800 bg-teal-100/80 border border-teal-300 px-2.5 py-1 rounded-lg">
                        {formatCLP(state.capacidadAhorroCLP)}/mes (≈{' '}
                        {ufValue > 0 ? (state.capacidadAhorroCLP / ufValue).toFixed(2) : 0} UF)
                      </span>
                    </div>
                  </div>

                  {/* Chips de Selección de Porcentaje */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {[
                      { key: 5, label: '5%', desc: 'Ahorro Conservador' },
                      { key: 10, label: '10%', desc: 'Ahorro Recomendado' },
                      { key: 15, label: '15%', desc: 'Ahorro Acelerado' },
                      { key: 'custom', label: 'Personalizado', desc: 'Monto Directo $' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSavingsRate(item.key as SavingsRatePreset)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          state.savingsRatePreset === item.key
                            ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm font-extrabold">{item.label}</span>
                          {item.key === 10 && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                state.savingsRatePreset === 10
                                  ? 'bg-teal-400 text-slate-950'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              Default
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] mt-1 font-medium ${
                            state.savingsRatePreset === item.key ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {item.desc}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Input de Monto Personalizado */}
                  {state.savingsRatePreset === 'custom' && (
                    <div className="pt-2 animate-fade-in">
                      <label
                        htmlFor="input-custom-ahorro"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Ingresa tu capacidad mensual de ahorro en pesos (CLP):
                      </label>
                      <div className="relative max-w-xs">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                        <input
                          id="input-custom-ahorro"
                          type="text"
                          inputMode="numeric"
                          value={state.capacidadAhorroCLP ? state.capacidadAhorroCLP.toLocaleString('es-CL') : ''}
                          onChange={(e) =>
                            handleMoneyInput(e.target.value, (val) => setSavingsRate('custom', val))
                          }
                          placeholder="Ej: 60.000"
                          className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Ahorro Actual en Libreta (CLP y UF Sincronizados) */}
                <div className="sm:col-span-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Ahorro Actual en Libreta de Vivienda *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Ingresa tu saldo disponible en pesos (CLP) o en UF. Ambos campos se convertirán y sincronizarán automáticamente según la UF del día ({formatCLP(ufValue)} CLP).
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="input-ahorro-actual-clp"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                      >
                        Monto de Ahorro ($ CLP)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">$</span>
                        <input
                          id="input-ahorro-actual-clp"
                          type="text"
                          inputMode="numeric"
                          value={savingsCLPInput}
                          onChange={(e) => handleSavingsCLPChange(e.target.value)}
                          placeholder="Ej: 394.000"
                          className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="input-ahorro-actual-uf"
                        className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                      >
                        Monto de Ahorro (UF)
                      </label>
                      <div className="relative">
                        <input
                          id="input-ahorro-actual-uf"
                          type="number"
                          min="0"
                          step="0.1"
                          value={savingsUFInput}
                          onChange={(e) => handleSavingsUFChange(e.target.value)}
                          placeholder="Ej: 10"
                          className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                        <span className="absolute right-3.5 top-2.5 text-slate-400 text-xs font-bold">UF</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                    <span>
                      Ahorros mínimos de referencia: <strong>DS49: 10 UF</strong> | <strong>DS1 T1: 30 UF</strong> | <strong>DS1 T2: 40 UF</strong> | <strong>DS1 T3: 80 UF</strong>
                    </span>
                    <span className="text-teal-700 font-bold">
                      Saldo registrado: {state.ahorroActualUF} UF (≈ {formatCLP(state.ahorroActualUF * ufValue)} CLP)
                    </span>
                  </div>
                </div>

                {/* Capacidad de Crédito Hipotecario */}
                <div className="flex items-center pt-4">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={state.tieneCapacidadCredito}
                      onChange={(e) => updateField('tieneCapacidadCredito', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                    />
                    <span className="text-xs text-slate-700 leading-snug">
                      <strong>Tengo capacidad o interés de crédito hipotecario</strong> (desbloquea opciones de
                      compra inmediata como DS1 Tramo 2 y 3).
                    </span>
                  </label>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================= */}
          {/* PASO 2: Hogar & Composición Familiar (Factor A) */}
          {/* ============================================================= */}
          {currentStep === 2 && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Paso 2: Composición del Núcleo Familiar & Cargas
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Tu tramo de RSH fue calculado automáticamente en el Paso 1. Si postulas solo (1 persona), las cargas familiares quedan canceladas por norma.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Visualización del RSH Asignado (Solo lectura, inferido con adultos equivalentes) */}
                <div className="sm:col-span-2 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl bg-teal-100 text-teal-800 w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0">
                      📊
                    </span>
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                        Calificación Socioeconómica Asignada (RSH) • Determinada en Paso 1
                      </span>
                      <h4 className="text-base font-extrabold text-teal-950">
                        Tramo asignado: {rshResult.percentil}% del RSH ({rshResult.tramoLabel})
                      </h4>
                      <span className="text-xs text-teal-800">
                        Escala de necesidades: <strong>{rshResult.escalaEquivalencia} adultos equivalentes</strong> (Ingreso equiv.: {formatCLP(rshResult.ingresoEquivalente)} CLP).
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-white border border-teal-300 text-teal-900 rounded-full text-xs font-bold shrink-0">
                    {rshResult.percentil <= 40 ? '✓ Elegible DS49 & DS1' : rshResult.percentil <= 80 ? '✓ Elegible DS1' : '✓ Elegible DS19'}
                  </span>
                </div>

                {/* Banner de Cancelación Automática si postula 1 persona */}
                {isSingleApplicant && (
                  <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1 animate-fade-in">
                    <div className="flex items-center gap-2 font-bold text-amber-950">
                      <span>👤</span> Postulación Individual (1 persona detectada):
                    </div>
                    <p className="text-amber-800 leading-relaxed">
                      Al postular de forma individual sin grupo familiar, los integrantes declarados, menores de edad, adultos mayores y jefatura monoparental quedan <strong>cancelados / deshabilitados</strong> según la normativa del MINVU.
                    </p>
                  </div>
                )}

                {/* Integrantes declarados (excluye postulante) */}
                <div>
                  <label
                    htmlFor="input-integrantes"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Integrantes adicionales en el hogar (excluye postulante)
                  </label>
                  <input
                    id="input-integrantes"
                    type="number"
                    min="0"
                    max="15"
                    disabled={isSingleApplicant}
                    value={isSingleApplicant ? 0 : state.integrantesDeclarados}
                    onChange={(e) =>
                      updateField('integrantesDeclarados', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className={`w-full border rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isSingleApplicant
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isSingleApplicant ? 'Cancelado (Postula individual)' : '50 pts por cada integrante adicional.'}
                  </span>
                </div>

                {/* Menores hasta 5 años */}
                <div>
                  <label
                    htmlFor="input-menores-5"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Menores de hasta 5 años (0 a 5 años)
                  </label>
                  <input
                    id="input-menores-5"
                    type="number"
                    min="0"
                    max="10"
                    disabled={isSingleApplicant}
                    value={isSingleApplicant ? 0 : state.menoresHasta5}
                    onChange={(e) =>
                      updateField('menoresHasta5', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className={`w-full border rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isSingleApplicant
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isSingleApplicant ? 'Cancelado' : '+50 pts adicionales c/u.'}
                  </span>
                </div>

                {/* Menores entre 6 y 18 años */}
                <div>
                  <label
                    htmlFor="input-menores-18"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Menores entre 6 y 18 años
                  </label>
                  <input
                    id="input-menores-18"
                    type="number"
                    min="0"
                    max="10"
                    disabled={isSingleApplicant}
                    value={isSingleApplicant ? 0 : state.menores6a18}
                    onChange={(e) =>
                      updateField('menores6a18', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className={`w-full border rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isSingleApplicant
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isSingleApplicant ? 'Cancelado' : '+40 pts c/u.'}
                  </span>
                </div>

                {/* Adultos mayores 60 años */}
                <div>
                  <label
                    htmlFor="input-adultos-60"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Adultos mayores (60 años o más)
                  </label>
                  <input
                    id="input-adultos-60"
                    type="number"
                    min="0"
                    max="5"
                    disabled={isSingleApplicant}
                    value={isSingleApplicant ? 0 : state.adultosMayores60}
                    onChange={(e) =>
                      updateField('adultosMayores60', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className={`w-full border rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                      isSingleApplicant
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-slate-50 text-slate-800 border-slate-300'
                    }`}
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {isSingleApplicant ? 'Cancelado' : '+100 pts c/u (excluye postulante individual).'}
                  </span>
                </div>

                {/* Monoparentalidad */}
                <div
                  className={`sm:col-span-2 p-4 rounded-2xl border space-y-3 ${
                    isSingleApplicant
                      ? 'bg-slate-100/70 border-slate-200 opacity-60'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <label
                    className={`flex items-start gap-3 select-none ${
                      isSingleApplicant ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={isSingleApplicant}
                      checked={isSingleApplicant ? false : state.esMonoparentalConHijos24}
                      onChange={(e) => updateField('esMonoparentalConHijos24', e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Jefatura de hogar monoparental con hijos a cargo de hasta 24 años (+150 pts)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {isSingleApplicant
                          ? 'Cancelado: Requiere tener hijos a cargo acreditados en el hogar.'
                          : 'Padre o madre soltero/a o viudo/a con hijos a cargo en el RSH.'}
                      </span>
                    </div>
                  </label>

                  {!isSingleApplicant && state.esMonoparentalConHijos24 && (
                    <div className="pl-8 pt-2 border-t border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={state.tieneConyugeRSH}
                          onChange={(e) => updateField('tieneConyugeRSH', e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span className="text-xs text-amber-900">
                          ¿Figura cónyuge o conviviente en tu Registro Social de Hogares?
                        </span>
                      </label>
                      {state.tieneConyugeRSH && (
                        <p className="text-[11px] text-amber-700 mt-1 font-semibold">
                          ⚠️ Incompatibilidad: Si figura pareja en el RSH, la norma no permite sumar los 150 puntos monoparentales.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ============================================================= */}
          {/* PASO 3: Vulnerabilidad Habitacional & Factores Especiales */}
          {/* ============================================================= */}
          {currentStep === 3 && (
            <section className="space-y-6 animate-fade-in">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Paso 3: Vulnerabilidad Habitacional & Factores Especiales
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Aquí no se cancela ningún campo: puedes ser voluntario de Bomberos, funcionario de Gendarmería, tener servicio militar o integrantes en el Registro de Discapacidad.
                </p>
              </div>

              {/* Vulnerabilidad Habitacional Complementaria */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Factor B: Vulnerabilidad Habitacional Complementaria
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500">
                    Hacinamiento evaluado en Paso 1 ({hacinamientoResult.ratio.toFixed(2)} pers/dorm)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={state.viviendaPrecaria}
                      onChange={(e) => updateField('viviendaPrecaria', e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Vivienda precaria (piso tierra, mediagua, desecho) <strong>(+140 pts)</strong></span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={state.aguaPrecaria}
                      onChange={(e) => updateField('aguaPrecaria', e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Agua precaria (acarreo o llave fuera de vivienda) <strong>(+30 pts)</strong></span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={state.banoPrecario}
                      onChange={(e) => updateField('banoPrecario', e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Baño precario (letrina, pozo negro o sin servicio) <strong>(+30 pts)</strong></span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300">
                    <input
                      type="checkbox"
                      checked={state.viviendaDestruida}
                      onChange={(e) => updateField('viviendaDestruida', e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Vivienda destruida o inhabitable por catástrofe <strong>(+50 pts)</strong></span>
                  </label>
                </div>
              </div>

              {/* Antigüedad de Libreta, Postulación y Arriendo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="input-meses-libreta"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Antigüedad de la Libreta (Meses)
                  </label>
                  <input
                    id="input-meses-libreta"
                    type="number"
                    min="0"
                    max="120"
                    value={state.mesesLibretaAhorro}
                    onChange={(e) =>
                      updateField('mesesLibretaAhorro', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    DS49: 1 pt/mes (máx 40 pts) | DS1: hasta 25 pts/semestre.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="input-postulaciones-indiv"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Postulaciones Previas Sin Éxito
                  </label>
                  <input
                    id="input-postulaciones-indiv"
                    type="number"
                    min="0"
                    max="6"
                    value={state.postulacionesPreviasIndividuales}
                    onChange={(e) =>
                      updateField('postulacionesPreviasIndividuales', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    DS49: 40 pts c/u (Tope: 160 pts) | DS1: 25 pts c/u.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="input-meses-arriendo"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Subsidio Arriendo DS52 (Copago al Día)
                  </label>
                  <input
                    id="input-meses-arriendo"
                    type="number"
                    min="0"
                    max="60"
                    value={state.mesesArriendoAlDia}
                    onChange={(e) =>
                      updateField('mesesArriendoAlDia', Math.max(0, parseInt(e.target.value, 10) || 0))
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    +80 pts cada 12 meses de copago al día (máx 240 pts).
                  </span>
                </div>

                <div className="sm:col-span-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                    <input
                      type="checkbox"
                      checked={state.saldoMedioCumplePermanencia}
                      onChange={(e) => updateField('saldoMedioCumplePermanencia', e.target.checked)}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>
                      <strong>Constancia de ahorro:</strong> Saldo medio del semestre previo ≥ 12.5% del saldo acreditado <strong>(+10 pts en DS49 / permanencia DS1)</strong>
                    </span>
                  </label>
                </div>
              </div>

              {/* Bomberos, Gendarmería y Servicio Militar */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Bomberos, Gendarmería y Servicio Militar
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="input-bomberos"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Bomberos Voluntarios Activos (+40 pts c/u)
                    </label>
                    <input
                      id="input-bomberos"
                      type="number"
                      min="0"
                      max="3"
                      value={state.bomberosActivos}
                      onChange={(e) =>
                        updateField('bomberosActivos', Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="input-militar"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Integrantes con Servicio Militar desde 2004 (+20 pts c/u)
                    </label>
                    <input
                      id="input-militar"
                      type="number"
                      min="0"
                      max="3"
                      disabled={state.perteneceGendarmeria}
                      value={state.servicioMilitar}
                      onChange={(e) =>
                        updateField('servicioMilitar', Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className={`w-full border rounded-xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                        state.perteneceGendarmeria
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-white text-slate-800 border-slate-300'
                      }`}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                      <input
                        type="checkbox"
                        checked={state.perteneceGendarmeria}
                        onChange={(e) => updateField('perteneceGendarmeria', e.target.checked)}
                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>
                        Postulante o cónyuge pertenece a <strong>Gendarmería de Chile (+40 pts)</strong>{' '}
                        <span className="text-[11px] text-amber-700 font-semibold">(Incompatible con puntaje de servicio militar)</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Factor E: Discapacidad y Valech/Rettig */}
              <div className="border border-emerald-200 bg-emerald-50/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Factor E: Discapacidad & Informe Valech / Rettig
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                    Activa +50% Bonificación
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="input-discapacidad"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Miembros en Reg. Nacional de Discapacidad (+300 pts c/u)
                    </label>
                    <input
                      id="input-discapacidad"
                      type="number"
                      min="0"
                      max="3"
                      value={state.miembrosDiscapacidad}
                      onChange={(e) =>
                        updateField('miembrosDiscapacidad', Math.max(0, parseInt(e.target.value, 10) || 0))
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-800 font-medium">
                      <input
                        type="checkbox"
                        checked={state.victimaValechRettig}
                        onChange={(e) => updateField('victimaValechRettig', e.target.checked)}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>
                        Postulante o cónyuge víctima política (Valech / Rettig) <strong>(+600 pts)</strong>
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Controles de Navegación del Formulario */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all"
              >
                ← Paso Anterior
              </button>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-semibold transition-all"
              >
                ↺ Restablecer Valores
              </button>
            )}

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Siguiente Paso →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                ✓ Revisar desde Paso 1
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MATRIZ COMPARATIVA MULTITRAMO: ¿CUÁL SUBSIDIO TE CONVIENE MÁS? */}
      {/* ============================================================= */}
      <div className="mt-10">
        <SubsidyComparisonMatrix
          recommendation={comparisonResult}
          ufValue={ufValue}
          onOpenAuditModal={() => setIsAuditModalOpen(true)}
          onNavigateToPurchaseCapacity={onNavigateToPurchaseCapacity}
        />
      </div>

      {/* Modal de Auditoría Técnica de Factores */}
      <ScoreBreakdownModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        result={calculationResult}
      />
    </div>
  );
}
