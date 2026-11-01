/**
 * @file ds49.ts
 * @description Motor de cálculo de puntajes y ecuación inversa para el Subsidio DS49
 * (Fondo Solidario de Elección de Vivienda - D.S. N° 49, V. y U., de 2011 y modificaciones vigentes).
 * 
 * Proyecto: Subsimatch (v1.4.1)
 */

/**
 * Regiones válidas para el subsidio DS49 y sus puntajes de corte.
 */
export type DS49Region =
  | 'arica'
  | 'tarapaca'
  | 'antofagasta'
  | 'atacama'
  | 'coquimbo'
  | 'valparaiso'
  | 'ohiggins'
  | 'maule'
  | 'nuble'
  | 'biobio'
  | 'araucania'
  | 'rios'
  | 'lagos'
  | 'aysen'
  | 'magallanes'
  | 'metropolitana';

/**
 * Puntajes de Corte Regionales Referenciales para 2025 (DS49).
 */
export const DS49_REGIONAL_CUTOFFS_2025: Readonly<Record<DS49Region, number>> = Object.freeze({
  arica: 980,
  tarapaca: 940,
  antofagasta: 940,
  atacama: 970,
  coquimbo: 940,
  valparaiso: 900,
  ohiggins: 1000,
  maule: 990,
  nuble: 980,
  biobio: 980,
  araucania: 890,
  rios: 850,
  lagos: 840,
  aysen: 750,
  magallanes: 653,
  metropolitana: 1000,
});

/**
 * Nombres oficiales formateados de las regiones para UI.
 */
export const DS49_REGION_LABELS: Readonly<Record<DS49Region, string>> = Object.freeze({
  arica: 'Arica y Parinacota',
  tarapaca: 'Tarapacá',
  antofagasta: 'Antofagasta',
  atacama: 'Atacama',
  coquimbo: 'Coquimbo',
  valparaiso: 'Valparaíso',
  ohiggins: "O'Higgins",
  maule: 'Maule',
  nuble: 'Ñuble',
  biobio: 'Biobío',
  araucania: 'La Araucanía',
  rios: 'Los Ríos',
  lagos: 'Los Lagos',
  aysen: 'Aysén',
  magallanes: 'Magallanes',
  metropolitana: 'Metropolitana',
});

/**
 * Mapeo de normalización para nombres o claves de región alternativas.
 */
const REGION_ALIAS_MAP: Record<string, DS49Region> = {
  arica: 'arica',
  'arica-y-parinacota': 'arica',
  'arica y parinacota': 'arica',
  tarapaca: 'tarapaca',
  tarapacá: 'tarapaca',
  antofagasta: 'antofagasta',
  atacama: 'atacama',
  coquimbo: 'coquimbo',
  valparaiso: 'valparaiso',
  valparaíso: 'valparaiso',
  ohiggins: 'ohiggins',
  "o'higgins": 'ohiggins',
  'bernardo-ohiggins': 'ohiggins',
  'bernardo ohiggins': 'ohiggins',
  "libertador bernardo o'higgins": 'ohiggins',
  maule: 'maule',
  nuble: 'nuble',
  ñuble: 'nuble',
  biobio: 'biobio',
  'bío bío': 'biobio',
  'bio-bio': 'biobio',
  'bío-bío': 'biobio',
  araucania: 'araucania',
  araucanía: 'araucania',
  'la-araucania': 'araucania',
  'la araucanía': 'araucania',
  rios: 'rios',
  ríos: 'rios',
  'los-rios': 'rios',
  'los ríos': 'rios',
  'de-los-rios': 'rios',
  lagos: 'lagos',
  'los-lagos': 'lagos',
  'los lagos': 'lagos',
  aysen: 'aysen',
  aysén: 'aysen',
  aisen: 'aysen',
  'aysen del general carlos ibanez': 'aysen',
  magallanes: 'magallanes',
  'magallanes-y-antartica-chilena': 'magallanes',
  'magallanes y antartica': 'magallanes',
  metropolitana: 'metropolitana',
  rm: 'metropolitana',
  santiago: 'metropolitana',
};

/**
 * Normaliza una cadena de región para obtener la clave canónica de DS49Region.
 *
 * @param regionStr Nombre o identificador de la región.
 * @returns DS49Region normalizada.
 * @throws Error si la región no es reconocida.
 */
