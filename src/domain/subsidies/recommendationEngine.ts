/**
 * @file recommendationEngine.ts
 * @description Orquestador de comparación y ranking inteligente de subsidios habitacionales.
 * Evalúa simultáneamente DS49, DS1-Tramo 1, DS1-Tramo 2 y DS1-Tramo 3 según el perfil socioeconómico,
 * tramo de RSH, capacidad de endeudamiento hipotecario y capacidad de ahorro del postulante.
 * 
 * Proyecto: Subsimatch (v1.4.1)
 */

import {
  evaluateDS49,
  DS49CalculationResult,
  DS49PostulacionInput,
  DS49Region,
  normalizeDS49Region,
} from './ds49';
import {
  evaluateDS1,
  DS1CalculationResult,
  DS1PostulacionInput,
  DS1Tramo,
  DS1_MAX_RSH_PERCENTILE,
  DS1_BASE_SAVINGS_UF,
} from './ds1';
import { TipoTenencia } from '../rsh/calculator';
import { DEFAULT_UF_VALUE } from '../../utils/api';

export type SubsidyOptionKey = 'ds49' | 'ds1_t1' | 'ds1_t2' | 'ds1_t3';

/**
 * Perfil unificado del postulante para la evaluación multiprograma.
 */
export interface UserSubsidyProfile {
  region: DS49Region | string;
  rshPercentil: number; // 40, 60, 80, 90, 100
  ingresoFamiliarCLP: number;
  tieneCapacidadCredito: boolean;
  ahorroActualUF: number;
  savingsRatePercentage?: number; // 5, 10, 15, etc.
  customMonthlySavingsCLP?: number;
  valorUF?: number;

  // Factores familiares
  integrantesDeclarados?: number;
  menoresHasta5?: number;
  menores6a18?: number;
  adultosMayores60?: number;
  postulanteMayor60?: boolean;
  esMonoparentalConHijos24?: boolean;
  tieneConyugeRSH?: boolean;
  miembrosDiscapacidad?: number;
  victimaValechRettig?: boolean;
  bomberosActivos?: number;
  servicioMilitar?: number;
  perteneceGendarmeria?: boolean;

  // Vulnerabilidad y Habitabilidad
  dormitorios?: number;
  totalPersonasVivienda?: number;
  tipoTenencia?: TipoTenencia;
  indiceHacinamientoDirecto?: number;
  viviendaPrecaria?: boolean;
  aguaPrecaria?: boolean;
  banoPrecario?: boolean;
  viviendaDestruida?: boolean;

  // Historial
  postulacionesPrevias?: number;
  mesesLibretaAhorro?: number;
  saldoMedioCumplePermanencia?: boolean;
  semestresConstanciaAhorro?: number;
  mesesArriendoAlDia?: number;
}

/**
 * Resultado individual de cada subsidio evaluado.
 */
export interface EvaluatedSubsidyOption {
  key: SubsidyOptionKey;
  subsidio: 'DS49' | 'DS1';
  tramo?: DS1Tramo;
  title: string;
  shortDescription: string;
  rshMaximo: number;
  esElegibleRSH: boolean;
  requiereCredito: boolean;
  esElegibleCredito: boolean;
  puntajeCorteRegion: number;
  puntajeActual: number;
  superaCorteActual: boolean;
  ahorroMinimoLegalUF: number;
  ahorroSugeridoMetaUF: number;
  ahorroSugeridoMetaCLP: number;
  brechaAhorroUF: number;
  brechaAhorroCLP: number;
  mesesEstimados: number;
  viabilidadScore: number;
  estaBloqueado: boolean;
  motivoBloqueo?: string;
  badge: string;
  badgeColor: 'emerald' | 'blue' | 'amber' | 'slate';
  motivo: string;
  detalles: DS49CalculationResult | DS1CalculationResult;
}

/**
 * Resultado integral del ranking comparativo.
 */
export interface RecommendationEngineResult {
  topMatch: EvaluatedSubsidyOption;
  options: EvaluatedSubsidyOption[];
  profileSummary: {
    region: DS49Region;
    rshPercentil: number;
    ingresoCLP: number;
    ahorroActualUF: number;
    tieneCredito: boolean;
    monthlySavingsCLP: number;
  };
}

/**
 * Evalúa en paralelo todos los subsidios habitacionales (DS49, DS1-T1, DS1-T2, DS1-T3)
 * y clasifica la mejor alternativa según el perfil social y financiero del postulante.
 */
