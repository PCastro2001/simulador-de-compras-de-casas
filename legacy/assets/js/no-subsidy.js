const BANKS = {
    BancoEstado: { tasa: 0.0455 },
    Santander: { tasa: 0.0434 },
    Coopeuch: { tasa: 0.0450 },
    Internacional: { tasa: 0.0479 },
    Falabella: { tasa: 0.0465 },
    Chile: { tasa: 0.0484 },
    BICE: { tasa: 0.0510 },
    Itau: { tasa: 0.0483 },
    BCI: { tasa: 0.0556 }
};


// Función para obtener el valor de la UF desde la API
async function fetchUFValue() {
    try {
        const response = await fetch('https://findic.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        document.getElementById('uf-value').value = ufValue.toFixed(2);
        return ufValue;
    } catch (error) {
        console.error('Error al obtener el valor de la UF:', error);
        return 41000; // Valor por defecto
    }
}

// Convertir CLP a UF
function convertToUF() {
    const ufValue = parseFloat(document.getElementById('uf-value').value);
    const propertyValueCLP = parseFloat(document.getElementById('property-value-clp').value);
    if (!isNaN(ufValue) && !isNaN(propertyValueCLP) && ufValue > 0) {
        const propertyValueUF = propertyValueCLP / ufValue;
        document.getElementById('property-value').value = propertyValueUF.toFixed(2);
    }
}

// Ajustar opciones del pie
function adjustDownPaymentOptions() {
    const downPaymentType = document.getElementById('down-payment-type').value;
    const downPaymentInput = document.getElementById('down-payment');
    if (downPaymentType === 'percentage') {
        downPaymentInput.min = 20;
        downPaymentInput.max = 50;
        downPaymentInput.value = 20;
    } else {
        downPaymentInput.min = 1;
        downPaymentInput.max = 999999; // Sin límite práctico
        downPaymentInput.value = 1;
    }
}

// Cargar UF al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
    adjustDownPaymentOptions();
});

// Manejar el formulario
document.getElementById('simulacion-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const propertyValue = parseFloat(document.getElementById('property-value').value);
    const downPaymentType = document.getElementById('down-payment-type').value;
    let downPayment = parseFloat(document.getElementById('down-payment').value);
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();
    const isYoungSingle = document.getElementById('is-young-single').checked;
    const resultsDiv = document.getElementById('results');
    const selectedBank = document.getElementById('bank').value;

    if (!BANKS[selectedBank]) {
        resultsDiv.innerHTML = `<p style="color:#d9534f;">Selecciona un banco válido.</p>`;
        return;
    }

    const interestRate = BANKS[selectedBank].tasa;

    // Validaciones
    if (propertyValue < 1 || isNaN(propertyValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El valor de la vivienda debe ser mayor a 0 UF.</p>`;
        return;
    }
    if (downPaymentType === 'percentage' && (downPayment < 20 || downPayment > 50)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El pie en porcentaje debe estar entre 20% y 50%.</p>`;
        return;
    }
    if (downPaymentType === 'uf' && downPayment < 100) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El pie en UF debe ser mayor a 100.</p>`;
        return;
    }
    if (isNaN(interestRate) || isNaN(loanTerm) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente.</p>`;
        return;
    }

    // Ajustar el pie
    if (downPaymentType === 'percentage') {
        if (downPayment === 10 && propertyValue > 4500) {
            resultsDiv.innerHTML = `<p style="color: #d9534f;">No puedes seleccionar un pie del 10% para viviendas de más de 4500 UF.</p>`;
            return;
        }
        downPayment = (downPayment / 100) * propertyValue;
    }

    // Calcular el crédito hipotecario
    const loanAmount = propertyValue - downPayment;
    if (loanAmount < 0) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El pie cubre el valor total de la vivienda. No se necesita crédito.</p>`;
        return;
    }

    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const monthlyPaymentCLP = monthlyPayment * ufValue;

    // Renta mínima (3x para jóvenes solteros, 4x para familias)
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const minimumIncome = monthlyPayment * incomeMultiplier;
    const minimumIncomeCLP = minimumIncome * ufValue;

    // Formatear valores
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    // Mostrar resultados
    resultsDiv.innerHTML = `
        <p>Valor de la vivienda: ${propertyValue.toFixed(2)} UF (${formatCurrency(propertyValue * ufValue)})</p>
        <p>Pie: ${downPayment.toFixed(2)} UF (${formatCurrency(downPayment * ufValue)})</p>
        <p>Crédito hipotecario estimado: ${loanAmount.toFixed(2)} UF (${formatCurrency(loanAmount * ufValue)})</p>
        <p>Banco seleccionado: ${selectedBank}</p>
        <p>Tasa usada para el cálculo: ${(interestRate * 100).toFixed(2)}%</p>
        <p>Dividendo mensual estimado: ${monthlyPayment.toFixed(2)} UF (${formatCurrency(monthlyPaymentCLP)})</p>
        <p>Renta mínima requerida (aprox. ${incomeMultiplier}x el dividendo): ${minimumIncome.toFixed(2)} UF (${formatCurrency(minimumIncomeCLP)})</p>
    `;
});