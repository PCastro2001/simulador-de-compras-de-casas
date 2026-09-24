// src/utils/api.ts

export const DEFAULT_UF_VALUE = 41000;

/**
 * Obtiene el valor actual de la UF desde la API pública.
 * Si la API falla o demora demasiado, se consulta una fuente secundaria y
 * finalmente retorna un valor de respaldo (fallback) de 41.000 pesos.
 */
export async function fetchUFValue(): Promise<number> {
  const endpoints = [
    'https://findic.cl/api/uf',
    'https://mindicador.cl/api/uf',
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(4000), // Evita bloqueos si el servicio está lento o caído
      });

      if (!response.ok) continue;

      const data = await response.json();
      const ufValue = data?.serie?.[0]?.valor;

      if (typeof ufValue === 'number' && !isNaN(ufValue) && ufValue > 0) {
        return ufValue;
      }
    } catch (error) {
      console.warn(`⚠️ Error al consultar la API de UF (${url}):`, error);
    }
  }

  console.warn(`⚠️ No se pudo obtener la UF de ninguna API pública. Usando valor de base: $${DEFAULT_UF_VALUE}`);
  return DEFAULT_UF_VALUE;
}