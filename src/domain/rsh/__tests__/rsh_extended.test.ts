import { describe, it, expect } from 'vitest';
import {
  calculateRSH,
  calculateEquivalenceScale,
  calculateHacinamiento,
  RSH_THRESHOLDS,
  TipoTenencia,
} from '../calculator';

describe('Pruebas Extendidas RSH & Hacinamiento (Subsimatch v1.5.0)', () => {
  describe('1. Escala de Adultos Equivalentes e Inferencia RSH', () => {
    it('calcula la escala e inferencia para persona sola con sueldo mínimo ($500.000 -> Tramo 70%)', () => {
      const res = calculateRSH({
        ingresoLiquidoMensualClp: 500000,
        adultosTotales: 1,
        menoresDe18: 0,
        miembrosConDiscapacidad: 0,
        postulanteEsAdultoMayor: false,
      });

      expect(res.esHogarUnipersonal).toBe(true);
      expect(res.escalaEquivalencia).toBe(1.0);
      expect(res.ingresoEquivalente).toBe(500000);
      // 398.493 < 500.000 <= 514.500 -> 70%
      expect(res.percentil).toBe(70);
      expect(res.tramoLabel).toBe('Tramo 70%');
    });

    it('aplica bonificación por adulto mayor (+0.2) y discapacidad (+0.3) en hogar unipersonal', () => {
      // Adulto mayor solo
      const resMayor = calculateRSH({
        ingresoLiquidoMensualClp: 500000,
        adultosTotales: 1,
        menoresDe18: 0,
        miembrosConDiscapacidad: 0,
        postulanteEsAdultoMayor: true,
      });
      expect(resMayor.escalaEquivalencia).toBe(1.2);
      expect(resMayor.ingresoEquivalente).toBe(Math.round(500000 / 1.2)); // 416667 -> 70%

      // Persona sola con discapacidad
      const resDiscapacidad = calculateRSH({
        ingresoLiquidoMensualClp: 300000,
        adultosTotales: 1,
        menoresDe18: 0,
        miembrosConDiscapacidad: 1,
        postulanteEsAdultoMayor: false,
      });
      expect(resDiscapacidad.escalaEquivalencia).toBe(1.3);
      // 300.000 / 1.3 = 230769 <= 246.960 -> Tramo 40%
      expect(resDiscapacidad.percentil).toBe(40);
    });

    it('calcula la escala e inferencia para familia de 4 (2 adultos + 2 niños) con $2.050.000 -> Tramo 90%', () => {
      const res = calculateRSH({
        ingresoLiquidoMensualClp: 2050000,
        adultosTotales: 2,
        menoresDe18: 2,
        miembrosConDiscapacidad: 0,
        postulanteEsAdultoMayor: false,
      });

      // Escala: 1.0 (primer adulto) + (1 * 0.7) + (2 * 0.5) = 2.7
      expect(res.esHogarUnipersonal).toBe(false);
      expect(res.escalaEquivalencia).toBe(2.7);
      // 2.050.000 / 2.7 = 759259
      expect(res.ingresoEquivalente).toBe(759259);
      // 699.720 < 759259 <= 1.151.624 -> Tramo 90%
      expect(res.percentil).toBe(90);
      expect(res.tramoLabel).toBe('Tramo 90%');
    });

    it('clasifica por encima de 1.151.624 como Tramo 100% (fuera de subsidios habitacionales)', () => {
      const res = calculateRSH({
        ingresoLiquidoMensualClp: 3500000,
        adultosTotales: 2,
        menoresDe18: 1,
        miembrosConDiscapacidad: 0,
        postulanteEsAdultoMayor: false,
      });

      // Escala: 1.0 + 0.7 + 0.5 = 2.2
      // 3.500.000 / 2.2 = 1590909 > 1.151.624 -> Tramo 100%
      expect(res.percentil).toBe(100);
      expect(res.tramoLabel).toBe('Tramo 100%');
    });
  });

  describe('2. Cálculo Automático de Hacinamiento y Tenencia', () => {
    it('calcula ratio y puntajes para familia arrendataria (independiente)', () => {
      // Familia de 3 personas que arrienda un depto con 2 dormitorios
      const hac = calculateHacinamiento({
        dormitorios: 2,
        totalPersonasVivienda: 3,
        tipoTenencia: 'ARRENDATARIO',
      });

      // Ratio = 3 / 2 = 1.5
      expect(hac.ratio).toBe(1.5);
      expect(hac.esPropietario).toBe(false);
      expect(hac.bloqueoPropietarioMensaje).toBeUndefined();

      // DS49: ratio < 2.5 -> 0 pts (SIN_HACINAMIENTO)
      expect(hac.ds49.puntos).toBe(0);
      expect(hac.ds49.categoria).toBe('SIN_HACINAMIENTO');

      // DS1: ratio <= 2.0 -> 0 pts (HASTA_2)
      expect(hac.ds1.puntos).toBe(0);
      expect(hac.ds1.categoria).toBe('HASTA_2');
    });

    it('calcula hacinamiento medio para familia allegada compartiendo vivienda', () => {
      // Familia allegada: núcleo de 3 en casa de parientes donde viven 6 personas en 2 dormitorios
      const hac = calculateHacinamiento({
        dormitorios: 2,
        totalPersonasVivienda: 6,
        tipoTenencia: 'ALLEGADO',
      });

      // Ratio = 6 / 2 = 3.0
      expect(hac.ratio).toBe(3.0);
      expect(hac.esPropietario).toBe(false);

      // DS49: 2.5 <= ratio < 5.0 -> 140 pts (MEDIO)
      expect(hac.ds49.puntos).toBe(140);
      expect(hac.ds49.categoria).toBe('MEDIO');

      // DS1: 2.5 < ratio <= 3.0 -> 90 pts (MAS_2_5_A_3)
      expect(hac.ds1.puntos).toBe(90);
      expect(hac.ds1.categoria).toBe('MAS_2_5_A_3');
    });

    it('calcula hacinamiento crítico para allegamiento severo (>= 5.0 personas/dormitorio)', () => {
      // 5 personas en 1 dormitorio
      const hac = calculateHacinamiento({
        dormitorios: 1,
        totalPersonasVivienda: 5,
        tipoTenencia: 'ALLEGADO',
      });

      expect(hac.ratio).toBe(5.0);

      // DS49: ratio >= 5.0 -> 280 pts (CRITICO)
      expect(hac.ds49.puntos).toBe(280);
      expect(hac.ds49.categoria).toBe('CRITICO');

      // DS1: ratio > 3.5 -> 270 pts (MAS_3_5)
      expect(hac.ds1.puntos).toBe(270);
      expect(hac.ds1.categoria).toBe('MAS_3_5');
    });

    it('activa bloqueo preventivo global si tenencia es PROPIETARIO', () => {
      const hac = calculateHacinamiento({
        dormitorios: 3,
        totalPersonasVivienda: 4,
        tipoTenencia: 'PROPIETARIO',
      });

      expect(hac.esPropietario).toBe(true);
      expect(hac.bloqueoPropietarioMensaje).toContain(
        'La normativa MINVU no permite postular a subsidio de compra si ya posees vivienda propia'
      );
    });
  });
});

