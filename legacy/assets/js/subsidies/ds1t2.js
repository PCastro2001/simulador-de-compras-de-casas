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

// Ajustar el valor máximo de la propiedad
function adjustMaxPropertyValue() {
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const isNewHome = document.getElementById('is-new-home').checked;
    const propertyValueInput = document.getElementById('property-value');
    const maxUF = (isNewHome && savingsUf >= 80) ? 3000 : 1600;
    propertyValueInput.max = maxUF;
}

// Convertir CLP a UF
function convertToUF() {
    const ufValue = parseFloat(document.getElementById('uf-value').value);
    const propertyValueCLP = parseFloat(document.getElementById('property-value-clp').value);
    if (!isNaN(ufValue) && !isNaN(propertyValueCLP) && ufValue > 0) {
        const propertyValueUF = propertyValueCLP / ufValue;
        document.getElementById('property-value').value = Math.min(propertyValueUF).toFixed(2);
    }
}

// Cargar UF al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
    adjustMaxPropertyValue// Ajustar el valor máximo al cargar
});

// Manejar el formulario
document.getElementById('ds1t2-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const propertyValueCLP = parseFloat(document.getElementById('property-value-clp').value);
    const propertyValue = parseFloat(document.getElementById('property-value').value);
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const location = document.getElementById('location').value;
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();
    const selectedBank = document.getElementById('bank').value;

    if (!BANKS[selectedBank]) {
        resultsDiv.innerHTML = `<p style="color:#d9534f;">Selecciona un banco válido.</p>`;
        return;
    }

    const interestRate = BANKS[selectedBank].tasa;
    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const isNewHome = document.getElementById('is-new-home').checked;
    const isYoungSingle = document.getElementById('is-young-single').checked;

    const resultsDiv = document.getElementById('results');

    // Validaciones
    if (savingsUf < 40 || isNaN(savingsUf)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El ahorro debe ser de al menos 40 UF.</p>`;
        return;
    }
    const maxPropertyValueLimit = (isNewHome && savingsUf >= 80) ? 3000 : 1600;
    if (propertyValue > maxPropertyValueLimit || propertyValue < 600 || isNaN(propertyValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El valor de la vivienda debe estar entre 600 UF y ${maxPropertyValueLimit} UF.</p>`;
        return;
    }
    if (isNaN(interestRate) || isNaN(loanTerm) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente.</p>`;
        return;
    }

    // Calcular el subsidio
    let subsidy;
    if (location === 'north') {
        subsidy = propertyValue <= 800 ? 650 : 650 - ((propertyValue - 800) * (300 / 800));
    } else if (location === 'south') {
        subsidy = propertyValue <= 800 ? 700 : 700 - ((propertyValue - 800) * (300 / 800));
    } else {
        subsidy = propertyValue <= 800 ? 550 : 550 - ((propertyValue - 800) * (300 / 800));
    }

    // Ajustar subsidio si el valor de la propiedad excede 1600 UF
    if (propertyValue > 1600) {
        subsidy = location === 'north' ? 350 : location === 'south' ? 400 : 250;
    }

    // Subsidio adicional para vivienda nueva y ahorro >= 80 UF
    const additionalSubsidy = (isNewHome && savingsUf >= 80) ? 150 : 0;
    const totalSubsidy = subsidy + additionalSubsidy;

    // Calcular el crédito hipotecario
    const loanAmount = propertyValue - savingsUf - totalSubsidy;
    if (loanAmount < 0) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El subsidio y ahorro cubren el valor total de la vivienda. No se necesita crédito.</p>`;
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
        <p>Subsidio total: ${totalSubsidy.toFixed(2)} UF (${formatCurrency(totalSubsidy * ufValue)})</p>
        <p>Monto del crédito hipotecario: ${loanAmount.toFixed(2)} UF (${formatCurrency(loanAmount * ufValue)})</p>
        <p>Banco seleccionado: ${selectedBank}</p>
        <p>Tasa usada para el cálculo: ${(interestRate * 100).toFixed(2)}%</p>
        <p>Dividendo mensual estimado: ${monthlyPayment.toFixed(2)} UF (${formatCurrency(monthlyPaymentCLP)})</p>
        <p>Renta mínima requerida (aprox. ${incomeMultiplier}x el dividendo): ${minimumIncome.toFixed(2)} UF (${formatCurrency(minimumIncomeCLP)})</p>
    `;
});