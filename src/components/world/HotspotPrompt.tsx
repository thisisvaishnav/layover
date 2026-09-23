"use client";

import { Hotspot } from "@/lib/world/types";
import { Sparkles, MessageCircle, ChevronRight } from "lucide-react";

interface HotspotPromptProps {
  hotspot: Hotspot;
  onInteract: () => void;
  onTalk?: () => void;
}

export function HotspotPrompt({ hotspot, onInteract, onTalk }: HotspotPromptProps) {
  const isMateo = hotspot.id === "barista_mateo";

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-md pointer-events-auto animate-in slide-in-from-bottom-3 duration-200">
      <div className="bg-stone-900/95 border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            {isMateo ? (
              <MessageCircle className="w-5 h-5 text-amber-400 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-stone-100 truncate flex items-center gap-1.5">
              <span>{hotspot.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                Cerca
              </span>
            </h4>
            <p className="text-xs text-stone-400 truncate">{hotspot.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isMateo && onTalk && (
            <button
              onClick={onTalk}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Hablar</span>
            </button>
          )}

          <button
            onClick={onInteract}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1 active:scale-95"
          >
            <span>{isMateo ? "Ver Frases [E]" : "Explorar [E]"}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