export function normalizeDS49Region(regionStr: string): DS49Region {
  if (!regionStr || typeof regionStr !== 'string') {
    throw new Error(`Región inválida: "${regionStr}". Debe ingresar una región válida.`);
  }

  const cleaned = regionStr
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z0-9]/g, '');

  for (const [alias, canonical] of Object.entries(REGION_ALIAS_MAP)) {
    const aliasCleaned = alias
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    if (cleaned === aliasCleaned) {
      return canonical;
    }
  }

  throw new Error(`Región no reconocida para DS49: "${regionStr}".`);
}

/**
 * Parámetros de entrada para el cálculo del subsidio DS49.
 */
export interface DS49PostulacionInput {
  /**
   * Región de postulación (ej: 'metropolitana', 'valparaiso', 'biobio', etc.)
   */
  region: DS49Region | string;

  // --- FACTOR A: NÚCLEO FAMILIAR ---
  /**
   * Cantidad de integrantes declarados en el grupo familiar, excluyendo al postulante.
   * Cada uno aporta 50 puntos.
   */
  integrantesDeclarados?: number;

  /**
   * Cantidad de menores entre 6 y 18 años cumplidos. Aporta 40 puntos c/u.
   */
  menores6a18?: number;

  /**
   * Cantidad de menores de hasta 5 años (0 a 5 años cumplidos). Aporta 50 puntos adicionales c/u.
   */
  menoresHasta5?: number;

  /**
   * Adultos mayores de 60 años o más (o que cumplan 60 en el año de postulación).
   * Aporta 100 puntos c/u (incluye al postulante si cumple la edad).
   */
  adultosMayores60?: number;

  /**
   * Cantidad de integrantes acreditados como voluntarios activos del Cuerpo de Bomberos.
   * Aporta 40 puntos c/u.
   */
  bomberosActivos?: number;

  /**
   * Cantidad de integrantes con servicio militar realizado a partir del año 2004.
   * Aporta 20 puntos c/u. Incompatible si el postulante o cónyuge pertenece a Gendarmería.
   */
  servicioMilitar?: number;

  /**
   * Indica si el postulante o su cónyuge pertenece a Gendarmería de Chile.
   * Otorga 40 puntos. Incompatible con el puntaje de servicio militar.
   */
  perteneceGendarmeria?: boolean;

  // --- FACTOR B: VULNERABILIDAD HABITACIONAL ---
  /**
   * Cantidad total de dormitorios en la vivienda actual (mínimo 1 para cálculo de hacinamiento).
   * Usado para determinar: índice = (1 + integrantesDeclarados) / dormitorios.
   */
  dormitorios?: number;

  /**
   * Índice de hacinamiento explícito. Si se provee, prima sobre el cálculo con dormitorios.
   * Menor a 2.50 = 0 pts; entre 2.5 y menor a 5.0 = 140 pts; 5.0 o más = 280 pts.
   */
  indiceHacinamiento?: number;

  /**
   * Vivienda precaria: piso de tierra, pieza, mediagua, rancho/choza o material de desecho.
   * Aporta 140 puntos.
   */
  viviendaPrecaria?: boolean;

  /**
   * Distribución de agua precaria: llave en sitio fuera de la vivienda o acarreo.
   * Aporta 30 puntos.
   */
  aguaPrecaria?: boolean;

  /**
   * Sistema de baño precario: letrina, pozo negro o no dispone de servicio higiénico.
   * Red pública / fosa séptica = 0 pts; precario = 30 pts.
   */
  banoPrecario?: boolean;

  // --- FACTOR C: ANTIGÜEDAD DE LA POSTULACIÓN ---
  /**
   * Postulaciones previas individuales consecutivas o históricas no seleccionadas.
   * Aporta 40 puntos c/u (Tope máx Factor C: 160 pts).
   */
  postulacionesPreviasIndividuales?: number;

  /**
   * Postulaciones previas colectivas consecutivas o históricas no seleccionadas.
   * Aporta 80 puntos c/u (Tope máx Factor C: 160 pts).
   */
  postulacionesPreviasColectivas?: number;

  /**
   * Alias de conveniencia para postulaciones previas individuales genéricas.
   */
  postulacionesFallidas?: number;

  // --- FACTOR D: ANTIGÜEDAD Y PERMANENCIA DEL AHORRO ---
  /**
   * Meses de antigüedad de la libreta para la vivienda (1 pt por mes, máximo 40 pts).
   */
  mesesLibretaAhorro?: number;

