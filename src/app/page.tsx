// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  const herramientas = [
    {
      href: "/percentil",
      categoria: "Paso 1: Diagnóstico Social",
      titulo: "Calcula tu percentil",
      descripcion: "Evalúa tus ingresos mensuales según tu núcleo familiar para saber exactamente en qué tramo del RSH estás."
    },
    {
      href: "/asistente-subsidios",
      categoria: "Orientación Guiada",
      titulo: "Asistente de Subsidios",
      descripcion: "Descubre tu subsidio ideal (DS49, DS1 T1, T2 y T3) con inferencia RSH y cálculo de ahorro mínimo para ganar."
    },
    {
      href: "/subsidies",
      categoria: "Simulación de Compra",
      titulo: "Simulador de Subsidios",
      descripcion: "Calcula el dividendo mensual estimado aplicando los montos de subsidio de los decretos DS1, DS49 o DS19."
    },
    {
      href: "/sin-subsidio",
      categoria: "Crédito Bancario Puro",
      titulo: "Compra sin Subsidio",
      descripcion: "Simula un crédito hipotecario tradicional e integra automáticamente la rebaja de tasa de la nueva Ley 21.748."
    },
    {
      href: "/valor-maximo",
      categoria: "Capacidad de Endeudamiento",
      titulo: "Valor Máximo de Casa",
      descripcion: "Calcula el precio límite de la propiedad que puedes comprar según tu sueldo líquido y el plazo del crédito."
    },
    {
      href: "/creditos",
      categoria: "Información General",
      titulo: "Créditos y Alianzas",
      descripcion: "Conoce los objetivos comerciales de SubsiMatch, al equipo de desarrollo y canales de contacto."
    }
  ];

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 flex flex-col justify-between">
      <div>
        {/* Encabezado */}
        <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-14 border-b-4 border-white shadow-sm">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight drop-shadow-sm">
              SubsiMatch
            </h1>
            <p className="text-blue-50 mt-2 max-w-xl text-sm md:text-base font-medium opacity-90">
              Simulador independiente de subsidios habitacionales y créditos hipotecarios. Calcula tu capacidad de compra real de forma clara y directa.
            </p>
          </div>
        </header>

        {/* Contenedor del contenido */}
        <main className="max-w-5xl mx-auto px-6 py-10">
          
          {/* Bloque 0: Selección de Perfil (Onboarding) */}
          <section className="mb-10">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                ¿Cómo quieres comenzar tu simulación?
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-2 max-w-2xl mx-auto">
                Selecciona la opción que mejor se adapte a tu situación actual para guiarte en el proceso.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tarjeta 1: Conoce el mejor subsidio para ti */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg hover:border-[#6b9ac4] hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#6b9ac4] rounded-xl flex items-center justify-center font-bold text-xl mb-4 group-hover:bg-[#6b9ac4] group-hover:text-white transition-colors duration-300">
                    ✨
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Conoce el mejor subsidio para ti
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed mb-6">
                    Evaluamos tu grupo familiar con la escala oficial de adultos equivalentes del RSH y calculamos exactamente tu ahorro mínimo para ganar entre DS49, DS1 T1, T2 y T3.
                  </p>
                  
                  {/* Timeline visual */}
                  <div className="space-y-4 mb-8">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#6b9ac4] text-xs font-bold flex items-center justify-center">1</div>
                        <div className="w-0.5 h-6 bg-slate-200"></div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Inferencia RSH Oficial</h4>
                        <p className="text-[11px] text-slate-400">Escala de adultos equivalentes y necesidades según MDSF.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#6b9ac4] text-xs font-bold flex items-center justify-center">2</div>
                        <div className="w-0.5 h-6 bg-slate-200"></div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Matriz Comparativa Multitramo</h4>
                        <p className="text-[11px] text-slate-400">Clasificación en vivo entre DS49, DS1 T1, T2 y T3.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-[#6b9ac4] text-xs font-bold flex items-center justify-center">3</div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Ahorro Mínimo para Ganar</h4>
                        <p className="text-[11px] text-slate-400">Ecuación inversa regional para asegurar tu postulación.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/asistente-subsidios" 
                  className="w-full text-center py-3.5 px-4 bg-[#6b9ac4] text-white hover:bg-[#5a86ae] font-bold text-sm rounded-xl transition-all shadow-sm"
                >
                  Conoce el mejor subsidio para ti →
                </Link>
              </div>

              {/* Tarjeta 2: Calcula el Valor Máximo de Casa */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg hover:border-[#87c0a3] hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 bg-emerald-50 text-[#87c0a3] rounded-xl flex items-center justify-center font-bold text-xl mb-4 group-hover:bg-[#87c0a3] group-hover:text-slate-950 transition-colors duration-300">
                    🏠
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    Calcula el Valor Máximo de Casa
                  </h3>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed mb-6">
                    Determina en segundos el precio máximo de propiedad al que puedes acceder combinando tus ingresos, capacidad de crédito y subsidios habitacionales.
                  </p>

                  {/* Filtros rápidos / Accesos directos */}
                  <div className="space-y-3 mb-8">
                    <Link 
                      href="/subsidies"
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#87c0a3] hover:bg-slate-50 transition-all text-xs font-medium text-slate-700 hover:text-slate-900 group/item"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[#87c0a3]">✔</span>
                        Simulador de Subsidios (DS1, DS49, DS19)
                      </span>
                      <span className="text-slate-300 group-hover/item:text-[#87c0a3] transition-colors font-bold">→</span>
                    </Link>
                    <Link 
                      href="/valor-maximo"
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#87c0a3] hover:bg-slate-50 transition-all text-xs font-medium text-slate-700 hover:text-slate-900 group/item"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[#87c0a3]">✔</span>
                        Calcular Capacidad de Compra (Sueldo Líquido)
                      </span>
                      <span className="text-slate-300 group-hover/item:text-[#87c0a3] transition-colors font-bold">→</span>
                    </Link>
                    <Link 
                      href="/sin-subsidio"
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#87c0a3] hover:bg-slate-50 transition-all text-xs font-medium text-slate-700 hover:text-slate-900 group/item"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[#87c0a3]">✔</span>
                        Compra sin Subsidio (Hipotecario con Ley de Tasas)
                      </span>
                      <span className="text-slate-300 group-hover/item:text-[#87c0a3] transition-colors font-bold">→</span>
                    </Link>
                  </div>
                </div>

                <Link 
                  href="/valor-maximo" 
                  className="w-full text-center py-3.5 px-4 bg-[#87c0a3] text-slate-950 hover:bg-[#76b092] font-bold text-sm rounded-xl transition-all shadow-sm"
                >
                  Calcula el Valor Máximo de Casa →
                </Link>
              </div>
            </div>
          </section>

          {/* Bloque 1: Evaluación de Perfil Comercial */}
          <section className="mb-10">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md border border-slate-800">
              <div className="max-w-2xl">
                <span className="text-xs font-bold tracking-wider uppercase text-sky-400 block mb-1">
                  Evaluación de Perfil Comercial
                </span>
                <h2 className="text-xl md:text-2xl font-bold">
                  ¿Quieres que busquemos proyectos por ti?
                </h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1.5 leading-relaxed">
                  Ingresa tus datos financieros en nuestra calculadora avanzada. Analizamos tu capacidad de crédito para conectarte con constructoras, inmobiliarias (DS19 o venta directa) y ejecutivos bancarios.
                </p>
              </div>
              <Link 
                href="/formulario" 
                className="w-full md:w-auto inline-flex justify-center items-center px-6 py-3.5 bg-[#87c0a3] text-slate-950 font-bold text-sm rounded-xl hover:bg-[#76b092] transition-all duration-200 shadow-sm whitespace-nowrap"
              >
                Evaluar mi capacidad gratis
              </Link>
            </div>
          </section>

          {/* Bloque 2: Indicador de sección */}
          <div className="flex items-center gap-4 mb-6">
            <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase whitespace-nowrap">
              Módulos de Simulación Individual
            </h3>
            <div className="h-px bg-slate-300 w-full"></div>
          </div>

          {/* Bloque 3: Grilla de calculadoras */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {herramientas.map((opcion, index) => (
              <article 
                key={index}
                className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-[#6b9ac4] group"
              >
                <Link href={opcion.href} className="block h-full flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-[#6b9ac4] block mb-2 group-hover:text-[#87c0a3] transition-colors duration-200">
                      {opcion.categoria}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mb-2">
                      {opcion.titulo}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-normal">
                      {opcion.descripcion}
                    </p>
                  </div>
                  
                  <div className="text-blue-600 text-xs font-semibold flex items-center gap-1 mt-6 pt-3 border-t border-slate-100 group-hover:text-slate-900 transition-colors duration-200">
                    Ingresar al simulador →
                  </div>
                </Link>
              </article>
            ))}
          </section>

        </main>
      </div>
    </div>
  );
}
