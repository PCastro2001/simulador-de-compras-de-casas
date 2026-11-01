/**
 * @file calculator.ts
 * @description Motor demográfico y habitacional para la inferencia automática del
 * percentil RSH mediante la escala oficial de adultos equivalentes (economías de escala MDSF)
 * y cálculo reactivo del índice de hacinamiento y tenencia habitacional.
 *
 * Proyecto: Subsimatch (v1.5.0)
 */

export interface RSHThreshold {
  max: number;
  percentile: number;
}

/**
 * Matriz oficial de umbrales decílicos del Registro Social de Hogares.
 * Fuente: Ministerio de Desarrollo Social y Familia (MDSF).
 */
export const RSH_THRESHOLDS: readonly RSHThreshold[] = [
  { max: 82320, percentile: 10 },
  { max: 141488, percentile: 20 },
  { max: 195510, percentile: 30 },
  { max: 246960, percentile: 40 }, // Tope DS49
  { max: 308700, percentile: 50 },
  { max: 398493, percentile: 60 }, // Tope DS1 Tramo 1
  { max: 514500, percentile: 70 },
  { max: 699720, percentile: 80 }, // Tope DS1 Tramo 2
  { max: 1151624, percentile: 90 }, // Tope DS1 Tramo 3
  { max: Infinity, percentile: 100 }, // Fuera de subsidios habitacionales
] as const;

/**
 * Estructura de Entrada para el Cálculo de RSH (v1.5.0)
 */
export interface RSHCalculationInput {
  ingresoLiquidoMensualClp?: number;
  adultosTotales?: number; // Postulante (1) + otros adultos (>= 1)
  menoresDe18?: number;
  miembrosConDiscapacidad?: number;
  postulanteEsAdultoMayor?: boolean;

  // Campos de compatibilidad retroactiva
  ingresoLiquidoFamiliar?: number;
  totalIntegrantes?: number;
  miembrosDiscapacidad?: number;
  adultosMayores60?: number;
  postulanteTieneDiscapacidad?: boolean;
}

export interface RSHCalculationResult {
  escalaEquivalencia: number;
  ingresoEquivalente: number;
  percentil: number; // 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
  tramoLabel: string;
  esHogarUnipersonal: boolean;
  detallesEscala: {
    base: number;
    adultosAdicionales: number;
    menores: number;
    ajusteDiscapacidad: number;
    ajusteAdultoMayor: number;
  };
}

/**
 * Calcula la escala oficial de adultos equivalentes de necesidades para el hogar.
 *
 * Reglas normativas:
 * 1. Hogar Unipersonal (adultosTotales === 1 && menoresDe18 === 0):
 *    Escala = 1.0 (+ 0.3 si tiene discapacidad, + 0.2 si es adulto mayor).
 * 2. Hogar Multipersonal:
 *    Escala = 1.0 (primer adulto) + ((adultosTotales - 1) * 0.7) + (menoresDe18 * 0.5) + (miembrosConDiscapacidad * 0.4).
 */
