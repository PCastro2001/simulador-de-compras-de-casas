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

// Cargar UF al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
});

// Manejar el formulario
document.getElementById('ds1t1-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const propertyValue = parseFloat(document.getElementById('property-value').value);
    const selectedBank = document.getElementById('bank').value;

    if (!BANKS[selectedBank]) {
        resultsDiv.innerHTML = `<p style="color:#d9534f;">Selecciona un banco válido.</p>`;
        return;
    }

    const interestRate = BANKS[selectedBank].tasa;
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();
    const location = document.getElementById('location').value;
    const loanTerm = parseInt(document.getElementById('loan-term').value);

    const resultsDiv = document.getElementById('results');

    // Validaciones
    if (savingsUf < 30 || isNaN(savingsUf)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El ahorro debe ser de al menos 30 UF.</p>`;
        return;
    }
    const maxPropertyValue = location === 'north' ? 1200 : location === 'south' ? 1250 : 1100;
    if (propertyValue > maxPropertyValue || isNaN(propertyValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El valor de la vivienda no puede exceder ${maxPropertyValue} UF en esta zona.</p>`;
        return;
    }
    if (isNaN(interestRate) || isNaN(loanTerm) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente.</p>`;
        return;
    }

    // Determinar el subsidio fijo según ubicación
    const baseSubsidy = location === 'north' ? 700 : location === 'south' ? 750 : 600;
    const totalSubsidy = baseSubsidy + savingsUf;

    // Calcular el crédito hipotecario
    const loanAmount = propertyValue - totalSubsidy;
    if (loanAmount < 0) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El subsidio cubre el valor total de la vivienda. No se necesita crédito.</p>`;
        return;
    }

    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const monthlyPaymentCLP = monthlyPayment * ufValue;

    // Renta mínima (4 veces el dividendo)
    const minimumIncome = monthlyPayment * 4;
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
        <p>Renta mínima requerida (aprox. 4x el dividendo): ${minimumIncome.toFixed(2)} UF (${formatCurrency(minimumIncomeCLP)})</p>
    `;
});