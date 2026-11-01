/**
 * @file ds1.ts
 * @description Motor de cálculo de puntajes, ecuación inversa marginal y reglas normativas
 * para el Subsidio DS1 (Sectores Medios - D.S. N° 1, V. y U., de 2011).
 * 
 * Tramos:
 * - Tramo 1 (T1): Sectores de menores ingresos (hasta 60% RSH). Ahorro base 30 UF.
 * - Tramo 2 (T2): Sectores medios (hasta 80% RSH). Ahorro base 40 UF.
 * - Tramo 3 (T3): Sectores medios-altos (hasta 90% RSH). Ahorro base 80 UF.
 * 
 * Proyecto: Subsimatch (v1.4.1)
 */

import { DS49Region, normalizeDS49Region } from './ds49';

export type DS1Tramo = 't1' | 't2' | 't3';

/**
 * Ahorros mínimos base obligatorios por tramo en UF.
 */
export const DS1_BASE_SAVINGS_UF: Readonly<Record<DS1Tramo, number>> = Object.freeze({
  t1: 30,
  t2: 40,
  t3: 80,
});

/**
 * Límites de calificación socioeconómica máxima en el Registro Social de Hogares.
 */
export const DS1_MAX_RSH_PERCENTILE: Readonly<Record<DS1Tramo, number>> = Object.freeze({
  t1: 60,
  t2: 80,
  t3: 90,
});

/**
 * Puntajes de Corte Regionales Referenciales para el Subsidio DS1 (Primer Llamado 2025).
 */
export const DS1_REGIONAL_CUTOFFS_2025: Readonly<Record<DS1Tramo, Record<DS49Region, number>>> = Object.freeze({
  t1: {
    arica: 598.3,
    tarapaca: 406.66,
    antofagasta: 378.73,
    atacama: 455.22,
    coquimbo: 618.59,
    valparaiso: 610.21,
    ohiggins: 645.83,
    maule: 598.79,
    nuble: 641.16,
    biobio: 622.66,
    araucania: 636.32,
    rios: 570.44,
    lagos: 536.05,
    aysen: 362.05,
    magallanes: 530.65,
    metropolitana: 578.09,
  },
  t2: {
    arica: 266.22,
    tarapaca: 69.73,
    antofagasta: 159.76,
    atacama: 280.78,
    coquimbo: 252.98,
    valparaiso: 228.13,
    ohiggins: 359.12,
    maule: 341.66,
    nuble: 269.02,
    biobio: 290.41,
    araucania: 306.72,
    rios: 368.62,
    lagos: 304.52,
    aysen: 339.95,
    magallanes: 239.73,
    metropolitana: 372.1,
  },
  t3: {
    arica: 109.26,
    tarapaca: 63.3,
    antofagasta: 114.7,
    atacama: 65.21,
    coquimbo: 150.78,
    valparaiso: 195.36,
    ohiggins: 199.93,
    maule: 204.06,
    nuble: 239.18,
    biobio: 80.92,
    araucania: 153.35,
    rios: 263.59,
    lagos: 223.93,
    aysen: 138.87,
    magallanes: 103.55,
    metropolitana: 142.98,
  },
});

/**
 * Parámetros de entrada para el cálculo normativo del Subsidio DS1.
 */
export interface DS1PostulacionInput {
  /** Región de postulación */
  region: DS49Region | string;

  // --- FACTOR GRUPO FAMILIAR ---
  /** Integrantes declarados en el hogar (excluyendo al postulante). 40 pts c/u */
  integrantesDeclarados?: number;
  /** Jefatura de hogar monoparental con hijos hasta 24 años. 35 pts */
  esMonoparentalConHijos24?: boolean;
  /** Indica si figura cónyuge o conviviente en el RSH (invalida monoparentalidad) */
  tieneConyugeRSH?: boolean;
  /** Cantidad de menores de hasta 5 años (0 a 5 años). 30 pts c/u */
  menoresHasta5?: number;
  /** Cantidad de menores entre 6 y 18 años. 20 pts c/u */
  menores6a18?: number;
  /** Cantidad de integrantes con discapacidad en el RND. 30 pts c/u */
  miembrosDiscapacidad?: number;
  /** Postulante con 60 años o más (o que los cumpla en el año). 150 pts */
  postulanteMayor60?: boolean;
  /** Integrantes adicionales de 60 años o más (excluye postulante). 30 pts c/u */
  adultosMayores60?: number;
  /** Postulante o cónyuge acreditado como víctima Valech / Rettig. 300 pts */
  victimaValechRettig?: boolean;
  /** Vivienda declarada inhabitable o destruida por catástrofe acreditada. 50 pts */
  viviendaDestruida?: boolean;
  /** Integrantes voluntarios activos acreditados de Bomberos. 40 pts c/u */
  bomberosActivos?: number;
  /** Integrantes con servicio militar realizado desde 2004. 20 pts c/u */
  servicioMilitar?: number;
  /** Postulante o cónyuge pertenece a Gendarmería (40 pts, incompatible con servicio militar) */
  perteneceGendarmeria?: boolean;

