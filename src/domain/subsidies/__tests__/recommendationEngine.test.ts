import { describe, it, expect } from 'vitest';
import { recommendBestSubsidy, UserSubsidyProfile } from '../recommendationEngine';

describe('recommendBestSubsidy - Orquestador y Matriz Comparativa (v1.5.0)', () => {
  it('recomienda DS49 como topMatch para perfil vulnerable (RSH 40%, sin crédito, allegado)', () => {
    const profile: UserSubsidyProfile = {
      region: 'metropolitana',
      rshPercentil: 40,
      ingresoFamiliarCLP: 450000,
      tieneCapacidadCredito: false,
      ahorroActualUF: 10,
      tipoTenencia: 'ALLEGADO',
      dormitorios: 2,
      totalPersonasVivienda: 5, // ratio 2.5 -> +140 pts
    };

    const result = recommendBestSubsidy(profile);

    expect(result.topMatch.key).toBe('ds49');
    expect(result.topMatch.subsidio).toBe('DS49');
    expect(result.topMatch.estaBloqueado).toBe(false);
    expect(result.options.length).toBe(4);
  });

  it('bloquea los 4 subsidios de compra si el usuario es PROPIETARIO de vivienda', () => {
    const profile: UserSubsidyProfile = {
      region: 'metropolitana',
      rshPercentil: 40,
      ingresoFamiliarCLP: 500000,
      tieneCapacidadCredito: true,
      ahorroActualUF: 50,
      tipoTenencia: 'PROPIETARIO',
    };

    const result = recommendBestSubsidy(profile);

    result.options.forEach((opt) => {
      expect(opt.estaBloqueado).toBe(true);
      expect(opt.motivoBloqueo).toContain('vivienda propia');
    });
  });

  it('bloquea DS49 cuando el RSH excede el 40% y recomienda DS1', () => {
    const profile: UserSubsidyProfile = {
      region: 'metropolitana',
      rshPercentil: 60,
      ingresoFamiliarCLP: 800000,
      tieneCapacidadCredito: true,
      ahorroActualUF: 30,
      tipoTenencia: 'ARRENDATARIO',
    };

    const result = recommendBestSubsidy(profile);

    const ds49 = result.options.find((o) => o.key === 'ds49');
    expect(ds49?.estaBloqueado).toBe(true);
    expect(ds49?.motivoBloqueo).toMatch(/excede el m.ximo permitido/i);

    const ds1t1 = result.options.find((o) => o.key === 'ds1_t1');
    expect(ds1t1?.estaBloqueado).toBe(false);
  });

  it('asigna puntos por copago al día de subsidio de arriendo DS52 (+80 pts cada 12 meses)', () => {
    const profileWithRent: UserSubsidyProfile = {
      region: 'metropolitana',
      rshPercentil: 60,
      ingresoFamiliarCLP: 700000,
      tieneCapacidadCredito: true,
      ahorroActualUF: 30,
      tipoTenencia: 'ARRENDATARIO',
      mesesArriendoAlDia: 24, // 2 años = +160 pts
    };

    const result = recommendBestSubsidy(profileWithRent);
    const ds1t1 = result.options.find((o) => o.key === 'ds1_t1');
    expect(ds1t1?.estaBloqueado).toBe(false);
    expect(ds1t1?.puntajeActual).toBeGreaterThanOrEqual(160);
  });
});
