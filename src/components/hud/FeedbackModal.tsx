"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/game/store";
import confetti from "canvas-confetti";
import { Trophy, CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";

export function FeedbackModal() {
  const { isCompleted, evaluation, resetGame } = useGameStore();

  useEffect(() => {
    if (isCompleted) {
      // Trigger festive confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f59e0b", "#10b981", "#ef4444", "#3b82f6"],
      });
    }
  }, [isCompleted]);

  if (!isCompleted || !evaluation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-amber-600/50 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden animate-scale-up text-stone-100">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-900/50 border border-amber-400/40">
            <Trophy className="w-8 h-8 text-stone-950" />
          </div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
            ¡Misión Cumplida en Madrid!
          </span>
          <h2 className="text-2xl font-black text-stone-100 mt-1">
            Evaluación de Fluidez
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Has superado la conversación y el imprevisto con éxito
          </p>
        </div>

        {/* Score Grid */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-stone-850 border border-stone-750 p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">
              Puntuación
            </span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">
              {evaluation.overallScore}%
            </span>
          </div>
          <div className="bg-stone-850 border border-stone-750 p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">
              Fluidez
            </span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              {evaluation.fluency}%
            </span>
          </div>
          <div className="bg-stone-850 border border-stone-750 p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">
              Vocabulario
            </span>
            <span className="text-2xl font-black text-amber-300 mt-1 block">
              {evaluation.vocabulary}%
            </span>
          </div>
        </div>

        {/* Strengths */}
        <div className="mb-4">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Lo que hiciste genial</span>
          </span>
          <ul className="text-xs space-y-1.5 text-stone-300 bg-stone-950/60 p-3 rounded-xl border border-stone-800">
            {evaluation.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Travel Tips for Spain */}
        <div className="mb-6">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span>Consejo para tu viaje real</span>
          </span>
          <div className="text-xs text-stone-300 bg-amber-950/20 border border-amber-700/30 p-3 rounded-xl italic">
            &ldquo;{evaluation.feedback}&rdquo;
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3">
          <button
            onClick={resetGame}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/40"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Jugar de Nuevo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
