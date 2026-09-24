// src/app/percentil/ds1t1/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";

const formatCLP = (value: number) => {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0
  }).format(value);
};

// 1. DICCIONARIO DE PUNTAJES DE CORTE (DS1 TRAMO 1 - PRIMER LLAMADO 2025)
const PUNTAJES_CORTE_T1: Record<string, number> = {
  arica: 598.30,
  tarapaca: 406.66,
  antofagasta: 378.73,
  atacama: 455.22,
  coquimbo: 618.59,
  valparaiso: 610.21,
  ohiggins: 645.83,
  maule: 598.79,
  nuble: 641.16,
  biobio: 622.66,
  araucania: 636.32,
  rios: 570.44,
  lagos: 536.05,
  aysen: 362.05,
  magallanes: 530.65,
  metropolitana: 578.09
};

const AHORRO_MINIMO_T1 = 30; // UF

export default function AhorroSeguroDS1T1Page() {
  const [ufValue, setUfValue] = useState(DEFAULT_UF_VALUE);
  const [results, setResults] = useState<any>(null);

  // Estados del Formulario
  const [region, setRegion] = useState("");
  const [integrantesExtra, setIntegrantesExtra] = useState("0");
  const [menores5, setMenores5] = useState("0");
  const [menores18, setMenores18] = useState("0");
  const [adultosMayores, setAdultosMayores] = useState("0");
  const [discapacidad, setDiscapacidad] = useState("0");
  const [postulanteMayor, setPostulanteMayor] = useState("no");
  const [monoparental, setMonoparental] = useState("no");
  const [victimaPolitica, setVictimaPolitica] = useState("no");
  const [bombero, setBombero] = useState("no");
  const [gendarmeria, setGendarmeria] = useState("no");
  const [servicioMilitar, setServicioMilitar] = useState("0");
  const [viviendaDestruida, setViviendaDestruida] = useState("no");
  const [dormitorios, setDormitorios] = useState("1");
  const [postulacionesFallidas, setPostulacionesFallidas] = useState("0");
  const [mesesDs52, setMesesDs52] = useState("0");
  const [constanciaAhorro, setConstanciaAhorro] = useState("0");

  useEffect(() => {
    async function init() {
      const uf = await fetchUFValue();
      setUfValue(uf);
    }
    init();
  }, []);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!region) {
      alert("Por favor, selecciona una región para continuar.");
      return;
    }

    // A. Parseo seguro
    const val = (s: string) => parseInt(s) || 0;
    const vIntegrantesExtra = val(integrantesExtra);
    const vDormitorios = Math.max(1, val(dormitorios)); // Prevenir división por 0

    // B. CÁLCULO DEL PUNTAJE BASE
    let puntajeBase = 0;

    // Familia
    puntajeBase += (vIntegrantesExtra * 40);
    puntajeBase += (val(menores5) * 30);
    puntajeBase += (val(menores18) * 20);
    puntajeBase += (val(adultosMayores) * 30);
    puntajeBase += (val(discapacidad) * 30);
    
    if (postulanteMayor === "si") puntajeBase += 150;
    if (monoparental === "si") puntajeBase += 35;

    // Condiciones Especiales
    if (victimaPolitica === "si") puntajeBase += 300;
    if (bombero === "si") puntajeBase += 40;
    if (viviendaDestruida === "si") puntajeBase += 50;
    if (gendarmeria === "si") puntajeBase += 40;
    puntajeBase += (val(servicioMilitar) * 20); 

    // Historial y Constancia
    puntajeBase += (val(postulacionesFallidas) * 25);
    
    // Arriendo DS52 (80 pts por cada 12 meses, máximo 240)
    let anosArriendo = Math.floor(val(mesesDs52) / 12);
    let puntosArriendo = Math.min(anosArriendo * 80, 240);
    puntajeBase += puntosArriendo;

    puntajeBase += val(constanciaAhorro);

    // Hacinamiento
    const totalPersonas = vIntegrantesExtra + 1; // +1 por el postulante
    const indiceHacinamiento = totalPersonas / vDormitorios;
    
    if (indiceHacinamiento > 3.5) puntajeBase += 270;
    else if (indiceHacinamiento > 3.0) puntajeBase += 135;
    else if (indiceHacinamiento > 2.5) puntajeBase += 90;
    else if (indiceHacinamiento > 2.0) puntajeBase += 45;

    // C. CÁLCULO DE LA BRECHA Y EL AHORRO EXTRA
    const puntajeCorte = PUNTAJES_CORTE_T1[region];
    let puntosFaltantes = puntajeCorte - puntajeBase;
    let ufExtraNecesarias = 0;

    if (puntosFaltantes > 0) {
      let puntosPorCubrir = puntosFaltantes;

      // Tramo 1 de exceso (hasta 60 UF) a 4 puntos c/u
      let maxPuntosFase1 = 60 * 4; 
      if (puntosPorCubrir <= maxPuntosFase1) {
          ufExtraNecesarias += puntosPorCubrir / 4;
          puntosPorCubrir = 0;
      } else {
          ufExtraNecesarias += 60;
          puntosPorCubrir -= maxPuntosFase1;
      }

      // Tramo 2 de exceso (de la 61 a 110 = 50 UF) a 2 puntos c/u
      if (puntosPorCubrir > 0) {
          let maxPuntosFase2 = 50 * 2;
          if (puntosPorCubrir <= maxPuntosFase2) {
              ufExtraNecesarias += puntosPorCubrir / 2;
              puntosPorCubrir = 0;
          } else {
              ufExtraNecesarias += 50;
              puntosPorCubrir -= maxPuntosFase2;
          }
      }

      // Tramo 3 de exceso (de la 111 a 160 = 50 UF) a 1 punto c/u
      if (puntosPorCubrir > 0) {
          let maxPuntosFase3 = 50 * 1; 
          if (puntosPorCubrir <= maxPuntosFase3) {
              ufExtraNecesarias += puntosPorCubrir / 1;
              puntosPorCubrir = 0;
          } else {
              ufExtraNecesarias += 50;
              puntosPorCubrir -= maxPuntosFase3;
          }
      }

      // Tramo Final (más de 160 UF de exceso) a 0.05 puntos c/u
      if (puntosPorCubrir > 0) {
          ufExtraNecesarias += puntosPorCubrir / 0.05;
      }
    }

    const ahorroMetaUF = AHORRO_MINIMO_T1 + ufExtraNecesarias;

    setResults({
      puntajeBase,
      puntajeCorte,
      puntosFaltantes: Math.max(0, puntosFaltantes),
      ahorroMetaUF,
      ahorroMetaCLP: ahorroMetaUF * ufValue,
      isExcessive: ahorroMetaUF > 250
    });
    
    // Smooth scroll al resultado (Timeout pequeño para que el DOM renderice primero)
    setTimeout(() => {
      document.getElementById("resultados-ahorro")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-12">
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-10 border-b-4 border-white shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Ahorro Seguro: DS1 Tramo 1</h1>
            <p className="text-blue-50 text-xs md:text-sm opacity-90 mt-1">
              Descubre exactamente cuánto debes ahorrar para superar a la competencia y ganar el subsidio.
            </p>
          </div>
          <Link href="/percentil" className="text-xs font-bold bg-white/20 text-white px-3 py-2 rounded-lg hover:bg-white/30 transition-all">
            ← Volver
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm mb-8">
          <form onSubmit={handleCalculate} className="space-y-6">
            
            {/* UBICACIÓN */}
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-2">¿En qué región vas a postular?</label>
              <select className="w-full p-3 border border-blue-200 rounded-xl bg-white text-sm focus:outline-none focus:border-blue-400 font-medium" value={region} onChange={(e) => setRegion(e.target.value)}>
                <option value="">Selecciona tu región...</option>
                <option value="arica">Región de Arica y Parinacota</option>
                <option value="tarapaca">Región de Tarapacá</option>
                <option value="antofagasta">Región de Antofagasta</option>
                <option value="atacama">Región de Atacama</option>
                <option value="coquimbo">Región de Coquimbo</option>
                <option value="valparaiso">Región de Valparaíso</option>
                <option value="metropolitana">Región Metropolitana de Santiago</option>
                <option value="ohiggins">Región de O'Higgins</option>
                <option value="maule">Región del Maule</option>
                <option value="nuble">Región de Ñuble</option>
                <option value="biobio">Región del Biobío</option>
                <option value="araucania">Región de La Araucanía</option>
                <option value="rios">Región de Los Ríos</option>
                <option value="lagos">Región de Los Lagos</option>
                <option value="aysen">Región de Aysén</option>
                <option value="magallanes">Región de Magallanes</option>
              </select>
            </div>

            <div className="h-px bg-slate-100 my-4"></div>

            {/* NÚCLEO FAMILIAR */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Tu Núcleo Familiar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Integrantes extra (SIN contarte a ti):</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={integrantesExtra} onChange={(e) => setIntegrantesExtra(e.target.value)} />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Ej: Si postulas tú y tu pareja, escribe 1.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Niños de 0 a 5 años:</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={menores5} onChange={(e) => setMenores5(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Menores de 6 a 18 años:</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={menores18} onChange={(e) => setMenores18(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adultos Mayores (Excluyéndote a ti):</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={adultosMayores} onChange={(e) => setAdultosMayores(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Inscritos en el Registro Nacional de Discapacidad:</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={discapacidad} onChange={(e) => setDiscapacidad(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-4"></div>

            {/* CONDICIONES ESPECIALES */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Condiciones Especiales (Postulante)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Tienes 60 años o más?</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={postulanteMayor} onChange={(e) => setPostulanteMayor(e.target.value)}>
                    <option value="no">No</option><option value="si">Sí (+150 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Padre/Madre monoparental con hijos a cargo?</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={monoparental} onChange={(e) => setMonoparental(e.target.value)}>
                    <option value="no">No</option><option value="si">Sí (+35 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Condición Valech / Rettig?</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={victimaPolitica} onChange={(e) => setVictimaPolitica(e.target.value)}>
                    <option value="no">No</option><option value="si">Sí (+300 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Bombero Voluntario Activo?</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={bombero} onChange={(e) => setBombero(e.target.value)}>
                    <option value="no">No</option><option value="si">Sí (+40 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Funcionario Activo de Gendarmería?</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={gendarmeria} onChange={(e) => setGendarmeria(e.target.value)}>
                    <option value="no">No</option><option value="si">Sí (+40 pts)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Familiares con Servicio Militar (Cant):</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={servicioMilitar} onChange={(e) => setServicioMilitar(e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Ex propietario de vivienda destruida/inhabitable?</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={viviendaDestruida} onChange={(e) => setViviendaDestruida(e.target.value)}>
                    <option value="no">No</option><option value="si">Sí (+50 pts)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-4"></div>

            {/* VIVIENDA ACTUAL Y CONSTANCIA */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Vivienda Actual y Constancia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Cuántos dormitorios tiene tu casa actual?</label>
                  <input type="number" min="1" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={dormitorios} onChange={(e) => setDormitorios(e.target.value)} />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Se evalúa el hacinamiento.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">¿Cuántas veces has postulado antes y fallado?</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={postulacionesFallidas} onChange={(e) => setPostulacionesFallidas(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Meses pagados al día en Subsidio de Arriendo:</label>
                  <input type="number" min="0" className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={mesesDs52} onChange={(e) => setMesesDs52(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Antigüedad de tu Ahorro:</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none" value={constanciaAhorro} onChange={(e) => setConstanciaAhorro(e.target.value)}>
                    <option value="0">Reciente (O lo pondré todo ahora)</option>
                    <option value="25">Buen saldo hace 1 semestre (+25 pts)</option>
                    <option value="50">Buen saldo hace 2 semestres (+50 pts)</option>
                    <option value="75">Buen saldo hace 3 semestres (+75 pts)</option>
                    <option value="100">Buen saldo constante hace 4 semestres o más (+100 pts)</option>
                  </select>
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#6b9ac4] text-white font-bold p-4 rounded-xl hover:bg-[#5a86ae] transition-colors shadow-sm text-lg mt-4">
              Calcular Mi Ahorro Meta
            </button>
          </form>
        </section>

        {/* INTERFAZ DE RESULTADOS */}
        {results && (
          <section id="resultados-ahorro" className="space-y-4 animate-fade-in">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Análisis de Puntaje</h3>
                  <p className="text-sm text-slate-600">El corte histórico en tu región es de <strong>{results.puntajeCorte} pts.</strong></p>
                  <p className="text-sm text-slate-600">Tu perfil base genera: <strong>{results.puntajeBase} pts.</strong></p>
                </div>
                
                {results.puntosFaltantes === 0 ? (
                  <div className="bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200 text-center md:text-right">
                    <span className="text-xs font-bold text-emerald-600 block uppercase">Brecha superada</span>
                    <strong className="text-lg text-emerald-800">¡Ya estás clasificado! 🎉</strong>
                  </div>
                ) : (
                  <div className="bg-amber-50 px-4 py-3 rounded-xl border border-amber-200 text-center md:text-right">
                    <span className="text-xs font-bold text-amber-600 block uppercase">Puntos Faltantes</span>
                    <strong className="text-2xl text-amber-800">{results.puntosFaltantes.toFixed(1)} pts</strong>
                  </div>
                )}
              </div>

              {results.isExcessive ? (
                <div className="bg-orange-50 border-2 border-orange-300 p-5 rounded-xl text-center">
                  <h3 className="text-lg font-bold text-orange-900 mb-2">¡Cuidado, la meta de ahorro es muy alta! ⚠️</h3>
                  <p className="text-sm text-orange-800 mb-4">Para ganar el Tramo 1 en tu región necesitarías compensar tu puntaje ahorrando unas asombrosas <strong>{results.ahorroMetaUF.toFixed(1)} UF</strong> ({formatCLP(results.ahorroMetaCLP)}).</p>
                  
                  <div className="bg-white p-4 rounded-lg border border-orange-200 mb-4">
                    <p className="text-sm font-medium text-slate-700">Por estrategia financiera, <strong>te conviene mucho más postular al Subsidio DS1 Tramo 2</strong>. Aunque exige un mínimo inicial levemente mayor (40 UF), sus puntajes de corte regionales son drásticamente más bajos. ¡Terminarás ganando usando menos dinero de tu bolsillo!</p>
                  </div>
                  
                  <Link href="/percentil/ds1t2" className="inline-block bg-orange-500 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-orange-600 transition-colors">
                    Ir al simulador del Tramo 2 →
                  </Link>
                </div>
              ) : (
                <div className="bg-blue-50 border-2 border-blue-200 p-6 rounded-xl text-center">
                  <p className="text-sm text-blue-800 mb-2 font-medium">Esta es la cantidad exacta que necesitas tener en tu libreta para asegurar matemáticamente tu victoria:</p>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Tu Ahorro Seguro Meta</h3>
                  <strong className="text-4xl md:text-5xl font-black text-blue-900 block mb-1">
                    {results.ahorroMetaUF.toFixed(1)} UF
                  </strong>
                  <span className="text-lg font-bold text-[#6b9ac4]">
                    ≈ {formatCLP(results.ahorroMetaCLP)}
                  </span>
                  {results.puntosFaltantes === 0 && (
                    <p className="text-xs text-slate-500 mt-4">Como tu puntaje base ya supera el corte, solo se te exige el mínimo legal establecido (30 UF).</p>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}