"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/game/store";
import { MessageSquare, User } from "lucide-react";

export function TranscriptHUD() {
  const { transcripts, showTranslation } = useGameStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts]);

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-lg flex flex-col h-[280px]">
      <div className="flex items-center justify-between border-b border-stone-800 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Diálogo en Vivo
          </h3>
        </div>
        <span className="text-[10px] text-stone-500">
          AssemblyAI Turn Detection (~300ms)
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {transcripts.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                msg.sender === "user"
                  ? "bg-emerald-600/40 text-emerald-300 border border-emerald-500/50"
                  : "bg-amber-600/40 text-amber-300 border border-amber-500/50"
              }`}
            >
              {msg.sender === "user" ? <User className="w-3.5 h-3.5" /> : "M"}
            </div>

            <div
              className={`max-w-[80%] rounded-xl px-3 py-2 ${
                msg.sender === "user"
                  ? "bg-emerald-950/40 border border-emerald-600/30 text-emerald-100"
                  : "bg-stone-800 border border-stone-700/60 text-stone-100"
              }`}
            >
              <div className="flex items-center justify-between gap-3 mb-0.5">
                <span className="text-[10px] font-semibold text-stone-400">
                  {msg.sender === "user" ? "Tú (Viajero)" : "Mateo (Barista)"}
                </span>
                <span className="text-[9px] text-stone-500 font-mono">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
              <p className="font-medium text-xs leading-relaxed">{msg.text}</p>
              {showTranslation && msg.translation && (
                <p className="text-[11px] text-stone-400 italic mt-1 pt-1 border-t border-stone-700/40">
                  {msg.translation}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
