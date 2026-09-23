import Link from "next/link";
import {
  Coffee,
  Mic,
  Sparkles,
  ArrowRight,
  Cpu,
  ShieldAlert,
  Zap,
  Globe2,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col selection:bg-amber-500 selection:text-stone-950">
      {/* Top Bar */}
      <header className="w-full border-b border-stone-800/80 bg-stone-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-500/30">
              <Coffee className="w-5 h-5 text-amber-100" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-wider text-xl text-stone-100">
                LAYOVER
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Voice Agent
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-stone-400 hidden sm:inline">
              AssemblyAI Hackathon 2026
            </span>
            <Link
              href="/play"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-amber-900/30"
            >
              <span>Entrar al Café</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-amber-600/15 via-rose-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulador de Viaje por Voz · Powered by AssemblyAI</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-stone-100 leading-[1.08] mb-6">
            Practice the trip{" "}
            <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              before you take it.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed mb-10">
            A voice-controlled travel simulator that trains you to handle real
            conversations and unexpected situations before your flight lands.
            Speak naturally with local NPCs — your voice controls the world.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/play"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl shadow-amber-900/40 hover:scale-105 active:scale-95"
            >
              <Mic className="w-5 h-5 text-stone-950" />
              <span>Iniciar Simulador · España</span>
              <ArrowRight className="w-4 h-4 text-stone-950" />
            </Link>

            <a
              href="#architecture"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Ver Arquitectura Técnica</span>
            </a>
          </div>
        </div>
      </section>

      {/* The Differentiator: Comparison */}
      <section className="py-16 px-6 bg-stone-900/50 border-y border-stone-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              El Factor Diferencial
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-100 mt-2">
              No es otro chatbot. Es entrenamiento de supervivencia conversacional.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional App */}
            <div className="bg-stone-950/70 border border-stone-800/80 rounded-3xl p-6 relative">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block mb-3">
                Apps de Idiomas Tradicionales
              </span>
              <ul className="space-y-3 text-xs text-stone-400">
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 text-[10px]">
                    1
                  </span>
                  <span>Lección pregrabada y repetitiva</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 text-[10px]">
                    2
                  </span>
                  <span>Pregunta de opción múltiple</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 text-[10px]">
                    3
                  </span>
                  <span>Respuesta correcta de libro</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center text-stone-500 text-[10px]">
                    4
                  </span>
                  <span>Te bloqueas cuando llegas al país real</span>
                </li>
              </ul>
            </div>

            {/* LAYOVER */}
            <div className="bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border-2 border-amber-600/50 rounded-3xl p-6 shadow-xl relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 block">
                  LAYOVER · Simulador Dinámico
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                  AssemblyAI
                </span>
              </div>
              <ul className="space-y-3 text-xs text-stone-200">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Eliges tu destino y objetivo de viaje</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Entras al entorno e interactúas por voz en tiempo real</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>El NPC reacciona y las Tool Calls cambian el mundo</span>
                </li>
                <li className="flex items-center gap-2.5 font-bold text-amber-300">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Surge un imprevisto realista que debes resolver al vuelo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Arquitectura Técnica
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-stone-100 mt-2">
              Un único WebSocket de voz controlando el estado del juego
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mt-2 max-w-xl mx-auto">
              AssemblyAI Voice Agent API procesa audio en streaming, detección
              neuronal de turnos y tool calls JSON hacia el motor reactivo de Layover.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 border border-amber-500/20">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-100 mb-2">
                Detección Neuronal de Turnos
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Decisiones de fin de turno en ~300ms basadas en tonalidad, ritmo y
                semántica del español, permitiendo interrupciones inmediatas (barge-in).
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-100 mb-2">
                Tool Calling en Tiempo Real
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Cuando dices &ldquo;dos cafés con leche&rdquo;, el agente ejecuta la función{" "}
                <code className="text-amber-300 font-mono text-[10px]">
                  order_item()
                </code>
                , actualizando la comanda visual y la animación del barista.
              </p>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4 border border-sky-500/20">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-stone-100 mb-2">
                Arquitectura Extensible
              </h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                El motor de escenarios desacopla el destino del agente. Hoy es
                España · Café; mañana es Japón · Ramen Bar o Francia · Hotel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations Roadmap */}
      <section className="py-16 px-6 bg-stone-900/30 border-t border-stone-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Mapa de Destinos
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-stone-100 mt-1">
                Elige tu próximo viaje
              </h2>
            </div>
            <Link
              href="/play"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Jugar escenario activo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Spain (Active) */}
            <div className="bg-gradient-to-b from-amber-950/40 to-stone-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between h-44">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🇪🇸</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase border border-emerald-500/30">
                    Disponible
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-100">
                  Madrid, España
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  Café de la Luna · 4 Niveles
                </p>
              </div>
              <Link
                href="/play"
                className="mt-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs text-center transition-all"
              >
                Comenzar
              </Link>
            </div>

            {/* Japan */}
            <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between h-44 opacity-75">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🇯🇵</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-medium">
                    Próximamente
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-300">
                  Tokio, Japón
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Ramen Bar Shinjuku
                </p>
              </div>
              <span className="text-[11px] text-stone-600 text-center">
                En desarrollo
              </span>
            </div>

            {/* France */}
            <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between h-44 opacity-75">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🇫🇷</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-medium">
                    Próximamente
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-300">
                  París, Francia
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Boulangerie Montmartre
                </p>
              </div>
              <span className="text-[11px] text-stone-600 text-center">
                En desarrollo
              </span>
            </div>

            {/* Italy */}
            <div className="bg-stone-900/50 border border-stone-800 rounded-2xl p-4 flex flex-col justify-between h-44 opacity-75">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">🇮🇹</span>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-medium">
                    Próximamente
                  </span>
                </div>
                <h3 className="text-sm font-bold text-stone-300">
                  Roma, Italia
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  Trastevere Gelateria
                </p>
              </div>
              <span className="text-[11px] text-stone-600 text-center">
                En desarrollo
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800/80 py-8 px-6 text-center text-xs text-stone-500">
        <p>
          LAYOVER · Construido para el <strong>AssemblyAI Voice Agent Hackathon</strong> (Septiembre 2026)
        </p>
        <p className="mt-1 text-[11px] text-stone-600">
          Single WebSocket · Neural Turn Detection · Voice-Driven Tool Calling · Mid-sentence Interruption
        </p>
      </footer>
    </div>
  );
}
