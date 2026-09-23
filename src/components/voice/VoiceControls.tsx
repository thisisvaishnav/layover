"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { Mic, Sparkles, MessageSquarePlus } from "lucide-react";
import { SPAIN_CAFE_SCENARIO } from "@/scenarios/spain-cafe";
import { ConnectionStatus } from "@/lib/voice-agent/types";

interface VoiceControlsProps {
  status: ConnectionStatus;
  audioLevel: number;
  onStartTalk: () => void;
  onStopTalk: () => void;
  onSimulateSpeech: (text: string) => void;
}

export function VoiceControls({
  status,
  audioLevel,
  onStartTalk,
  onStopTalk,
  onSimulateSpeech,
}: VoiceControlsProps) {
  const { level, pushToTalkActive } = useGameStore();
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  const levelData = SPAIN_CAFE_SCENARIO.levels[level];

  // Spacebar push-to-talk listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setIsSpacePressed(true);
        onStartTalk();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        onStopTalk();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [onStartTalk, onStopTalk]);

  return (
    <div className="w-full flex flex-col items-center gap-4 py-2">
      {/* Push-To-Talk Main Action Button */}
      <div className="relative flex flex-col items-center">
        {/* Pulsing Audio Waves Ring */}
        <div
          className={`absolute -inset-4 rounded-full transition-all duration-75 pointer-events-none ${
            pushToTalkActive || isSpacePressed
              ? "bg-emerald-500/20 border-2 border-emerald-500/40 animate-ping"
              : "opacity-0"
          }`}
          style={{
            transform: `scale(${1 + Math.min(0.4, audioLevel * 0.5)})`,
          }}
        />

        <button
          onMouseDown={onStartTalk}
          onMouseUp={onStopTalk}
          onTouchStart={onStartTalk}
          onTouchEnd={onStopTalk}
          disabled={status !== "ready"}
          className={`relative z-10 w-20 h-20 md:w-24 md:h-24 rounded-full flex flex-col items-center justify-center transition-all duration-150 shadow-2xl select-none active:scale-95 ${
            status !== "ready"
              ? "bg-stone-800 border-2 border-stone-700 text-stone-500 cursor-not-allowed"
              : pushToTalkActive || isSpacePressed
              ? "bg-gradient-to-tr from-emerald-600 to-emerald-400 text-stone-950 border-4 border-emerald-300 scale-105 shadow-emerald-500/50"
              : "bg-gradient-to-tr from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 border-4 border-amber-300/80 shadow-amber-900/50 hover:scale-102"
          }`}
        >
          {pushToTalkActive || isSpacePressed ? (
            <Mic className="w-8 h-8 md:w-10 md:h-10 text-stone-950 animate-bounce" />
          ) : (
            <Mic className="w-8 h-8 md:w-10 md:h-10 text-stone-950" />
          )}
          <span className="text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider mt-1 text-stone-950">
            {pushToTalkActive || isSpacePressed ? "Hablando..." : "Pulsar"}
          </span>
        </button>

        {/* Helpful Shortcut Tip */}
        <div className="mt-2.5 text-center">
          <p className="text-xs text-stone-400 flex items-center justify-center gap-1.5 font-medium">
            <span>Mantén pulsado o usa</span>
            <kbd className="px-2 py-0.5 rounded bg-stone-850 border border-stone-700 text-[11px] text-amber-300 font-mono shadow-xs">
              Espacio
            </kbd>
            <span>para hablar</span>
          </p>
        </div>
      </div>

      {/* Suggested Target Phrases for Active Level (Click to test/speak) */}
      <div className="w-full max-w-2xl bg-stone-900/90 border border-amber-900/30 rounded-xl p-3 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Frases clave para {levelData.title}</span>
          </span>
          <span className="text-[11px] text-stone-500">
            (Haz clic para probar o di en voz alta)
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {levelData.targetPhrases.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => onSimulateSpeech(phrase)}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-850 hover:bg-amber-950/60 border border-stone-700/80 hover:border-amber-600/50 text-stone-200 hover:text-amber-200 transition-all flex items-center gap-1.5 text-left group"
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-amber-500/70 group-hover:text-amber-400 shrink-0" />
              <span>&ldquo;{phrase}&rdquo;</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
