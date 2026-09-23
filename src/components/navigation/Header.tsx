"use client";

import { useGameStore } from "@/lib/game/store";
import { ConnectionStatus } from "@/lib/voice-agent/types";
import {
  Volume2,
  VolumeX,
  Languages,
  Coffee,
  RotateCcw,
  Radio,
} from "lucide-react";
import { GameLevel } from "@/lib/game/types";

interface HeaderProps {
  status: ConnectionStatus;
  onConnect: () => void;
  onReset: () => void;
}

export function Header({ status, onConnect, onReset }: HeaderProps) {
  const {
    level,
    setLevel,
    isMuted,
    setIsMuted,
    showTranslation,
    toggleTranslation,
  } = useGameStore();

  const levels: Array<{ id: GameLevel; label: string; badge: string }> = [
    { id: 1, label: "L1: Pedido", badge: "Básico" },
    { id: 2, label: "L2: Personalizar", badge: "Detalles" },
    { id: 3, label: "L3: Charla", badge: "Conversación" },
    { id: 4, label: "L4: Imprevisto", badge: "Sorpresa" },
  ];

  return (
    <header className="w-full border-b border-amber-950/20 bg-stone-900/90 backdrop-blur-md text-stone-100 px-4 py-3 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Destination */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-900/40 border border-amber-500/30">
              <Coffee className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-xl text-amber-100">
                  LAYOVER
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AssemblyAI
                </span>
              </div>
              <p className="text-xs text-stone-400 flex items-center gap-1.5">
                <span>🇪🇸 Madrid, España</span>
                <span className="text-stone-600">•</span>
                <span className="text-amber-300/80 font-medium">Café de la Luna</span>
              </p>
            </div>
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center gap-2">
            <button
              onClick={onConnect}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm ${
                status === "ready"
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                  : status === "connecting"
                  ? "bg-amber-950/60 text-amber-300 border border-amber-500/40 animate-pulse"
                  : "bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600"
              }`}
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  status === "ready"
                    ? "text-emerald-400 animate-pulse"
                    : "text-stone-400"
                }`}
              />
              <span>
                {status === "ready"
                  ? "Voz Activa"
                  : status === "connecting"
                  ? "Conectando..."
                  : "Conectar Voz"}
              </span>
            </button>
          </div>
        </div>

        {/* Level Tabs */}
        <div className="flex items-center bg-stone-950/70 p-1 rounded-xl border border-stone-800 overflow-x-auto max-w-full">
          {levels.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setLevel(lvl.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                level === lvl.id
                  ? "bg-amber-600 text-stone-950 font-bold shadow-md shadow-amber-600/30"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
              }`}
            >
              <span>{lvl.label}</span>
              <span
                className={`text-[9px] px-1 py-0.2 rounded ${
                  level === lvl.id
                    ? "bg-amber-800/40 text-stone-950"
                    : "bg-stone-800 text-stone-400"
                }`}
              >
                {lvl.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Translation Toggle */}
          <button
            onClick={toggleTranslation}
            title={
              showTranslation ? "Ocultar traducción inglés" : "Mostrar traducción inglés"
            }
            className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
              showTranslation
                ? "bg-amber-900/30 border-amber-600/40 text-amber-200"
                : "bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700"
            }`}
          >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">
              {showTranslation ? "EN On" : "EN Off"}
            </span>
          </button>

          {/* Mute toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Activar audio" : "Silenciar audio"}
            className={`p-2 rounded-lg border transition-all ${
              isMuted
                ? "bg-red-950/60 border-red-500/40 text-red-300"
                : "bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700"
            }`}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>

          {/* Reset session */}
          <button
            onClick={onReset}
            title="Reiniciar conversación"
            className="p-2 rounded-lg border border-stone-700 bg-stone-800 text-stone-400 hover:text-stone-200 hover:bg-stone-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
