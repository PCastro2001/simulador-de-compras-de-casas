'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  evaluateDS49,
  DS49PostulacionInput,
  DS49CalculationResult,
  DS49Region,
  DS49_REGIONAL_CUTOFFS_2025,
  calculateSavingsTimeline,
  SavingsTimelineResult,
  SavingsRatePreset,
} from '@/domain/subsidies/ds49';
import {
  recommendBestSubsidy,
  UserSubsidyProfile,
  RecommendationEngineResult,
} from '@/domain/subsidies/recommendationEngine';
import {
  calculateRSH,
  RSHCalculationResult,
  calculateEquivalenceScale,
  TipoTenencia,
  HacinamientoResult,
  calculateHacinamiento,
} from '@/domain/rsh/calculator';
import { fetchUFValue, DEFAULT_UF_VALUE } from '@/utils/api';

export interface SubsidyRecommendation {
  primarySubsidy: 'ds49' | 'ds1' | 'ds19';
  title: string;
  badge: string;
  explanation: string;
  isDS49Priority: boolean;
  suggestsDS1Alternative: boolean;
  rshLabel: string;
}

/**
 * Helper de compatibilidad: Calcula el percentil referencial del RSH según el motor de adultos equivalentes.
 */
export function calculateRSHFromIncome(
  ingresoFamiliarCLP: number,
  totalPersonasHogar: number,
  menoresDe18: number = 0,
  discapacidad: number = 0
): number {
  return calculateRSH({
    ingresoLiquidoMensualClp: ingresoFamiliarCLP,
    adultosTotales: Math.max(1, totalPersonasHogar - menoresDe18),
    menoresDe18,
    miembrosConDiscapacidad: discapacidad,
    postulanteEsAdultoMayor: false,
  }).percentil;
}

export interface UseDS49CalculatorState {
  // Datos del postulante y hogar (v1.5.0)
  region: DS49Region;
  adultosTotales: number; // Postulante (1) + otros adultos (>= 1)
  menoresDe18: number;
  postulanteEsAdultoMayor: boolean;
  cantidadPersonasHogar: number; // Suma de adultosTotales + menoresDe18
  rshPercentil: number; // 40, 60, 80, 90, 100 (calculado automáticamente)
  ingresoFamiliarCLP: number;
  savingsRatePreset: SavingsRatePreset; // 5, 10, 15, 'custom'
  capacidadAhorroCLP: number;
  ahorroActualUF: number;
  tieneCapacidadCredito: boolean;

  // Factor A: Núcleo Familiar
  integrantesDeclarados: number;
  menoresHasta5: number;
  menores6a18: number;
  adultosMayores60: number;
  bomberosActivos: number;
  servicioMilitar: number;
  perteneceGendarmeria: boolean;

  // Factor B: Vulnerabilidad Habitacional & Tenencia (v1.5.0)
  dormitorios: number;
  totalPersonasVivienda: number;
  tipoTenencia: TipoTenencia;
  indiceHacinamientoDirecto?: number;
  viviendaPrecaria: boolean;
  aguaPrecaria: boolean;
  banoPrecario: boolean;
  viviendaDestruida: boolean;

  // Factor C: Antigüedad de Postulación
  postulacionesPreviasIndividuales: number;
  postulacionesPreviasColectivas: number;

  // Factor D: Libreta de Ahorro y Arriendo
  mesesLibretaAhorro: number;
  saldoMedioCumplePermanencia: boolean;
  mesesArriendoAlDia: number;

  // Factor E: Condiciones Especiales
  miembrosDiscapacidad: number;
  victimaValechRettig: boolean;
  esMonoparentalConHijos24: boolean;
  tieneConyugeRSH: boolean;
}

