// src/app/formulario/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchUFValue, DEFAULT_UF_VALUE } from "@/utils/api";

export default function FormularioPage() {
  // Estado para guardar el valor de la UF
  const [ufValue, setUfValue] = useState<number>(DEFAULT_UF_VALUE);

  // Estado del formulario (Datos del Lead)
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    rut: "",
    email: "",
    telefono: "",
    ingresos: "",
    ahorro: "",
    subsidio: "",
    region: "",
  });

  // Estados de la interfaz (UX)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Cargar UF al inicio y revisar si hay un sueldo guardado en localStorage del paso de "Percentil"
  useEffect(() => {
    async function loadInitialData() {
      const uf = await fetchUFValue();
      setUfValue(uf);

      // Si el usuario calculó su percentil antes, autocompletamos su sueldo
      const savedIncome = localStorage.getItem("income");
      if (savedIncome) {
        setFormData((prev) => ({ ...prev, ingresos: savedIncome }));
      }
    }
    loadInitialData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      // AQUÍ VA TU URL DE RAILWAY (Ejemplo: https://tu-api.up.railway.app/api/leads)
      const BACKEND_URL = "https://tu-backend-railway.com/api/leads"; 

      /* * NOTA PARA FER: Descomenta este bloque fetch cuando tu backend en NestJS/Oracle esté arriba.
       * Por ahora, simularemos un envío exitoso con un setTimeout de 1.5 segundos.
       */
      
      /*
      const response = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ...formData,
            ingresos: parseFloat(formData.ingresos),
            ahorro: parseFloat(formData.ahorro)
        }),
      });

      if (!response.ok) throw new Error("Error al enviar los datos.");
      */

      // Simulación de envío exitoso (Borrar cuando conectes el fetch real)
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setStatus("success");
      
    } catch (error) {
      console.error(error);
      setStatus("error");
      setErrorMessage("Hubo un problema al enviar tu solicitud. Por favor, intenta nuevamente.");
    }
  };

  // Si el envío fue exitoso, mostramos un mensaje de agradecimiento en lugar del formulario
  if (status === "success") {
    return (
      <div className="bg-slate-100 min-h-screen flex items-center justify-center p-6">
        <div className="bg-white max-w-lg w-full rounded-3xl p-10 text-center shadow-lg border border-slate-200 animate-fade-in">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-inner">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">¡Perfil Pre-evaluado!</h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            Hemos registrado tus datos financieros de forma segura. En base a tu sueldo, ahorro y subsidio, nuestro motor inteligente hará el match definitivo con bancos e inmobiliarias asociadas sin dar rodeos ni vueltas matemáticas.
          </p>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-left text-xs mb-8 space-y-2">
            <p className="font-bold text-slate-700">🔒 Compromiso de Privacidad:</p>
            <p className="text-slate-500">Tus datos están protegidos y solo se utilizarán con el fin exclusivo de contactarte para concretar la compra de tu propiedad. No compartimos tu información con terceros no autorizados.</p>
          </div>
          <Link href="/" className="inline-block bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-sm">
            Volver al Menú Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans pb-16">
      
      {/* Header Institucional con Enfoque SaaS / B2C */}
      <header className="bg-gradient-to-r from-[#6b9ac4] to-[#87c0a3] text-white px-6 py-12 border-b-4 border-white shadow-sm text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Conexión Inmobiliaria y Bancaria Directa
          </h1>
          <p className="text-blue-50 text-xs md:text-sm opacity-95 max-w-xl mx-auto">
            Evita rodeos y cálculos complejos. Evaluamos tu perfil financiero y te conectamos directamente con inmobiliarias, corredoras y bancos asociados de forma 100% gratuita para acelerar el sueño de tu casa propia.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 -mt-6">
        
        {/* Banner Informativo de Conexión Rápida y Protección de Datos */}
        <section className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 mb-6 shadow-md border border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block mb-1">
                ¿Por qué usar SubsiMatch para enviar tus datos?
              </span>
              <h3 className="text-base font-bold">Respuesta Definitiva sin Complicaciones</h3>
              <p className="text-slate-300 text-xs mt-1 leading-relaxed">
                Calculamos al instante qué propiedades de proyectos inmobiliarios (DS19, DS1 o créditos puros) y qué opciones hipotecarias aplican exactamente a tu perfil. Protegemos tus datos de forma estricta y transparente para acercarte a tu hogar ideal.
              </p>
            </div>
            <span className="text-xs bg-[#87c0a3] text-slate-950 px-3 py-1.5 rounded-full font-bold whitespace-nowrap">
              100% Gratis
            </span>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-md">
          
          <div className="mb-8 pb-4 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Formulario de Pre-evaluación Inteligente</h2>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full flex items-center gap-1">
              🔒 Datos Protegidos
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Bloque 1: Datos Personales */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">1. Datos Personales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre</label>
                  <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] focus:ring-1 focus:ring-[#6b9ac4]/30 text-sm transition-all" placeholder="Ej: Juan" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Apellidos</label>
                  <input type="text" name="apellidos" required value={formData.apellidos} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] focus:ring-1 focus:ring-[#6b9ac4]/30 text-sm transition-all" placeholder="Ej: Pérez" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">RUT</label>
                  <input type="text" name="rut" required value={formData.rut} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] focus:ring-1 focus:ring-[#6b9ac4]/30 text-sm transition-all" placeholder="12.345.678-9" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Teléfono Móvil</label>
                  <input type="tel" name="telefono" required value={formData.telefono} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] focus:ring-1 focus:ring-[#6b9ac4]/30 text-sm transition-all" placeholder="+56 9 1234 5678" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Correo Electrónico</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] focus:ring-1 focus:ring-[#6b9ac4]/30 text-sm transition-all" placeholder="correo@ejemplo.com" />
              </div>
            </div>

            {/* Bloque 2: Perfil Financiero */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">2. Perfil Financiero</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ingreso Líquido Mensual (CLP)</label>
                  <input type="number" name="ingresos" min="0" required value={formData.ingresos} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] text-sm" placeholder="Ej: 900000" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ahorro para la Vivienda (CLP)</label>
                  <input type="number" name="ahorro" min="0" required value={formData.ahorro} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] text-sm" placeholder="Ej: 3000000" />
                  <p className="text-[10px] text-slate-400 mt-1">Equivale aprox. a {formData.ahorro ? (parseFloat(formData.ahorro) / ufValue).toFixed(1) : 0} UF</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">¿Cuentas con algún subsidio?</label>
                  <select name="subsidio" required value={formData.subsidio} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] text-sm">
                    <option value="">Selecciona una opción...</option>
                    <option value="ninguno">No tengo subsidio (Crédito tradicional)</option>
                    <option value="ds19">Integración Social (DS19 - Automático)</option>
                    <option value="ds1t1">Subsidio DS1 - Tramo 1</option>
                    <option value="ds1t2">Subsidio DS1 - Tramo 2</option>
                    <option value="ds1t3">Subsidio DS1 - Tramo 3</option>
                    <option value="ds1t4">Subsidio DS1 - Tramo 4</option>
                    <option value="ds49">Fondo Solidario (DS49)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Región de Preferencia</label>
                  <select name="region" required value={formData.region} onChange={handleChange} className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-[#6b9ac4] text-sm">
                    <option value="">Selecciona una región...</option>
                    <option value="RM">Región Metropolitana</option>
                    <option value="V">Región de Valparaíso</option>
                    <option value="VI">Región de O'Higgins</option>
                    <option value="VIII">Región del Biobío</option>
                    <option value="OTRA">Otra región</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mensajes de Error y Botón de Submit */}
            {status === "error" && (
              <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium">
                {errorMessage}
              </div>
            )}

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={status === "loading"}
                className={`w-full p-3.5 font-bold text-sm rounded-xl shadow-sm transition-all duration-200 ${
                  status === "loading" 
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                    : "bg-[#87c0a3] text-slate-950 hover:bg-[#76b092] hover:shadow-md"
                }`}
              >
                {status === "loading" ? "Enviando perfil financiero..." : "Enviar mi perfil a Bancos e Inmobiliarias"}
              </button>
              <div className="mt-4 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-500 leading-relaxed text-left">
                <p className="font-semibold text-slate-700 mb-1">🛡️ Tu Privacidad es nuestro Compromiso</p>
                Te protegemos realmente porque queremos que cumplas tu sueño. Tu información confidencial de sueldo, ahorro y contacto se encripta y se utiliza únicamente para el perfilamiento hipotecario y habitacional. Nos contactaremos de forma ágil para presentarte alternativas reales sin rodeos matemáticos.
              </div>
            </div>

          </form>
        </section>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
            ← Cancelar y volver al inicio
          </Link>
        </div>
      </main>

    </div>
  );
}