  // --- FACTOR HACINAMIENTO ---
  /** Cantidad de dormitorios disponibles en la vivienda */
  dormitorios?: number;
  /** Índice de hacinamiento directo si se conoce */
  indiceHacinamientoDirecto?: number;

  // --- FACTOR HISTORIAL Y AHORRO ---
  /** Cantidad de semestres cumplidos con constancia de saldo medio (25 pts c/semestre) */
  semestresConstanciaAhorro?: number;
  /** Cantidad de postulaciones previas no seleccionadas en DS1 o DS49. 25 pts c/u */
  postulacionesPrevias?: number;
  /** Meses de copago al día en programa de Subsidio de Arriendo (DS52). 80 pts c/12 meses, máx 240 */
  mesesArriendoAlDia?: number;

  // --- AHORRO Y CAPACIDAD ECONÓMICA ---
  /** Ahorro actual acreditado en libreta (en UF) */
  ahorroActualUF?: number;
  /** Ingreso líquido mensual familiar (CLP) */
  ingresoDisponibleMensualCLP?: number;
  /** Valor de la UF en CLP */
  valorUF?: number;
}

/**
 * Desglose detallado de puntajes base de DS1.
 */
export interface DS1ScoreBreakdown {
  familia: {
    integrantesPts: number;
    monoparentalPts: number;
    menoresHasta5Pts: number;
    menores6a18Pts: number;
    discapacidadPts: number;
    postulanteMayor60Pts: number;
    adultosMayoresPts: number;
    valechRettigPts: number;
    viviendaDestruidaPts: number;
    bomberosPts: number;
    gendarmeriaPts: number;
    servicioMilitarPts: number;
    incompatibilidadGendarmeria: boolean;
    totalFamilia: number;
  };
  hacinamiento: {
    totalPersonas: number;
    dormitorios: number;
    indice: number;
    puntos: number;
  };
  historialYAhorro: {
    semestresConstancia: number;
    constanciaPts: number;
    postulacionesPrevias: number;
    postulacionesPts: number;
    mesesArriendo: number;
    arriendoPts: number;
    totalHistorial: number;
  };
  puntajeBaseTotal: number;
}

/**
 * Resultado completo de la evaluación de un tramo del Subsidio DS1.
 */
export interface DS1CalculationResult {
  tramo: DS1Tramo;
  region: DS49Region;
  puntajeCorteRegion: number;
  puntajeBase: number;
  ahorroBaseUF: number;
  ahorroActualUF: number;
  excesoAhorroActualUF: number;
  puntajeExcesoActual: number;
  puntajeTotalActual: number;
  superaCorte: boolean;

  // Ecuación Inversa Marginal
  deficitPuntos: number;
  excesoAhorroRequeridoUF: number;
  ahorroTotalSugeridoUF: number;
  puntajeProyectadoConAhorroSugerido: number;

  // Brechas y Proyección
  brechaAhorroUF: number;
  brechaAhorroCLP: number | null;
  mesesProyectados: number | null;

  desglose: DS1ScoreBreakdown;
}

/**
 * Calcula el puntaje base no financiero de un postulante al subsidio DS1.
 */