const DEFAULT_STATE: UseDS49CalculatorState = {
  region: 'metropolitana',
  adultosTotales: 2,
  menoresDe18: 1,
  postulanteEsAdultoMayor: false,
  cantidadPersonasHogar: 3,
  rshPercentil: 40,
  ingresoFamiliarCLP: 500000,
  savingsRatePreset: 10,
  capacidadAhorroCLP: 50000, // 10% de 500.000
  ahorroActualUF: 10,
  tieneCapacidadCredito: false,

  integrantesDeclarados: 2,
  menoresHasta5: 1,
  menores6a18: 0,
  adultosMayores60: 0,
  bomberosActivos: 0,
  servicioMilitar: 0,
  perteneceGendarmeria: false,

  dormitorios: 2,
  totalPersonasVivienda: 5,
  tipoTenencia: 'ALLEGADO',
  indiceHacinamientoDirecto: 2.5,
  viviendaPrecaria: false,
  aguaPrecaria: false,
  banoPrecario: false,
  viviendaDestruida: false,

  postulacionesPreviasIndividuales: 1,
  postulacionesPreviasColectivas: 0,

  mesesLibretaAhorro: 18,
  saldoMedioCumplePermanencia: true,
  mesesArriendoAlDia: 0,

  miembrosDiscapacidad: 0,
  victimaValechRettig: false,
  esMonoparentalConHijos24: false,
  tieneConyugeRSH: false,
};

