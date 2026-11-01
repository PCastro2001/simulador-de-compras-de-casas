import { describe, it, expect } from 'vitest';
import {
  calculateRSH,
  calculateEquivalenceScale,
  RSH_THRESHOLDS,
} from '../calculator';

describe('Motor de Inferencia del Registro Social de Hogares (RSH)', () => {
  it('1. Persona sola con sueldo mínimo (~$500.000) clasifica en tramo 70%', () => {
    const res = calculateRSH({
      ingresoLiquidoFamiliar: 500000,
      totalIntegrantes: 1,
    });

    expect(res.esHogarUnipersonal).toBe(true);
    expect(res.escalaEquivalencia).toBe(1.0);
    expect(res.ingresoEquivalente).toBe(500000);
    // 398.493 < 500.000 <= 514.500 -> percentile 70
    expect(res.percentil).toBe(70);
    expect(res.tramoLabel).toBe('Tramo 70%');
  });

  it('2. Persona sola con ingreso vulnerable ($200.000) clasifica en tramo 40%', () => {
    const res = calculateRSH({
      ingresoLiquidoFamiliar: 200000,
      totalIntegrantes: 1,
    });

    expect(res.esHogarUnipersonal).toBe(true);
    expect(res.escalaEquivalencia).toBe(1.0);
    expect(res.ingresoEquivalente).toBe(200000);
    // 195.510 < 200.000 <= 246.960 -> percentile 40
    expect(res.percentil).toBe(40);
    expect(res.tramoLabel).toBe('Tramo 40%');
  });

  it('3. Familia de 4 (2 adultos, 2 niños) con $2.050.000 clasifica en tramo 90%', () => {
    const res = calculateRSH({
      ingresoLiquidoFamiliar: 2050000,
      totalIntegrantes: 4,
      menoresDe18: 2,
    });

    // Escala: 1.0 (postulante) + 0.7 (1 adulto adicional) + 1.0 (2 menores * 0.5) = 2.7
    expect(res.esHogarUnipersonal).toBe(false);
    expect(res.escalaEquivalencia).toBe(2.7);
    // 2.050.000 / 2.7 = 759.259
    expect(res.ingresoEquivalente).toBe(759259);
    // 699.720 < 759.259 <= 1.151.624 -> percentile 90
    expect(res.percentil).toBe(90);
    expect(res.tramoLabel).toBe('Tramo 90%');
  });

  it('4. Ajuste por discapacidad y adulto mayor en hogar unipersonal', () => {
    // Adulto mayor solo (1.0 + 0.2 = 1.2)
    const scaleMayor = calculateEquivalenceScale({
      totalIntegrantes: 1,
      postulanteEsAdultoMayor: true,
    });
    expect(scaleMayor.escala).toBe(1.2);

    // Persona sola con discapacidad (1.0 + 0.3 = 1.3)
    const scaleDiscapacidad = calculateEquivalenceScale({
      totalIntegrantes: 1,
      postulanteTieneDiscapacidad: true,
    });
    expect(scaleDiscapacidad.escala).toBe(1.3);

    // Con $300.000 y discapacidad: 300.000 / 1.3 = 230.769 -> tramo 40% (max 246.960)
    const resDiscapacidad = calculateRSH({
      ingresoLiquidoFamiliar: 300000,
      totalIntegrantes: 1,
      postulanteTieneDiscapacidad: true,
    });
    expect(resDiscapacidad.percentil).toBe(40);
  });

  it('5. Hogar multipersonal con miembro con discapacidad (+0.4)', () => {
    // 3 personas (postulante, 1 adulto, 1 menor) con 1 miembro con discapacidad
    // Escala: 1.0 + 0.7 + 0.5 + 0.4 = 2.6
    const res = calculateRSH({
      ingresoLiquidoFamiliar: 1000000,
      totalIntegrantes: 3,
      menoresDe18: 1,
      miembrosDiscapacidad: 1,
    });

    expect(res.escalaEquivalencia).toBe(2.6);
    expect(res.ingresoEquivalente).toBe(Math.round(1000000 / 2.6)); // ~384.615
    // 308.700 < 384.615 <= 398.493 -> percentile 60
    expect(res.percentil).toBe(60);
  });

  it('6. Matriz de umbrales RSH completa y ordenada', () => {
    expect(RSH_THRESHOLDS).toHaveLength(10);
    for (let i = 0; i < RSH_THRESHOLDS.length - 1; i++) {
      expect(RSH_THRESHOLDS[i].max).toBeLessThan(RSH_THRESHOLDS[i + 1].max);
      expect(RSH_THRESHOLDS[i].percentile).toBe((i + 1) * 10);
    }
  });
});