export function calculateDS1BaseScore(input: DS1PostulacionInput): DS1ScoreBreakdown {
  const integrantes = Math.max(0, input.integrantesDeclarados ?? 0);
  const menores5 = Math.max(0, input.menoresHasta5 ?? 0);
  const menores18 = Math.max(0, input.menores6a18 ?? 0);
  const discapacidad = Math.max(0, input.miembrosDiscapacidad ?? 0);
  const adultosMayores = Math.max(0, input.adultosMayores60 ?? 0);
  const postulanteMayor = Boolean(input.postulanteMayor60);
  const esMonoparental = Boolean(input.esMonoparentalConHijos24);
  const tieneConyuge = Boolean(input.tieneConyugeRSH);
  const victimaPolitica = Boolean(input.victimaValechRettig);
  const viviendaDestruida = Boolean(input.viviendaDestruida);
  const bomberos = Math.max(0, input.bomberosActivos ?? 0);
  const militarCount = Math.max(0, input.servicioMilitar ?? 0);
  const gendarmeria = Boolean(input.perteneceGendarmeria);

  // 1. Familia
  const integrantesPts = integrantes * 40;
  const monoparentalPts = esMonoparental && !tieneConyuge ? 35 : 0;
  const menoresHasta5Pts = menores5 * 30;
  const menores6a18Pts = menores18 * 20;
  const discapacidadPts = discapacidad * 30;
  const postulanteMayor60Pts = postulanteMayor ? 150 : 0;
  const adultosMayoresPts = adultosMayores * 30;
  const valechRettigPts = victimaPolitica ? 300 : 0;
  const viviendaDestruidaPts = viviendaDestruida ? 50 : 0;
  const bomberosPts = bomberos * 40;

  let gendarmeriaPts = 0;
  let servicioMilitarPts = 0;
  let incompatibilidadGendarmeria = false;

  if (gendarmeria) {
    gendarmeriaPts = 40;
    servicioMilitarPts = 0;
    if (militarCount > 0) incompatibilidadGendarmeria = true;
  } else {
    servicioMilitarPts = militarCount * 20;
  }

  const totalFamilia =
    integrantesPts +
    monoparentalPts +
    menoresHasta5Pts +
    menores6a18Pts +
    discapacidadPts +
    postulanteMayor60Pts +
    adultosMayoresPts +
    valechRettigPts +
    viviendaDestruidaPts +
    bomberosPts +
    gendarmeriaPts +
    servicioMilitarPts;

  // 2. Hacinamiento
  const totalPersonas = 1 + integrantes;
  const dormitorios = Math.max(1, input.dormitorios ?? 1);
  const indice =
    typeof input.indiceHacinamientoDirecto === 'number' && input.indiceHacinamientoDirecto > 0
      ? input.indiceHacinamientoDirecto
      : totalPersonas / dormitorios;

  let hacinamientoPts = 0;
  if (indice > 3.5) {
    hacinamientoPts = 270;
  } else if (indice > 3.0) {
    hacinamientoPts = 135;
  } else if (indice > 2.5) {
    hacinamientoPts = 90;
  } else if (indice > 2.0) {
    hacinamientoPts = 45;
  } else {
    hacinamientoPts = 0;
  }

  // 3. Historial y Constancia de Ahorro
  const semestresConstancia = Math.max(0, input.semestresConstanciaAhorro ?? 0);
  const constanciaPts = semestresConstancia * 25;

  const postulacionesPrevias = Math.max(0, input.postulacionesPrevias ?? 0);
  const postulacionesPts = postulacionesPrevias * 25;

  const mesesArriendo = Math.max(0, input.mesesArriendoAlDia ?? 0);
  const periodosArriendo = Math.floor(mesesArriendo / 12);
  const arriendoPts = Math.min(240, periodosArriendo * 80);

  const totalHistorial = constanciaPts + postulacionesPts + arriendoPts;

  const puntajeBaseTotal = totalFamilia + hacinamientoPts + totalHistorial;

  return {
    familia: {
      integrantesPts,
      monoparentalPts,
      menoresHasta5Pts,
      menores6a18Pts,
      discapacidadPts,
      postulanteMayor60Pts,
      adultosMayoresPts,
      valechRettigPts,
      viviendaDestruidaPts,
      bomberosPts,
      gendarmeriaPts,
      servicioMilitarPts,
      incompatibilidadGendarmeria,
      totalFamilia,
    },
    hacinamiento: {
      totalPersonas,
      dormitorios,
      indice: Number(indice.toFixed(2)),
      puntos: hacinamientoPts,
    },
    historialYAhorro: {
      semestresConstancia,
      constanciaPts,
      postulacionesPrevias,
      postulacionesPts,
      mesesArriendo,
      arriendoPts,
      totalHistorial,
    },
    puntajeBaseTotal,
  };
}