  /**
   * Constancia de ahorro: Saldo medio mensual del semestre previo es >= 12.5% del saldo acreditado.
   * Aporta 10 puntos.
   */
  saldoMedioCumplePermanencia?: boolean;

  // --- FACTOR E: CONDICIONES ESPECIALES ---
  /**
   * Cantidad de integrantes inscritos en el Registro Nacional de Discapacidad.
   * Otorga 300 puntos directos por cada uno y activa la bonificación del 50% de (A + B + C + D).
   */
  miembrosDiscapacidad?: number;

  /**
   * Postulante o cónyuge reconocido en informe Valech o Rettig (prisión política / tortura).
   * Otorga 600 puntos directos y activa la bonificación del 50% de (A + B + C + D).
   */
  victimaValechRettig?: boolean;

  /**
   * Hogar monoparental con hijos a cargo de hasta 24 años. Otorga 150 puntos directos.
   * Incompatible si figura cónyuge o conviviente en el Registro Social de Hogares.
   */
  esMonoparentalConHijos24?: boolean;

  /**
   * Indica si figura cónyuge o conviviente en el RSH. Si es true, anula el puntaje monoparental.
   */
  tieneConyugeRSH?: boolean;

  // --- AHORRO ACTUAL Y PROYECCIÓN FINANCIERA ---
  /**
   * Ahorro actual acreditado en la libreta (en UF).
   * Mínimo exigido por norma: 10 UF (otorga 10 pts base). Cada UF adicional otorga 2 pts.
   */
  ahorroActualUF?: number;

  /**
   * Capacidad de ahorro mensual o ingreso disponible mensual destinado a vivienda (en CLP).
   */
  ingresoDisponibleMensualCLP?: number;

  /**
   * Valor de la UF en pesos chilenos (CLP) para la proyección económica.
   * Si no se especifica, no se calcula la brecha en CLP ni los meses proyectados.
   */
  valorUF?: number;
}

/**
 * Desglose detallado de los componentes de cálculo por factor.
 */
export interface DS49Breakdown {
  factorA: {
    integrantesPts: number;
    menores6a18Pts: number;
    menoresHasta5Pts: number;
    adultosMayoresPts: number;
    bomberosPts: number;
    gendarmeriaPts: number;
    servicioMilitarPts: number;
    incompatibilidadGendarmeriaAplicada: boolean;
    subtotalBruto: number;
    subtotalAplicado: number;
    topeExcedido: boolean;
  };
  factorB: {
    totalPersonas: number;
    dormitorios: number;
    indiceHacinamiento: number;
    hacinamientoPts: number;
    viviendaPrecariaPts: number;
    aguaPrecariaPts: number;
    banoPrecarioPts: number;
    totalFactorB: number;
  };
  factorC: {
    postulacionesIndividuales: number;
    postulacionesColectivas: number;
    individualesPts: number;
    colectivasPts: number;
    subtotalBruto: number;
    subtotalAplicado: number;
    topeExcedido: boolean;
  };
  factorD: {
    mesesLibreta: number;
    antiguedadLibretaPts: number;
    permanenciaAhorroPts: number;
    totalFactorD: number;
  };
  factorE: {
    discapacidadDirectoPts: number;
    valechRettigDirectoPts: number;
    monoparentalDirectoPts: number;
    incompatibilidadMonoparentalAplicada: boolean;
    totalDirectoFactorE: number;
  };
}

/**
 * Resultado integral del análisis normativo y proyección del Subsidio DS49.
 */
export interface DS49CalculationResult {
  /** Región evaluada en formato canónico */
  region: DS49Region;

  /** Puntaje de corte regional referencial (2025) */
  puntajeCorteRegion: number;

  /** Sumatoria de factores normativos base: min(600, A) + B + min(160, C) + D */
  subtotalABCD: number;

  /** Bonificación del 50% de subtotalABCD si aplica discapacidad o Valech/Rettig */
  bonificacionEspecial50: number;

  /** Indica si se aplicó la bonificación del 50% */
  aplicaBonificacionEspecial: boolean;

  /** Puntaje directo por condiciones especiales (discapacidad + Valech + monoparental) */
  puntajeEDirecto: number;

  /** Puntaje por el ahorro base reglamentario obligatorio (10 UF = 10 pts) */
  puntajeAhorroBase: number;

