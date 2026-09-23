"use client";

import { Hotspot } from "@/lib/world/types";
import { X, BookOpen, Volume2, Sparkles, Coffee, Utensils, CreditCard, ChevronRight } from "lucide-react";

interface VocabularyModalProps {
  hotspot: Hotspot | null;
  onClose: () => void;
  onSelectPhrase?: (phrase: string) => void;
}

export function VocabularyModal({ hotspot, onClose, onSelectPhrase }: VocabularyModalProps) {
  if (!hotspot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-950/80 to-stone-900 p-5 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {hotspot.iconName === "coffee" && <Coffee className="w-5 h-5" />}
              {hotspot.iconName === "croissant" && <Utensils className="w-5 h-5" />}
              {hotspot.iconName === "book-open" && <BookOpen className="w-5 h-5" />}
              {hotspot.iconName === "credit-card" && <CreditCard className="w-5 h-5" />}
              {hotspot.iconName === "utensils" && <Utensils className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-100">{hotspot.title}</h3>
              <p className="text-xs text-amber-300/80">{hotspot.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Cultural Tip Card */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {hotspot.culturalNote}
            </p>
          </div>

          {/* Useful Spanish Phrases to Speak */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5 flex items-center gap-1.5">
              <span>Frases útiles para decir en voz alta</span>
            </h4>
            <div className="space-y-2">
              {hotspot.spanishPhrases.map((phrase, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onSelectPhrase?.(phrase);
                    onClose();
                  }}
                  className="group bg-stone-800/60 hover:bg-amber-500/10 border border-stone-700/60 hover:border-amber-500/40 rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
                    <span className="text-stone-200 group-hover:text-amber-200 font-medium">
                      &ldquo;{phrase}&rdquo;
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              ))}
            </div>
          </div>

          {/* Vocabulary Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2.5">
              Vocabulario clave
            </h4>
            <div className="grid grid-cols-1 gap-2.5">
              {hotspot.vocabulary.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-stone-800/40 border border-stone-800 rounded-xl p-3"
                >
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="font-bold text-stone-100 text-sm">
                      {item.spanish}
                    </span>
                    {item.phonetics && (
                      <span className="text-[11px] text-amber-400/80 font-mono">
                        /{item.phonetics}/
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-stone-400">{item.english}</div>
                  {item.tip && (
                    <div className="text-[11px] text-stone-500 mt-1 italic">
                      💡 {item.tip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Cerrar [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
