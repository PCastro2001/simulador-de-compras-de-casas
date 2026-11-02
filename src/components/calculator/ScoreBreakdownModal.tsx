'use client';

import React from 'react';
import type { DS49CalculationResult } from '@/domain/subsidies/ds49';
import type { DS1CalculationResult } from '@/domain/subsidies/ds1';
import type { EvaluatedSubsidyOption } from '@/domain/subsidies/recommendationEngine';

interface ScoreBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: DS49CalculationResult;
  option?: EvaluatedSubsidyOption | null;
  ufValue?: number;
}

export const ScoreBreakdownModal: React.FC<ScoreBreakdownModalProps> = ({
  isOpen,
  onClose,
  result,
  option,
  ufValue = 37800,
}) => {
  if (!isOpen) return null;

  const isDS1 = option?.subsidio === 'DS1';
  const tramoLabel = option?.tramo ? option.tramo.toUpperCase() : '';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-all duration-300 animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="relative bg-white rounded-2xl max-w-3xl w-full p-6 md:p-8 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              Auditoría Técnica Oficial MINVU
            </div>
            <h3 id="modal-title" className="text-2xl font-bold text-gray-900">
              {isDS1 ? `Desglose de Factores: DS1 (${tramoLabel})` : 'Desglose de Factores: Subsidio DS49'}
            </h3>
            <p className="text-sm text-gray-500">
              {isDS1
                ? 'Cálculo de puntajes según D.S. N° 1 (V. y U.), de 2011 y llamado nacional vigente.'
                : 'Cálculo algorítmico normado bajo el D.S. N° 49 (V. y U.), de 2011.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-xl transition-all"
            aria-label="Cerrar modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-6 space-y-6 flex-1 pr-1 focus:outline-none">
          {isDS1 && option ? (
            <DS1AuditSection option={option} ufValue={ufValue} />
          ) : (
            <DS49AuditSection result={result} ufValue={ufValue} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50 -mx-6 -mb-6 md:-mx-8 md:-mb-8 px-6 md:px-8 py-4 rounded-b-2xl">
          <div className="text-xs text-gray-500 text-center sm:text-left">
            Simulación referencial con fines de planificación. Los cortes oficiales son determinados en cada llamado por el MINVU.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// DS1 AUDIT SECTION
// ==========================================
interface DS1AuditSectionProps {
  option: EvaluatedSubsidyOption;
  ufValue: number;
}

const DS1AuditSection: React.FC<DS1AuditSectionProps> = ({ option, ufValue }) => {
  const isTramo3 = option.tramo === 't3';
  const tramoNombre = isTramo3 ? 'DS1 Tramo 3' : option.tramo === 't2' ? 'DS1 Tramo 2' : 'DS1 Tramo 1';

  // Extraer detalles de DS1
  const ds1Detalles = (option.detalles as DS1CalculationResult) || null;
  const puntajeTotal = option.puntajeActual;
  const puntajeCorte = option.puntajeCorteRegion;
  const puntajeBase = ds1Detalles ? ds1Detalles.puntajeBase : puntajeTotal;
  const deficitPuntos = Math.max(0, puntajeCorte - puntajeTotal);
  const ahorroMinimoUF = option.ahorroMinimoLegalUF;
  const ahorroRecomendadoUF = option.ahorroSugeridoMetaUF;
  const excesoRecomendadoUF = Math.max(0, ahorroRecomendadoUF - ahorroMinimoUF);

  return (
    <div className="space-y-6">
      {/* Resumen de Puntajes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Puntaje Actual</span>
          <span className="text-2xl font-bold text-slate-900">{puntajeTotal.toFixed(2)} pts</span>
          <span className="text-xs text-slate-500 block mt-1">
            Base: {puntajeBase.toFixed(2)} + Exceso actual
          </span>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Corte Referencial</span>
          <span className="text-2xl font-bold text-blue-900">{puntajeCorte.toFixed(2)} pts</span>
          <span className="text-xs text-blue-600 block mt-1">Región seleccionada (corte previo)</span>
        </div>
        <div className={`rounded-xl p-4 text-center border ${deficitPuntos > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <span className={`text-xs font-semibold uppercase tracking-wider block ${deficitPuntos > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
            {deficitPuntos > 0 ? 'Déficit de Puntaje' : 'Margen Favorable'}
          </span>
          <span className={`text-2xl font-bold ${deficitPuntos > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>
            {deficitPuntos > 0 ? `-${deficitPuntos.toFixed(2)} pts` : `+${Math.abs(deficitPuntos).toFixed(2)} pts`}
          </span>
          <span className={`text-xs block mt-1 ${deficitPuntos > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
            {deficitPuntos > 0 ? 'A compensar con exceso de ahorro' : 'Superas el corte histórico'}
          </span>
        </div>
      </div>

      {/* Reglas de Exceso de Ahorro según D.S.1 */}
      <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-indigo-950 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Escala Oficial de Exceso de Ahorro: {isTramo3 ? 'DS1 Tramo 3' : 'DS1 Tramos 1 y 2'}
          </h4>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
            Ahorro Mínimo: {ahorroMinimoUF} UF
          </span>
        </div>
        <p className="text-xs text-indigo-900">
          En el {tramoNombre}, el ahorro obligatorio ({ahorroMinimoUF} UF) no otorga puntos base. Los puntos se obtienen exclusivamente por cada UF que <strong>exceda</strong> el ahorro mínimo exigido, según la escala marginal oficial:
        </p>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse bg-white rounded-lg overflow-hidden border border-indigo-200">
            <thead>
              <tr className="bg-indigo-100/70 text-indigo-900 font-semibold border-b border-indigo-200">
                <th className="p-2.5">Tramo de Exceso sobre el Mínimo</th>
                <th className="p-2.5 text-right">Puntos por cada UF de exceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-100 text-gray-700">
              <tr>
                <td className="p-2.5">Más de 0 UF hasta 60 UF de exceso</td>
                <td className="p-2.5 text-right font-bold text-indigo-900">{isTramo3 ? '2 puntos / UF' : '4 puntos / UF'}</td>
              </tr>
              <tr>
                <td className="p-2.5">Más de 60 UF hasta 110 UF de exceso</td>
                <td className="p-2.5 text-right font-bold text-indigo-900">{isTramo3 ? '1 punto / UF' : '2 puntos / UF'}</td>
              </tr>
              <tr>
                <td className="p-2.5">Más de 110 UF hasta 160 UF de exceso</td>
                <td className="p-2.5 text-right font-bold text-indigo-900">{isTramo3 ? '0.5 puntos / UF' : '1 punto / UF'}</td>
              </tr>
              <tr>
                <td className="p-2.5">Más de 160 UF de exceso (sin tope)</td>
                <td className="p-2.5 text-right font-bold text-indigo-900">0.05 puntos / UF</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicación de la Ecuación Inversa aplicada */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <span className="p-1 rounded bg-amber-100 text-amber-700 font-mono text-xs">f⁻¹(x)</span>
          Ecuación Inversa de Ahorro Recomendado
        </h4>
        <div className="space-y-2 text-xs text-gray-600 leading-relaxed">
          <p>
            Para alcanzar el corte histórico de <strong>{puntajeCorte.toFixed(2)} pts</strong>, el sistema calcula la cantidad exacta de UF que debes ahorrar para cubrir la brecha de puntaje:
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs space-y-1.5 text-gray-800">
            <div>• Ahorro mínimo exigido: <span className="font-bold">{ahorroMinimoUF} UF</span></div>
            <div>• Puntos faltantes (brecha): <span className="font-bold">{deficitPuntos.toFixed(2)} pts</span></div>
            <div>• Exceso calculado por escala marginal: <span className="font-bold text-indigo-600">{excesoRecomendadoUF.toFixed(2)} UF</span></div>
            <div className="pt-1.5 border-t border-gray-200 font-semibold text-slate-900">
              = Ahorro Recomendado: {ahorroMinimoUF} UF + {excesoRecomendadoUF.toFixed(2)} UF = <span className="text-emerald-600 font-bold text-sm">{ahorroRecomendadoUF.toFixed(2)} UF</span> (~${Math.round(ahorroRecomendadoUF * ufValue).toLocaleString('es-CL')} CLP)
            </div>
          </div>
          {deficitPuntos > 0 && excesoRecomendadoUF <= 60 && (
            <p className="text-gray-500 italic">
              * Al ser una brecha menor a {isTramo3 ? '120 puntos' : '240 puntos'}, cada UF extra otorga {isTramo3 ? '2' : '4'} puntos directos ({deficitPuntos.toFixed(2)} / {isTramo3 ? '2' : '4'} = {excesoRecomendadoUF.toFixed(2)} UF de exceso).
            </p>
          )}
        </div>
      </div>

      {/* Factores complementarios del DS1 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
        <span className="font-bold text-slate-800 block">Factores adicionales considerados en DS1:</span>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Núcleo Familiar:</strong> 40 pts por cada integrante declarado (distinto al postulante), más bonificaciones para menores, adultos mayores (60+ años) y personas con discapacidad acreditada (COMPIN/RSH).</li>
          <li><strong>Permanencia y Constancia de Ahorro:</strong> Hasta 100 puntos por semestres continuos manteniendo el saldo medio exigido (25 pts por semestre, máx 4 semestres).</li>
          <li><strong>Antigüedad de Postulación:</strong> Puntos adicionales por llamados anteriores no seleccionados.</li>
        </ul>
      </div>
    </div>
  );
};

// ==========================================
// DS49 AUDIT SECTION
// ==========================================
interface DS49AuditSectionProps {
  result: DS49CalculationResult;
  ufValue: number;
}

const DS49AuditSection: React.FC<DS49AuditSectionProps> = ({ result, ufValue }) => {
  const {
    desglose,
    subtotalABCD,
    bonificacionEspecial50,
    aplicaBonificacionEspecial,
    puntajeEDirecto,
    puntajeBase,
    puntajeTotalActual,
    puntajeCorteRegion,
    deficitPuntos,
    ahorroTotalSugeridoUF,
  } = result;

  return (
    <div className="space-y-6">
      {/* Banner de Puntaje Total vs Corte */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Subtotal Base (A+B+C+D)</span>
          <span className="text-2xl font-bold text-slate-900">{subtotalABCD} pts</span>
          <span className="text-xs text-slate-500 block mt-1">Factores normativos base</span>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">Bonificación 50%</span>
          <span className="text-2xl font-bold text-purple-900">+{bonificacionEspecial50} pts</span>
          <span className="text-xs text-purple-600 block mt-1">
            {aplicaBonificacionEspecial ? 'Aplicada (Discapacidad / Valech)' : 'No aplica'}
          </span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Puntaje Total Actual</span>
          <span className="text-2xl font-bold text-emerald-900">{puntajeTotalActual} pts</span>
          <span className="text-xs text-emerald-600 block mt-1">Corte regional: {puntajeCorteRegion} pts</span>
        </div>
      </div>

      {/* Lista detallada de Factores D.S.49 */}
      <div className="space-y-4">
        {/* Factor A */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Factor A: Núcleo Familiar (Máximo 600 pts)
            </h4>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {desglose.factorA.subtotalAplicado} pts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div>• Integrantes adicionales (50 pts c/u): <span className="font-semibold text-gray-800">{desglose.factorA.integrantesPts} pts</span></div>
            <div>• Menores 6 a 18 años (40 pts c/u): <span className="font-semibold text-gray-800">{desglose.factorA.menores6a18Pts} pts</span></div>
            <div>• Menores de hasta 5 años (50 pts c/u): <span className="font-semibold text-gray-800">{desglose.factorA.menoresHasta5Pts} pts</span></div>
            <div>• Adultos mayores 60+ (100 pts c/u): <span className="font-semibold text-gray-800">{desglose.factorA.adultosMayoresPts} pts</span></div>
            <div>• Bomberos voluntarios (40 pts c/u): <span className="font-semibold text-gray-800">{desglose.factorA.bomberosPts} pts</span></div>
            <div>• Gendarmería / Servicio militar: <span className="font-semibold text-gray-800">{desglose.factorA.gendarmeriaPts || desglose.factorA.servicioMilitarPts} pts</span></div>
          </div>
          {desglose.factorA.topeExcedido && (
            <p className="text-[11px] text-amber-600 mt-2 font-medium">
              * Se aplicó el tope normativo máximo de 600 puntos para este factor (Subtotal bruto: {desglose.factorA.subtotalBruto} pts).
            </p>
          )}
        </div>

        {/* Factor B */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Factor B: Vulnerabilidad Habitacional
            </h4>
            <span className="text-sm font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
              {desglose.factorB.totalFactorB} pts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div>• Hacinamiento ({desglose.factorB.indiceHacinamiento.toFixed(1)} pers/dorm): <span className="font-semibold text-gray-800">{desglose.factorB.hacinamientoPts} pts</span></div>
            <div>• Tipo de vivienda precaria: <span className="font-semibold text-gray-800">{desglose.factorB.viviendaPrecariaPts} pts</span></div>
            <div>• Distribución de agua: <span className="font-semibold text-gray-800">{desglose.factorB.aguaPrecariaPts} pts</span></div>
            <div>• Sistema de baño: <span className="font-semibold text-gray-800">{desglose.factorB.banoPrecarioPts} pts</span></div>
          </div>
        </div>

        {/* Factor C */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Factor C: Antigüedad de Postulación (Máx 160 pts)
            </h4>
            <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              {desglose.factorC.subtotalAplicado} pts
            </span>
          </div>
          <p className="text-xs text-gray-600">
            {desglose.factorC.postulacionesIndividuales} postulaciones previas no seleccionadas ({desglose.factorC.individualesPts} pts).
          </p>
        </div>

        {/* Factor D */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Factor D: Ahorro (Base + Exceso + Constancia)
            </h4>
            <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {desglose.factorD.totalFactorD} pts
            </span>
          </div>
          <div className="space-y-1 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div>• Puntaje base por ahorro mínimo (10 UF): <span className="font-semibold text-gray-800">0 pts</span> (Ahorro exigido no otorga puntos basales)</div>
            <div>• Antigüedad de libreta ({desglose.factorD.mesesLibreta} meses): <span className="font-semibold text-gray-800">{desglose.factorD.antiguedadLibretaPts} pts</span></div>
            <div>• Constancia y permanencia de ahorro: <span className="font-semibold text-emerald-700">{desglose.factorD.permanenciaAhorroPts} pts</span></div>
          </div>
        </div>

        {/* Factor E */}
        <div className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              Factor E: Condiciones Especiales
            </h4>
            <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
              {puntajeEDirecto} pts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
            <div>• Discapacidad acreditada (70 pts): <span className="font-semibold text-gray-800">{desglose.factorE.discapacidadDirectoPts} pts</span></div>
            <div>• Bono Valech / Rettig (600 pts): <span className="font-semibold text-gray-800">{desglose.factorE.valechRettigDirectoPts} pts</span></div>
            <div>• Jefatura monoparental (100 pts): <span className="font-semibold text-gray-800">{desglose.factorE.monoparentalDirectoPts} pts</span></div>
          </div>
        </div>
      </div>

      {/* Explicación Ahorro Recomendado DS49 */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
        <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
          <span>💡</span> Ahorro Recomendado para DS49
        </h4>
        <p className="text-xs text-emerald-800">
          En el D.S.49, cada 1 UF de ahorro por sobre el mínimo (10 UF) otorga <strong>2 puntos</strong>. Además, al aplicar la bonificación del 50% al subtotal, cada 1 UF adicional en el subtotal aporta de forma efectiva <strong>3 puntos finales</strong>.
        </p>
        <div className="bg-white/80 p-3 rounded-lg text-xs font-mono text-emerald-900">
          <div>• Puntaje Base (incluye bonificación y directos): <span className="font-bold">{puntajeBase} pts</span></div>
          <div>• Déficit respecto al corte ({puntajeCorteRegion} pts): <span className="font-bold">{deficitPuntos} pts</span></div>
          <div>• Ahorro mínimo obligatorio: <span className="font-bold">10 UF</span></div>
          <div className="font-bold text-emerald-700 pt-1">
            = Meta Sugerida: {ahorroTotalSugeridoUF} UF (~${Math.round(ahorroTotalSugeridoUF * ufValue).toLocaleString('es-CL')} CLP)
          </div>
        </div>
      </div>
    </div>
  );
};
