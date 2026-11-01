import { describe, it, expect } from 'vitest';
import {
  evaluateDS49,
  normalizeDS49Region,
  DS49_REGIONAL_CUTOFFS_2025,
  calculateSavingsTimeline,
  DS49PostulacionInput,
} from '../ds49';

describe('Motor de Cálculo DS49 - Subsimatch', () => {
  // -------------------------------------------------------------------------
  // Test 1: Caso estándar de familia vulnerable sin condiciones especiales
  // -------------------------------------------------------------------------
  it('1. Caso estándar de familia vulnerable sin condiciones especiales', () => {
    // Postulante + cónyuge + 2 hijos (uno de 4 años y otro de 10 años)
    // 3 integrantes declarados (excluye al postulante)
    // 1 menor de 4 años (menor hasta 5 años)
    // 1 menor de 10 años (menor entre 6 y 18 años)
    // Vivienda: 1 dormitorio -> índice hacinamiento = (1 + 3) / 1 = 4.0 (rango 2.5 a 5.0 -> 140 pts)
    // Vivienda precaria = true (140 pts)
    // Agua regular = false (0 pts)
    // Baño regular = false (0 pts)
    // 2 postulaciones previas individuales (2 * 40 = 80 pts)
    // Libreta: 20 meses (20 pts), saldo constante = true (10 pts)
    // Región Metropolitana (corte: 1000)
    // Ahorro actual: 10 UF
    // Capacidad ahorro mensual: $38.000 CLP, valor UF: $38.000 CLP
    const input: DS49PostulacionInput = {
      region: 'metropolitana',
      integrantesDeclarados: 3,
      menoresHasta5: 1,
      menores6a18: 1,
      dormitorios: 1,
      viviendaPrecaria: true,
      aguaPrecaria: false,
      banoPrecario: false,
      postulacionesPreviasIndividuales: 2,
      mesesLibretaAhorro: 20,
      saldoMedioCumplePermanencia: true,
      ahorroActualUF: 10,
      valorUF: 38000,
      ingresoDisponibleMensualCLP: 380000,
    };

    const result = evaluateDS49(input);

    // Factor A:
    // 3 integrantes * 50 = 150 pts
    // 1 menor (6-18) * 40 = 40 pts
    // 1 menor (<=5) * 50 = 50 pts
    // Total A = 240 pts (menor al tope de 600)
    expect(result.desglose.factorA.integrantesPts).toBe(150);
    expect(result.desglose.factorA.menores6a18Pts).toBe(40);
    expect(result.desglose.factorA.menoresHasta5Pts).toBe(50);
    expect(result.desglose.factorA.subtotalAplicado).toBe(240);
    expect(result.desglose.factorA.topeExcedido).toBe(false);

    // Factor B:
    // 4 personas / 1 dormitorio = 4.0 -> 140 pts
    // Vivienda precaria = 140 pts
    // Total B = 280 pts
    expect(result.desglose.factorB.indiceHacinamiento).toBe(4.0);
    expect(result.desglose.factorB.hacinamientoPts).toBe(140);
    expect(result.desglose.factorB.viviendaPrecariaPts).toBe(140);
    expect(result.desglose.factorB.totalFactorB).toBe(280);

    // Factor C:
    // 2 postulaciones individuales * 40 = 80 pts (tope 160)
    expect(result.desglose.factorC.subtotalAplicado).toBe(80);
    expect(result.desglose.factorC.topeExcedido).toBe(false);

    // Factor D:
    // 20 meses = 20 pts + 10 pts permanencia = 30 pts
    expect(result.desglose.factorD.antiguedadLibretaPts).toBe(20);
    expect(result.desglose.factorD.permanenciaAhorroPts).toBe(10);
    expect(result.desglose.factorD.totalFactorD).toBe(30);

    // Subtotal ABCD = 240 + 280 + 80 + 30 = 630 pts
    expect(result.subtotalABCD).toBe(630);

    // Sin condiciones especiales ni bonificación 50%
    expect(result.aplicaBonificacionEspecial).toBe(false);
    expect(result.bonificacionEspecial50).toBe(0);
    expect(result.puntajeEDirecto).toBe(0);

    // Puntaje Base = 630 (ABCD) + 0 + 0 + 10 (ahorro base) = 640 pts
    expect(result.puntajeAhorroBase).toBe(10);
    expect(result.puntajeBase).toBe(640);
    expect(result.puntajeTotalActual).toBe(640);

    // Corte Metropolitana = 1000 pts
    expect(result.puntajeCorteRegion).toBe(1000);
    // Déficit = 1000 - 640 = 360 pts
    expect(result.deficitPuntos).toBe(360);

    // Ecuación Inversa:
    // Ahorro extra = ceil(360 / 2) = 180 UF
    // Ahorro total sugerido = 10 + 180 = 190 UF
    expect(result.ahorroExtraRequeridoUF).toBe(180);
    expect(result.ahorroTotalSugeridoUF).toBe(190);
    expect(result.puntajeProyectadoConAhorroSugerido).toBe(1000);
    expect(result.superaCorte).toBe(false);

    // Proyección financiera:
    // Brecha UF respecto a los 10 UF actuales: 190 - 10 = 180 UF
    // Brecha CLP = 180 * 38.000 = 6.840.000 CLP
    // Meses con ahorro disponible de $380.000 CLP/mes = ceil(6.840.000 / 380.000) = 18 meses
    expect(result.brechaAhorroUF).toBe(180);
    expect(result.brechaAhorroCLP).toBe(6840000);
    expect(result.mesesProyectados).toBe(18);
  });

  // -------------------------------------------------------------------------
  // Test 2: Caso con tope de 600 pts en núcleo familiar
  // -------------------------------------------------------------------------
  it('2. Caso con tope de 600 pts en núcleo familiar', () => {
    // Familia numerosa:
    // 8 integrantes declarados: 8 * 50 = 400 pts
    // 3 menores hasta 5 años: 3 * 50 = 150 pts
    // 2 adultos mayores de 60 años: 2 * 100 = 200 pts
    // 1 bombero activo: 40 pts
    // Subtotal bruto = 400 + 150 + 200 + 40 = 790 pts
    // El tope legal debe limitar el Factor A a 600 pts
    const input: DS49PostulacionInput = {
      region: 'valparaiso',
      integrantesDeclarados: 8,
      menoresHasta5: 3,
      adultosMayores60: 2,
      bomberosActivos: 1,
      dormitorios: 2,
    };

    const result = evaluateDS49(input);

    expect(result.desglose.factorA.subtotalBruto).toBe(790);
    expect(result.desglose.factorA.subtotalAplicado).toBe(600);
    expect(result.desglose.factorA.topeExcedido).toBe(true);

    // Verificar que en Subtotal ABCD se utiliza exactamente el tope de 600 pts
    expect(result.subtotalABCD).toBe(
      600 +
        result.desglose.factorB.totalFactorB +
        result.desglose.factorC.subtotalAplicado +
        result.desglose.factorD.totalFactorD
    );
  });

  // -------------------------------------------------------------------------
  // Test 3: Caso con bonificación del 50% por discapacidad o Valech
  // -------------------------------------------------------------------------
  it('3. Caso con bonificación del 50% por discapacidad/Valech', () => {
    // Caso 3.1: Con integrante en Registro Nacional de Discapacidad
    const inputDiscapacidad: DS49PostulacionInput = {
      region: 'biobio',
      integrantesDeclarados: 2, // 100 pts
      dormitorios: 1, // 3 personas / 1 = 3.0 -> 140 pts
      viviendaPrecaria: true, // 140 pts
      mesesLibretaAhorro: 20, // 20 pts
      miembrosDiscapacidad: 1, // 300 pts directos + 50% bonificación de ABCD
    };

    const resDiscapacidad = evaluateDS49(inputDiscapacidad);

    // Subtotal ABCD:
    // A = 2 * 50 = 100
    // B = 140 (hacinamiento) + 140 (vivienda) = 280
    // C = 0
    // D = 20
    // Subtotal ABCD = 100 + 280 + 0 + 20 = 400 pts
    expect(resDiscapacidad.subtotalABCD).toBe(400);

    // Bonificación 50% de 400 = 200 pts
    expect(resDiscapacidad.aplicaBonificacionEspecial).toBe(true);
    expect(resDiscapacidad.bonificacionEspecial50).toBe(200);

    // Factor E directo: 1 * 300 = 300 pts
    expect(resDiscapacidad.desglose.factorE.discapacidadDirectoPts).toBe(300);
    expect(resDiscapacidad.puntajeEDirecto).toBe(300);

    // Puntaje Base = 400 (ABCD) + 200 (bonif 50%) + 300 (E directo) + 10 (ahorro base) = 910 pts
    expect(resDiscapacidad.puntajeBase).toBe(910);

    // Corte Biobío = 980 pts. Déficit = 980 - 910 = 70 pts
    expect(resDiscapacidad.puntajeCorteRegion).toBe(980);
    expect(resDiscapacidad.deficitPuntos).toBe(70);
    expect(resDiscapacidad.ahorroExtraRequeridoUF).toBe(35); // ceil(70 / 2) = 35 UF
    expect(resDiscapacidad.ahorroTotalSugeridoUF).toBe(45); // 10 + 35 = 45 UF

    // Caso 3.2: Víctima Valech / Rettig
    const inputValech: DS49PostulacionInput = {
      region: 'araucania', // Corte 890
      integrantesDeclarados: 1, // 50 pts
      viviendaPrecaria: true, // 140 pts
      mesesLibretaAhorro: 10, // 10 pts
      victimaValechRettig: true, // 600 pts directos + 50% bonificación de ABCD
    };

    const resValech = evaluateDS49(inputValech);

    // Subtotal ABCD = 50 + 140 + 0 + 10 = 200 pts
    expect(resValech.subtotalABCD).toBe(200);
    // Bonificación 50% = 100 pts
    expect(resValech.bonificacionEspecial50).toBe(100);
    // Valech directo = 600 pts
    expect(resValech.desglose.factorE.valechRettigDirectoPts).toBe(600);
    expect(resValech.puntajeEDirecto).toBe(600);

    // Puntaje base = 200 + 100 + 600 + 10 = 910 pts
    expect(resValech.puntajeBase).toBe(910);
    // Corte Araucanía = 890. 910 > 890 => supera corte, déficit 0!
    expect(resValech.superaCorte).toBe(true);
    expect(resValech.deficitPuntos).toBe(0);
    expect(resValech.ahorroExtraRequeridoUF).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 4: Caso donde el usuario ya supera el puntaje de corte (Ahorro Extra = 0 UF)
  // -------------------------------------------------------------------------
  it('4. Caso donde el usuario ya supera el puntaje de corte (Ahorro Extra = 0 UF)', () => {
    // Región Magallanes: Corte 653 pts
    // Familia vulnerable con puntaje base superior a 653
    const input: DS49PostulacionInput = {
      region: 'magallanes',
      integrantesDeclarados: 4, // 200 pts
      menoresHasta5: 1, // 50 pts
      menores6a18: 1, // 40 pts
      adultosMayores60: 1, // 100 pts
      // Factor A = 390 pts
      dormitorios: 1, // 5 personas / 1 = 5.0 -> hacinamiento crítico 280 pts
      viviendaPrecaria: true, // 140 pts
      // Factor B = 420 pts
      mesesLibretaAhorro: 40, // 40 pts
      saldoMedioCumplePermanencia: true, // 10 pts
      // Factor D = 50 pts
      ahorroActualUF: 15, // Ya tiene 15 UF (cumple holgadamente el mínimo de 10)
    };

    const result = evaluateDS49(input);

    expect(result.puntajeCorteRegion).toBe(653);
    // Subtotal ABCD = 390 + 420 + 0 + 50 = 860 pts
    expect(result.subtotalABCD).toBe(860);
    // Puntaje base = 860 + 0 + 0 + 10 = 870 pts
    expect(result.puntajeBase).toBe(870);
    expect(result.puntajeBase).toBeGreaterThan(653);

    // Al superar el corte regional:
    expect(result.deficitPuntos).toBe(0);
    expect(result.ahorroExtraRequeridoUF).toBe(0);
    expect(result.ahorroTotalSugeridoUF).toBe(10);
    expect(result.superaCorte).toBe(true);

    // Brecha de ahorro en UF respecto al ahorro actual (15 UF vs meta 10 UF)
    expect(result.brechaAhorroUF).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Test 5: Verificación de incompatibilidad entre Gendarmería y Servicio Militar
  // -------------------------------------------------------------------------
  it('5. Verificación de incompatibilidad entre Gendarmería y Servicio Militar', () => {
    // Escenario A: Usuario selecciona Gendarmería Y Servicio Militar simultáneamente
    const inputConAmbos: DS49PostulacionInput = {
      region: 'ohiggins',
      integrantesDeclarados: 1,
      perteneceGendarmeria: true,
      servicioMilitar: 2, // 2 integrantes hicieron servicio militar
    };

    const resAmbos = evaluateDS49(inputConAmbos);

    // Gendarmería debe sumar 40 pts
    expect(resAmbos.desglose.factorA.gendarmeriaPts).toBe(40);
    // Servicio militar debe ser 0 pts debido a la incompatibilidad
    expect(resAmbos.desglose.factorA.servicioMilitarPts).toBe(0);
    expect(resAmbos.desglose.factorA.incompatibilidadGendarmeriaAplicada).toBe(true);
    // Total Factor A: 50 (integrante) + 40 (gendarmería) + 0 (militar) = 90 pts
    expect(resAmbos.desglose.factorA.subtotalBruto).toBe(90);

    // Escenario B: Usuario NO pertenece a Gendarmería y tiene Servicio Militar
    const inputSoloMilitar: DS49PostulacionInput = {
      region: 'ohiggins',
      integrantesDeclarados: 1,
      perteneceGendarmeria: false,
      servicioMilitar: 2,
    };

    const resMilitar = evaluateDS49(inputSoloMilitar);

    expect(resMilitar.desglose.factorA.gendarmeriaPts).toBe(0);
    expect(resMilitar.desglose.factorA.servicioMilitarPts).toBe(40); // 2 * 20 = 40 pts
    expect(resMilitar.desglose.factorA.incompatibilidadGendarmeriaAplicada).toBe(false);
    expect(resMilitar.desglose.factorA.subtotalBruto).toBe(90);

    // Escenario C: Usuario con Gendarmería pero sin servicio militar
    const inputSoloGendarmeria: DS49PostulacionInput = {
      region: 'ohiggins',
      integrantesDeclarados: 1,
      perteneceGendarmeria: true,
      servicioMilitar: 0,
    };

    const resGendarmeria = evaluateDS49(inputSoloGendarmeria);
    expect(resGendarmeria.desglose.factorA.gendarmeriaPts).toBe(40);
    expect(resGendarmeria.desglose.factorA.servicioMilitarPts).toBe(0);
    expect(resGendarmeria.desglose.factorA.incompatibilidadGendarmeriaAplicada).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Tests Adicionales: Robustez, Casos Borde y Reglas Complementarias
  // -------------------------------------------------------------------------
  describe('Pruebas complementarias y casos borde', () => {
    it('aplica tope de 160 puntos en Antigüedad de Postulación (Factor C)', () => {
      // 5 postulaciones individuales * 40 = 200 pts -> Debe topar a 160 pts
      const input: DS49PostulacionInput = {
        region: 'coquimbo',
        postulacionesPreviasIndividuales: 5,
      };

      const result = evaluateDS49(input);
      expect(result.desglose.factorC.subtotalBruto).toBe(200);
      expect(result.desglose.factorC.subtotalAplicado).toBe(160);
      expect(result.desglose.factorC.topeExcedido).toBe(true);

      // 3 postulaciones colectivas * 80 = 240 pts -> Debe topar a 160 pts
      const inputColectiva: DS49PostulacionInput = {
        region: 'coquimbo',
        postulacionesPreviasColectivas: 3,
      };
      const resCol = evaluateDS49(inputColectiva);
      expect(resCol.desglose.factorC.subtotalBruto).toBe(240);
      expect(resCol.desglose.factorC.subtotalAplicado).toBe(160);
      expect(resCol.desglose.factorC.topeExcedido).toBe(true);
    });

    it('aplica incompatibilidad monoparental si figura cónyuge/conviviente en RSH', () => {
      // Monoparental válido sin cónyuge en RSH -> 150 pts
      const inputValido: DS49PostulacionInput = {
        region: 'maule',
        esMonoparentalConHijos24: true,
        tieneConyugeRSH: false,
      };
      const resValido = evaluateDS49(inputValido);
      expect(resValido.desglose.factorE.monoparentalDirectoPts).toBe(150);
      expect(resValido.desglose.factorE.incompatibilidadMonoparentalAplicada).toBe(false);

      // Monoparental con cónyuge en RSH -> 0 pts
      const inputInvalido: DS49PostulacionInput = {
        region: 'maule',
        esMonoparentalConHijos24: true,
        tieneConyugeRSH: true,
      };
      const resInvalido = evaluateDS49(inputInvalido);
      expect(resInvalido.desglose.factorE.monoparentalDirectoPts).toBe(0);
      expect(resInvalido.desglose.factorE.incompatibilidadMonoparentalAplicada).toBe(true);
    });

    it('normaliza correctamente nombres y alias de regiones con y sin acentos', () => {
      expect(normalizeDS49Region('Valparaíso')).toBe('valparaiso');
      expect(normalizeDS49Region('arica-y-parinacota')).toBe('arica');
      expect(normalizeDS49Region("O'Higgins")).toBe('ohiggins');
      expect(normalizeDS49Region('Ñuble')).toBe('nuble');
      expect(normalizeDS49Region('Bío-Bío')).toBe('biobio');
      expect(normalizeDS49Region('Los Ríos')).toBe('rios');
      expect(normalizeDS49Region('Los Lagos')).toBe('lagos');
      expect(normalizeDS49Region('Aysén')).toBe('aysen');
      expect(normalizeDS49Region('Magallanes y Antártica Chilena')).toBe('magallanes');
      expect(normalizeDS49Region('RM')).toBe('metropolitana');
    });

    it('calcula correctamente todos los puntajes de corte regional referenciales 2025', () => {
      const regions = Object.keys(DS49_REGIONAL_CUTOFFS_2025) as (keyof typeof DS49_REGIONAL_CUTOFFS_2025)[];
      for (const reg of regions) {
        const res = evaluateDS49({ region: reg });
        expect(res.puntajeCorteRegion).toBe(DS49_REGIONAL_CUTOFFS_2025[reg]);
      }
    });

    it('proyecta meses como 0 cuando el ahorro sugerido ya está cubierto', () => {
      const result = evaluateDS49({
        region: 'aysen', // Corte 750
        integrantesDeclarados: 4, // 200
        dormitorios: 1, // 5 / 1 = 5.0 -> 280
        viviendaPrecaria: true, // 140
        mesesLibretaAhorro: 40, // 40
        saldoMedioCumplePermanencia: true, // 10
        // ABCD = 670 + 10 = 680 pts base
        // Déficit = 750 - 680 = 70 pts
        // Ahorro extra = 35 UF -> Meta = 45 UF
        ahorroActualUF: 50, // Ya posee 50 UF
        valorUF: 38000,
        ingresoDisponibleMensualCLP: 100000,
      });

      expect(result.ahorroTotalSugeridoUF).toBe(45);
      expect(result.brechaAhorroUF).toBe(0);
      expect(result.brechaAhorroCLP).toBe(0);
      expect(result.mesesProyectados).toBe(0);
    });

    describe('calculateSavingsTimeline (proyección por tasa porcentual)', () => {
      it('calcula correctamente la proyección al 10% (ahorro recomendado)', () => {
        // Meta: 50 UF, Ahorro actual: 10 UF -> Brecha: 40 UF
        // Ingreso: $500.000 CLP, Tasa: 10% -> Ahorro mensual: $50.000 CLP
        // Valor UF: $38.000 CLP -> Brecha CLP: 40 * 38.000 = $1.520.000 CLP
        // Meses: ceil(1.520.000 / 50.000) = 31 meses (> 24 meses => mediano plazo)
        const timeline = calculateSavingsTimeline(50, 10, 500000, 10, 38000);

        expect(timeline.targetUF).toBe(50);
        expect(timeline.currentUF).toBe(10);
        expect(timeline.brechaUF).toBe(40);
        expect(timeline.brechaCLP).toBe(1520000);
        expect(timeline.monthlySavingsCLP).toBe(50000);
        expect(timeline.savingsRatePercentage).toBe(10);
        expect(timeline.mesesProyectados).toBe(31);
        expect(timeline.esMedianoPlazo).toBe(true);
        expect(timeline.consejoPermanencia).toContain('antigüedad de cuenta y permanencia');
      });

      it('calcula proyección acelerada al 15% reduciendo los meses', () => {
        // Ahorro mensual: 15% de $500.000 = $75.000 CLP
        // Meses: ceil(1.520.000 / 75.000) = 21 meses (<= 24 meses => no mediano plazo)
        const timeline = calculateSavingsTimeline(50, 10, 500000, 15, 38000);

        expect(timeline.monthlySavingsCLP).toBe(75000);
        expect(timeline.mesesProyectados).toBe(21);
        expect(timeline.esMedianoPlazo).toBe(false);
        expect(timeline.consejoPermanencia).toBeNull();
      });

      it('maneja caso donde el usuario ya tiene o supera el ahorro requerido', () => {
        const timeline = calculateSavingsTimeline(20, 25, 500000, 10, 38000);

        expect(timeline.brechaUF).toBe(0);
        expect(timeline.brechaCLP).toBe(0);
        expect(timeline.mesesProyectados).toBe(0);
        expect(timeline.esMedianoPlazo).toBe(false);
      });

      it('soporta monto de ahorro personalizado en CLP', () => {
        // Usuario ingresa $100.000 CLP fijos mensuales directamente
        const timeline = calculateSavingsTimeline(50, 10, 500000, 0, 38000, 100000);

        expect(timeline.monthlySavingsCLP).toBe(100000);
        // 1.520.000 / 100.000 = 15.2 -> 16 meses
        expect(timeline.mesesProyectados).toBe(16);
        expect(timeline.savingsRatePercentage).toBe(20); // 100.000 / 500.000 = 20%
      });
    });
  });
});

