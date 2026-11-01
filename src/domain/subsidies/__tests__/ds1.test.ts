import { describe, it, expect } from 'vitest';
import {
  evaluateDS1,
  calculateDS1ExcessUF,
  calculateDS1ExcessPoints,
  calculateDS1BaseScore,
  DS1PostulacionInput,
  DS1_REGIONAL_CUTOFFS_2025,
} from '../ds1';
import {
  recommendBestSubsidy,
  UserSubsidyProfile,
} from '../recommendationEngine';

describe('Motor de Cálculo DS1 y Ecuación Inversa Marginal', () => {
  // -------------------------------------------------------------------------
  // Test 1: Despeje inverso por tramos marginales en T1
  // -------------------------------------------------------------------------
  it('1. Despeje inverso por tramos marginales en T1 (ej. déficit de 280 puntos -> 80 UF exceso)', () => {
    // Especificación del requerimiento:
    // Déficit de 280 pts en T1:
    // - Primer tramo: 60 UF * 4 pts = 240 pts (restan 40 pts)
    // - Segundo tramo: 40 pts / 2 pts/UF = 20 UF
    // Total exceso = 60 UF + 20 UF = 80 UF
    const excesoCalculado = calculateDS1ExcessUF(280, 't1');
    expect(excesoCalculado).toBe(80);

    // Verificar correspondencia exacta con la función directa:
    // 80 UF de exceso debe generar exactamente 280 pts
    const puntosDirectos = calculateDS1ExcessPoints(80, 't1');
    expect(puntosDirectos).toBe(280);

    // Probar tramos marginales adicionales en T1:
    // Déficit pequeño: 100 pts -> 100 / 4 = 25 UF de exceso
    expect(calculateDS1ExcessUF(100, 't1')).toBe(25);
    expect(calculateDS1ExcessPoints(25, 't1')).toBe(100);

    // Déficit intermedio: 360 pts -> 240 (60 UF) + 100 (50 UF) + 20 (20 UF a 1 pt) = 130 UF
    expect(calculateDS1ExcessUF(360, 't1')).toBe(130);
    expect(calculateDS1ExcessPoints(130, 't1')).toBe(360);

    // Déficit profundo con tramo de cola (0.05 pts):
    // 390 pts cubren 160 UF. Si el déficit es 391 pts -> 160 + (1 / 0.05) = 180 UF
    expect(calculateDS1ExcessUF(391, 't1')).toBe(180);
    expect(calculateDS1ExcessPoints(180, 't1')).toBe(391);
  });

  // -------------------------------------------------------------------------
  // Test 2: Despeje inverso en T3 con tramos diferenciados
  // -------------------------------------------------------------------------
  it('2. Despeje inverso en T3 con tramos diferenciados (2, 1, 0.5, 0.05 pts)', () => {
    // Fase 1: hasta 60 UF a 2 pts/UF (hasta 120 pts)
    expect(calculateDS1ExcessUF(60, 't3')).toBe(30); // 60 / 2 = 30 UF
    expect(calculateDS1ExcessUF(120, 't3')).toBe(60); // 120 / 2 = 60 UF
    expect(calculateDS1ExcessPoints(60, 't3')).toBe(120);

    // Fase 2: de 60 a 110 UF a 1 pt/UF (de 120 a 170 pts)
    // Déficit de 150 pts -> 120 pts (60 UF) + 30 pts (30 UF a 1 pt) = 90 UF
    expect(calculateDS1ExcessUF(150, 't3')).toBe(90);
    expect(calculateDS1ExcessPoints(90, 't3')).toBe(150);

    // Fase 3: de 110 a 160 UF a 0.5 pts/UF (de 170 a 195 pts)
    // Déficit de 180 pts -> 170 pts (110 UF) + 10 pts (10 / 0.5 = 20 UF) = 130 UF
    expect(calculateDS1ExcessUF(180, 't3')).toBe(130);
    expect(calculateDS1ExcessPoints(130, 't3')).toBe(180);

    // Fase 4: más de 160 UF a 0.05 pts/UF
    // Déficit de 196 pts -> 195 pts (160 UF) + 1 pt (1 / 0.05 = 20 UF) = 180 UF
    expect(calculateDS1ExcessUF(196, 't3')).toBe(180);
    expect(calculateDS1ExcessPoints(180, 't3')).toBe(196);
  });

  it('2b. Validación de casos del usuario (ej. 22 pts base, corte RM 142.98, déficit 120.98 pts en T3)', () => {
    // Caso 1: 60 UF de exceso en Tramo 3
    // 80 base + 60 exceso = 140 UF total -> 60 * 2 = 120 pts
    expect(calculateDS1ExcessPoints(60, 't3')).toBe(120);

    // Caso 2: 190 UF ahorro total en Tramo 3 (110 UF de exceso)
    // 60 UF a 2 pts = 120 pts, más (110 - 60) = 50 UF a 1 pt = 50 pts -> Total = 170 pts
    expect(calculateDS1ExcessPoints(110, 't3')).toBe(170);

    // Caso 3: Postulante con 22 pts base en RM (Corte = 142.98 pts)
    // Déficit = 142.98 - 22 = 120.98 pts
    // Primeras 60 UF cubren 120 pts (restan 0.98 pts)
    // Siguiente tramo a 1 pt/UF cubre 0.98 pts -> 0.98 UF
    // Exceso necesario = 60 + 0.98 = 60.98 UF
    const deficitRM = Number((142.98 - 22).toFixed(2));
    expect(deficitRM).toBe(120.98);

    const excesoRequerido = calculateDS1ExcessUF(deficitRM, 't3');
    expect(excesoRequerido).toBe(60.98);

    // Ahorro total sugerido = 80 UF base + 60.98 UF exceso = 140.98 UF
    const ahorroTotalSugerido = Number((80 + excesoRequerido).toFixed(2));
    expect(ahorroTotalSugerido).toBe(140.98);

    // Verificación de que 60.98 UF de exceso otorga exactamente 120.98 pts
    const puntosObtenidos = calculateDS1ExcessPoints(excesoRequerido, 't3');
    expect(puntosObtenidos).toBe(120.98);
    expect(Number((22 + puntosObtenidos).toFixed(2))).toBe(142.98);
  });

  // -------------------------------------------------------------------------
  // Test 3: Ranking multitramo en recommendationEngine
  // -------------------------------------------------------------------------
  it('3. Ranking multitramo: un usuario en el 40% RSH sin crédito debe quedar con DS49 o DS1-T1 como top match', () => {
    const profileVulnerable: UserSubsidyProfile = {
      region: 'metropolitana',
      rshPercentil: 40,
      ingresoFamiliarCLP: 420000,
      tieneCapacidadCredito: false, // Sin crédito
      ahorroActualUF: 10,
      integrantesDeclarados: 2, // 2 hijos
      menoresHasta5: 1,
      dormitorios: 1,
      viviendaPrecaria: true,
      mesesLibretaAhorro: 18,
      saldoMedioCumplePermanencia: true,
      valorUF: 38000,
    };

    const recommendation = recommendBestSubsidy(profileVulnerable);

    // El top match debe ser obligatoriamente DS49 o DS1-T1 (ambos viables para 40% sin crédito)
    expect(['ds49', 'ds1_t1']).toContain(recommendation.topMatch.key);
    expect(recommendation.topMatch.esElegibleRSH).toBe(true);

    // Si es DS49, debe tener financiamiento total sin crédito
    const ds49Option = recommendation.options.find((o) => o.key === 'ds49');
    expect(ds49Option).toBeDefined();
    expect(ds49Option?.esElegibleRSH).toBe(true);
    expect(ds49Option?.requiereCredito).toBe(false);

    // Las opciones T2 y T3 deben verse penalizadas por requerir crédito
    const t2Option = recommendation.options.find((o) => o.key === 'ds1_t2');
    const t3Option = recommendation.options.find((o) => o.key === 'ds1_t3');
    expect(t2Option?.requiereCredito).toBe(true);
    expect(t2Option?.esElegibleCredito).toBe(false);
    expect(t3Option?.requiereCredito).toBe(true);
    expect(t3Option?.esElegibleCredito).toBe(false);

    // DS49 y DS1-T1 deben estar por encima de T2 y T3 en el ranking
    const rankDS49 = recommendation.options.findIndex((o) => o.key === 'ds49');
    const rankT1 = recommendation.options.findIndex((o) => o.key === 'ds1_t1');
    const rankT2 = recommendation.options.findIndex((o) => o.key === 'ds1_t2');
    const rankT3 = recommendation.options.findIndex((o) => o.key === 'ds1_t3');

    expect(rankDS49).toBeLessThan(rankT2);
    expect(rankDS49).toBeLessThan(rankT3);
    expect(rankT1).toBeLessThan(rankT2);
    expect(rankT1).toBeLessThan(rankT3);
  });

  // -------------------------------------------------------------------------
  // Tests Adicionales: Factores normativos DS1 y casos borde
  // -------------------------------------------------------------------------
  it('aplica factores normativos de familia, hacinamiento, arriendo y constancia en DS1', () => {
    const input: DS1PostulacionInput = {
      region: 'valparaiso',
      integrantesDeclarados: 3, // 3 * 40 = 120
      menoresHasta5: 1, // 1 * 30 = 30
      menores6a18: 1, // 1 * 20 = 20
      miembrosDiscapacidad: 1, // 1 * 30 = 30
      postulanteMayor60: true, // 150
      adultosMayores60: 1, // 1 * 30 = 30
      victimaValechRettig: true, // 300
      viviendaDestruida: true, // 50
      bomberosActivos: 1, // 40
      perteneceGendarmeria: true, // 40 (incompatible con militar)
      servicioMilitar: 2, // 0 pts por incompatibilidad
      dormitorios: 1, // 4 personas / 1 = 4.0 -> > 3.5 -> 270 pts hacinamiento
      semestresConstanciaAhorro: 3, // 3 * 25 = 75
      postulacionesPrevias: 2, // 2 * 25 = 50
      mesesArriendoAlDia: 25, // floor(25/12) = 2 periodos * 80 = 160 pts
    };

    const breakdown = calculateDS1BaseScore(input);

    expect(breakdown.familia.integrantesPts).toBe(120);
    expect(breakdown.familia.menoresHasta5Pts).toBe(30);
    expect(breakdown.familia.menores6a18Pts).toBe(20);
    expect(breakdown.familia.discapacidadPts).toBe(30);
    expect(breakdown.familia.postulanteMayor60Pts).toBe(150);
    expect(breakdown.familia.adultosMayoresPts).toBe(30);
    expect(breakdown.familia.valechRettigPts).toBe(300);
    expect(breakdown.familia.viviendaDestruidaPts).toBe(50);
    expect(breakdown.familia.bomberosPts).toBe(40);
    expect(breakdown.familia.gendarmeriaPts).toBe(40);
    expect(breakdown.familia.servicioMilitarPts).toBe(0);
    expect(breakdown.familia.incompatibilidadGendarmeria).toBe(true);

    expect(breakdown.hacinamiento.indice).toBe(4.0);
    expect(breakdown.hacinamiento.puntos).toBe(270);

    expect(breakdown.historialYAhorro.constanciaPts).toBe(75);
    expect(breakdown.historialYAhorro.postulacionesPts).toBe(50);
    expect(breakdown.historialYAhorro.arriendoPts).toBe(160);

    const esperadoFamilia =
      120 + 30 + 20 + 30 + 150 + 30 + 300 + 50 + 40 + 40; // 810
    expect(breakdown.familia.totalFamilia).toBe(esperadoFamilia);
    expect(breakdown.puntajeBaseTotal).toBe(
      esperadoFamilia + 270 + 75 + 50 + 160
    );
  });

  it('clasifica a un postulante de clase media con 75% RSH hacia DS1-T2 o T3', () => {
    const profileClaseMedia: UserSubsidyProfile = {
      region: 'biobio',
      rshPercentil: 75,
      ingresoFamiliarCLP: 1100000,
      tieneCapacidadCredito: true,
      ahorroActualUF: 50,
      integrantesDeclarados: 1,
      dormitorios: 2,
    };

    const recommendation = recommendBestSubsidy(profileClaseMedia);

    // DS49 y DS1-T1 deben quedar bloqueados por RSH (>40% y >60%)
    const ds49 = recommendation.options.find((o) => o.key === 'ds49');
    const t1 = recommendation.options.find((o) => o.key === 'ds1_t1');
    expect(ds49?.esElegibleRSH).toBe(false);
    expect(ds49?.estaBloqueado).toBe(true);
    expect(ds49?.motivoBloqueo).toContain('supera el 40%');
    expect(t1?.esElegibleRSH).toBe(false);
    expect(t1?.estaBloqueado).toBe(true);

    // El top match debe ser DS1-T2 o DS1-T3 (ambos elegibles para RSH 75% con crédito)
    expect(['ds1_t2', 'ds1_t3']).toContain(recommendation.topMatch.key);
    expect(recommendation.topMatch.esElegibleRSH).toBe(true);
    expect(recommendation.topMatch.esElegibleCredito).toBe(true);
    expect(recommendation.topMatch.estaBloqueado).toBe(false);
  });

  it('bloquea inmediatamente opciones que requieren crédito si el usuario indica no tener capacidad', () => {
    const profileSinCredito: UserSubsidyProfile = {
      region: 'metropolitana',
      rshPercentil: 40,
      ingresoFamiliarCLP: 450000,
      tieneCapacidadCredito: false,
      ahorroActualUF: 20,
      integrantesDeclarados: 1,
    };

    const rec = recommendBestSubsidy(profileSinCredito);

    const t2 = rec.options.find((o) => o.key === 'ds1_t2');
    const t3 = rec.options.find((o) => o.key === 'ds1_t3');
    expect(t2?.estaBloqueado).toBe(true);
    expect(t2?.motivoBloqueo).toContain('crédito');
    expect(t3?.estaBloqueado).toBe(true);
    expect(t3?.motivoBloqueo).toContain('crédito');

    // DS49 y T1 son viables sin crédito
    const ds49 = rec.options.find((o) => o.key === 'ds49');
    const t1 = rec.options.find((o) => o.key === 'ds1_t1');
    expect(ds49?.estaBloqueado).toBe(false);
    expect(t1?.estaBloqueado).toBe(false);
  });
});
