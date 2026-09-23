"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Mic,
  Plane,
  Gamepad2,
} from "lucide-react";
import { LANGUAGES, DESTINATIONS, DestinationOption } from "@/scenarios/catalog";

export default function DashboardPage() {
  const router = useRouter();

  // Onboarding state
  const [selectedLanguage, setSelectedLanguage] = useState<string>("es");
  const [selectedDestination, setSelectedDestination] = useState<DestinationOption>(
    DESTINATIONS[0]
  );
  const [travelerLevel, setTravelerLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner"
  );

  // Filter destinations by language or show all
  const filteredDestinations = DESTINATIONS.filter(
    (d) => selectedLanguage === "all" || d.languageCode === selectedLanguage
  );

  const handleLaunchGame = (dest?: DestinationOption) => {
    const target = dest || selectedDestination;
    router.push(`/play?destination=${encodeURIComponent(target.id)}&lang=${encodeURIComponent(target.languageCode)}`);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      {/* Top Airport Departure Navigation Bar */}
      <header className="w-full border-b border-stone-800/80 bg-stone-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-500/30">
              <Plane className="w-5 h-5 text-amber-100 rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black tracking-wider text-xl text-stone-100">
                  LAYOVER
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  3D Voice World
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Simulador de Viaje por Voz · Powered by AssemblyAI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-stone-800/60 border border-stone-700/60 px-3 py-1.5 rounded-xl text-xs text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Vuelo activo: <strong>MAD-104 · Puerta 3D</strong></span>
            </div>

            <button
              onClick={() => handleLaunchGame()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-amber-900/40 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Entrar al Mundo 3D</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard / Onboarding Hub */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 flex flex-col gap-8">
        {/* Hero Intro Banner */}
        <section className="relative rounded-3xl bg-gradient-to-r from-amber-950/60 via-stone-900 to-stone-900/80 border border-amber-500/20 p-6 md:p-8 overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Paso 1 de 2 · Configura tu Escala de Viaje</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-100 leading-tight">
              ¿A dónde deseas viajar y practicar hoy?
            </h1>
            <p className="text-sm sm:text-base text-stone-300 mt-3 leading-relaxed">
              Selecciona el idioma y el lugar que quieres explorar en 3D. Entrarás a
              un mundo interactivo donde caminas con <strong>W, A, S, D</strong>,
              descubres cultura local y conversas en voz real con NPCs locales.
            </p>
          </div>
        </section>

        {/* Step 1: Language Selection */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <div>
                <h2 className="font-bold text-lg text-stone-100">
                  Selecciona el Idioma a Entrenar
                </h2>
                <p className="text-xs text-stone-400">
                  Elige la lengua con la que interactuarás por voz
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedLanguage("all")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                selectedLanguage === "all"
                  ? "bg-stone-800 text-amber-400 border-amber-500/40 font-bold"
                  : "text-stone-400 border-stone-800 hover:text-stone-200"
              }`}
            >
              Ver todos los idiomas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                    isSelected
                      ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-900/20 ring-1 ring-amber-500/50"
                      : "bg-stone-900/90 border-stone-800 hover:border-stone-700 hover:bg-stone-850"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{lang.flag}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-stone-100">
                    {lang.name}
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {lang.nativeName}
                  </p>
                  <span className="text-[10px] text-amber-300/80 font-mono mt-2 block">
                    {lang.destinationsCount} {lang.destinationsCount === 1 ? "lugar disponible" : "lugares disponibles"}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Destination / Place Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
              2
            </span>
            <div>
              <h2 className="font-bold text-lg text-stone-100">
                Selecciona el Lugar / Establecimiento
              </h2>
              <p className="text-xs text-stone-400">
                Elige el entorno 3D donde transcurrirá tu misión
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDestinations.map((dest) => {
              const isSelected = selectedDestination.id === dest.id;

              return (
                <div
                  key={dest.id}
                  onClick={() => setSelectedDestination(dest)}
                  className={`rounded-3xl border p-5 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? "bg-gradient-to-b from-stone-900 to-amber-950/30 border-amber-500 shadow-2xl ring-2 ring-amber-500/40"
                      : "bg-stone-900/80 border-stone-800 hover:border-stone-700 hover:bg-stone-850"
                  }`}
                >
                  {/* Top Badge */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-stone-800 border border-stone-700 text-stone-300 flex items-center gap-1.5 font-medium">
                        <span>{dest.flag}</span>
                        <span>{dest.city}, {dest.country}</span>
                      </span>

                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Mundo 3D Activo</span>
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-stone-100 group-hover:text-amber-300 transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-xs font-semibold text-amber-400/90 mt-0.5">
                      {dest.categoryLabel}
                    </p>

                    <p className="text-xs text-stone-400 mt-2.5 leading-relaxed">
                      {dest.description}
                    </p>

                    {/* NPC Host Preview */}
                    <div className="mt-4 p-3 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                        {dest.npcName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-stone-200">
                          {dest.npcName}
                        </div>
                        <div className="text-[11px] text-stone-400">
                          {dest.npcRole}
                        </div>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="mt-4 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
                        Qué aprenderás:
                      </span>
                      {dest.learningHighlights.map((hl, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-xs text-stone-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Launch Card Action */}
                  <div className="mt-6 pt-4 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-400">
                      Nivel: {dest.difficulty}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchGame(dest);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-amber-900/30 hover:scale-105 active:scale-95"
                    >
                      <span>Entrar 3D</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Step 3: Traveler Experience Level */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-xs">
              3
            </span>
            <div>
              <h2 className="font-bold text-lg text-stone-100">
                Selecciona tu Nivel de Experiencia
              </h2>
              <p className="text-xs text-stone-400">
                Ajusta el ritmo y la dificultad de conversación del barista
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button
              onClick={() => setTravelerLevel("beginner")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                travelerLevel === "beginner"
                  ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50"
                  : "bg-stone-900 border-stone-800 hover:border-stone-700"
              }`}
            >
              <div className="font-bold text-sm text-stone-100 mb-1">
                Turista Principiante
              </div>
              <p className="text-xs text-stone-400">
                Pide lo básico con calma, frases guiadas y pronunciación asistida.
              </p>
            </button>
            <button
              onClick={() => setTravelerLevel("intermediate")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                travelerLevel === "intermediate"
                  ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50"
                  : "bg-stone-900 border-stone-800 hover:border-stone-700"
              }`}
            >
              <div className="font-bold text-sm text-stone-100 mb-1">
                Mochilero Intermedio
              </div>
              <p className="text-xs text-stone-400">
                Personalizaciones de ingredientes y charla amena sobre tu viaje.
              </p>
            </button>
            <button
              onClick={() => setTravelerLevel("advanced")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                travelerLevel === "advanced"
                  ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/50"
                  : "bg-stone-900 border-stone-800 hover:border-stone-700"
              }`}
            >
              <div className="font-bold text-sm text-stone-100 mb-1">
                Inmersión Local
              </div>
              <p className="text-xs text-stone-400">
                Ritmo nativo rápido y resolución de situaciones inesperadas en vivo.
              </p>
            </button>
          </div>
        </section>

        {/* Selected Boarding Pass Confirmation Banner */}
        <section className="rounded-3xl bg-stone-900 border border-amber-500/40 p-6 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl">
              {selectedDestination.flag}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Tarjeta de Embarque Lista
                </span>
                <span className="text-xs text-stone-400">
                  {selectedDestination.city} · {selectedDestination.country}
                </span>
              </div>
              <h3 className="text-xl font-black text-stone-100">
                {selectedDestination.name}
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Host NPC: <strong>{selectedDestination.npcName}</strong> ({selectedDestination.npcRole}) · Controles WASD en Mundo 3D
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => handleLaunchGame()}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-amber-900/50 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-stone-950" />
              <span>Comenzar Viaje en 3D</span>
              <ArrowRight className="w-4 h-4 text-stone-950" />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
