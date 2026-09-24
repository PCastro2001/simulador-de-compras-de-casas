document.addEventListener('DOMContentLoaded', async () => {

    // --- 1. CONFIGURACIÓN Y UTILIDADES ---

    // --- CONFIGURACIÓN DE CONEXIÓN ---

    // TU BACKEND EN LA NUBE (Railway)
    const RAILWAY_URL = 'https://backend-subsimatch-production.up.railway.app/api/lead'; 

    // DETECCIÓN INTELIGENTE
    // Si estás probando en tu PC, usa localhost. Si es internet, usa Railway.
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const API_URL = isLocal 
        ? 'http://localhost:3000/api/lead' 
        : RAILWAY_URL; 

    console.log("📡 Conectando a:", API_URL);
    
    // A. Obtención de UF
    async function fetchUFValue() {
        try {
            const response = await fetch('https://findic.cl/api/uf');
            const data = await response.json();
            return data.serie[0].valor;
        } catch (error) {
            console.error('Error API UF, usando valor respaldo:', error);
            return 41000; 
        }
    }

    let VALOR_UF_HOY = await fetchUFValue();
    console.log(`Valor UF cargado: $${VALOR_UF_HOY}`);

    const TASAS_BANCOS = {
        'BancoEstado': 0.0450, 'Santander': 0.0480, 'BCI': 0.0470,
        'Chile': 0.0460, 'Itau': 0.0490, 'Falabella': 0.0510,
        'BICE': 0.0440, 'Coopeuch': 0.0430, 'Internacional': 0.0500
    };

    // B. Mapeo de Zonas (Estricto según tu solicitud)
    function getZoneFromRegion(regionValue) {
        // Chiloe agregado al bloque Norte según instrucción
        const north = ['arica', 'tarapaca', 'antofagasta', 'atacama', 'chiloe'];
        // Insular agregado al bloque Sur según instrucción
        const south = ['aysen', 'magallanes', 'insular']; 
        
        if (north.includes(regionValue)) return 'north';
        if (south.includes(regionValue)) return 'south';
        return 'center'; // Todo lo demás es zona regular/centro
    }

    // C. Límites de Ingresos Mensuales Familiares (DS1 Tramo 3 - RSH > 90%)
    // Índices: 0=1 persona, 1=2 personas, 2=3 personas, 3=4 o más.
    const LIMITES_INGRESO_DS1T3 = {
        'north':  [2468142, 3227571, 3531342, 3835113], // Zonas Extremas Norte + Chiloe
        'south':  [2468142, 3227571, 3531342, 3835113], // Zonas Extremas Sur + Insular
        'center': [1898571, 2657999, 2961771, 3265542]  // Resto del país
    };

    // D. Fórmula de Interpolación Minvu
    function calculateSlopeSubsidy(totalValue, maxSubsidy, minSubsidy, minRange, maxRange) {
        const propertyValue = totalValue / 1.375; 
        if (propertyValue <= minRange) return maxSubsidy;
        if (propertyValue >= maxRange) return minSubsidy;
        const slope = (maxSubsidy - minSubsidy) / (minRange - maxRange);
        return maxSubsidy + slope * (propertyValue - minRange);
    }

    //E. Calculo de Percentiles
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


    // --- 2. CALCULADORAS (Lógica Financiera + Social) ---

    const CALCULADORAS = {

        'DS1_T1': function(inputs) {
            const { ahorroUF, location, loanAmountUF } = inputs;
            
            if (ahorroUF < 30) throw "El ahorro mínimo para Tramo 1 son 30 UF.";

            let maxPropValue = 1100;
            let baseSubsidy = 600;

            if (location === 'north') { maxPropValue = 1200; baseSubsidy = 700; }
            else if (location === 'south') { maxPropValue = 1250; baseSubsidy = 750; }

            const totalSubsidy = baseSubsidy + ahorroUF; 
            let maxPosible = loanAmountUF + totalSubsidy;
            
            if (maxPosible > maxPropValue) maxPosible = maxPropValue;

            return {
                nombre: 'DS1 Tramo 1',
                valorViviendaUF: maxPosible,
                subsidioUF: totalSubsidy,
                creditoUF: maxPosible - totalSubsidy
            };
        },

        'DS1_T2': function(inputs) {
            const { ahorroUF, location, loanAmountUF } = inputs;

            if (ahorroUF < 40) throw "El ahorro mínimo para Tramo 2 son 40 UF.";

            // Lógica Tope 3000 UF
            const accessTo3000 = (ahorroUF >= 80); 
            
            let maxPropLimit = accessTo3000 ? 3000 : 1600; 
            if (!accessTo3000 && (location === 'north' || location === 'south')) maxPropLimit = 1800;

            // Parámetros Interpolación
            let fixedSubsidy, maxS, minS, minR, maxR;
            if (location === 'north') {
                fixedSubsidy = 950; maxS = 650; minS = 350; minR = 800; maxR = 1600;
            } else if (location === 'south') {
                fixedSubsidy = 1000; maxS = 700; minS = 400; minR = 800; maxR = 1600;
            } else {
                fixedSubsidy = 850; maxS = 550; minS = 250; minR = 800; maxR = 1600;
            }

            // Cálculo Iterativo
            let estimatedTotal = loanAmountUF + ahorroUF + fixedSubsidy;
            let calculatedSubsidy = calculateSlopeSubsidy(estimatedTotal, maxS, minS, minR, maxR);
            const additionalSubsidy = accessTo3000 ? 150 : 0;
            let totalSubsidy = calculatedSubsidy + additionalSubsidy;

            let maxPosible = loanAmountUF + ahorroUF + totalSubsidy;

            if (maxPosible < 600) throw "No calificas (Capacidad menor a 600 UF).";
            
            if (maxPosible > maxPropLimit) {
                maxPosible = maxPropLimit;
                totalSubsidy = minS + additionalSubsidy; 
            }

            return {
                nombre: 'DS1 Tramo 2',
                valorViviendaUF: maxPosible,
                subsidioUF: totalSubsidy,
                creditoUF: maxPosible - ahorroUF - totalSubsidy
            };
        },

        'DS1_T3': function(inputs) {
            const { ahorroUF, location, loanAmountUF, sueldoTotal, totalPersonas } = inputs;

            // 1. Validación de Ahorro
            if (ahorroUF < 80) throw "El ahorro mínimo para Tramo 3 son 80 UF.";

            // 2. VALIDACIÓN SOCIAL (Ingreso Máximo Permitido)
            // Obtenemos el límite según la zona y cantidad de personas (Tope índice 3 para 4+ personas)
            const indexPersonas = Math.min(totalPersonas, 4) - 1; 
            const limiteIngreso = LIMITES_INGRESO_DS1T3[location][indexPersonas];
            
            if (sueldoTotal > limiteIngreso) {
                const formateado = limiteIngreso.toLocaleString('es-CL');
                throw `Tus ingresos superan el límite permitido para DS1 Tramo 3 en zona ${location === 'center' ? 'Centro' : 'Extrema'}.<br>Tope para ${totalPersonas} persona(s): $${formateado}.`;
            }

            // 3. Lógica Tope 3000 UF
            const accessTo3000 = (ahorroUF >= 160);

            let maxPropLimit = accessTo3000 ? 3000 : 2200;
            if (!accessTo3000 && (location === 'north' || location === 'south')) maxPropLimit = 2600;

            // Parámetros Interpolación
            let fixedSubsidy,maxS, minS, minR, maxR;
            if (location === 'north') {fixedSubsidy = 950; maxS = 500; minS = 350; minR = 1200; maxR = 1600; }
            else if (location === 'south') {fixedSubsidy = 1000; maxS = 550; minS = 400; minR = 1200; maxR = 1600; }
            else {fixedSubsidy = 850; maxS = 400; minS = 250; minR = 1200; maxR = 1600; }

            // Cálculo
            let estimatedTotal = loanAmountUF + ahorroUF + fixedSubsidy; 
            let calculatedSubsidy = calculateSlopeSubsidy(estimatedTotal, maxS, minS, minR, maxR);
            const additionalSubsidy = accessTo3000 ? 150 : 0;
            let totalSubsidy = calculatedSubsidy + additionalSubsidy;

            let maxPosible = loanAmountUF + ahorroUF + totalSubsidy;

            if (maxPosible < 800) throw "No calificas (Capacidad menor a 800 UF).";

            if (maxPosible > maxPropLimit) {
                maxPosible = maxPropLimit;
                totalSubsidy = minS + additionalSubsidy;
            }

            return {
                nombre: 'DS1 Tramo 3',
                valorViviendaUF: maxPosible,
                subsidioUF: totalSubsidy,
                creditoUF: maxPosible - ahorroUF - totalSubsidy
            };
        },

        'DS19': function(inputs) {
             const { loanAmountUF } = inputs;
             // Solo Crédito, valores en 0 para filtro
             return {
                 nombre: 'DS19 (Evaluación Crédito)',
                 valorViviendaUF: 0, 
                 subsidioUF: 0,
                 creditoUF: loanAmountUF, 
                 ahorroOutput: 0 
             };
        },

        'SIN_SUBSIDIO': function(inputs) {
            const { ahorroUF, loanAmountUF } = inputs;
            
            // ESTRATEGIA COMERCIAL (LEAD GEN):
            // Asumimos que el cliente conseguirá el pie (ahorrando o pagando en cuotas).
            // El límite duro es el CRÉDITO, porque el banco no perdona.
            
            // 1. Calculamos el valor máximo de la propiedad basado SOLO en el crédito (80% financiamiento)
            // Fórmula: Si el crédito es el 80%, la casa vale: Crédito / 0.8
            const valorViviendaTeorico = loanAmountUF / 0.80;
            
            // 2. Calculamos cuánto pie DEBERÍA tener para esa casa
            const pieNecesario = valorViviendaTeorico * 0.20;
            
            // 3. Calculamos la Brecha (Lo que le falta)
            let mensajeBrecha = "";
            let deficit = 0;

            if (ahorroUF < pieNecesario) {
                deficit = pieNecesario - ahorroUF;
                // Este dato es ORO para la inmobiliaria: "Cliente necesita pagar pie en cuotas"
            }

            return {
                nombre: 'Sin Subsidio (Crédito Hipotecario)',
                valorViviendaUF: valorViviendaTeorico,
                subsidioUF: 0,
                creditoUF: loanAmountUF, 
                
                // DATOS EXTRAS PARA TU UI
                pieNecesarioUF: pieNecesario,
                ahorroActualUF: ahorroUF,
                deficitUF: deficit // Si es > 0, mostramos alerta
            };
        }
    };


    // --- 3. UI: MANEJO VISUAL ---
    
    // Referencias a elementos
    const hasSubsidySelect = document.getElementById('has-subsidy');
    const wantSubsidySelect = document.getElementById('want-subsidy');
    
    // 🔥 NUEVAS REFERENCIAS PARA EL FILTRO 🔥
    const inputSueldo = document.getElementById('sueldo');
    const inputAdultos = document.querySelector('input[name="adultos"]'); 
    const inputNinos = document.querySelector('input[name="ninos"]');
    const selectSubsidyType = document.getElementById('subsidy-type');

    const toggleDisplay = (id, show) => document.getElementById(id).style.display = show ? 'block' : 'none';

    // 🔥 FUNCIÓN DE FILTRADO INTELIGENTE (NUEVO) 🔥
    function filtrarOpcionesSubsidio() {
        // 1. Obtener valores actuales (Si están vacíos, asumimos 0 o 1)
        const sueldo = parseInt(inputSueldo.value) || 0;
        const adultos = parseInt(inputAdultos.value) || 1;
        const ninos = parseInt(inputNinos.value) || 0;
        
        // 2. Calcular Ingreso Per Cápita (Vital para el RSH)
        // RSH = Ingreso Total / Cantidad de Personas
        const totalPersonas = adultos + ninos;
        const perCapita = sueldo / totalPersonas;

        // console.log(`💰 Per Cápita calculado: $${perCapita.toLocaleString()}`);

        // 3. Definir Límites (Basado en datos RSH 2025)
        const LIMITE_60_PCT = 398493; // 60%
        const LIMITE_80_PCT = 699720; // 80%
        const LIMITE_90_PCT = 1151624; // 90%
        const LIMITE_DS19_TOTAL = 2600000; // Tope Mercado

        // 4. Aplicar Reglas a las Opciones
        const opciones = selectSubsidyType.options;

        for (let i = 0; i < opciones.length; i++) {
            const opt = opciones[i];
            let bloquear = false;
            let mensaje = "";

            // Guardamos el texto original la primera vez
            if (!opt.getAttribute('data-original')) {
                opt.setAttribute('data-original', opt.text);
            }
            const textoOriginal = opt.getAttribute('data-original');

            // REGLAS DE FILTRADO
            if (opt.value === 'DS1_T1') {
                if (perCapita > LIMITE_60_PCT) {
                    bloquear = true;
                    mensaje = " (Supera 60% RSH)";
                }
            } 
            else if (opt.value === 'DS1_T2') {
                if (perCapita > LIMITE_80_PCT) {
                    bloquear = true;
                    mensaje = " (Supera 80% RSH)";
                }
            } 
            else if (opt.value === 'DS1_T3') {
                if (perCapita > LIMITE_90_PCT) {
                    bloquear = true;
                    mensaje = " (Supera 90% RSH)";
                }
            }
            else if (opt.value === 'DS19') {
                if (sueldo > LIMITE_DS19_TOTAL) {
                    bloquear = true;
                    mensaje = " (Ingreso muy alto)";
                }
            }

            // APLICAR CAMBIOS VISUALES
            if (bloquear) {
                opt.disabled = true;
                opt.style.color = "#999"; 
                opt.text = "🔒 " + textoOriginal + mensaje;
            } else {
                opt.disabled = false;
                opt.style.color = ""; 
                opt.text = textoOriginal;
            }
        }
    }

    // --- EVENT LISTENERS ---

    // 1. Escuchamos cambios en los Inputs para filtrar en tiempo real
    inputSueldo.addEventListener('input', filtrarOpcionesSubsidio);
    inputAdultos.addEventListener('input', filtrarOpcionesSubsidio);
    if(inputNinos) inputNinos.addEventListener('input', filtrarOpcionesSubsidio);

    // 2. Lógica visual de los Selects
    hasSubsidySelect.addEventListener('change', (e) => {
        toggleDisplay('subsidy-type-owned', e.target.value === 'yes');
        toggleDisplay('subsidy-want', e.target.value === 'no');
        toggleDisplay('subsidy-type-want', false);
    });

    wantSubsidySelect.addEventListener('change', (e) => {
        const val = e.target.value;
        const typeContainer = document.getElementById('subsidy-type-want');
        const typeSelect = document.getElementById('subsidy-type');

        if (val === 'yes') {
            typeContainer.style.display = 'block'; 
            typeSelect.value = ""; 
            
            // 🔥 AQUÍ ACTIVAMOS EL FILTRO AL ABRIR EL MENÚ 🔥
            filtrarOpcionesSubsidio(); 
        } 
        else if (val === 'no') {
            typeContainer.style.display = 'none'; 
            typeSelect.value = 'NO_SUBSIDY'; 
        } 
        else {
            typeContainer.style.display = 'none';
            typeSelect.value = "";
        }
    });


    // --- 4. CONTROLADOR PRINCIPAL (SUBMIT) ---
    document.getElementById('max-value-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());

            // A. Datos Básicos
            const sueldo = parseInt(data.sueldo);
            const ahorroPesos = parseInt(data.ahorro) || 0;
            const ahorroUFInput = ahorroPesos / VALOR_UF_HOY; 
            const adultos = parseInt(data.adultos);
            const ninos = parseInt(data.ninos) || 0;
            const totalPersonas = adultos + ninos;
            const banco = data.banco;
            const tasaAnual = TASAS_BANCOS[banco] || 0.0450;
            const plazo = parseInt(data.plazo);
            const region = data.region;
            
            const isYoungSingle = (totalPersonas === 1); 
            const percentile = calculatePercentile(sueldo);
            
            // B. Cálculo de Crédito Puro
            const multiplier = isYoungSingle ? 3 : 4;
            const incomeUF = sueldo / VALOR_UF_HOY;
            const maxMonthlyPaymentUF = incomeUF / multiplier;

            const tasaMensual = tasaAnual / 12;
            const meses = plazo * 12;
            const factor = (1 - Math.pow(1 + tasaMensual, -meses)) / tasaMensual;
            const loanAmountUF = maxMonthlyPaymentUF * factor; 


            // C. Selección de Calculadora
            let codigoSubsidy = 'SIN_SUBSIDIO';
            if (data.has_subsidy === 'yes') codigoSubsidy = data.subsidy_owned; 
            else if (data.want_subsidy === 'yes') codigoSubsidy = data.subsidy_type;
            else if (data.want_subsidy === 'no') codigoSubsidy = 'SIN_SUBSIDIO';

            const calculadora = CALCULADORAS[codigoSubsidy] || CALCULADORAS['SIN_SUBSIDIO'];

            // D. Ejecución
            const inputs = {
                ahorroUF: ahorroUFInput,
                location: getZoneFromRegion(region),
                loanAmountUF: loanAmountUF,
                ufValue: VALOR_UF_HOY,
                // Nuevos inputs para validación social (DS1 T3)
                sueldoTotal: sueldo,
                totalPersonas: totalPersonas
            };

            const resultado = calculadora(inputs);

            // E. Lógica especial para guardar Ahorro
            let ahorroParaGuardar = ahorroUFInput;
            if (resultado.hasOwnProperty('ahorroOutput')) {
                ahorroParaGuardar = resultado.ahorroOutput; // 0 para DS19
            }


            // F. Preparar Payload Oracle
            const payloadDB = {
                NOMBRE_COMPLETO: data.nombre,
                EMAIL: data.email,
                TELEFONO: data.telefono,
                REGION: region.toUpperCase(),
                MACRO_REGION: getZoneFromRegion(region).toUpperCase(),
                
                ADULTOS: adultos,
                NINOS: ninos,
                TOTAL_PERSONAS: totalPersonas,
                
                SUELDO_CLP: sueldo,
                BANCO: banco,
                TASA_BANCO: tasaAnual,
                PLAZO_ANOS: plazo,
                
                TIENE_SUBSIDIO: (data.has_subsidy === 'yes') ? 'S' : 'N',
                TIPO_SUBSIDIO: (data.has_subsidy === 'yes') ? data.subsidy_owned : null,
                DESEA_POSTULAR: (data.want_subsidy === 'yes') ? data.subsidy_type : 'SIN_SUBSIDIO',
                
                AHORRO_UF: parseFloat(ahorroParaGuardar.toFixed(2)),
                SUBSIDIO_UF: parseFloat(resultado.subsidioUF.toFixed(2)),
                CREDITO_MAX_UF: parseFloat(resultado.creditoUF.toFixed(2)),
                VALOR_MAX_VIVIENDA_UF: parseFloat(resultado.valorViviendaUF.toFixed(2)),
                
                JOVEN_SOLTERO: isYoungSingle ? 'S' : 'N',
                ESTADO_LEAD: 'INSCRITO'
            };

            console.log("Payload Oracle:", payloadDB);
            
            // --- FETCH AL BACKEND ---
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payloadDB)
            });

            if (!response.ok) {
                throw new Error("Error al guardar los datos en el servidor.");
            }

            // G. Mensaje Final
            let msg = `✅ Evaluación Exitosa: ${resultado.nombre}\n\n`;
            
            if (codigoSubsidy === 'DS19') {
                msg += `💰 Tu Creidto Maximo (Descontando Ahorro y Subsidio): ${payloadDB.CREDITO_MAX_UF} UF\n`;
            } else {
                msg += `🏠 Valor Vivienda Máximo: ${payloadDB.VALOR_MAX_VIVIENDA_UF} UF\n`;
                msg += `💳 Crédito del Banco: ${payloadDB.CREDITO_MAX_UF} UF\n`;
                
                // LÓGICA DE ALERTA DE PIE (Solo si existe la propiedad deficitUF)
                if (resultado.deficitUF > 0) {
                    msg += `\n⚠️ ATENCIÓN: Te faltan ${resultado.deficitUF.toFixed(1)} UF para el pie.\n`;
                    msg += `💡 Tip: Muchas inmobiliarias permiten pagar esto en cuotas.`;
                } else if (codigoSubsidy === 'SIN_SUBSIDIO') {
                    msg += `✅ ¡Tienes el pie completo cubierto!`;
                }
                
                if(resultado.subsidioUF > 0) msg += `🎁 Subsidio: ${payloadDB.SUBSIDIO_UF} UF`;
            }
            
            alert(msg);
            
        } catch (error) {
            // Manejo de errores (incluye validación de ingresos DS1 T3)
            alert("⚠️ Atención: " + error); 
        }
    });

});