export function useDS49Calculator(initialState?: Partial<UseDS49CalculatorState>) {
  const [state, setState] = useState<UseDS49CalculatorState>({
    ...DEFAULT_STATE,
    ...initialState,
  });

  const [ufValue, setUfValue] = useState<number>(DEFAULT_UF_VALUE);
  const [isLoadingUF, setIsLoadingUF] = useState<boolean>(true);

  // Carga reactiva del valor oficial de la UF
  useEffect(() => {
    let isMounted = true;
    async function loadUF() {
      try {
        setIsLoadingUF(true);
        const uf = await fetchUFValue();
        if (isMounted && uf > 0) {
          setUfValue(uf);
        }
      } catch (err) {
        console.warn('No se pudo cargar la UF dinámica, usando fallback:', err);
      } finally {
        if (isMounted) setIsLoadingUF(false);
      }
    }
    loadUF();
    return () => {
      isMounted = false;
    };
  }, []);

  // Actualizador genérico de campos con lógica de sincronización RSH y miembros
  const updateField = useCallback(
    <K extends keyof UseDS49CalculatorState>(key: K, value: UseDS49CalculatorState[K]) => {
      setState((prev) => {
        const next = { ...prev, [key]: value };

        // Sincronización demográfica
        if (key === 'adultosTotales') {
          next.adultosTotales = Math.max(1, Number(value));
          next.cantidadPersonasHogar = next.adultosTotales + next.menoresDe18 + next.miembrosDiscapacidad;
        } else if (key === 'menoresDe18') {
          next.menoresDe18 = Math.max(0, Number(value));
          next.cantidadPersonasHogar = next.adultosTotales + next.menoresDe18 + next.miembrosDiscapacidad;
        } else if (key === 'miembrosDiscapacidad') {
          next.miembrosDiscapacidad = Math.max(0, Number(value));
          next.cantidadPersonasHogar = next.adultosTotales + next.menoresDe18 + next.miembrosDiscapacidad;
        } else if (key === 'cantidadPersonasHogar') {
          const total = Math.max(1, Number(value));
          next.cantidadPersonasHogar = total;
          if (total === 1) {
            next.adultosTotales = 1;
            next.menoresDe18 = 0;
            next.miembrosDiscapacidad = 0;
          } else {
            next.adultosTotales = Math.max(1, total - next.menoresDe18 - next.miembrosDiscapacidad);
          }
        }

        // Si es arrendatario, el total de personas en la vivienda es igual al núcleo familiar
        if (next.tipoTenencia === 'ARRENDATARIO') {
          next.totalPersonasVivienda = next.cantidadPersonasHogar;
        } else if (key === 'totalPersonasVivienda') {
          next.totalPersonasVivienda = Math.max(next.cantidadPersonasHogar, Number(value));
        }

        // Si postula 1 persona (hogar unipersonal):
        // Se cancelan / no aplican los integrantes declarados, menores, adultos mayores y monoparentalidad
        if (next.cantidadPersonasHogar === 1) {
          next.integrantesDeclarados = 0;
          next.menoresHasta5 = 0;
          next.menores6a18 = 0;
          next.adultosMayores60 = 0;
          next.esMonoparentalConHijos24 = false;
          next.tieneConyugeRSH = false;
        } else if (next.cantidadPersonasHogar > 1) {
          // Si tiene más de 1 integrante, los integrantes declarados adicionales son (total - postulante)
          next.integrantesDeclarados = next.cantidadPersonasHogar - 1;
        }

        // Si cambia cualquier variable relevante para el RSH, recalculamos con la escala oficial de adultos equivalentes
        if (
          key === 'ingresoFamiliarCLP' ||
          key === 'adultosTotales' ||
          key === 'menoresDe18' ||
          key === 'cantidadPersonasHogar' ||
          key === 'postulanteEsAdultoMayor' ||
          key === 'miembrosDiscapacidad' ||
          key === 'menoresHasta5' ||
          key === 'menores6a18' ||
          key === 'adultosMayores60'
        ) {
          const isSingle = next.cantidadPersonasHogar === 1;
          const rshCalc = calculateRSH({
            ingresoLiquidoMensualClp: next.ingresoFamiliarCLP,
            adultosTotales: next.adultosTotales,
            menoresDe18: next.menoresDe18,
            miembrosConDiscapacidad: next.miembrosDiscapacidad,
            totalIntegrantes: next.cantidadPersonasHogar,
            postulanteEsAdultoMayor: isSingle ? next.postulanteEsAdultoMayor : false,
          });
          next.rshPercentil = rshCalc.percentil;
        }

        // Si se actualiza el ingreso y el usuario tiene un porcentaje prefijado (5, 10, 15),
        // recalculamos automáticamente la capacidad de ahorro en CLP
        if (key === 'ingresoFamiliarCLP' && typeof value === 'number') {
          if (prev.savingsRatePreset !== 'custom') {
            next.capacidadAhorroCLP = Math.round(value * (prev.savingsRatePreset / 100));
          }
        }

        return next;
      });
    },
    []
  );

  // Cambiar la tasa de ahorro con presets (5%, 10%, 15% o 'custom')
  const setSavingsRate = useCallback(
    (preset: SavingsRatePreset, customClp?: number) => {
      setState((prev) => {
        if (preset === 'custom') {
          const amount =
            typeof customClp === 'number' && customClp >= 0
              ? customClp
              : prev.capacidadAhorroCLP;
          return {
            ...prev,
            savingsRatePreset: 'custom',
            capacidadAhorroCLP: amount,
          };
        }

        const calculatedClp = Math.round(prev.ingresoFamiliarCLP * (preset / 100));
        return {
          ...prev,
          savingsRatePreset: preset,
          capacidadAhorroCLP: calculatedClp,
        };
      });
    },
    []
  );

  // Actualizador por lote
  const updateMultiple = useCallback((fields: Partial<UseDS49CalculatorState>) => {
    setState((prev) => ({ ...prev, ...fields }));
  }, []);

  // Reiniciar a valores por defecto
  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // Hacinamiento reactivo según dormitorios, personas en la vivienda y tenencia (v1.5.0)
  const hacinamientoResult: HacinamientoResult = useMemo(() => {
    return calculateHacinamiento({
      dormitorios: state.dormitorios,
      totalPersonasVivienda: state.totalPersonasVivienda,
      tipoTenencia: state.tipoTenencia,
    });
  }, [state.dormitorios, state.totalPersonasVivienda, state.tipoTenencia]);

  // Construcción del objeto de entrada para evaluateDS49
  const ds49Input: DS49PostulacionInput = useMemo(() => {
    return {
      region: state.region,
      integrantesDeclarados: state.integrantesDeclarados,
      menoresHasta5: state.menoresHasta5,
      menores6a18: state.menores6a18,
      adultosMayores60: state.adultosMayores60,
      bomberosActivos: state.bomberosActivos,
      servicioMilitar: state.servicioMilitar,
      perteneceGendarmeria: state.perteneceGendarmeria,

      dormitorios: state.dormitorios,
      indiceHacinamiento: hacinamientoResult.ratio,
      viviendaPrecaria: state.viviendaPrecaria,
      aguaPrecaria: state.aguaPrecaria,
      banoPrecario: state.banoPrecario,

      postulacionesPreviasIndividuales: state.postulacionesPreviasIndividuales,
      postulacionesPreviasColectivas: state.postulacionesPreviasColectivas,

      mesesLibretaAhorro: state.mesesLibretaAhorro,
      saldoMedioCumplePermanencia: state.saldoMedioCumplePermanencia,

      miembrosDiscapacidad: state.miembrosDiscapacidad,
      victimaValechRettig: state.victimaValechRettig,
      esMonoparentalConHijos24: state.esMonoparentalConHijos24,
      tieneConyugeRSH: state.tieneConyugeRSH,

      ahorroActualUF: state.ahorroActualUF,
      ingresoDisponibleMensualCLP: state.capacidadAhorroCLP,
      valorUF: ufValue,
    };
  }, [state, hacinamientoResult.ratio, ufValue]);

  // Ejecución memoizada del motor normativo DS49
  const calculationResult: DS49CalculationResult = useMemo(() => {
    return evaluateDS49(ds49Input);
  }, [ds49Input]);

  // Proyección temporal dinámica por porcentaje de ahorro
  const savingsTimeline: SavingsTimelineResult = useMemo(() => {
    const isCustom = state.savingsRatePreset === 'custom';
    const rateNumber = typeof state.savingsRatePreset === 'number' ? state.savingsRatePreset : 0;
    return calculateSavingsTimeline(
      calculationResult.ahorroTotalSugeridoUF,
      state.ahorroActualUF,
      state.ingresoFamiliarCLP,
      rateNumber,
      ufValue,
      isCustom ? state.capacidadAhorroCLP : undefined
    );
  }, [
    calculationResult.ahorroTotalSugeridoUF,
    state.ahorroActualUF,
    state.ingresoFamiliarCLP,
    state.savingsRatePreset,
    state.capacidadAhorroCLP,
    ufValue,
  ]);

  // Lógica de recomendación de subsidio según perfil socioeconómico y crediticio
  const recommendation: SubsidyRecommendation = useMemo(() => {
    const isRSH40 = state.rshPercentil <= 40;
    const hasMortgageCapacity = state.tieneCapacidadCredito || state.ingresoFamiliarCLP >= 750000;

    if (isRSH40 && !hasMortgageCapacity) {
      return {
        primarySubsidy: 'ds49',
        title: 'Subsidio DS49 - Fondo Solidario de Elección de Vivienda',
        badge: 'Prioridad Alta: Vulnerabilidad Social',
        explanation:
          'Tu calificación de vulnerabilidad (hasta 40% RSH) y tu perfil sin crédito hipotecario te sitúan como candidato ideal para el DS49. El Estado financia la vivienda complementando tu libreta sin generar deuda bancaria mensual.',
        isDS49Priority: true,
        suggestsDS1Alternative: false,
        rshLabel: `${state.rshPercentil}% RSH`,
      };
    }

    if (isRSH40 && hasMortgageCapacity) {
      return {
        primarySubsidy: 'ds49',
        title: 'DS49 (Prioritario) o DS1 Tramo 1 (Estrategia Acelerada)',
        badge: 'Opción Dual Recomendada',
        explanation:
          'Cumples el requisito social del 40% para el DS49, pero tu capacidad de financiamiento te permite postular en paralelo al DS1 Tramo 1 para evitar las listas de espera del Fondo Solidario.',
        isDS49Priority: true,
        suggestsDS1Alternative: true,
        rshLabel: `${state.rshPercentil}% RSH`,
      };
    }

    if (state.rshPercentil <= 60) {
      return {
        primarySubsidy: 'ds1',
        title: 'Subsidio DS1 Tramo 1 o Tramo 2 para Sectores Medios',
        badge: 'Recomendado: DS1 Clase Media',
        explanation:
          'Al encontrarte en el tramo del 60% RSH, quedas fuera del corte regular del DS49 pero calificas plenamente para el subsidio DS1, donde tu ahorro extra sumará puntos directos para ganar tu casa.',
        isDS49Priority: false,
        suggestsDS1Alternative: true,
        rshLabel: `${state.rshPercentil}% RSH`,
      };
    }

    return {
      primarySubsidy: 'ds19',
      title: 'Proyectos de Integración Social DS19 o DS1 Tramo 3',
      badge: 'Recomendado: DS19 Automático',
      explanation:
        'Con RSH superior al 60% e ingresos estables, tu alternativa más rápida es postular de forma directa a proyectos inmobiliarios con subsidio DS19 sin postulación al MINVU, o al DS1 Tramo 3.',
      isDS49Priority: false,
      suggestsDS1Alternative: true,
      rshLabel: `${state.rshPercentil}% RSH`,
    };
  }, [state.rshPercentil, state.tieneCapacidadCredito, state.ingresoFamiliarCLP]);

  // Inferencia detallada del RSH con escala de necesidades de adultos equivalentes
  const rshResult: RSHCalculationResult = useMemo(() => {
    const isSingle = state.cantidadPersonasHogar === 1;
    return calculateRSH({
      ingresoLiquidoMensualClp: state.ingresoFamiliarCLP,
      adultosTotales: state.adultosTotales,
      menoresDe18: state.menoresDe18,
      miembrosConDiscapacidad: state.miembrosDiscapacidad,
      postulanteEsAdultoMayor: isSingle ? state.postulanteEsAdultoMayor : false,
    });
  }, [
    state.ingresoFamiliarCLP,
    state.adultosTotales,
    state.menoresDe18,
    state.miembrosDiscapacidad,
    state.postulanteEsAdultoMayor,
    state.cantidadPersonasHogar,
  ]);

  // Perfil unificado para la matriz de recomendación multitramo
  const userProfile: UserSubsidyProfile = useMemo(() => {
    return {
      region: state.region,
      rshPercentil: rshResult.percentil,
      ingresoFamiliarCLP: state.ingresoFamiliarCLP,
      tieneCapacidadCredito: state.tieneCapacidadCredito,
      ahorroActualUF: state.ahorroActualUF,
      savingsRatePercentage:
        state.savingsRatePreset === 'custom' ? undefined : state.savingsRatePreset,
      customMonthlySavingsCLP:
        state.savingsRatePreset === 'custom' ? state.capacidadAhorroCLP : undefined,
      valorUF: ufValue,

      integrantesDeclarados: state.integrantesDeclarados,
      menoresHasta5: state.menoresHasta5,
      menores6a18: state.menores6a18,
      adultosMayores60: state.adultosMayores60,
      postulanteMayor60: state.postulanteEsAdultoMayor,
      bomberosActivos: state.bomberosActivos,
      servicioMilitar: state.servicioMilitar,
      perteneceGendarmeria: state.perteneceGendarmeria,
      dormitorios: state.dormitorios,
      totalPersonasVivienda: state.totalPersonasVivienda,
      tipoTenencia: state.tipoTenencia,
      indiceHacinamientoDirecto: hacinamientoResult.ratio,
      viviendaPrecaria: state.viviendaPrecaria,
      aguaPrecaria: state.aguaPrecaria,
      banoPrecario: state.banoPrecario,
      viviendaDestruida: state.viviendaDestruida,
      postulacionesPrevias: state.postulacionesPreviasIndividuales,
      mesesLibretaAhorro: state.mesesLibretaAhorro,
      saldoMedioCumplePermanencia: state.saldoMedioCumplePermanencia,
      mesesArriendoAlDia: state.mesesArriendoAlDia,
      miembrosDiscapacidad: state.miembrosDiscapacidad,
      victimaValechRettig: state.victimaValechRettig,
      esMonoparentalConHijos24: state.esMonoparentalConHijos24,
      tieneConyugeRSH: state.tieneConyugeRSH,
    };
  }, [state, rshResult.percentil, hacinamientoResult.ratio, ufValue]);

  // Evaluación paralela en el motor comparador
  const comparisonResult: RecommendationEngineResult = useMemo(() => {
    return recommendBestSubsidy(userProfile);
  }, [userProfile]);

  return {
    state,
    updateField,
    setSavingsRate,
    updateMultiple,
    reset,
    ufValue,
    isLoadingUF,
    calculationResult,
    savingsTimeline,
    recommendation,
    comparisonResult,
    rshResult,
    hacinamientoResult,
    cutoffs: DS49_REGIONAL_CUTOFFS_2025,
  };
}