export function calculateEquivalenceScale(input: RSHCalculationInput): {
  escala: number;
  esHogarUnipersonal: boolean;
  detalles: {
    base: number;
    adultosAdicionales: number;
    menores: number;
    ajusteDiscapacidad: number;
    ajusteAdultoMayor: number;
  };
} {
  const menores = Math.max(0, input.menoresDe18 ?? 0);
  let adultos = 1;

  if (typeof input.adultosTotales === 'number' && input.adultosTotales >= 1) {
    adultos = Math.max(1, Math.round(input.adultosTotales));
  } else if (typeof input.totalIntegrantes === 'number') {
    const total = Math.max(1, Math.round(input.totalIntegrantes));
    adultos = Math.max(1, total - menores);
  }

  const discapacidad = Math.max(
    0,
    input.miembrosConDiscapacidad ?? input.miembrosDiscapacidad ?? (input.postulanteTieneDiscapacidad ? 1 : 0)
  );

  const esAdultoMayor = Boolean(
    input.postulanteEsAdultoMayor || (input.adultosMayores60 && input.adultosMayores60 > 0)
  );

  const totalIntegrantes = typeof input.totalIntegrantes === 'number'
    ? input.totalIntegrantes
    : (adultos + menores);

  const esHogarUnipersonal = totalIntegrantes === 1 && adultos === 1 && menores === 0;

  if (esHogarUnipersonal) {
    const base = 1.0;
    const ajusteDiscapacidad = discapacidad > 0 ? 0.3 : 0;
    const ajusteAdultoMayor = esAdultoMayor ? 0.2 : 0;
    const escala = Number((base + ajusteDiscapacidad + ajusteAdultoMayor).toFixed(2));

    return {
      escala,
      esHogarUnipersonal: true,
      detalles: {
        base,
        adultosAdicionales: 0,
        menores: 0,
        ajusteDiscapacidad,
        ajusteAdultoMayor,
      },
    };
  }

  // Hogar Multipersonal
  const base = 1.0;
  const factorAdultos = Number(((adultos - 1) * 0.7).toFixed(2));
  const factorMenores = Number((menores * 0.5).toFixed(2));
  const ajusteDiscapacidad = Number((discapacidad * 0.4).toFixed(2));

  const escala = Number((base + factorAdultos + factorMenores + ajusteDiscapacidad).toFixed(2));

  return {
    escala,
    esHogarUnipersonal: false,
    detalles: {
      base,
      adultosAdicionales: factorAdultos,
      menores: factorMenores,
      ajusteDiscapacidad,
      ajusteAdultoMayor: 0,
    },
  };
}

/**
 * Calcula el percentil decílico oficial del RSH según el ingreso líquido y la composición familiar.
 */
export function calculateRSH(input: RSHCalculationInput): RSHCalculationResult {
  const ingreso = Math.max(
    0,
    input.ingresoLiquidoMensualClp ?? input.ingresoLiquidoFamiliar ?? 0
  );

  const { escala, esHogarUnipersonal, detalles } = calculateEquivalenceScale(input);
  const ingresoEquivalente = escala > 0 ? ingreso / escala : ingreso;

  // Buscar el primer umbral cuyo límite superior sea >= ingresoEquivalente
  const threshold =
    RSH_THRESHOLDS.find((t) => t.max >= ingresoEquivalente) ??
    RSH_THRESHOLDS[RSH_THRESHOLDS.length - 1];

  return {
    escalaEquivalencia: escala,
    ingresoEquivalente: Math.round(ingresoEquivalente),
    percentil: threshold.percentile,
    tramoLabel: `Tramo ${threshold.percentile}%`,
    esHogarUnipersonal,
    detallesEscala: detalles,
  };
}

// =============================================================================
// MOTOR HABITACIONAL: HACINAMIENTO & TENENCIA
// =============================================================================

export type TipoTenencia = 'ALLEGADO' | 'ARRENDATARIO' | 'PROPIETARIO';

export interface HacinamientoInput {
  dormitorios: number; // Número de dormitorios en la vivienda actual (>= 1)
  totalPersonasVivienda: number; // Total de personas en la vivienda (postulante + núcleo + otros si es allegado)
  tipoTenencia: TipoTenencia;
}

export interface HacinamientoResult {
  dormitorios: number;
  totalPersonasVivienda: number;
  tipoTenencia: TipoTenencia;
  ratio: number;
  esPropietario: boolean;
  bloqueoPropietarioMensaje?: string;
  ds49: {
    ratio: number;
    puntos: number;
    categoria: 'SIN_HACINAMIENTO' | 'MEDIO' | 'CRITICO';
    descripcion: string;
  };
  ds1: {
    ratio: number;
    puntos: number;
    categoria: 'HASTA_2' | 'MAS_2_A_2_5' | 'MAS_2_5_A_3' | 'MAS_3_A_3_5' | 'MAS_3_5';
    descripcion: string;
  };
}