  /**
   * Puntaje base reglamentario:
   * Subtotal_ABCD + Bonificación + Puntaje_E_Directo + 10 (ahorro base)
   */
  puntajeBase: number;

  /** Ahorro actual ingresado por el usuario en UF */
  ahorroActualUF: number;

  /** Puntaje obtenido por el ahorro adicional actual (2 pts por cada UF sobre 10 UF) */
  puntajeAhorroExtraActual: number;

  /** Puntaje total acumulado por el postulante en el estado actual */
  puntajeTotalActual: number;

  // --- ECUACIÓN INVERSA (MINVU 2025) ---
  /**
   * Déficit de puntos respecto al corte regional con el ahorro base de 10 UF:
   * max(0, Puntaje_Corte_Region - Puntaje_Base)
   */
  deficitPuntos: number;

  /**
   * Ahorro adicional mínimo necesario en UF para cubrir el déficit:
   * ceil(Déficit / 2)
   */
  ahorroExtraRequeridoUF: number;

  /**
   * Meta de ahorro total recomendada en UF para alcanzar o superar el corte:
   * 10 + Ahorro_Extra_Requerido_UF
   */
  ahorroTotalSugeridoUF: number;

  /**
   * Puntaje proyectado que obtendría el usuario con el ahorro total sugerido
   */
  puntajeProyectadoConAhorroSugerido: number;

  /**
   * Indica si el postulante ya alcanza o supera el corte regional con su situación actual
   */
  superaCorte: boolean;

  // --- PROYECCIÓN TEMPORAL Y BRECHA FINANCIERA ---
  /**
   * Brecha en UF entre el ahorro sugerido y el ahorro que ya posee:
   * max(0, Ahorro_Total_Sugerido_UF - Ahorro_Actual_UF)
   */
  brechaAhorroUF: number;

  /**
   * Brecha monetaria en pesos chilenos (CLP) si se proporcionó valorUF
   */
  brechaAhorroCLP: number | null;

  /**
   * Meses proyectados para alcanzar la meta de ahorro, según capacidad mensual informada
   */
  mesesProyectados: number | null;

  /** Desglose analítico de puntajes para auditoría y visualización */
  desglose: DS49Breakdown;
}

/**
 * Función pura de evaluación normativa y ecuación inversa para el subsidio DS49.
 *
 * @param input Parámetros del postulante y su grupo familiar.
 * @returns Resultado completo con puntajes, ecuación inversa y proyección.
 */
