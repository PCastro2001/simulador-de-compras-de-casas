// --- CONFIGURACIÓN DE CONSTANTES DS52 ---
const TOTAL_SUBSIDY_UF = 170; // Total de ahorro en la "cuenta" del subsidio

// Zona Regular
const CAP_RENT_REGULAR = 11; // Tope máximo de arriendo (11 UF)
const CAP_SUBSIDY_REGULAR = 4.2; // Tope máximo de subsidio mensual (4.2 UF)

// Zona Especial (RM, Norte, Sur)
const CAP_RENT_SPECIAL = 13; // Tope máximo de arriendo (13 UF)
const CAP_SUBSIDY_SPECIAL = 4.9; // Tope máximo de subsidio mensual (4.9 UF)

// Requisitos de Ingreso (en UF)
const MIN_INCOME_UF = 7;
const MAX_INCOME_UF = 25;


// 1. Obtener UF
async function fetchUFValue() {
    try {
        const response = await fetch('https://findic.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        document.getElementById('uf-value').value = ufValue.toFixed(2);
        return ufValue;
    } catch (error) {
        console.error('Error UF:', error);
        return 41000; // Fallback
    }
}

// 2. Cargar datos iniciales
document.addEventListener('DOMContentLoaded', async () => {
    const income = localStorage.getItem('income');
    const incomeDisplay = document.getElementById('income-display');

    if (income && !isNaN(income)) {
        incomeDisplay.textContent = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(income);
    } else {
        incomeDisplay.textContent = 'Sin información de sueldo.';
        incomeDisplay.style.color = '#d9534f';
    }

    await fetchUFValue();
});

// 3. Lógica Principal
document.getElementById('ds52-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const incomeCLP = parseFloat(localStorage.getItem('income'));
    const locationType = document.getElementById('location').value; // 'regular' o 'special'
    const months = parseInt(document.getElementById('duration-months').value);
    
    // Asegurar valor UF
    let ufValue = parseFloat(document.getElementById('uf-value').value);
    if (!ufValue || isNaN(ufValue)) ufValue = await fetchUFValue();

    const resultsDiv = document.getElementById('results');

    // --- VALIDACIONES PREVIAS ---
    if (!incomeCLP || isNaN(incomeCLP)) {
        resultsDiv.innerHTML = `<p class="error-text">No se encontró tu sueldo. Vuelve al inicio.</p>`;
        return;
    }

    const incomeInUF = incomeCLP / ufValue;

    // Validación de Rango de Ingresos (7 UF - 25 UF)
    if (incomeInUF < MIN_INCOME_UF || incomeInUF > MAX_INCOME_UF) {
        resultsDiv.innerHTML = `
            <div style="background-color: #ffe6e6; padding: 15px; border-radius: 8px; border-left: 5px solid #d9534f;">
                <h3>⚠️ Requisitos de Ingreso no cumplidos</h3>
                <p>Para el Subsidio de Arriendo, tu ingreso debe estar entre <strong>7 UF</strong> y <strong>25 UF</strong>.</p>
                <p>Tu ingreso actual es de: <strong>${incomeInUF.toFixed(2)} UF</strong>.</p>
            </div>
        `;
        return;
    }

    // --- CÁLCULOS ---

    // 1. Definir topes según zona
    let maxRentCapUF = (locationType === 'special') ? CAP_RENT_SPECIAL : CAP_RENT_REGULAR;
    let maxMonthlySubsidyCapUF = (locationType === 'special') ? CAP_SUBSIDY_SPECIAL : CAP_SUBSIDY_REGULAR;

    // 2. Calcular subsidio mensual TEÓRICO (Total / Meses)
    let calculatedMonthlySubsidyUF = TOTAL_SUBSIDY_UF / months;

    // 3. Aplicar tope mensual al subsidio (No te pueden dar más de 4.2 o 4.9 al mes)
    // Usamos Math.min para elegir el menor entre lo calculado y el tope legal
    let finalMonthlySubsidyUF = Math.min(calculatedMonthlySubsidyUF, maxMonthlySubsidyCapUF);

    // 4. Calcular capacidad de pago del usuario (Sueldo / 3)
    // Supuesto: El usuario no debería gastar más del 30% aprox de su sueldo en copago, 
    // pero para buscar casa sumamos su capacidad + el subsidio.
    let userContributionCapacityUF = incomeInUF / 3; 

    // 5. Calcular Arriendo Máximo que puede buscar
    let maxSearchableRentUF = userContributionCapacityUF + finalMonthlySubsidyUF;

    // 6. Aplicar el tope legal de la vivienda (11 UF o 13 UF)
    // Si la suma de (mi plata + subsidio) me deja arrendar algo de 15 UF, 
    // el sistema debe bajarme a 13 UF (o 11 UF) porque el subsidio no permite viviendas más caras.
    let finalRentUF = Math.min(maxSearchableRentUF, maxRentCapUF);

    // 7. Calcular el Copago Real (Lo que paga el usuario a fin de mes)
    // Copago = Valor Arriendo - Subsidio
    let userFinalPaymentUF = finalRentUF - finalMonthlySubsidyUF;

    // --- FORMATEO DE MONEDA ---
    const fmt = (val) => val.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    // --- RENDERIZADO ---
    resultsDiv.innerHTML = `
        <h3>Resultados de la Simulación</h3>
        
        <div class="result-card" style="background: #fdfdfd; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius:8px;">
            <p><strong>1. Vivienda que puedes buscar:</strong></p>
            <p style="font-size: 1.2em; color: #2c3e50;">
                Hasta <strong>${finalRentUF.toFixed(2)} UF</strong> (${fmt(finalRentUF * ufValue)})
            </p>
            <small>Tope legal zona: ${maxRentCapUF} UF</small>
        </div>

        <div class="result-card" style="background: #e8f5e9; border: 1px solid #c8e6c9; padding: 15px; margin-bottom: 10px; border-radius:8px;">
            <p><strong>2. El Estado paga (Subsidio):</strong></p>
            <p style="font-size: 1.5em; color: #2e7d32; font-weight: bold;">
                ${finalMonthlySubsidyUF.toFixed(2)} UF / mes
            </p>
            <p><small>(${fmt(finalMonthlySubsidyUF * ufValue)})</small></p>
        </div>

        <div class="result-card" style="background: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius:8px;">
            <p><strong>3. Tú pagas (Copago estimado):</strong></p>
            <p style="font-size: 1.5em; color: #1565c0; font-weight: bold;">
                ${userFinalPaymentUF.toFixed(2)} UF / mes
            </p>
            <p><small>(${fmt(userFinalPaymentUF * ufValue)})</small></p>
            <small>Equivale aprox. al ${( (userFinalPaymentUF/incomeInUF)*100 ).toFixed(1)}% de tu sueldo.</small>
        </div>
    `;
});