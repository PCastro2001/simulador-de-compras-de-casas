// 1. Cargar el valor de la UF apenas se abra la página
document.addEventListener('DOMContentLoaded', () => {
    fetchUFValue();
});

document.getElementById('subsidy-form').addEventListener('submit', (event) => {
    event.preventDefault();

    const income = parseFloat(document.getElementById('total-income').value);
    const householdSize = parseInt(document.getElementById('household-size').value);
    
    // Obtenemos el valor de la UF desde el input (donde lo guardó la función fetch)
    // Si por alguna razón falló la API, usamos un valor por defecto seguro (ej: 41000)
    let ufValue = parseFloat(document.getElementById('uf-value').value);
    if (!ufValue || isNaN(ufValue)) ufValue = 41000;

    if (isNaN(income) || isNaN(householdSize)) {
        alert("Por favor, ingresa valores numéricos válidos.");
        return;
    }

    localStorage.setItem('income', income);

    const adjustedIncome = (income) / householdSize;
    const percentile = calculatePercentile(adjustedIncome);

    let resultHTML = `<p>Tu percentil estimado es: <strong>${percentile}%</strong></p>`;
    resultHTML += `<p><small>Valor UF utilizado: $${ufValue}</small></p>`; // Informativo
    
    resultHTML += '<div class="subsidy-options">';
    // AHORA PASAMOS 4 ARGUMENTOS: percentil, tamaño hogar, ingreso total y valor UF
    resultHTML += getAvailableSubsidies(percentile, householdSize, income, ufValue);
    resultHTML += '</div>';

    document.getElementById('results').innerHTML = resultHTML;
});

// Tu función para obtener la UF (sin cambios, solo integrada)
async function fetchUFValue() {
    try {
        const response = await fetch('https://findic.cl/api/uf');
        const data = await response.json();
        const ufValue = data.serie[0].valor;
        // Asegúrate de tener un <input type="hidden" id="uf-value"> en tu HTML
        // o un input visible si quieres mostrarlo
        const ufInput = document.getElementById('uf-value');
        if(ufInput) {
            ufInput.value = ufValue.toFixed(2);
        }
        return ufValue;
    } catch (error) {
        console.error('Error al obtener el valor de la UF:', error);
        // Seteamos un fallback en el input si falla
        const ufInput = document.getElementById('uf-value');
        if(ufInput) ufInput.value = 41000; 
        return 41000; 
    }
}

function calculatePercentile(income) {
    const thresholds = [
        { max: 82320, percentile: 10 },
        { max: 141488, percentile: 20 },
        { max: 195510, percentile: 30 },
        { max: 246960, percentile: 40 },
        { max: 308700, percentile: 50 },
        { max: 398493, percentile: 60 },
        { max: 514500, percentile: 70 },
        { max: 699720, percentile: 80 },
        { max: 1151624, percentile: 90 },
        { max: Infinity, percentile: 100 }
    ];
    const found = thresholds.find(threshold => income < threshold.max);
    return found ? found.percentile : 100;
}

// AHORA RECIBE income Y ufValue
function getAvailableSubsidies(percentile, householdSize, income, ufValue) {
    let subsidies = '';

    // Lógica DS52 con restricción de UF
    // 1. Percentil <= 70
    // 2. Más de 1 persona
    // 3. Ingreso >= 7 UF
    // 4. Ingreso <= 25 UF
    
    const minIncomeDS52 = 7 * ufValue;
    const maxIncomeDS52 = 25 * ufValue;

    if (percentile <= 70 && 
        householdSize > 1 && 
        income >= minIncomeDS52 && 
        income <= maxIncomeDS52) {
        
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds52.html">
                    <h2>Subsidio DS 52</h2>
                    <p>Subsidio de Arriendo que te ayudara a ahorrar para el Subsidio DS1 o DS19.</p>
                </a>
            </article>
        `;
    }

    // DS49
    if (percentile <= 40) {
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds49.html">
                    <h2>Subsidio DS49</h2>
                    <p>Para el 40% más vulnerable.</p>
                </a>
            </article>
        `;
    }

    // DS1 Tramo 1
    if (percentile <= 60) {
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds1t1.html">
                    <h2>Subsidio DS1 Tramo 1</h2>
                    <p>Compra hasta 1.100 UF.</p>
                </a>
            </article>
        `;
    }

    // DS1 Tramo 2
    if (percentile <= 80) {
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds1t2.html">
                    <h2>Subsidio DS1 Tramo 2</h2>
                    <p>Compra hasta 1.600 UF.</p>
                </a>
            </article>
        `;
    }

    // DS1 Tramo 3
    if (percentile <= 100) {
        subsidies += `
            <article class="subsidy-card">
                <a href="../pages/percentile/ds1t3.html">
                    <h2>Subsidio DS1 Tramo 3</h2>
                    <p>Compra hasta 2.200 UF.</p>
                </a>
            </article>
        `;
    }

    return subsidies;
}