export function evaluateDS49(input: DS49PostulacionInput): DS49CalculationResult {
  const region = normalizeDS49Region(input.region);
  const puntajeCorteRegion = DS49_REGIONAL_CUTOFFS_2025[region];

  // ---------------------------------------------------------------------------
  // a) Núcleo Familiar (Tope máximo: 600 puntos)
  // ---------------------------------------------------------------------------
  const integrantesDeclarados = Math.max(0, input.integrantesDeclarados ?? 0);
  const menores6a18 = Math.max(0, input.menores6a18 ?? 0);
  const menoresHasta5 = Math.max(0, input.menoresHasta5 ?? 0);
  const adultosMayores60 = Math.max(0, input.adultosMayores60 ?? 0);
  const bomberosActivos = Math.max(0, input.bomberosActivos ?? 0);
  const servicioMilitarCount = Math.max(0, input.servicioMilitar ?? 0);
  const perteneceGendarmeria = Boolean(input.perteneceGendarmeria);

  const integrantesPts = integrantesDeclarados * 50;
  const menores6a18Pts = menores6a18 * 40;
  const menoresHasta5Pts = menoresHasta5 * 50;
  const adultosMayoresPts = adultosMayores60 * 100;
  const bomberosPts = bomberosActivos * 40;

  // Incompatibilidad Gendarmería vs Servicio Militar:
  // Si pertenece a Gendarmería (40 pts), el puntaje por servicio militar es 0.
  let gendarmeriaPts = 0;
  let servicioMilitarPts = 0;
  let incompatibilidadGendarmeriaAplicada = false;

  if (perteneceGendarmeria) {
    gendarmeriaPts = 40;
    servicioMilitarPts = 0;
    if (servicioMilitarCount > 0) {
      incompatibilidadGendarmeriaAplicada = true;
    }
  } else {
    servicioMilitarPts = servicioMilitarCount * 20;
  }

  const subtotalABruto =
    integrantesPts +
    menores6a18Pts +
    menoresHasta5Pts +
    adultosMayoresPts +
    bomberosPts +
    gendarmeriaPts +
    servicioMilitarPts;

  const puntajeFactorA = Math.min(600, subtotalABruto);
  const topeAExcedido = subtotalABruto > 600;

  // ---------------------------------------------------------------------------
  // b) Vulnerabilidad Habitacional
  // ---------------------------------------------------------------------------
  const totalPersonas = 1 + integrantesDeclarados;
  const dormitorios = Math.max(1, input.dormitorios ?? 1);

  let indiceHacinamiento: number;
  if (typeof input.indiceHacinamiento === 'number' && !Number.isNaN(input.indiceHacinamiento)) {
    indiceHacinamiento = Math.max(0, input.indiceHacinamiento);
  } else {
    indiceHacinamiento = totalPersonas / dormitorios;
  }

  let hacinamientoPts = 0;
  if (indiceHacinamiento >= 5.0) {
    hacinamientoPts = 280;
  } else if (indiceHacinamiento >= 2.5) {
    hacinamientoPts = 140;
  } else {
    hacinamientoPts = 0;
  }

  const viviendaPrecariaPts = input.viviendaPrecaria ? 140 : 0;
  const aguaPrecariaPts = input.aguaPrecaria ? 30 : 0;
  const banoPrecarioPts = input.banoPrecario ? 30 : 0;

  const puntajeFactorB =
    hacinamientoPts + viviendaPrecariaPts + aguaPrecariaPts + banoPrecarioPts;

  // ---------------------------------------------------------------------------
  // c) Antigüedad de la Postulación (Tope máximo: 160 puntos)
  // ---------------------------------------------------------------------------
  const postulacionesIndiv = Math.max(
    0,
    input.postulacionesPreviasIndividuales ?? input.postulacionesFallidas ?? 0
  );
  const postulacionesColec = Math.max(0, input.postulacionesPreviasColectivas ?? 0);

  const individualesPts = postulacionesIndiv * 40;
  const colectivasPts = postulacionesColec * 80;
  const subtotalCBruto = individualesPts + colectivasPts;

  const puntajeFactorC = Math.min(160, subtotalCBruto);
  const topeCExcedido = subtotalCBruto > 160;

  // ---------------------------------------------------------------------------
  // d) Antigüedad y Permanencia del Ahorro
  // ---------------------------------------------------------------------------
  const mesesLibreta = Math.max(0, input.mesesLibretaAhorro ?? 0);
  const antiguedadLibretaPts = Math.min(40, mesesLibreta * 1);
  const permanenciaAhorroPts = input.saldoMedioCumplePermanencia ? 10 : 0;

  const puntajeFactorD = antiguedadLibretaPts + permanenciaAhorroPts;

  // ---------------------------------------------------------------------------
  // Subtotal_ABCD = min(600, Puntaje_A) + Puntaje_B + min(160, Puntaje_C) + Puntaje_D
  // ---------------------------------------------------------------------------
  const subtotalABCD = puntajeFactorA + puntajeFactorB + puntajeFactorC + puntajeFactorD;

  // ---------------------------------------------------------------------------
  // e) Condiciones Especiales y Bonificación del 50%
  // ---------------------------------------------------------------------------
  const miembrosDiscapacidad = Math.max(0, input.miembrosDiscapacidad ?? 0);
  const victimaValechRettig = Boolean(input.victimaValechRettig);
  const esMonoparental = Boolean(input.esMonoparentalConHijos24);
  const tieneConyugeRSH = Boolean(input.tieneConyugeRSH);

  const discapacidadDirectoPts = miembrosDiscapacidad * 300;
  const valechRettigDirectoPts = victimaValechRettig ? 600 : 0;

  // Monoparental incompatible si figura cónyuge o conviviente en RSH
  let monoparentalDirectoPts = 0;
  let incompatibilidadMonoparentalAplicada = false;
  if (esMonoparental) {
    if (tieneConyugeRSH) {
      monoparentalDirectoPts = 0;
      incompatibilidadMonoparentalAplicada = true;
    } else {
      monoparentalDirectoPts = 150;
    }
  }

  const puntajeEDirecto =
    discapacidadDirectoPts + valechRettigDirectoPts + monoparentalDirectoPts;

  // Bonificación del 50%: Si aplica discapacidad o Valech/Rettig
  const aplicaBonificacionEspecial = miembrosDiscapacidad > 0 || victimaValechRettig;
  const bonificacionEspecial50 = aplicaBonificacionEspecial
    ? Math.round(subtotalABCD * 0.5)
    : 0;

  // ---------------------------------------------------------------------------
  // f) Ahorro Base y Ahorro Adicional Actual
  // ---------------------------------------------------------------------------
  const puntajeAhorroBase = 0; // El ahorro base mínimo (10 UF) es requisito de entrada; no otorga puntos base por sí mismo

  // Puntaje_Base (Puntaje Total) = Subtotal_ABCD + Bonificación 50% + Puntaje_E_Directo
  const puntajeBase = subtotalABCD + bonificacionEspecial50 + puntajeEDirecto;

  const ahorroActualUF = Math.max(0, input.ahorroActualUF ?? 0);
  const extraActualUF = Math.max(0, ahorroActualUF - 10);
  // 2 pts por cada 1 UF que supere las 10 UF base (calculado con redondeo hacia abajo para UFs enteras completadas)
  const puntajeAhorroExtraActual = Math.floor(extraActualUF) * 2;
  const puntajeTotalActual = puntajeBase + puntajeAhorroExtraActual;

  // ---------------------------------------------------------------------------
  // 3. Ecuación Inversa Requerida
  // ---------------------------------------------------------------------------
  // Déficit = max(0, Puntaje_Corte_Region - Puntaje_Base)
  const deficitPuntos = Math.max(0, puntajeCorteRegion - puntajeBase);

  // Ahorro_Extra_Requerido_UF = ceil(Déficit / 2)
  const ahorroExtraRequeridoUF = Math.ceil(deficitPuntos / 2);

  // Ahorro_Total_Sugerido_UF = 10 + Ahorro_Extra_Requerido_UF
  const ahorroTotalSugeridoUF = 10 + ahorroExtraRequeridoUF;

  // Puntaje proyectado con la meta sugerida
  const puntajeProyectadoConAhorroSugerido =
    puntajeBase + ahorroExtraRequeridoUF * 2;

  const superaCorte = puntajeTotalActual >= puntajeCorteRegion;

  // ---------------------------------------------------------------------------
  // Proyección Temporal y Financiera
  // ---------------------------------------------------------------------------
  // Brecha respecto al ahorro que el usuario ya posee
  const brechaAhorroUF = Math.max(0, ahorroTotalSugeridoUF - ahorroActualUF);

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

  // ---------------------------------------------------------------------------
  // Construcción del Desglose
  // ---------------------------------------------------------------------------
  const desglose: DS49Breakdown = {
    factorA: {
      integrantesPts,
      menores6a18Pts,
      menoresHasta5Pts,
      adultosMayoresPts,
      bomberosPts,
      gendarmeriaPts,
      servicioMilitarPts,
      incompatibilidadGendarmeriaAplicada,
      subtotalBruto: subtotalABruto,
      subtotalAplicado: puntajeFactorA,
      topeExcedido: topeAExcedido,
    },
    factorB: {
      totalPersonas,
      dormitorios,
      indiceHacinamiento: Number(indiceHacinamiento.toFixed(2)),
      hacinamientoPts,
      viviendaPrecariaPts,
      aguaPrecariaPts,
      banoPrecarioPts,
      totalFactorB: puntajeFactorB,
    },
    factorC: {
      postulacionesIndividuales: postulacionesIndiv,
      postulacionesColectivas: postulacionesColec,
      individualesPts,
      colectivasPts,
      subtotalBruto: subtotalCBruto,
      subtotalAplicado: puntajeFactorC,
      topeExcedido: topeCExcedido,
    },
    factorD: {
      mesesLibreta,
      antiguedadLibretaPts,
      permanenciaAhorroPts,
      totalFactorD: puntajeFactorD,
    },
    factorE: {
      discapacidadDirectoPts,
      valechRettigDirectoPts,
      monoparentalDirectoPts,
      incompatibilidadMonoparentalAplicada,
      totalDirectoFactorE: puntajeEDirecto,
    },
  };

  return {
    region,
    puntajeCorteRegion,
    subtotalABCD,
    bonificacionEspecial50,
    aplicaBonificacionEspecial,
    puntajeEDirecto,
    puntajeAhorroBase,
    puntajeBase,
    ahorroActualUF,
    puntajeAhorroExtraActual,
    puntajeTotalActual,
    deficitPuntos,
    ahorroExtraRequeridoUF,
    ahorroTotalSugeridoUF,
    puntajeProyectadoConAhorroSugerido,
    superaCorte,
    brechaAhorroUF,
    brechaAhorroCLP,
    mesesProyectados,
    desglose,
  };
}