/**
 * Calcula automáticamente el ratio de hacinamiento y el puntaje normativo
 * correspondiente para DS49 y DS1 según dormitorios y personas totales en la vivienda.
 */
export function calculateHacinamiento(input: HacinamientoInput): HacinamientoResult {
  const dormitorios = Math.max(1, Math.round(input.dormitorios || 1));
  const totalPersonas = Math.max(1, Math.round(input.totalPersonasVivienda || 1));
  const ratio = Number((totalPersonas / dormitorios).toFixed(2));
  const esPropietario = input.tipoTenencia === 'PROPIETARIO';

  // Mapeo normativo DS49:
  // - Ratio < 2.5 -> 0 pts
  // - Ratio >= 2.5 y < 5.0 -> 140 pts
  // - Ratio >= 5.0 -> 280 pts
  let ds49Puntos = 0;
  let ds49Cat: 'SIN_HACINAMIENTO' | 'MEDIO' | 'CRITICO' = 'SIN_HACINAMIENTO';
  let ds49Desc = 'Sin hacinamiento normativo (< 2.5 personas/dormitorio)';
  if (ratio >= 5.0) {
    ds49Puntos = 280;
    ds49Cat = 'CRITICO';
    ds49Desc = 'Hacinamiento Crítico (≥ 5.0 personas/dormitorio)';
  } else if (ratio >= 2.5) {
    ds49Puntos = 140;
    ds49Cat = 'MEDIO';
    ds49Desc = 'Hacinamiento Medio (2.5 a 4.99 personas/dormitorio)';
  }

  // Mapeo normativo DS1:
  // - Ratio <= 2.0 -> HASTA_2 (0 pts)
  // - Ratio > 2.0 y <= 2.5 -> MAS_2_A_2_5 (45 pts)
  // - Ratio > 2.5 y <= 3.0 -> MAS_2_5_A_3 (90 pts)
  // - Ratio > 3.0 y <= 3.5 -> MAS_3_A_3_5 (135 pts)
  // - Ratio > 3.5 -> MAS_3_5 (270 pts)
  let ds1Puntos = 0;
  let ds1Cat: 'HASTA_2' | 'MAS_2_A_2_5' | 'MAS_2_5_A_3' | 'MAS_3_A_3_5' | 'MAS_3_5' = 'HASTA_2';
  let ds1Desc = 'Hasta 2.0 personas/dormitorio (0 pts)';
  if (ratio > 3.5) {
    ds1Puntos = 270;
    ds1Cat = 'MAS_3_5';
    ds1Desc = 'Más de 3.5 personas/dormitorio (+270 pts)';
  } else if (ratio > 3.0) {
    ds1Puntos = 135;
    ds1Cat = 'MAS_3_A_3_5';
    ds1Desc = 'Más de 3.0 a 3.5 personas/dormitorio (+135 pts)';
  } else if (ratio > 2.5) {
    ds1Puntos = 90;
    ds1Cat = 'MAS_2_5_A_3';
    ds1Desc = 'Más de 2.5 a 3.0 personas/dormitorio (+90 pts)';
  } else if (ratio > 2.0) {
    ds1Puntos = 45;
    ds1Cat = 'MAS_2_A_2_5';
    ds1Desc = 'Más de 2.0 a 2.5 personas/dormitorio (+45 pts)';
  }

  return {
    dormitorios,
    totalPersonasVivienda: totalPersonas,
    tipoTenencia: input.tipoTenencia,
    ratio,
    esPropietario,
    bloqueoPropietarioMensaje: esPropietario
      ? 'La normativa MINVU no permite postular a subsidio de compra si ya posees vivienda propia a tu nombre.'
      : undefined,
    ds49: {
      ratio,
      puntos: ds49Puntos,
      categoria: ds49Cat,
      descripcion: ds49Desc,
    },
    ds1: {
      ratio,
      puntos: ds1Puntos,
      categoria: ds1Cat,
      descripcion: ds1Desc,
    },
  };
}
