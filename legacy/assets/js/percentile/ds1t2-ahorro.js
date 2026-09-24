// 1. DICCIONARIO DE PUNTAJES DE CORTE (DS1 TRAMO 2 - PRIMER LLAMADO 2025)
const PUNTAJES_CORTE_T2 = {
    arica: 266.22,
    tarapaca: 69.73,
    antofagasta: 159.76,
    atacama: 280.78,
    coquimbo: 252.98,
    valparaiso: 228.13,
    ohiggins: 359.12,
    maule: 341.66,
    nuble: 269.02,
    biobio: 290.41,
    araucania: 306.72,
    rios: 368.62,
    lagos: 304.52,
    aysen: 339.95,
    magallanes: 239.73,
    metropolitana: 372.10
};

const AHORRO_MINIMO_T2 = 40; // UF

async function fetchUFValue() {
    try {
        const response = await fetch('https://findic.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        document.getElementById('uf-value').value = ufValue;
        return ufValue;
    } catch (error) {
        return 41000;
    }
}

document.addEventListener('DOMContentLoaded', fetchUFValue);

document.getElementById('ds1t2-ahorro-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    // Recoger datos (igual que T1)
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

    // Cálculo Puntaje Base
    let puntajeBase = 0;
    puntajeBase += (integrantesExtra * 40) + (menores5 * 30) + (menores18 * 20) + (adultosMayores * 30) + (discapacidad * 30);
    if (postulanteMayor) puntajeBase += 150;
    if (monoparental) puntajeBase += 35;
    if (victimaPolitica) puntajeBase += 300;
    if (bombero) puntajeBase += 40;
    if (viviendaDestruida) puntajeBase += 50;
    if (gendarmeria) puntajeBase += 40;
    puntajeBase += (servicioMilitar * 20) + (postulacionesFallidas * 25);
    
    let puntosArriendo = Math.floor(mesesDs52 / 12) * 80;
    puntajeBase += (puntosArriendo > 240 ? 240 : puntosArriendo) + constanciaAhorro;

    const totalPersonas = integrantesExtra + 1;
    const indiceHacinamiento = totalPersonas / dormitorios;
    if (indiceHacinamiento > 3.5) puntajeBase += 270;
    else if (indiceHacinamiento > 3.0) puntajeBase += 135;
    else if (indiceHacinamiento > 2.5) puntajeBase += 90;
    else if (indiceHacinamiento > 2.0) puntajeBase += 45;

    // Brecha y Exceso de Ahorro (Fórmula T1 y T2)
    const puntajeCorte = PUNTAJES_CORTE_T2[region];
    let puntosFaltantes = puntajeCorte - puntajeBase;
    let ufExtraNecesarias = 0;

    if (puntosFaltantes > 0) {
        let p = puntosFaltantes;
        
        let maxF1 = 60 * 4; // 240 pts
        if (p <= maxF1) { ufExtraNecesarias += p / 4; p = 0; } 
        else { ufExtraNecesarias += 60; p -= maxF1; }

        if (p > 0) {
            let maxF2 = 50 * 2; // 100 pts
            if (p <= maxF2) { ufExtraNecesarias += p / 2; p = 0; } 
            else { ufExtraNecesarias += 50; p -= maxF2; }
        }

        if (p > 0) {
            let maxF3 = 50 * 1; // 50 pts
            if (p <= maxF3) { ufExtraNecesarias += p / 1; p = 0; } 
            else { ufExtraNecesarias += 50; p -= maxF3; }
        }

        if (p > 0) {
            ufExtraNecesarias += p / 0.05;
        }
    }

    // Resultados
    let ahorroTotalUF = AHORRO_MINIMO_T2 + ufExtraNecesarias;
    const ufActual = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();
    const ahorroTotalCLP = ahorroTotalUF * ufActual;
    const resultsDiv = document.getElementById('results');
    resultsDiv.style.display = 'block';
    
    const formatCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(ahorroTotalCLP);

    if (puntosFaltantes <= 0) {
        resultsDiv.innerHTML = `
            <h2 style="color: #4CAF50;">¡Excelente noticia!</h2>
            <p>Tu puntaje base es <strong>${puntajeBase} puntos</strong>, superando el corte de tu región (${puntajeCorte} pts).</p>
            <hr>
            <h3>Ahorro Seguro: ${AHORRO_MINIMO_T2} UF</h3>
            <p>Aprox: ${formatCLP}</p>
        `;
    } else {
        resultsDiv.innerHTML = `
            <h2>Resultado de tu Simulación (Tramo 2)</h2>
            <p>Corte regional: <strong>${puntajeCorte} puntos</strong> | Tu puntaje: <strong>${puntajeBase} puntos</strong></p>
            <p>Te faltan ${puntosFaltantes.toFixed(2)} puntos. Este es el ahorro exacto para lograrlos:</p>
            <hr>
            <h3 style="color: #ff8a65; font-size: 1.5em; text-align: center;">Tu Ahorro Seguro Meta:</h3>
            <div style="background-color: #ffebee; padding: 15px; border-radius: 10px; text-align: center;">
                <span style="font-size: 2em; font-weight: bold; color: #d32f2f;">${ahorroTotalUF.toFixed(1)} UF</span><br>
                <span style="font-size: 1.2em; color: #5a3e36;">(Aprox. ${formatCLP})</span>
            </div>
        `;
    }
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
});