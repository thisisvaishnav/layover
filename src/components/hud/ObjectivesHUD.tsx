"use client";

import { useGameStore } from "@/lib/game/store";
import { CheckCircle2, Circle, Trophy } from "lucide-react";
import { SPAIN_CAFE_SCENARIO } from "@/scenarios/spain-cafe";

export function ObjectivesHUD() {
  const { level, objectives, showTranslation } = useGameStore();

  const currentLevelInfo = SPAIN_CAFE_SCENARIO.levels[level];
  const completedCount = objectives.filter((o) => o.completed).length;

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-800 pb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Misiones de Viaje
          </h3>
        </div>
        <span className="text-xs font-mono text-stone-400">
          {completedCount} / {objectives.length} Completadas
        </span>
      </div>

      {/* Current Level Goal Banner */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90 block">
          Objetivo de {currentLevelInfo.title}
        </span>
        <p className="text-xs font-semibold text-stone-200 mt-0.5">
          {currentLevelInfo.goal}
        </p>
      </div>

      {/* Objectives Checklist */}
      <ul className="space-y-2">
        {objectives.map((obj) => (
          <li
            key={obj.id}
            className={`p-2 rounded-xl border transition-all text-xs flex items-start gap-2.5 ${
              obj.completed
                ? "bg-emerald-950/20 border-emerald-600/40 text-emerald-200"
                : obj.level === level
                ? "bg-stone-850 border-amber-600/40 text-stone-100"
                : "bg-stone-950/50 border-stone-850 text-stone-500 opacity-60"
            }`}
          >
            {obj.completed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className={`font-semibold block ${obj.completed ? "line-through text-emerald-400" : ""}`}>
                {obj.label}
              </span>
              <p className="text-[11px] text-amber-300/80 mt-0.5 italic">
                &ldquo;{obj.hintSpanish}&rdquo;
              </p>
              {showTranslation && (
                <p className="text-[10px] text-stone-400 mt-0.5">
                  &ldquo;{obj.hintEnglish}&rdquo;
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
