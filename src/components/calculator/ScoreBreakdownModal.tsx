'use client';

import React from 'react';
import { DS49CalculationResult } from '@/domain/subsidies/ds49';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DS49CalculationResult;
}

export function ScoreBreakdownModal({ isOpen, onClose, result }: ScoreBreakdownModalProps) {
  if (!isOpen) return null;

  const { desglose } = result;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] p-6 text-white flex justify-between items-center">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Auditoría Normativa MINVU
            </span>
            <h2 id="modal-title" className="text-xl font-bold text-white">
              Desglose Técnico de Puntaje DS49
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-white"
          >
            ✕
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* Resumen Total */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
            <div>
              <span className="text-xs text-slate-500 block">Subtotal (A+B+C+D)</span>
              <span className="text-lg font-bold text-slate-800">{result.subtotalABCD} pts</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Bonificación 50%</span>
              <span className="text-lg font-bold text-emerald-600">
                +{result.bonificacionEspecial50} pts
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Cond. Especiales (E)</span>
              <span className="text-lg font-bold text-indigo-600">
                +{result.puntajeEDirecto} pts
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Puntaje Total Base</span>
              <span className="text-lg font-bold text-blue-700">{result.puntajeBase} pts</span>
            </div>
          </div>

          {/* Factor A: Núcleo Familiar */}
          <section className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                  A
                </span>
                Factor Núcleo Familiar
              </h3>
              <div className="text-right">
                <span className="font-extrabold text-blue-700 text-base">
                  {desglose.factorA.subtotalAplicado} pts
                </span>
                {desglose.factorA.topeExcedido && (
                  <span className="block text-[11px] text-amber-600 font-semibold">
                    Tope máx. 600 pts aplicado (Bruto: {desglose.factorA.subtotalBruto})
                  </span>
                )}
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
              <li className="flex justify-between pt-1">
                <span>Integrantes declarados (50 pts c/u, excluye postulante):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorA.integrantesPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Menores de hasta 5 años (50 pts adicionales c/u):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorA.menoresHasta5Pts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Menores entre 6 y 18 años (40 pts c/u):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorA.menores6a18Pts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Adultos mayores (60 años o más, 100 pts c/u):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorA.adultosMayoresPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Voluntarios activos de Bomberos (40 pts c/u):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorA.bomberosPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Gendarmería de Chile (40 pts postulante/cónyuge):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorA.gendarmeriaPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Servicio Militar realizado desde 2004 (20 pts c/u):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorA.servicioMilitarPts} pts
                </span>
              </li>
              {desglose.factorA.incompatibilidadGendarmeriaAplicada && (
                <li className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-md mt-1">
                  ⚠️ <strong>Incompatibilidad aplicada:</strong> Por pertenecer a Gendarmería, la
                  normativa no permite sumar puntaje por servicio militar.
                </li>
              )}
            </ul>
          </section>

          {/* Factor B: Vulnerabilidad Habitacional */}
          <section className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">
                  B
                </span>
                Vulnerabilidad Habitacional
              </h3>
              <span className="font-extrabold text-emerald-700 text-base">
                {desglose.factorB.totalFactorB} pts
              </span>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
              <li className="flex justify-between pt-1">
                <span>
                  Hacinamiento ({desglose.factorB.totalPersonas} personas en{' '}
                  {desglose.factorB.dormitorios} dorm., índice{' '}
                  {desglose.factorB.indiceHacinamiento}):
                </span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorB.hacinamientoPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Tipo de vivienda precaria (tierra, mediagua, desecho):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorB.viviendaPrecariaPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Distribución de agua precaria (acarreo / llave fuera):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorB.aguaPrecariaPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Sistema de baño precario (letrina / pozo negro / sin baño):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorB.banoPrecarioPts} pts
                </span>
              </li>
            </ul>
          </section>

          {/* Factor C: Antigüedad de la Postulación */}
          <section className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">
                  C
                </span>
                Antigüedad de Postulación
              </h3>
              <div className="text-right">
                <span className="font-extrabold text-amber-700 text-base">
                  {desglose.factorC.subtotalAplicado} pts
                </span>
                {desglose.factorC.topeExcedido && (
                  <span className="block text-[11px] text-amber-600 font-semibold">
                    Tope máx. 160 pts aplicado (Bruto: {desglose.factorC.subtotalBruto})
                  </span>
                )}
              </div>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
              <li className="flex justify-between pt-1">
                <span>
                  Postulaciones previas individuales ({desglose.factorC.postulacionesIndividuales} x
                  40 pts):
                </span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorC.individualesPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>
                  Postulaciones previas colectivas ({desglose.factorC.postulacionesColectivas} x 80
                  pts):
                </span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorC.colectivasPts} pts
                </span>
              </li>
            </ul>
          </section>

          {/* Factor D: Antigüedad y Permanencia del Ahorro */}
          <section className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs flex items-center justify-center font-bold">
                  D
                </span>
                Antigüedad y Constancia del Ahorro
              </h3>
              <span className="font-extrabold text-purple-700 text-base">
                {desglose.factorD.totalFactorD} pts
              </span>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
              <li className="flex justify-between pt-1">
                <span>
                  Antigüedad de la libreta ({desglose.factorD.mesesLibreta} meses, máx. 40 pts):
                </span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorD.antiguedadLibretaPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Constancia de ahorro (saldo medio semestral ≥ 12.5%):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorD.permanenciaAhorroPts} pts
                </span>
              </li>
            </ul>
          </section>

          {/* Factor E: Condiciones Especiales */}
          <section className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs flex items-center justify-center font-bold">
                  E
                </span>
                Condiciones Especiales y Bonificaciones
              </h3>
              <span className="font-extrabold text-rose-700 text-base">
                +{result.puntajeEDirecto + result.bonificacionEspecial50} pts
              </span>
            </div>

            <ul className="space-y-1.5 text-xs text-slate-600 divide-y divide-slate-100">
              <li className="flex justify-between pt-1">
                <span>Registro Nacional de Discapacidad (300 pts c/u):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorE.discapacidadDirectoPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Informe Valech / Rettig (600 pts directo):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorE.valechRettigDirectoPts} pts
                </span>
              </li>
              <li className="flex justify-between pt-1">
                <span>Monoparental con hijos hasta 24 años (150 pts directo):</span>
                <span className="font-semibold text-slate-800">
                  +{desglose.factorE.monoparentalDirectoPts} pts
                </span>
              </li>
              {desglose.factorE.incompatibilidadMonoparentalAplicada && (
                <li className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-md mt-1">
                  ⚠️ <strong>Incompatibilidad monoparental:</strong> Figura cónyuge o conviviente en
                  el RSH, por lo que no se adicionan los 150 puntos.
                </li>
              )}
              {result.aplicaBonificacionEspecial && (
                <li className="flex justify-between pt-1 bg-emerald-50 -mx-4 px-4 py-2 mt-1 rounded-md text-emerald-800">
                  <span className="font-semibold">
                    🎁 Bonificación Especial del 50% de (A+B+C+D):
                  </span>
                  <span className="font-bold">+{result.bonificacionEspecial50} pts</span>
                </li>
              )}
            </ul>
          </section>
        </div>

        {/* Pie del modal */}
        <div className="bg-slate-100 px-6 py-4 flex justify-between items-center border-t border-slate-200">
          <div className="text-xs text-slate-500">
            Región: <strong className="capitalize text-slate-700">{result.region}</strong> | Corte
            2025: <strong className="text-slate-800">{result.puntajeCorteRegion} pts</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

