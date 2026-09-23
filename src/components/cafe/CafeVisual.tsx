"use client";

import { useGameStore } from "@/lib/game/store";
import { AlertCircle } from "lucide-react";
import { SPAIN_CAFE_SCENARIO } from "@/scenarios/spain-cafe";

export function CafeVisual() {
  const {
    baristaAction,
    baristaEmotion,
    order,
    currentUnexpected,
    transcripts,
    audioLevel,
    pushToTalkActive,
  } = useGameStore();

  const lastNpcMessage = [...transcripts]
    .reverse()
    .find((m) => m.sender === "npc");

  return (
    <div className="relative w-full h-[360px] md:h-[440px] rounded-2xl overflow-hidden border border-amber-900/40 bg-gradient-to-b from-stone-900 via-stone-850 to-stone-950 shadow-2xl flex flex-col justify-between p-4 md:p-6 select-none">
      {/* Background Ambience: Spanish café interior walls & warm lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/15 via-amber-950/25 to-stone-950/80 pointer-events-none" />

      {/* Decorative Madrid Tile Border at top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-800 opacity-70" />

      {/* Chalkboard Menu in background */}
      <div className="absolute top-4 left-4 md:left-6 max-w-[200px] hidden sm:block p-3 rounded-xl bg-stone-950/80 border border-stone-800/80 shadow-md backdrop-blur-xs">
        <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 border-b border-stone-800 pb-1 mb-1.5 flex items-center justify-between">
          <span>Menú del Día</span>
          <span className="text-[9px] text-stone-500">Madrid</span>
        </div>
        <ul className="text-[11px] space-y-1 text-stone-300 font-mono">
          <li className="flex justify-between">
            <span>Café con leche</span>
            <span className="text-amber-400">2.20€</span>
          </li>
          <li className="flex justify-between">
            <span>Café solo</span>
            <span className="text-amber-400">1.80€</span>
          </li>
          <li className="flex justify-between">
            <span>Croissant plancha</span>
            <span className="text-amber-400">2.50€</span>
          </li>
          <li className="flex justify-between">
            <span>Tostada c/ tomate</span>
            <span className="text-amber-400">2.80€</span>
          </li>
        </ul>
      </div>

      {/* Top Center: Barista Live Speech Bubble */}
      <div className="relative z-10 mx-auto max-w-xl w-full">
        {lastNpcMessage && (
          <div className="bg-stone-900/95 border border-amber-600/40 text-stone-100 px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md transition-all animate-fade-in flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-500/50 flex items-center justify-center shrink-0 mt-0.5 text-amber-300 font-bold text-xs">
              M
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-semibold text-amber-400">
                  {SPAIN_CAFE_SCENARIO.npcName} · {SPAIN_CAFE_SCENARIO.npcRole}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    baristaAction === "speaking"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                      : baristaAction === "listening"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-stone-800 text-stone-400"
                  }`}
                >
                  {baristaAction === "speaking"
                    ? "Hablando..."
                    : baristaAction === "listening"
                    ? "Escuchando..."
                    : baristaAction === "brewing"
                    ? "Preparando..."
                    : "Atendiendo"}
                </span>
              </div>
              <p className="text-sm md:text-base text-stone-100 font-medium leading-relaxed">
                &ldquo;{lastNpcMessage.text}&rdquo;
              </p>
              {lastNpcMessage.translation && (
                <p className="text-xs text-stone-400 italic mt-1 border-t border-stone-800/80 pt-1">
                  &ldquo;{lastNpcMessage.translation}&rdquo;
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Unexpected Event Banner if active */}
      {currentUnexpected && !currentUnexpected.resolved && (
        <div className="relative z-10 mx-auto max-w-md w-full my-2 bg-rose-950/80 border border-rose-600/60 rounded-xl p-3 flex items-center gap-3 text-rose-200 shadow-lg animate-bounce-slow">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs">
            <span className="font-bold uppercase tracking-wider text-rose-300 block">
              ¡Imprevisto del barista!
            </span>
            <span className="text-rose-100">{currentUnexpected.explanation}</span>
          </div>
        </div>
      )}

      {/* Main Stage: Mateo the Barista & Coffee Bar */}
      <div className="relative z-1 flex items-end justify-center w-full h-full mt-4">
        {/* Mateo the Barista Avatar Graphic */}
        <div className="relative flex flex-col items-center">
          {/* Head & Face */}
          <div
            className={`w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-amber-800/50 bg-gradient-to-b from-amber-200 via-amber-100 to-amber-200 shadow-xl flex items-center justify-center relative transition-transform duration-300 ${
              baristaAction === "speaking"
                ? "scale-105"
                : baristaAction === "listening"
                ? "translate-y-1"
                : "scale-100"
            }`}
          >
            {/* Mateo's stylish hair */}
            <div className="absolute -top-3 w-28 h-10 bg-stone-900 rounded-t-full" />
            <div className="absolute -top-2 left-2 w-7 h-6 bg-stone-900 rounded-full" />
            <div className="absolute -top-2 right-2 w-7 h-6 bg-stone-900 rounded-full" />

            {/* Eyes */}
            <div className="absolute top-11 flex gap-6">
              <div
                className={`w-2.5 h-3 bg-stone-900 rounded-full transition-all ${
                  baristaAction === "listening" ? "scale-y-75" : ""
                }`}
              />
              <div
                className={`w-2.5 h-3 bg-stone-900 rounded-full transition-all ${
                  baristaAction === "listening" ? "scale-y-75" : ""
                }`}
              />
            </div>

            {/* Mateo's Friendly Smile / Speaking mouth */}
            <div
              className={`absolute bottom-7 transition-all duration-150 ${
                baristaAction === "speaking"
                  ? "w-6 h-4 bg-rose-900 rounded-full border-2 border-stone-800 animate-pulse"
                  : baristaEmotion === "apologetic"
                  ? "w-5 h-1.5 bg-stone-700 rounded-md"
                  : "w-6 h-2.5 border-b-2 border-stone-800 rounded-b-full"
              }`}
            />

            {/* Apron Straps */}
            <div className="absolute -bottom-2 w-14 h-4 bg-emerald-950 rounded-t-md border-t-2 border-amber-600/40" />
          </div>

          {/* Barista Torso / Barista Apron */}
          <div className="w-40 h-24 md:w-48 md:h-28 bg-emerald-950 border-x-2 border-t-2 border-emerald-800/60 rounded-t-3xl relative flex flex-col items-center pt-2 shadow-2xl">
            <span className="text-[10px] tracking-widest uppercase font-bold text-amber-400/90 font-mono">
              CAFÉ DE LA LUNA
            </span>
            <div className="w-12 h-6 border-b border-amber-600/30" />

            {/* Hands/Arms Action indication */}
            {baristaAction === "brewing" && (
              <div className="absolute -left-6 top-6 bg-amber-700 text-[10px] text-amber-100 px-2 py-0.5 rounded-full font-bold shadow animate-bounce">
                Moliendo café...
              </div>
            )}
            {baristaAction === "serving" && (
              <div className="absolute -right-6 top-6 bg-emerald-600 text-[10px] text-emerald-100 px-2 py-0.5 rounded-full font-bold shadow animate-pulse">
                ¡Aquí tienes!
              </div>
            )}
          </div>
        </div>

        {/* Espresso Machine (Left side of counter) */}
        <div className="absolute left-6 md:left-20 bottom-8 flex flex-col items-center">
          {/* Animated Steam */}
          <div className="flex gap-1.5 mb-1 opacity-70">
            <div className="w-1.5 h-6 bg-stone-300/40 rounded-full animate-pulse blur-[1px]" />
            <div className="w-1.5 h-8 bg-stone-200/50 rounded-full animate-bounce blur-[1px]" />
            <div className="w-1.5 h-5 bg-stone-300/30 rounded-full animate-pulse blur-[1px]" />
          </div>
          {/* Espresso Machine body */}
          <div className="w-20 md:w-28 h-24 md:h-28 bg-gradient-to-t from-stone-800 to-stone-700 rounded-t-xl border-t-2 border-x-2 border-amber-600/40 shadow-xl flex flex-col items-center p-2 justify-between">
            <div className="w-full flex justify-between px-1">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <span className="text-[9px] font-mono text-amber-300 tracking-wider">
              MARZOCCO
            </span>
            <div className="w-8 h-3 bg-stone-900 rounded-xs border border-stone-600" />
          </div>
        </div>

        {/* Items Served on the Counter (Right side) */}
        <div className="absolute right-6 md:right-20 bottom-8 flex items-end gap-3">
          {order.length > 0 ? (
            order.map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex flex-col items-center animate-fade-in group cursor-pointer"
                title={`${item.spanishName} (${item.modifications.join(", ") || "Clásico"})`}
              >
                {/* Visual Cup / Food */}
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-amber-700 to-amber-950 border border-amber-400/40 shadow-lg flex items-center justify-center text-amber-200 relative group-hover:scale-110 transition-transform">
                  <span className="text-lg">
                    {item.spanishName.toLowerCase().includes("croissant")
                      ? "🥐"
                      : item.spanishName.toLowerCase().includes("tostada")
                      ? "🍞"
                      : item.spanishName.toLowerCase().includes("té")
                      ? "🍵"
                      : "☕"}
                  </span>
                  {item.quantity > 1 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-stone-950 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {item.quantity}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-stone-300 mt-1 max-w-[70px] truncate text-center">
                  {item.spanishName}
                </span>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-stone-500 italic pb-2">
              (El mostrador está vacío)
            </div>
          )}
        </div>
      </div>

      {/* Wooden Bar Counter Surface (Bottom bar) */}
      <div className="relative z-10 -mx-4 md:-mx-6 -mb-4 md:-mb-6 h-10 bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-t-4 border-amber-600/50 shadow-2xl flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] text-amber-200 font-mono tracking-wider">
            BARRA PRINCIPAL
          </span>
        </div>
        {pushToTalkActive && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold animate-pulse">
            <span>Transmitiendo audio...</span>
            <div
              className="w-16 h-2 bg-stone-900 rounded-full overflow-hidden border border-emerald-500/40"
            >
              <div
                className="h-full bg-emerald-500 transition-all duration-75"
                style={{ width: `${Math.min(100, audioLevel * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
