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


async function fetchUFValue() {
    try {
        const response = await fetch('https://findic.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        document.getElementById('uf-value').value = ufValue.toFixed(2);
        return ufValue;
    } catch (error) {
        console.error('Error al obtener el valor de la UF:', error);
        return 41000;
    }
}

function convertToUF() {
    const ufValue = parseFloat(document.getElementById('uf-value').value);
    const incomeCLP = parseFloat(document.getElementById('income-clp').value);
    if (!isNaN(ufValue) && !isNaN(incomeCLP) && ufValue > 0) {
        const incomeUF = incomeCLP / ufValue;
        document.getElementById('income-uf').value = incomeUF.toFixed(2);
    }
}

function adjustDownPaymentOptions() {
    const downPaymentType = document.getElementById('down-payment-type').value;
    const downPaymentInput = document.getElementById('down-payment');
    if (downPaymentType === 'percentage') {
        downPaymentInput.min = 20;
        downPaymentInput.max = 50;
        downPaymentInput.value = 20;
    } else {
        downPaymentInput.min = 100;
        downPaymentInput.max = 999999;
        downPaymentInput.value = 100;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
    adjustDownPaymentOptions();
});

document.getElementById('max-value-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const incomeUF = parseFloat(document.getElementById('income-uf').value);
    const downPaymentType = document.getElementById('down-payment-type').value;
    const isNewHome = document.getElementById('is-new-home').checked;
    let downPayment = parseFloat(document.getElementById('down-payment').value);
    const ufValue = parseFloat(document.getElementById('uf-value').value) || await fetchUFValue();
    const selectedBank = document.getElementById('bank').value;

    if (!BANKS[selectedBank]) {
        resultsDiv.innerHTML = `<p style="color:#d9534f;">Selecciona un banco válido.</p>`;
        return;
    }

    const interestRate = BANKS[selectedBank].tasa;


    const loanTerm = parseInt(document.getElementById('loan-term').value);
    const isYoungSingle = document.getElementById('is-young-single').checked;

    const resultsDiv = document.getElementById('results');

    // Validaciones
    if (downPaymentType === 'percentage' && (downPayment < 20 || downPayment > 50)) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El pie en porcentaje debe estar entre 20% y 50%.</p>`;
        return;
    }
    if (downPaymentType === 'uf' && downPayment < 100) {
        resultsDiv.innerHTML = `<p style="color: #d9534f;">El pie en UF debe ser mayor a 100.</p>`;
        return;
    }
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

    // Calcular el valor máximo de la vivienda
    let maxPropertyValuePossible;
    if (downPaymentType === 'percentage') {
        maxPropertyValuePossible = loanAmount / (1 - (downPayment / 100));
        if (downPayment === 10 && maxPropertyValuePossible > 4500) {
            resultsDiv.innerHTML = `<p style="color: #d9534f;">No puedes seleccionar un pie del 10% para viviendas de más de 4500 UF.</p>`;
            return;
        }
        downPayment = (downPayment / 100) * maxPropertyValuePossible;
    } else {
        maxPropertyValuePossible = loanAmount + downPayment;
    }

    // Formatear valores
    const formatCurrency = (value) => value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    // Mostrar resultados
    resultsDiv.innerHTML = `
        <p>Pie: ${downPayment.toFixed(2)} UF (${formatCurrency(downPayment * ufValue)})</p>
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
            origin: 'no-subsidy',
            new: isNewHome
        });
        window.location.href = '../real-estate-offers.html?' + params.toString();
    });
});