export function recommendBestSubsidy(profile: UserSubsidyProfile): RecommendationEngineResult {
  const region = normalizeDS49Region(profile.region);
  const ufValue = profile.valorUF && profile.valorUF > 0 ? profile.valorUF : DEFAULT_UF_VALUE;
  const ahorroActualUF = Math.max(0, profile.ahorroActualUF ?? 0);
  const rsh = profile.rshPercentil;
  const ingresoCLP = Math.max(0, profile.ingresoFamiliarCLP ?? 0);
  const esPropietario = profile.tipoTenencia === 'PROPIETARIO';

  // Determinar capacidad mensual de ahorro en CLP
  const rate = profile.savingsRatePercentage ?? 10;
  const monthlySavingsCLP =
    typeof profile.customMonthlySavingsCLP === 'number' && profile.customMonthlySavingsCLP > 0
      ? profile.customMonthlySavingsCLP
      : Math.round(ingresoCLP * (rate / 100));

  // Capacidad crediticia: indicador del usuario o sueldo suficiente
  const tieneCapacidadCredito = Boolean(
    profile.tieneCapacidadCredito || ingresoCLP >= 750000
  );

  // ---------------------------------------------------------------------------
  // 1. Evaluación DS49
  // ---------------------------------------------------------------------------
  const ds49Input: DS49PostulacionInput = {
    region,
    integrantesDeclarados: profile.integrantesDeclarados,
    menoresHasta5: profile.menoresHasta5,
    menores6a18: profile.menores6a18,
    adultosMayores60:
      (profile.adultosMayores60 ?? 0) + (profile.postulanteMayor60 ? 1 : 0),
    bomberosActivos: profile.bomberosActivos,
    servicioMilitar: profile.servicioMilitar,
    perteneceGendarmeria: profile.perteneceGendarmeria,
    dormitorios: profile.dormitorios,
    indiceHacinamiento: profile.indiceHacinamientoDirecto,
    viviendaPrecaria: profile.viviendaPrecaria,
    aguaPrecaria: profile.aguaPrecaria,
    banoPrecario: profile.banoPrecario,
    postulacionesPreviasIndividuales: profile.postulacionesPrevias,
    mesesLibretaAhorro: profile.mesesLibretaAhorro,
    saldoMedioCumplePermanencia: profile.saldoMedioCumplePermanencia,
    miembrosDiscapacidad: profile.miembrosDiscapacidad,
    victimaValechRettig: profile.victimaValechRettig,
    esMonoparentalConHijos24: profile.esMonoparentalConHijos24,
    tieneConyugeRSH: profile.tieneConyugeRSH,
    ahorroActualUF,
    ingresoDisponibleMensualCLP: monthlySavingsCLP,
    valorUF: ufValue,
  };

  const ds49Result = evaluateDS49(ds49Input);
  const ds49ElegibleRSH = rsh <= 40;
  const ds49Meses =
    ds49Result.brechaAhorroUF === 0
      ? 0
      : monthlySavingsCLP > 0
      ? Math.ceil((ds49Result.brechaAhorroUF * ufValue) / monthlySavingsCLP)
      : 999;

  let ds49Score = 0;
  const estaBloqueadoDS49 = esPropietario || !ds49ElegibleRSH;
  const motivoBloqueoDS49 = esPropietario
    ? 'La normativa MINVU no permite postular a subsidio de compra si ya posees vivienda propia a tu nombre.'
    : !ds49ElegibleRSH
    ? `No compatible: Tu RSH calculado de ${rsh}% excede el máximo permitido (supera el 40% exigido).`
    : undefined;

  if (estaBloqueadoDS49) {
    ds49Score -= esPropietario ? 5000 : 2000;
  } else {
    ds49Score += 500; // Gran bonificación por 0 deuda bancaria en familias vulnerables
    if (!tieneCapacidadCredito) ds49Score += 250; // Ideal para quienes no acceden a crédito
    if (ds49Result.superaCorte) ds49Score += 150;
    ds49Score -= Math.min(200, ds49Meses * 2);
  }

  const ds49Option: EvaluatedSubsidyOption = {
    key: 'ds49',
    subsidio: 'DS49',
    title: 'Subsidio DS49 (Fondo Solidario)',
    shortDescription: '100% financiado por el Estado sin dividendo. Compra de vivienda social.',
    rshMaximo: 40,
    esElegibleRSH: ds49ElegibleRSH,
    requiereCredito: false,
    esElegibleCredito: true,
    puntajeCorteRegion: ds49Result.puntajeCorteRegion,
    puntajeActual: ds49Result.puntajeTotalActual,
    superaCorteActual: ds49Result.superaCorte,
    ahorroMinimoLegalUF: 10,
    ahorroSugeridoMetaUF: ds49Result.ahorroTotalSugeridoUF,
    ahorroSugeridoMetaCLP: Math.round(ds49Result.ahorroTotalSugeridoUF * ufValue),
    brechaAhorroUF: ds49Result.brechaAhorroUF,
    brechaAhorroCLP: Math.round(ds49Result.brechaAhorroUF * ufValue),
    mesesEstimados: ds49Meses,
    viabilidadScore: ds49Score,
    estaBloqueado: estaBloqueadoDS49,
    motivoBloqueo: motivoBloqueoDS49,
    badge: esPropietario
      ? 'Bloqueado: Propietario'
      : ds49ElegibleRSH
      ? 'Vivienda Social Sin Deuda'
      : 'Bloqueado por RSH',
    badgeColor: esPropietario || !ds49ElegibleRSH ? 'slate' : 'emerald',
    motivo: esPropietario
      ? 'Incompatible: Ya posees vivienda propia a tu nombre.'
      : ds49ElegibleRSH
      ? 'Excelente opción sin dividendo para familias del 40% RSH.'
      : 'Incompatible: Requiere Registro Social de Hogares hasta el 40%.',
    detalles: ds49Result,
  };

  // ---------------------------------------------------------------------------
  // 2. Evaluaciones DS1 (T1, T2, T3)
  // ---------------------------------------------------------------------------
  const ds1Input: DS1PostulacionInput = {
    region,
    integrantesDeclarados: profile.integrantesDeclarados,
    esMonoparentalConHijos24: profile.esMonoparentalConHijos24,
    tieneConyugeRSH: profile.tieneConyugeRSH,
    menoresHasta5: profile.menoresHasta5,
    menores6a18: profile.menores6a18,
    miembrosDiscapacidad: profile.miembrosDiscapacidad,
    postulanteMayor60: profile.postulanteMayor60,
    adultosMayores60: profile.adultosMayores60,
    victimaValechRettig: profile.victimaValechRettig,
    viviendaDestruida: profile.viviendaDestruida,
    bomberosActivos: profile.bomberosActivos,
    servicioMilitar: profile.servicioMilitar,
    perteneceGendarmeria: profile.perteneceGendarmeria,
    dormitorios: profile.dormitorios,
    indiceHacinamientoDirecto: profile.indiceHacinamientoDirecto,
    semestresConstanciaAhorro:
      typeof profile.semestresConstanciaAhorro === 'number'
        ? profile.semestresConstanciaAhorro
        : 0,
    postulacionesPrevias: profile.postulacionesPrevias,
    mesesArriendoAlDia: profile.mesesArriendoAlDia,
    ahorroActualUF,
    ingresoDisponibleMensualCLP: monthlySavingsCLP,
    valorUF: ufValue,
  };

  const evaluateDS1Option = (tramo: DS1Tramo): EvaluatedSubsidyOption => {
    const res = evaluateDS1(ds1Input, tramo);
    const rshMax = DS1_MAX_RSH_PERCENTILE[tramo];
    const esElegibleRSH = rsh <= rshMax;

    // Reglas de crédito:
    // T1: Crédito opcional.
    // T2: Crédito complementario requerido (salvo excepciones de alto ahorro).
    // T3: Crédito complementario obligatorio.
    const requiereCredito = tramo !== 't1';
    let esElegibleCredito = true;
    if (requiereCredito && !tieneCapacidadCredito) {
      esElegibleCredito = false;
    }

    const estaBloqueado = esPropietario || !esElegibleRSH || (requiereCredito && !esElegibleCredito);
    let motivoBloqueo: string | undefined = undefined;
    if (esPropietario) {
      motivoBloqueo = 'La normativa MINVU no permite postular a subsidio de compra si ya posees vivienda propia a tu nombre.';
    } else if (!esElegibleRSH) {
      motivoBloqueo = `No compatible: Tu RSH calculado de ${rsh}% excede el máximo permitido (supera el ${rshMax}% exigido).`;
    } else if (requiereCredito && !esElegibleCredito) {
      motivoBloqueo = 'Requiere capacidad o interés de crédito hipotecario bancario para complementar.';
    }

    const meses =
      res.brechaAhorroUF === 0
        ? 0
        : monthlySavingsCLP > 0
        ? Math.ceil((res.brechaAhorroUF * ufValue) / monthlySavingsCLP)
        : 999;

    let score = 0;
    if (esPropietario) {
      score -= 5000;
    } else if (!esElegibleRSH) {
      score -= 2000;
    } else if (requiereCredito && !esElegibleCredito) {
      score -= 1500;
    } else {
      score += 400; // Base por elegibilidad social
      if (res.superaCorte) score += 180;
      score -= Math.min(220, meses * 2);

      // En T1: Gran opción si el usuario puede ahorrar extra
      if (tramo === 't1') {
        score += 80;
        if (rsh <= 40 && tieneCapacidadCredito) {
          score += 150; // Tramo alternativo veloz para el 40% con capacidad de ahorro
        }
      }

      // En T2 y T3: Bonificación si cuenta con crédito
      if (requiereCredito && tieneCapacidadCredito) {
        score += 120;
      }
    }

    const titles: Record<DS1Tramo, string> = {
      t1: 'Subsidio DS1 Tramo 1',
      t2: 'Subsidio DS1 Tramo 2',
      t3: 'Subsidio DS1 Tramo 3',
    };

    const descriptions: Record<DS1Tramo, string> = {
      t1: 'Para familias de ingresos bajos-medios. Crédito hipotecario opcional. Compra hasta 1.100 - 1.200 UF.',
      t2: 'Para clase media con capacidad crediticia. Compra viviendas de hasta 1.600 UF.',
      t3: 'Para sectores medios con mayor capacidad financiera. Compra viviendas de hasta 2.200 - 2.600 UF.',
    };

    let badge = 'Alternativa Viable';
    let badgeColor: 'emerald' | 'blue' | 'amber' | 'slate' = 'blue';

    if (esPropietario) {
      badge = 'Bloqueado: Propietario';
      badgeColor = 'slate';
    } else if (!esElegibleRSH) {
      badge = `Bloqueado: Excede ${rshMax}% RSH`;
      badgeColor = 'slate';
    } else if (requiereCredito && !esElegibleCredito) {
      badge = 'Bloqueado: Requiere Crédito';
      badgeColor = 'amber';
    } else if (tramo === 't1') {
      badge = 'Ahorro Programado';
      badgeColor = 'emerald';
    }

    let motivo = '';
    if (esPropietario) {
      motivo = 'Incompatible: Ya posees vivienda propia a tu nombre.';
    } else if (!esElegibleRSH) {
      motivo = `No compatible: Tu RSH calculado (${rsh}%) supera el límite permitido (${rshMax}%).`;
    } else if (requiereCredito && !esElegibleCredito) {
      motivo = 'Requiere capacidad de crédito hipotecario para complementar el subsidio.';
    } else if (tramo === 't1') {
      motivo = 'El ahorro extra suma hasta 4 puntos por cada UF, permitiendo acelerar la adjudicación.';
    } else {
      motivo = 'Permite comprar propiedades de mayor valor comercial con apoyo hipotecario.';
    }

    return {
      key: `ds1_${tramo}` as SubsidyOptionKey,
      subsidio: 'DS1',
      tramo,
      title: titles[tramo],
      shortDescription: descriptions[tramo],
      rshMaximo: rshMax,
      esElegibleRSH,
      requiereCredito,
      esElegibleCredito,
      puntajeCorteRegion: res.puntajeCorteRegion,
      puntajeActual: res.puntajeTotalActual,
      superaCorteActual: res.superaCorte,
      ahorroMinimoLegalUF: DS1_BASE_SAVINGS_UF[tramo],
      ahorroSugeridoMetaUF: res.ahorroTotalSugeridoUF,
      ahorroSugeridoMetaCLP: Math.round(res.ahorroTotalSugeridoUF * ufValue),
      brechaAhorroUF: res.brechaAhorroUF,
      brechaAhorroCLP: Math.round(res.brechaAhorroUF * ufValue),
      mesesEstimados: meses,
      viabilidadScore: score,
      estaBloqueado,
      motivoBloqueo,
      badge,
      badgeColor,
      motivo,
      detalles: res,
    };
  };

  const t1Option = evaluateDS1Option('t1');
  const t2Option = evaluateDS1Option('t2');
  const t3Option = evaluateDS1Option('t3');

  // ---------------------------------------------------------------------------
  // 3. Ordenamiento y Selección del Top Match
  // ---------------------------------------------------------------------------
  const allOptions = [ds49Option, t1Option, t2Option, t3Option];

  // Ordenar por viabilidadScore descendente
  allOptions.sort((a, b) => b.viabilidadScore - a.viabilidadScore);

  // Marcar el top match como 'Mejor Match'
  const topMatch = allOptions[0];
  if (!topMatch.estaBloqueado) {
    topMatch.badge = '★ Tu Mejor Opción';
    topMatch.badgeColor = 'emerald';
  }

  return {
    topMatch,
    options: allOptions,
    profileSummary: {
      region,
      rshPercentil: rsh,
      ingresoCLP,
      ahorroActualUF,
      tieneCredito: tieneCapacidadCredito,
      monthlySavingsCLP,
    },
  };
}
