"use client";

import React from "react";
import { Mic, Radio } from "lucide-react";

interface InteractionPromptProps {
  isVisible: boolean;
  npcName: string;
  interactKey?: string;
  onInteract?: () => void;
}

/**
 * World-space interaction prompt shown when the player is near an NPC.
 * Appears as a high-visibility Neo-Brutalist floating badge and card.
 * Positioned at the center-bottom area (above the bottom overlay).
 */
export function InteractionPrompt({
  isVisible,
  npcName,
  interactKey = "E",
  onInteract,
}: InteractionPromptProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute flex flex-col items-center select-none"
      style={{
        bottom: "170px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 35,
      }}
    >
      {/* Top flashing status pill */}
      <div className="bg-[#FF5722] text-white border-2 border-black font-mono font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wider shadow-[2px_2px_0px_#000] -mb-2 z-10 flex items-center gap-1.5 animate-bounce">
        <Radio className="w-3 h-3 text-white animate-pulse" />
        <span>IN RANGE · LIVE NPC</span>
      </div>

      <button
        type="button"
        onClick={onInteract}
        className="flex flex-col items-center gap-2 px-5 py-3 border-[3px] border-black bg-[#FAF9F5] shadow-[6px_6px_0px_#000] hover:shadow-[8px_8px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000] transition-all cursor-pointer"
        aria-label={`Talk to ${npcName} (Press ${interactKey})`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#FFB800] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000]">
            <Mic className="w-4 h-4 text-black" />
          </div>
          <span className="font-black text-black text-sm uppercase tracking-tight">
            Talk to {npcName}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t-2 border-black/10 w-full justify-center">
          <kbd className="px-2.5 py-0.5 border-2 border-black font-mono font-black text-xs bg-[#FFB800] text-black shadow-[2px_2px_0px_#000]">
            {interactKey}
          </kbd>
          <span className="text-[11px] font-mono font-bold text-black/75 uppercase tracking-wider">
            press [{interactKey}] or click
          </span>
        </div>
      </button>
    </div>
  );
}

