// src/app/subsidies/ds19/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";
import { BANKS } from "@/data/banks";

export default function DS19Page() {
  const [propertyCLP, setPropertyCLP] = useState("");
  const [propertyUF, setPropertyUF] = useState("");
  const [savings, setSavings] = useState("");
  const [bank, setBank] = useState("");
  const [loanTerm, setLoanTerm] = useState("25");
  const [isYoungSingle, setIsYoungSingle] = useState(false);
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  // Estados de la Nueva Matriz Normativa
  const [subsidyType, setSubsidyType] = useState("none"); // "ds49" | "ds1t1" | "ds1t2" | "ds1t3" | "none"
  const [cupoType, setCupoType] = useState("urban_media"); // Depende del subsidio elegido
  const [location, setLocation] = useState("regular"); // "regular" | "urbana_norte_stgo" | "sur_islas"
  const [propertyType, setPropertyType] = useState<"casa" | "depto">("depto");
  const [manualSubsidy, setManualSubsidy] = useState(""); // Para subsidios mínimos/variables
  const [isDS15, setIsDS15] = useState(true);

  // ESTA ES LA CONSTANTE CORREGIDA: Accesible para toda la página
  const isVariable = 
    (subsidyType === "ds1t2" && cupoType === "medios2") ||
    subsidyType === "ds1t3" ||
    (subsidyType === "none" && cupoType === "urban_media");

  // Efecto secundario para sincronizar el Tipo de Cupo por defecto al cambiar el subsidio
  useEffect(() => {
    if (subsidyType === "ds49") setCupoType("vulnerable");
    if (subsidyType === "ds1t3") setCupoType("medios2");
    if (subsidyType === "ds1t1") setCupoType("vulnerable");
    if (subsidyType === "ds1t2") setCupoType("medios1");
    if (subsidyType === "none") setCupoType("urban_media");
    setResults(null);
  }, [subsidyType]);

  useEffect(() => {
    async function init() {
      const uf = await fetchUFValue();
      setUfValue(uf);
    }
    init();
  }, []);

  const handleCLPChange = (val: string) => {
    setPropertyCLP(val);
    const clp = parseFloat(val);
    if (!isNaN(clp) && ufValue > 0) {
      setPropertyUF((clp / ufValue).toFixed(2));
    } else {
      setPropertyUF("");
    }
  };

  const handleUFChange = (val: string) => {
    setPropertyUF(val);
    const uf = parseFloat(val);
    if (!isNaN(uf) && ufValue > 0) {
      setPropertyCLP((uf * ufValue).toFixed(0));
    } else {
      setPropertyCLP("");
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const pUF = parseFloat(propertyUF);
    const sUF = parseFloat(savings);
    const term = parseInt(loanTerm);

    if (!bank || !BANKS[bank]) {
      alert("Por favor, selecciona un banco adscrito.");
      return;
    }
    const esCupoVulnerable = subsidyType === "ds49" || (subsidyType === "ds1t1" && cupoType === "vulnerable");
    if (esCupoVulnerable) {
      if (sUF < 40) {
        alert("Para postular al cupo vulnerable se exige un ahorro mínimo de 40 UF.");
        return;
      }
    } else {
      if (sUF < 80) {
        alert("Para proyectos DS19 (Sectores Medios) se exige un ahorro mínimo de 80 UF (con beneficio DS15 aplicado automáticamente).");
        return;
      }
    }

    let maxLimit = 2600;
    let baseSubsidy = 0;
    let minAllowedSubsidy = 350;
    let nombreTramoVisual = "";

    // -------------------------------------------------------------------------
    // CASO 1: El usuario tiene DS49 o DS1 Tramo 1 (Cupo de Sectores Vulnerables)
    // -------------------------------------------------------------------------
    if (subsidyType === "ds49" || (subsidyType === "ds1t1" && cupoType === "vulnerable")) {
      nombreTramoVisual = "Cupo de Integración Social (Sectores Vulnerables - Mín. 25% del Proyecto)";
      if (location === "sur_islas") {
        maxLimit = 2000;
        baseSubsidy = 1700;
      } else if (location === "urbana_norte_stgo") {
        maxLimit = propertyType === "casa" ? 1500 : 1600;
        baseSubsidy = propertyType === "casa" ? 1200 : 1300;
      } else {
        maxLimit = propertyType === "casa" ? 1600 : 1500;
        baseSubsidy = propertyType === "casa" ? 1100 : 1200;
      }
    }
    // -------------------------------------------------------------------------
    // CASO 2 o 4.1: Tiene DS1 T1/T2 o Sin Subsidio (Cupo Sectores Medios 1 / Rural)
    // -------------------------------------------------------------------------
    else if (
      (subsidyType === "ds1t1" && cupoType === "medios1") ||
      (subsidyType === "ds1t2" && cupoType === "medios1") ||
      (subsidyType === "none" && cupoType === "vulnerable_rural")
    ) {
      nombreTramoVisual = "Cupo Sectores Medios / Zona Rural (Mín. 15% del Proyecto)";
      if (location === "sur_islas") {
        maxLimit = 2400;
        baseSubsidy = 537.5;
      } else if (location === "urbana_norte_stgo") {
        maxLimit = 1900;
        baseSubsidy = 487.5;
      } else {
        maxLimit = 1800;
        baseSubsidy = 425;
      }
    }
    // -------------------------------------------------------------------------
    // CASO 3 o 4.2: Tiene DS1 T2/T3 o Sin Subsidio (Cupo Sectores Medios 2 / Urbano)
    // -------------------------------------------------------------------------
    else if (isVariable) { // <-- Ahora usamos la constante global
      nombreTramoVisual = "Cupo Sectores Medios / Zona Urbana (Hasta 60% del Proyecto)";
      if (location === "sur_islas") {
        maxLimit = 3000;
        minAllowedSubsidy = 500;
      } else if (location === "urbana_norte_stgo") {
        maxLimit = 2800;
        minAllowedSubsidy = 350;
      } else {
        maxLimit = 2600;
        minAllowedSubsidy = 350;
      }

      const inputSub = parseFloat(manualSubsidy);
      if (isNaN(inputSub) || inputSub < minAllowedSubsidy) {
        alert(`Para esta zona, debes ingresar el subsidio específico del proyecto (Mínimo ${minAllowedSubsidy} UF).`);
        return;
      }
      baseSubsidy = inputSub;
    }

    if (pUF > maxLimit) {
      alert(`El valor de la vivienda supera el tope máximo de ${maxLimit} UF permitido para esta modalidad y zona.`);
      return;
    }

    // Aplicar beneficio DS15 (+100 UF si es sector medio)
    const esCupoVulnerableFromTramo = nombreTramoVisual.includes("Vulnerables");
    if (isDS15 && esCupoVulnerableFromTramo) {
      alert("El beneficio transitorio DS15 aplica exclusivamente a los tramos de Sectores Medios.");
      return;
    }

    const ds15Bonus = isDS15 ? 100 : 0;
    const totalSubsidy = baseSubsidy + ds15Bonus;
    const loanAmount = pUF - sUF - totalSubsidy;

    if (loanAmount <= 0) {
      alert("Tu ahorro y el subsidio asignado cubren el valor completo. No requieres un crédito hipotecario.");
      return;
    }

    // Motor central de tasas
    const bankData = BANKS[bank];
    const tasaOriginal = bankData.calcularTasa ? bankData.calcularTasa(loanAmount, term) : (bankData.tasaBase || 0.05);
    const tasaAplicada = tasaOriginal - (bankData.descuentoDS15 || 0);

    const monthlyRate = tasaAplicada / 12;
    const totalPayments = term * 12;
    const monthlyPayment = (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    const incomeMultiplier = isYoungSingle ? 3 : 4;

    setResults({
      valorViviendaUF: pUF,
      pieUF: sUF,
      piePorcentajeReal: (sUF / pUF) * 100,
      creditoUF: loanAmount,
      banco: bankData.name,
      tasaOriginal,
      tasaAplicada,
      dividendoUF: monthlyPayment,
      rentaMinimaUF: monthlyPayment * incomeMultiplier,
      ahorroMensualCLP: totalSubsidy * ufValue,
      aplicaLey: true,
      aplicaDS15: isDS15,
      tramoDetectado: nombreTramoVisual,
      subsidioBaseUF: baseSubsidy,
      bonoExtra: ds15Bonus,
      multiplicadorRenta: incomeMultiplier
    });
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Integración Social DS19</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Configurador avanzado con cruce de subsidios previos y asignación geográfica.
            </p>
          </div>
          <Link href="/subsidies" className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all">
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleCalculate} className="space-y-5">
            
            {/* ENTRADA DE SUBSIDIO PREVIO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">¿Tienes un subsidio adjudicado?</label>
                <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none" value={subsidyType} onChange={(e) => setSubsidyType(e.target.value)}>
                  <option value="none">No tengo subsidio previo (Postulación Directa)</option>
                  <option value="ds49">Sí, tengo Subsidio DS49</option>
                  <option value="ds1t1">Sí, tengo Subsidio DS1 Tramo 1</option>
                  <option value="ds1t2">Sí, tengo Subsidio DS1 Tramo 2</option>
                  <option value="ds1t3">Sí, tengo Subsidio DS1 Tramo 3</option>
                </select>
              </div>

              {/* DROPDOWN CONDICIONAL PARA MANEJAR TRASLAPE DE CUPOS */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Cupo o Sector del Proyecto:</label>
                {subsidyType === "ds49" && <input type="text" readOnly className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-sm font-medium text-slate-500" value="Cupo Vulnerable Asignado" />}
                {subsidyType === "ds1t3" && <input type="text" readOnly className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-100 text-sm font-medium text-slate-500" value="Cupo Sectores Medios 2 Asignado" />}
                
                {subsidyType === "ds1t1" && (
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none text-blue-600 font-bold" value={cupoType} onChange={(e) => setCupoType(e.target.value)}>
                    <option value="vulnerable">Postular a Cupo Vulnerable (Hasta 1400-1600 UF)</option>
                    <option value="medios1">Postular a Cupo Sectores Medios 1 (Hasta 1800-1900 UF)</option>
                  </select>
                )}
                {subsidyType === "ds1t2" && (
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none text-blue-600 font-bold" value={cupoType} onChange={(e) => setCupoType(e.target.value)}>
                    <option value="medios1">Postular a Cupo Sectores Medios 1 (Hasta 1800-1900 UF)</option>
                    <option value="medios2">Postular a Cupo Sectores Medios 2 (Hasta 2600-2800 UF)</option>
                  </select>
                )}
                {subsidyType === "none" && (
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-white text-sm focus:outline-none text-blue-600 font-bold" value={cupoType} onChange={(e) => setCupoType(e.target.value)}>
                    <option value="urban_media">Sector Urbano / Clase Media (Hasta 2600-3000 UF)</option>
                    <option value="vulnerable_rural">Sector Vulnerable / Rural (Hasta 1800-2400 UF)</option>
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Precio Vivienda ($ CLP):</label>
                <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={propertyCLP} onChange={(e) => handleCLPChange(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Precio Vivienda (UF):</label>
                <input type="number" required min="500" step="0.01" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={propertyUF} onChange={(e) => handleUFChange(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Zona Geográfica del Proyecto:</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                >
                    <option value="regular">Demás Regiones y Comunas de Chile</option>
                    
                    {/* TEXTO DINÁMICO: Cambia según el tramo detectado */}
                    {isVariable ? (
                      <option value="urbana_norte_stgo">
                        Zona Urbana (Arica, Iquique, Antofagasta, Calama, Copiapó, Valparaíso, Viña del Mar, Concepción, Los Ángeles, Gran Stgo, Chiloé)
                      </option>
                    ) : (
                      <option value="urbana_norte_stgo">
                        Zona Norte y Santiago (Arica y Parinacota, Tarapacá, Antofagasta, Atacama, Gran Santiago, Chiloé)
                      </option>
                    )}

                    <option value="sur_islas">
                      Zona Sur Extrema e Islas (Aysén/Coyhaique, Magallanes/Punta Arenas, Palena, Isla de Pascua, Juan Fernández)
                    </option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Edificación:</label>
                <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={propertyType} onChange={(e) => setPropertyType(e.target.value as "casa" | "depto")}>
                    <option value="depto">Departamento</option>
                    <option value="casa">Casas (O de edificación general en zonas mixtas)</option>
                </select>
              </div>
            </div>

            {/* MONTO VARIABLE EXCLUSIVO PARA RANGOS MEDIOS 2 (AHORA FUNCIONA) */}
            {isVariable && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl animate-fade-in">
                <label className="block text-xs font-bold text-blue-900 mb-1">Subsidio específico informado por la Inmobiliaria (UF):</label>
                <input type="number" required step="0.01" placeholder={location === "sur_islas" ? "Mínimo 500 UF" : "Mínimo 350 UF"} className="w-full p-2.5 border border-blue-300 rounded-xl bg-white text-sm focus:outline-none" value={manualSubsidy} onChange={(e) => setManualSubsidy(e.target.value)} />
                <span className="text-[10px] text-blue-700 mt-1 block">Este subsidio es variable. Debes colocar el valor que el proyecto inmobiliario presente para este modelo de vivienda.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Ahorro Neto (UF):</label>
                <input type="number" required min="40" step="1" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={savings} onChange={(e) => setSavings(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Banco Evaluador:</label>
                <select required className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={bank} onChange={(e) => setBank(e.target.value)}>
                    <option value="">Selecciona una entidad...</option>
                    {BANKS && typeof BANKS === 'object' && Object.keys(BANKS).map(key => {
                      const b = BANKS[key];
                      return <option key={key} value={key}>{b?.name || key} ({b?.tasaBase ? `${(b.tasaBase * 100).toFixed(2)}%` : 'Tasa Dinámica'})</option>;
                    })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Plazo de Amortización:</label>
                <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={loanTerm} onChange={(e) => setLoanTerm(e.target.value)}>
                  <option value="10">10 años</option>
                  <option value="15">15 años</option>
                  <option value="20">20 años</option>
                  <option value="25">25 años</option>
                  <option value="30">30 años</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-400 cursor-not-allowed">
                <input type="checkbox" checked disabled className="w-4 h-4 rounded text-slate-300" /> 
                Proyecto de Integración Social (Vivienda Nueva por defecto)
              </label>
              
              <div className="pl-6">
                <label className="flex items-center gap-2 text-sm font-bold text-blue-700 cursor-not-allowed">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={true} disabled /> 
                  Beneficio DS15 aplicado automáticamente: +100 UF Subsidio y rebaja de tasa (Mín. 80 UF de ahorro)
                </label>
              </div>

              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer pt-2 border-t border-slate-200">
                <input type="checkbox" className="w-4 h-4 text-[#6b9ac4] rounded" checked={isYoungSingle} onChange={(e) => setIsYoungSingle(e.target.checked)} /> 
                ¿Eres joven soltero menor de 35 años?
              </label>
            </div>

            <button type="submit" className="w-full bg-[#87c0a3] text-slate-950 font-bold p-3.5 rounded-xl hover:bg-[#76b092] transition-colors shadow-sm">
              Analizar Financiamiento DS19
            </button>
          </form>
        </section>

        {/* INTERFAZ DE RESULTADOS */}
        {results && (
          <section className="space-y-4 animate-fade-in">
            <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 p-5 rounded-xl shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="inline-block px-3 py-0.5 bg-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-full mb-2">
                    {results.tramoDetectado}
                  </span>
                  <h4 className="text-sm font-bold">Subsidio Total Financiado por Proyecto</h4>
                  <p className="text-xs opacity-90 mt-0.5">Subsidio base adjudicado: {results.subsidioBaseUF} UF {results.aplicaDS15 ? `+ ${results.bonoExtra} UF (Booster DS15)` : ''}</p>
                </div>
                <div className="md:text-right">
                  <span className="text-2xl font-black text-emerald-700 block leading-none">
                    ${Math.round(results.ahorroMensualCLP).toLocaleString("es-CL")} CLP
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                Análisis de Crédito
              </h3>

              <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                <div>
                  <span className="text-slate-500 block">Precio Propiedad:</span>
                  <strong className="text-slate-800">{results.valorViviendaUF.toFixed(2)} UF</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Ahorro (Pie):</span>
                  <strong className="text-slate-800">{results.pieUF.toFixed(2)} UF</strong>
                </div>
                <div className="pt-2 border-t border-slate-50">
                  <span className="text-slate-500 block">Crédito Neto a Solicitar:</span>
                  <strong className="text-blue-600 font-bold">{results.creditoUF.toFixed(2)} UF</strong>
                </div>
                <div className="pt-2 border-t border-slate-50">
                  <span className="text-slate-500 block">Tasa Final Efectiva:</span>
                  <strong className="text-slate-800">
                    {(results.tasaAplicada * 100).toFixed(2)}% Anual
                  </strong>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Dividendo Neto Estimado:</span>
                  <span className="text-xl font-extrabold text-slate-900">{results.dividendoUF.toFixed(2)} UF</span>
                  <span className="text-sm font-semibold text-blue-600 block">
                    ≈ ${Math.round(results.dividendoUF * ufValue).toLocaleString("es-CL")} / mes
                  </span>
                </div>
                <div className="md:border-l md:pl-4 border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block uppercase tracking-wide">Renta Mínima Bancaria:</span>
                  <span className="text-lg font-bold text-slate-800">{results.rentaMinimaUF.toFixed(2)} UF</span>
                  <span className="text-sm font-bold text-slate-700 block">
                    ≈ ${Math.round(results.rentaMinimaUF * ufValue).toLocaleString("es-CL")}
                  </span>
                </div>
              </div>

              <div className="text-center pt-4">
                <Link 
                  href={`/ofertas-inmobiliarias?maxPrice=${Math.round(results.valorViviendaUF * ufValue)}&maxUF=${Math.round(results.valorViviendaUF)}&credit=${Math.round(results.creditoUF)}&origin=ds19&region=${
                    location === "sur_islas" ? "aysen" : 
                    location === "urbana_norte_stgo" ? "metropolitana" : 
                    "valparaiso"
                  }&propertyType=${propertyType === "depto" ? "departamento" : "casa"}&subsidyType=${subsidyType}&cupoType=${cupoType}`}
                  className="inline-block w-full bg-[#87c0a3] text-slate-950 font-bold py-3.5 px-6 rounded-xl hover:bg-[#76b092] transition-colors shadow-sm text-sm"
                >
                  Buscar Proyectos Nuevos DS19 →
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}