/**
 * Preajustes recomendados de porcentaje de ahorro mensual sobre el sueldo líquido.
 */
export type SavingsRatePreset = 5 | 10 | 15 | 'custom';

/**
 * Resultado de la proyección de ahorro temporal según tasa de ahorro mensual.
 */
export interface SavingsTimelineResult {
  /** Meta de ahorro total en UF */
  targetUF: number;
  /** Ahorro actual que posee el usuario en UF */
  currentUF: number;
  /** Brecha pendiente por ahorrar en UF */
  brechaUF: number;
  /** Brecha pendiente en pesos chilenos según la UF informada */
  brechaCLP: number;
  /** Porcentaje de ahorro mensual aplicado sobre el ingreso líquido */
  savingsRatePercentage: number;
  /** Ahorro mensual en pesos chilenos (CLP) */
  monthlySavingsCLP: number;
  /** Ahorro mensual equivalente en UF */
  monthlySavingsUF: number;
  /** Cantidad de meses estimados para cubrir la brecha (0 si no hay brecha) */
  mesesProyectados: number;
  /** Indica si la meta supera los 24 meses (mediano plazo) */
  esMedianoPlazo: boolean;
  /** Consejo estratégico normativo para postulaciones de mediano plazo */
  consejoPermanencia: string | null;
}

