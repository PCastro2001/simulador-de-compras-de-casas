/**
 * @file calculator.ts
 * @description Motor de inferencia automática del Registro Social de Hogares (RSH)
 * basado en la escala oficial de equivalencia de necesidades (adultos equivalentes)
 * y la matriz decílica de ingresos per cápita equivalentes del Ministerio de Desarrollo Social y Familia (MDSF).
 *
 * Proyecto: Subsimatch (v1.4.1)
 */

export interface RSHThreshold {
  max: number;
  percentile: number;
}

/**
 * Matriz oficial de umbrales decílicos del Registro Social de Hogares.
 */
export const RSH_THRESHOLDS: readonly RSHThreshold[] = [
  { max: 82320, percentile: 10 },
  { max: 141488, percentile: 20 },
  { max: 195510, percentile: 30 },
  { max: 246960, percentile: 40 },
  { max: 308700, percentile: 50 },
  { max: 398493, percentile: 60 },
  { max: 514500, percentile: 70 },
  { max: 699720, percentile: 80 },
  { max: 1151624, percentile: 90 },
  { max: Infinity, percentile: 100 },
] as const;

export interface RSHCalculationInput {
  ingresoLiquidoFamiliar: number;
  totalIntegrantes: number;
  menoresDe18?: number;
  adultosMayores60?: number;
  postulanteEsAdultoMayor?: boolean;
  miembrosDiscapacidad?: number;
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
 * Calcula la escala de adultos equivalentes de necesidades para el hogar.
 */
export function calculateEquivalenceScale(input: {
  totalIntegrantes: number;
  menoresDe18?: number;
  adultosMayores60?: number;
  postulanteEsAdultoMayor?: boolean;
  miembrosDiscapacidad?: number;
  postulanteTieneDiscapacidad?: boolean;
}): {
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
  const total = Math.max(1, input.totalIntegrantes);
  const esHogarUnipersonal = total === 1;

  if (esHogarUnipersonal) {
    const base = 1.0;
    const tieneDiscapacidad = Boolean(
      input.postulanteTieneDiscapacidad || (input.miembrosDiscapacidad && input.miembrosDiscapacidad > 0)
    );
    const esMayor = Boolean(
      input.postulanteEsAdultoMayor || (input.adultosMayores60 && input.adultosMayores60 > 0)
    );

    const ajusteDiscapacidad = tieneDiscapacidad ? 0.3 : 0;
    const ajusteAdultoMayor = esMayor ? 0.2 : 0;
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
  const base = 1.0; // Postulante
  const totalMenores = Math.max(0, Math.min(input.menoresDe18 ?? 0, total - 1));
  const additionalAdults = Math.max(0, total - 1 - totalMenores);
  const totalDiscapacidad = Math.max(0, input.miembrosDiscapacidad ?? 0);

  const factorAdultos = Number((additionalAdults * 0.7).toFixed(2));
  const factorMenores = Number((totalMenores * 0.5).toFixed(2));
  const ajusteDiscapacidad = Number((totalDiscapacidad * 0.4).toFixed(2));

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
  const ingresoFamiliar = Math.max(0, input.ingresoLiquidoFamiliar);
  const { escala, esHogarUnipersonal, detalles } = calculateEquivalenceScale(input);

  const ingresoEquivalente = escala > 0 ? ingresoFamiliar / escala : ingresoFamiliar;

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

