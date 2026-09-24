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
    const incomeCLP = parseFloat(document.getElementById('income-clp').value);
    if (!isNaN(ufValue) && !isNaN(incomeCLP) && ufValue > 0) {
        const incomeUF = incomeCLP / ufValue;
        document.getElementById('income-uf').value = incomeUF.toFixed(2);
    }
}

// Ajustar el valor máximo de la propiedad según las condiciones
function adjustMaxPropertyValue() {
    const savingsUf = parseFloat(document.getElementById('savings-uf').value);
    const isNewHome = document.getElementById('is-new-home').checked;
    const maxUF = (isNewHome && savingsUf >= 80) ? 3000 : 1600;
    return maxUF;
}

// Función para calcular el subsidio variable
function calculateSubsidy(totalValue, maxSubsidy, minSubsidy, minRange, maxRange) {
    const propertyValue = totalValue / 1.375; // Ajuste según la lógica del segundo fragmento
    if (propertyValue <= minRange) return maxSubsidy;
    if (propertyValue >= maxRange) return minSubsidy;
    const slope = (maxSubsidy - minSubsidy) / (minRange - maxRange);
    return maxSubsidy + slope * (propertyValue - minRange);
}

// Cargar UF al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
});

// Manejar el formulario
document.getElementById('max-value-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const incomeUF = parseFloat(document.getElementById('income-uf').value);
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
    if (isNaN(incomeUF) || isNaN(interestRate) || isNaN(loanTerm) || isNaN(ufValue)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">Por favor, completa todos los campos correctamente.</p>`;
        return;
    }

    // Calcular el dividendo máximo según el sueldo
    const incomeMultiplier = isYoungSingle ? 3 : 4;
    const maxMonthlyPayment = incomeUF / incomeMultiplier;

    // Calcular el monto máximo del crédito
    const monthlyRate = interestRate / 12;
    const totalPayments = loanTerm * 12;
    const loanAmount = maxMonthlyPayment * (1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate;

    // Determinar subsidio y valor máximo según ubicación
    let subsidyUF, initialSubsidyUF, maxPropertyValue;
    if (location === 'north') {
        initialSubsidyUF = 950;
        maxPropertyValue = savingsUf >= 80 && isNewHome ? 3000 : 1800;
        subsidyUF = calculateSubsidy(loanAmount + savingsUf + 950, 650, 350, 800, 1600);
    } else if (location === 'south') {
        initialSubsidyUF = 1000;
        maxPropertyValue = savingsUf >= 80 && isNewHome ? 3000 : 1800;
        subsidyUF = calculateSubsidy(loanAmount + savingsUf + 1000, 700, 400, 800, 1600);
    } else {
        initialSubsidyUF = 850;
        maxPropertyValue = savingsUf >= 80 && isNewHome ? 3000 : 1600;
        subsidyUF = calculateSubsidy(loanAmount + savingsUf + 850, 550, 250, 800, 1600);
    }

    // Ajustar por vivienda nueva y ahorro >= 80 UF
    const additionalSubsidyUF = (savingsUf >= 80 && isNewHome) ? 150 : 0;
    let totalSubsidyUF = subsidyUF + additionalSubsidyUF;

    // Calcular valor máximo de la propiedad
    let maxPropertyValuePossible = loanAmount + savingsUf + totalSubsidyUF;
    if (maxPropertyValuePossible < 600) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">No calificas para este subsidio (valor mínimo: 600 UF).</p>`;
        return;
    }
    if (maxPropertyValuePossible > maxPropertyValue) {
        maxPropertyValuePossible = maxPropertyValue;
        totalSubsidyUF = location === 'north' ? 350 : location === 'south' ? 400 : 250;
        totalSubsidyUF += additionalSubsidyUF;
    }

    // Formatear valores
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    // Mostrar resultados
    resultsDiv.innerHTML = `
        <p>Subsidio total estimado: ${totalSubsidyUF.toFixed(2)} UF (${formatCurrency(totalSubsidyUF * ufValue)})</p>
        <p>Monto máximo del crédito: ${loanAmount.toFixed(2)} UF (${formatCurrency(loanAmount * ufValue)})</p>
        <p>Banco seleccionado: ${selectedBank}</p>
        <p>Tasa usada para el cálculo: ${(interestRate * 100).toFixed(2)}%</p>
        <p>Dividendo mensual máximo: ${maxMonthlyPayment.toFixed(2)} UF (${formatCurrency(maxMonthlyPayment * ufValue)})</p>
        <p>Valor máximo de la vivienda: ${maxPropertyValuePossible.toFixed(2)} UF (${formatCurrency(maxPropertyValuePossible * ufValue)})</p>
        <button id="show-links" style="margin-top:10px;">Ofertas Inmobiliarias</button>
    `;

    document.getElementById('show-links').addEventListener('click', () => {
        const maxPrice = Math.round(maxPropertyValuePossible * ufValue);
       const params = new URLSearchParams({
            maxPrice: maxPrice,
            maxUF: Math.round(maxPropertyValuePossible),
            credit: Math.round(loanAmount),
            origin: 'ds1t2',
            new: isNewHome
        });
        window.location.href = '../real-estate-offers.html?' + params.toString();
    });
});