/**
 * Calcula la proyección temporal para alcanzar una meta de ahorro en UF en función
 * de una tasa de ahorro porcentual sobre el sueldo líquido mensual.
 *
 * @param targetUf Meta total de ahorro requerida en UF.
 * @param currentUf Ahorro actualmente acreditado en UF.
 * @param monthlyIncomeClp Ingreso líquido mensual familiar en CLP.
 * @param savingsRatePercentage Porcentaje del sueldo destinado al ahorro (ej: 5, 10, 15).
 * @param ufValueClp Valor de la UF en pesos chilenos (CLP).
 * @param customMonthlySavingsClp Monto personalizado opcional en CLP (si se ingresa cifra directa).
 * @returns SavingsTimelineResult con el desglose en UF, CLP y meses proyectados.
 */
export function calculateSavingsTimeline(
  targetUf: number,
  currentUf: number,
  monthlyIncomeClp: number,
  savingsRatePercentage: number,
  ufValueClp: number,
  customMonthlySavingsClp?: number
): SavingsTimelineResult {
  const brechaUF = Math.max(0, targetUf - currentUf);
  const brechaCLP = Math.round(brechaUF * ufValueClp);

  const monthlySavingsCLP =
    typeof customMonthlySavingsClp === 'number' && customMonthlySavingsClp > 0
      ? customMonthlySavingsClp
      : Math.round(monthlyIncomeClp * (savingsRatePercentage / 100));

  const effectivePercentage =
    monthlyIncomeClp > 0
      ? Number(((monthlySavingsCLP / monthlyIncomeClp) * 100).toFixed(1))
      : savingsRatePercentage;

  const monthlySavingsUF =
    ufValueClp > 0 ? Number((monthlySavingsCLP / ufValueClp).toFixed(2)) : 0;

  let mesesProyectados = 0;
  if (brechaUF === 0) {
    mesesProyectados = 0;
  } else if (monthlySavingsCLP > 0) {
    mesesProyectados = Math.ceil(brechaCLP / monthlySavingsCLP);
  }

  const esMedianoPlazo = mesesProyectados > 24;
  const consejoPermanencia = esMedianoPlazo
    ? 'Tu meta es a mediano plazo; mantener tu libreta activa sumará puntos por antigüedad de cuenta y permanencia.'
    : null;

  return {
    targetUF: targetUf,
    currentUF: currentUf,
    brechaUF,
    brechaCLP,
    savingsRatePercentage: effectivePercentage,
    monthlySavingsCLP,
    monthlySavingsUF,
    mesesProyectados,
    esMedianoPlazo,
    consejoPermanencia,
  };
}