/**
 * Calcula los puntos otorgados por el exceso de ahorro en función de los tramos marginales.
 *
 * Tramos 1 y 2:
 * - 0 a 60 UF de exceso: 4 pts/UF (hasta 240 pts)
 * - 60 a 110 UF de exceso: 2 pts/UF (hasta 100 pts)
 * - 110 a 160 UF de exceso: 1 pt/UF (hasta 50 pts)
 * - > 160 UF de exceso: 0.05 pts/UF
 *
 * Tramo 3:
 * - 0 a 60 UF de exceso: 2 pts/UF (hasta 120 pts)
 * - 60 a 110 UF de exceso: 1 pt/UF (hasta 50 pts)
 * - 110 a 160 UF de exceso: 0.5 pts/UF (hasta 25 pts)
 * - > 160 UF de exceso: 0.05 pts/UF
 */
export function calculateDS1ExcessPoints(excessUF: number, tramo: DS1Tramo): number {
  if (excessUF <= 0) return 0;

  let points = 0;
  let remainingUF = excessUF;

  if (tramo === 't1' || tramo === 't2') {
    // Fase 1: hasta 60 UF a 4 pts
    const f1 = Math.min(remainingUF, 60);
    points += f1 * 4;
    remainingUF -= f1;

    // Fase 2: 50 UF (de 60 a 110) a 2 pts
    if (remainingUF > 0) {
      const f2 = Math.min(remainingUF, 50);
      points += f2 * 2;
      remainingUF -= f2;
    }

    // Fase 3: 50 UF (de 110 a 160) a 1 pt
    if (remainingUF > 0) {
      const f3 = Math.min(remainingUF, 50);
      points += f3 * 1;
      remainingUF -= f3;
    }

    // Fase 4: más de 160 UF a 0.05 pts
    if (remainingUF > 0) {
      points += remainingUF * 0.05;
    }
  } else {
    // Tramo 3
    // Fase 1: hasta 60 UF a 2 pts
    const f1 = Math.min(remainingUF, 60);
    points += f1 * 2;
    remainingUF -= f1;

    // Fase 2: 50 UF (de 60 a 110) a 1 pt
    if (remainingUF > 0) {
      const f2 = Math.min(remainingUF, 50);
      points += f2 * 1;
      remainingUF -= f2;
    }

    // Fase 3: 50 UF (de 110 a 160) a 0.5 pts
    if (remainingUF > 0) {
      const f3 = Math.min(remainingUF, 50);
      points += f3 * 0.5;
      remainingUF -= f3;
    }

    // Fase 4: más de 160 UF a 0.05 pts
    if (remainingUF > 0) {
      points += remainingUF * 0.05;
    }
  }

  return Number(points.toFixed(2));
}

/**
 * Ecuación Inversa Marginal del Subsidio DS1:
 * Determina exactamente cuántas UF de exceso sobre el ahorro base se requieren
 * para cubrir un déficit de puntos.
 *
 * Ejemplo en T1/T2:
 * - Déficit de 280 pts -> 240 pts consumen 60 UF. Los 40 pts restantes a 2 pts/UF consumen 20 UF.
 *   Exceso requerido = 60 + 20 = 80 UF.
 */
