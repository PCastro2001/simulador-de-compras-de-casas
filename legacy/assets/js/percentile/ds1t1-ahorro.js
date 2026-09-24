// 1. DICCIONARIO DE PUNTAJES DE CORTE (DS1 TRAMO 1 - PRIMER LLAMADO 2025)
const PUNTAJES_CORTE_T1 = {
    arica: 598.30,
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
    metropolitana: 578.09
};

// Constantes del subsidio
const AHORRO_MINIMO_T1 = 30; // UF

// 2. FUNCIÓN PARA OBTENER LA UF (Mismo método que ya usas)
async function fetchUFValue() {
    try {
        const response = await fetch('https://findic.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        document.getElementById('uf-value').value = ufValue;
        return ufValue;
    } catch (error) {
        console.error('Error al obtener la UF:', error);
        return 41000; // Valor fallback por si falla la API
    }
}

// Cargar la UF al iniciar
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
});

// 3. LÓGICA DE CÁLCULO PRINCIPAL
document.getElementById('ds1t1-ahorro-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    // -- A. OBTENER DATOS DEL FORMULARIO --
    const region = document.getElementById('region').value;
    const integrantesExtra = parseInt(document.getElementById('integrantes-extra').value) || 0;
    const menores5 = parseInt(document.getElementById('menores-5').value) || 0;
    const menores18 = parseInt(document.getElementById('menores-18').value) || 0;
    const adultosMayores = parseInt(document.getElementById('adultos-mayores').value) || 0;
    const discapacidad = parseInt(document.getElementById('discapacidad').value) || 0;
    
    const postulanteMayor = document.getElementById('postulante-mayor').value === 'si';
    const monoparental = document.getElementById('monoparental').value === 'si';
    const victimaPolitica = document.getElementById('victima-politica').value === 'si';
    const bombero = document.getElementById('bombero').value === 'si';
    const gendarmeria = document.getElementById('gendarmeria').value === 'si';
    const servicioMilitar = parseInt(document.getElementById('servicio-militar').value) || 0;
    const viviendaDestruida = document.getElementById('vivienda-destruida').value === 'si';
    
    const dormitorios = parseInt(document.getElementById('dormitorios').value) || 1;
    const postulacionesFallidas = parseInt(document.getElementById('postulaciones-fallidas').value) || 0;
    const mesesDs52 = parseInt(document.getElementById('meses-ds52').value) || 0;
    const constanciaAhorro = parseInt(document.getElementById('constancia-ahorro').value) || 0;

    // -- B. CÁLCULO DEL PUNTAJE BASE --
    let puntajeBase = 0;

    // Familia
    puntajeBase += (integrantesExtra * 40);
    puntajeBase += (menores5 * 30);
    puntajeBase += (menores18 * 20);
    puntajeBase += (adultosMayores * 30);
    puntajeBase += (discapacidad * 30);
    
    if (postulanteMayor) puntajeBase += 150;
    if (monoparental) puntajeBase += 35;

    // Condiciones Especiales
    if (victimaPolitica) puntajeBase += 300;
    if (bombero) puntajeBase += 40;
    if (viviendaDestruida) puntajeBase += 50;
    if (gendarmeria) puntajeBase += 40;
    puntajeBase += (servicioMilitar * 20); 

    // Historial y Constancia
    puntajeBase += (postulacionesFallidas * 25);
    
    // Arriendo DS52 (80 pts por cada 12 meses, máximo 240)
    let anosArriendo = Math.floor(mesesDs52 / 12);
    let puntosArriendo = anosArriendo * 80;
    if (puntosArriendo > 240) puntosArriendo = 240;
    puntajeBase += puntosArriendo;

    puntajeBase += constanciaAhorro;

    // Hacinamiento
    const totalPersonas = integrantesExtra + 1; // +1 por el postulante
    const indiceHacinamiento = totalPersonas / dormitorios;
    
    if (indiceHacinamiento > 3.5) {
        puntajeBase += 270;
    } else if (indiceHacinamiento > 3.0) {
        puntajeBase += 135;
    } else if (indiceHacinamiento > 2.5) {
        puntajeBase += 90;
    } else if (indiceHacinamiento > 2.0) {
        puntajeBase += 45;
    } // "Hasta 2" no suma puntos.

    // -- C. CÁLCULO DE LA BRECHA Y EL AHORRO --
    const puntajeCorte = PUNTAJES_CORTE_T1[region];
    let puntosFaltantes = puntajeCorte - puntajeBase;
    
    let ufExtraNecesarias = 0;

    if (puntosFaltantes > 0) {
        // Fórmula de Exceso para TRAMO 1 y 2
        let puntosPorCubrir = puntosFaltantes;

        // Tramo 1 de exceso (hasta 60 UF) a 4 puntos c/u
        let maxPuntosFase1 = 60 * 4; // 240 pts
        if (puntosPorCubrir <= maxPuntosFase1) {
            ufExtraNecesarias += puntosPorCubrir / 4;
            puntosPorCubrir = 0;
        } else {
            ufExtraNecesarias += 60;
            puntosPorCubrir -= maxPuntosFase1;
        }

        // Tramo 2 de exceso (de la 61 a 110 = 50 UF) a 2 puntos c/u
        if (puntosPorCubrir > 0) {
            let maxPuntosFase2 = 50 * 2; // 100 pts
            if (puntosPorCubrir <= maxPuntosFase2) {
                ufExtraNecesarias += puntosPorCubrir / 2;
                puntosPorCubrir = 0;
            } else {
                ufExtraNecesarias += 50;
                puntosPorCubrir -= maxPuntosFase2;
            }
        }

        // Tramo 3 de exceso (de la 111 a 160 = 50 UF) a 1 punto c/u
        if (puntosPorCubrir > 0) {
            let maxPuntosFase3 = 50 * 1; // 50 pts
            if (puntosPorCubrir <= maxPuntosFase3) {
                ufExtraNecesarias += puntosPorCubrir / 1;
                puntosPorCubrir = 0;
            } else {
                ufExtraNecesarias += 50;
                puntosPorCubrir -= maxPuntosFase3;
            }
        }

        // Tramo Final (más de 160 UF de exceso) a 0.05 puntos c/u
        if (puntosPorCubrir > 0) {
            ufExtraNecesarias += puntosPorCubrir / 0.05;
        }
    }

    // -- D. MOSTRAR RESULTADOS --
    let ahorroTotalUF = AHORRO_MINIMO_T1 + ufExtraNecesarias;
    
    const ufInput = document.getElementById('uf-value').value;
    const ufActual = parseFloat(ufInput) || await fetchUFValue();
    const ahorroTotalCLP = ahorroTotalUF * ufActual;

    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block';
    
    // Formatear pesos chilenos
    const formatCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(ahorroTotalCLP);

    if (puntosFaltantes <= 0) {
        resultsDiv.innerHTML = `
            <h2 style="color: #4CAF50;">¡Excelente noticia!</h2>
            <p>Con tu situación familiar actual, tu puntaje base es de <strong>${puntajeBase} puntos</strong>.</p>
            <p>Esto supera el puntaje de corte histórico de tu región (${puntajeCorte} pts). ¡Solo necesitas el ahorro mínimo exigido por ley para asegurar tu subsidio!</p>
            <hr>
            <h3>Ahorro Seguro: ${AHORRO_MINIMO_T1} UF</h3>
            <p>Aprox: ${formatCLP}</p>
        `;
    } else {
        // AQUÍ ESTÁ EL GRAN CAMBIO: Evaluamos si el ahorro es excesivo
        if (ahorroTotalUF > 250) {
            resultsDiv.innerHTML = `
                <h2>Resultado de tu Simulación</h2>
                <p>El puntaje de corte en tu región es de <strong>${puntajeCorte} puntos</strong>.</p>
                <p>Tu puntaje base estimado es de <strong>${puntajeBase} puntos</strong>. Te faltan ${puntosFaltantes.toFixed(2)} puntos para ganar.</p>
                <hr>
                <div style="background-color: #fff3e0; padding: 15px; border-radius: 10px; text-align: center;">
                    <h3 style="color: #e65100; margin-bottom: 10px;">¡Cuidado, el ahorro exigido es demasiado alto! ⚠️</h3>
                    <p style="color: #5a3e36;">Para asegurar el Tramo 1 en tu región necesitarías ahorrar unas asombrosas <strong>${ahorroTotalUF.toFixed(1)} UF</strong> (Aprox. ${formatCLP}).</p>
                    <p style="font-size: 0.9em; margin-top: 10px;">Por estrategia financiera, <strong>te conviene mucho más postular al Subsidio DS1 Tramo 2</strong>. Aunque pide un mínimo un poco mayor, sus puntajes de corte son muchísimo más bajos, por lo que terminarás usando menos dinero de tu bolsillo.</p>
                    <button onclick="window.location.href='ds1t2.html'" style="margin-top: 15px; background-color: #ff8a65; padding: 10px 20px; border: none; border-radius: 5px; color: white; cursor: pointer; font-weight: bold;">
                        Ir a Calcular mi Ahorro en Tramo 2
                    </button>
                </div>
            `;
        } else {
            // Resultado normal si el ahorro es razonable (menor o igual a 250 UF)
            resultsDiv.innerHTML = `
                <h2>Resultado de tu Simulación</h2>
                <p>El puntaje de corte en tu región es de <strong>${puntajeCorte} puntos</strong>.</p>
                <p>Tu puntaje base estimado es de <strong>${puntajeBase} puntos</strong>. Te faltan ${puntosFaltantes.toFixed(2)} puntos para ganar.</p>
                <hr>
                <p>Para asegurar tu subsidio Tramo 1, debes superar el ahorro mínimo legal (30 UF). Esta es la cantidad exacta que necesitas tener en tu libreta:</p>
                <h3 style="color: #ff8a65; font-size: 1.5em; text-align: center; margin-top: 20px;">Tu Ahorro Seguro Meta:</h3>
                <div style="background-color: #ffebee; padding: 15px; border-radius: 10px; text-align: center;">
                    <span style="font-size: 2em; font-weight: bold; color: #d32f2f;">${ahorroTotalUF.toFixed(1)} UF</span><br>
                    <span style="font-size: 1.2em; color: #5a3e36;">(Aprox. ${formatCLP})</span>
                </div>
                <p style="font-size: 0.8em; text-align: center; margin-top: 10px; color: #777;">Cálculo basado en la tabla de exceso de ahorro del Minvu.</p>
            `;
        }
    }
    
    // Hacer scroll suave hacia los resultados
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
});