export function calculateDS1ExcessUF(deficitPoints: number, tramo: DS1Tramo): number {
  if (deficitPoints <= 0) return 0;

  let d = deficitPoints;
  let excessUF = 0;

  if (tramo === 't1' || tramo === 't2') {
    // Fase 1: hasta 240 pts (60 UF a 4 pts/UF)
    if (d <= 240) {
      return Number((d / 4).toFixed(2));
    }
    excessUF += 60;
    d -= 240;

    // Fase 2: hasta 100 pts (50 UF a 2 pts/UF)
    if (d <= 100) {
      return Number((excessUF + d / 2).toFixed(2));
    }
    excessUF += 50;
    d -= 100;

    // Fase 3: hasta 50 pts (50 UF a 1 pt/UF)
    if (d <= 50) {
      return Number((excessUF + d / 1).toFixed(2));
    }
    excessUF += 50;
    d -= 50;

    // Fase 4: más de 160 UF a 0.05 pts/UF
    return Number((excessUF + d / 0.05).toFixed(2));
  } else {
    // Tramo 3
    // Fase 1: hasta 120 pts (60 UF a 2 pts/UF)
    if (d <= 120) {
      return Number((d / 2).toFixed(2));
    }
    excessUF += 60;
    d -= 120;

    // Fase 2: hasta 50 pts (50 UF a 1 pt/UF)
    if (d <= 50) {
      return Number((excessUF + d / 1).toFixed(2));
    }
    excessUF += 50;
    d -= 50;

    // Fase 3: hasta 25 pts (50 UF a 0.5 pts/UF)
    if (d <= 25) {
      return Number((excessUF + d / 0.5).toFixed(2));
    }
    excessUF += 50;
    d -= 25;

    // Fase 4: más de 160 UF a 0.05 pts/UF
    return Number((excessUF + d / 0.05).toFixed(2));
  }
}

/**
 * Función pura que evalúa un tramo específico del subsidio DS1 (T1, T2 o T3).
 */
export function evaluateDS1(input: DS1PostulacionInput, tramo: DS1Tramo): DS1CalculationResult {
  const region = normalizeDS49Region(input.region);
  const puntajeCorteRegion = DS1_REGIONAL_CUTOFFS_2025[tramo][region];
  const ahorroBaseUF = DS1_BASE_SAVINGS_UF[tramo];

  const desglose = calculateDS1BaseScore(input);
  const puntajeBase = desglose.puntajeBaseTotal;

  const ahorroActualUF = Math.max(0, input.ahorroActualUF ?? 0);
  const excesoAhorroActualUF = Math.max(0, ahorroActualUF - ahorroBaseUF);
  const puntajeExcesoActual = calculateDS1ExcessPoints(excesoAhorroActualUF, tramo);
  const puntajeTotalActual = Number((puntajeBase + puntajeExcesoActual).toFixed(2));

  // Déficit respecto al puntaje de corte con solo el ahorro base
  const deficitPuntos = Math.max(0, Number((puntajeCorteRegion - puntajeBase).toFixed(2)));
  const excesoAhorroRequeridoUF = calculateDS1ExcessUF(deficitPuntos, tramo);
  const ahorroTotalSugeridoUF = Number((ahorroBaseUF + excesoAhorroRequeridoUF).toFixed(2));

  const puntajeProyectadoConAhorroSugerido = Number(
    (puntajeBase + calculateDS1ExcessPoints(excesoAhorroRequeridoUF, tramo)).toFixed(2)
  );

  const superaCorte = puntajeTotalActual >= puntajeCorteRegion;

  // Brecha respecto a lo que ya posee el usuario
  const brechaAhorroUF = Math.max(0, Number((ahorroTotalSugeridoUF - ahorroActualUF).toFixed(2)));

  let brechaAhorroCLP: number | null = null;
  let mesesProyectados: number | null = null;

  if (typeof input.valorUF === 'number' && input.valorUF > 0) {
    brechaAhorroCLP = Math.round(brechaAhorroUF * input.valorUF);

    if (brechaAhorroUF === 0) {
      mesesProyectados = 0;
    } else if (
      typeof input.ingresoDisponibleMensualCLP === 'number' &&
      input.ingresoDisponibleMensualCLP > 0
    ) {
      mesesProyectados = Math.ceil(brechaAhorroCLP / input.ingresoDisponibleMensualCLP);
    }
  }

  return {
    tramo,
    region,
    puntajeCorteRegion,
    puntajeBase,
    ahorroBaseUF,
    ahorroActualUF,
    excesoAhorroActualUF,
    puntajeExcesoActual,
    puntajeTotalActual,
    superaCorte,
    deficitPuntos,
    excesoAhorroRequeridoUF,
    ahorroTotalSugeridoUF,
    puntajeProyectadoConAhorroSugerido,
    brechaAhorroUF,
    brechaAhorroCLP,
    mesesProyectados,
    desglose,
  };
}

